import { describe, expect, it } from "vitest";
import { loadArchive } from "../src/data/ingen";
import { PERSON_SORTS, SPECIMEN_SORTS, queryPersonnel, querySpecimens } from "../src/lib/query";
import {
  containment,
  deptShort,
  dietLabel,
  parseSlug,
  plateBlend,
  specimenStatusShort,
  clearance,
  cells,
} from "../src/lib/derive";

const { specimens, personnel } = loadArchive();
const q = (query = "", filter = "all", sort = 0) => querySpecimens(specimens, query, filter, sort);

describe("specimen search", () => {
  it("returns everything with no query or filter", () => {
    expect(q().results).toHaveLength(specimens.length);
  });

  // The taxonomy chips used to pattern-match prose, which put a pterosaur in
  // the marine results (its diet line mentions marine prey) and returned only
  // Pteranodon for "Flying". They read the file-id register now; this pins
  // each chip to exactly the assets filed under that register.
  it.each([
    ["mar", ["MAR"]],
    ["fly", ["AIR", "AVI"]],
    ["hyb", ["HYB"]],
  ])("filters %s to the %s register alone", (filter, prefixes) => {
    const inRegister = (d: { fileId: string }) => prefixes.includes(d.fileId.split("-")[1]);
    const expected = specimens.filter(inRegister);
    const got = q("", filter).results;
    expect(got.length).toBe(expected.length);
    expect(got.length).toBeGreaterThan(0);
    expect(got.every(inRegister)).toBe(true);
  });

  // The reference files number Quetzalcoatlus ING-AVI-003 while the other three
  // aerial assets are ING-AIR. Reading one prefix dropped a pterosaur out of
  // "Flying" entirely, which is the failure the register was meant to end.
  it("keeps both aerial prefixes in the Flying register", () => {
    const names = q("", "fly").results.map((d) => d.name);
    expect(names).toContain("Quetzalcoatlus");
    expect(names).toContain("Pteranodon");
  });

  it("keeps the diet chips agreeing with the label a dossier prints", () => {
    for (const d of q("", "carn").results) expect(dietLabel(d.diet)).toBe("Carnivore");
    for (const d of q("", "herb").results) expect(dietLabel(d.diet)).toBe("Herbivore");
  });

  it("matches on name, species and file id", () => {
    expect(q("indominus").results.map((d) => d.id)).toContain("indominus-rex");
    expect(q("ING-DIN-013").results).toHaveLength(1);
    expect(q("mosasaurus").results.length).toBeGreaterThan(0);
  });

  it("is case- and whitespace-insensitive", () => {
    expect(q("  BLUE  ").results).toEqual(q("blue").results);
  });

  it("returns nothing for an unmatched term", () => {
    expect(q("raptor-omega").results).toHaveLength(0);
  });
});

describe("specimen filters", () => {
  it("threat 4+ keeps only flagged assets", () => {
    const { results, isFiltered } = q("", "threat");
    expect(isFiltered).toBe(true);
    expect(results.every((d) => d.threat >= 4)).toBe(true);
  });

  it("breached keeps only failed containment", () => {
    expect(q("", "failed").results.every((d) => /FAIL|BREACH/i.test(d.contain))).toBe(true);
  });

  it("carnivore and herbivore are disjoint", () => {
    const carn = new Set(q("", "carn").results.map((d) => d.id));
    expect(q("", "herb").results.some((d) => carn.has(d.id))).toBe(false);
  });

  it("composes with the query", () => {
    const r = q("rex", "threat").results;
    expect(r.length).toBeGreaterThan(0);
    expect(r.every((d) => d.threat >= 4 && /rex/i.test(JSON.stringify(d)))).toBe(true);
  });
});

describe("specimen sort", () => {
  it("cycles through all four orders", () => {
    expect(SPECIMEN_SORTS.map((s) => s.label)).toEqual(["Record ID", "Threat", "Name", "Status"]);
    expect(q("", "all", 4).sort.label).toBe("Record ID");
  });

  it("record id ascending", () => {
    const ids = q("", "all", 0).results.map((d) => d.fileId);
    expect(ids).toEqual([...ids].sort());
  });

  it("threat descending, name breaking ties", () => {
    const r = q("", "all", 1).results;
    for (let i = 1; i < r.length; i++) {
      expect(r[i - 1].threat).toBeGreaterThanOrEqual(r[i].threat);
      if (r[i - 1].threat === r[i].threat) expect(r[i - 1].name.localeCompare(r[i].name)).toBeLessThanOrEqual(0);
    }
  });

  it("name ascending", () => {
    const names = q("", "all", 2).results.map((d) => d.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });
});

describe("personnel query", () => {
  const p = (query = "", filter = "all", sort = 0) => queryPersonnel(personnel, query, filter, sort);

  it("defaults to clearance descending", () => {
    expect(PERSON_SORTS[0].label).toBe("Clearance");
    const r = p().results;
    for (let i = 1; i < r.length; i++) expect(r[i - 1].clearance).toBeGreaterThanOrEqual(r[i].clearance);
  });

  it("level 4+ filter", () => {
    expect(p("", "l4").results.every((x) => x.clearance >= 4)).toBe(true);
  });

  it("department filters partition the roster", () => {
    const keys = ["exec", "gen", "ops", "sec", "ext"];
    const total = keys.reduce((n, k) => n + p("", k).results.length, 0);
    expect(total).toBe(personnel.length);
  });

  it("searches role and department text", () => {
    expect(p("velociraptor").results.length).toBeGreaterThan(0);
    expect(p("qqqq").results).toHaveLength(0);
  });
});

describe("derived semantics", () => {
  it("maps containment language", () => {
    expect(containment("FAILED PERMANENTLY").label).toBe("Containment failed — permanent");
    expect(containment("PARTIALLY STABLE").label).toBe("Partial containment");
    expect(containment("").label).toBe("Containment unknown");
  });

  it("maps status language", () => {
    expect(specimenStatusShort("ACTIVE").label).toBe("Active");
    expect(specimenStatusShort("DECEASED").ink).toBe("#E08A84");
  });

  it("parses assignment slugs into year and label", () => {
    expect(parseSlug("fallen-kingdom-2018")).toEqual({
      year: "2018",
      label: "Fallen Kingdom",
      slug: "fallen-kingdom-2018",
    });
    expect(parseSlug("unknown").year).toBe("—");
  });

  it("keeps alpha cutouts unblended", () => {
    expect(plateBlend("ankylosaurus")).toBe("normal");
    expect(plateBlend("blue")).toBe("multiply");
  });

  it("trims the affiliation tail off department labels", () => {
    expect(deptShort("Security / Asset Containment (Former)")).toBe("Security");
    expect(deptShort("")).toBe("—");
  });

  it("scales clearance wording and meters", () => {
    expect(clearance(5).word).toBe("Full access");
    expect(clearance(1).word).toBe("Restricted");
    expect(cells(3, "#fff")).toEqual(["#fff", "#fff", "#fff", "#1F2833", "#1F2833"]);
  });
});
