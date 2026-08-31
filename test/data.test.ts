import { describe, expect, it } from "vitest";
import raw from "../src/data/ingen.json";
import { buildArchive, loadArchive } from "../src/data/ingen";
import { ArchiveDataError, validateArchive, validateCrossLinks } from "../src/data/validate";
import locations from "../src/data/locations.json";
import flora from "../src/data/flora.json";
import facilities from "../src/data/facilities.json";
import incidents from "../src/data/operations.json";

describe("archive dataset", () => {
  it("validates the shipped data with no issues", () => {
    expect(validateArchive(raw)).toEqual([]);
  });

  // Counts are asserted against the data rather than written down: a literal
  // here would have to be edited every time a record is added, which makes it
  // a maintenance tax rather than a check. What is worth pinning is that the
  // published counts agree with the collections they describe.
  it("counts every loaded dossier", () => {
    const a = loadArchive();
    expect(a.specimens.length).toBeGreaterThan(0);
    expect(a.personnel.length).toBeGreaterThan(0);
    expect(a.counts.specimen).toBe(a.specimens.length);
    expect(a.counts.person).toBe(a.personnel.length);
    expect(a.counts.total).toBe(a.entries.length);
    expect(a.entries).toHaveLength(
      a.specimens.length +
        a.personnel.length +
        a.locations.length +
        a.flora.length +
        a.facilities.length +
        a.incidents.length
    );
  });

  // Not every record was photographed — those render the drawn technical
  // plate, and an empty path is how the archive says so. What must hold is
  // that a path, where one exists, actually points into the media tree.
  it("resolves a well-formed image path for every photographed record", () => {
    const a = loadArchive();
    const records = [...a.specimens, ...a.personnel];
    for (const r of records) {
      if (r.img === "") continue;
      expect(r.img, r.id).toMatch(/^\/media\/(dinos|personnel)\//);
    }
    expect(records.some((r) => r.img !== "")).toBe(true);
  });

  it("indexes records by id", () => {
    const a = loadArchive();
    expect(a.specimenById.get("indominus-rex")?.fileId).toBe("ING-HYB-001");
    expect(a.personById.get("owen-grady")?.name).toBe("Owen Grady");
    expect(a.specimenById.get("nope")).toBeUndefined();
  });

  it("derives the summary figures from the records", () => {
    const a = loadArchive();
    expect(a.stats.dTotal).toBe(a.specimens.length);
    expect(a.stats.pTotal).toBe(a.personnel.length);
    expect(a.personnel.filter((p) => p.clearance >= 5)).toHaveLength(a.stats.pL5);
    expect(a.specimens.filter((d) => /FAIL|BREACH/i.test(d.contain))).toHaveLength(a.stats.dFailed);
  });

  it("throws a typed error listing every problem", () => {
    const broken = structuredClone(raw) as Record<string, unknown>;
    const specimens = broken.specimens as Record<string, unknown>[];
    delete specimens[0].name;
    specimens[1].threat = "high";
    expect(() => buildArchive(broken)).toThrow(ArchiveDataError);
    try {
      buildArchive(broken);
    } catch (e) {
      const issues = (e as ArchiveDataError).issues;
      expect(issues).toContain('specimens[0]: missing "name"');
      expect(issues).toContain('specimens[1]: "threat" expected number, got string');
    }
  });

  it("rejects a duplicate id", () => {
    const broken = structuredClone(raw) as Record<string, unknown>;
    const p = broken.personnel as Record<string, unknown>[];
    p[1].id = p[0].id;
    expect(validateArchive(broken).some((i) => i.includes("duplicate id"))).toBe(true);
  });

  // Operations are cited by slug rather than record id, so nothing else in the
  // cross-link check can see them. A bad slug used to sever the link silently.
  it("catches an operation slug that resolves to no incident", () => {
    const divisions = { locations, flora, facilities, incidents } as never;
    expect(validateCrossLinks(raw, divisions)).toEqual([]);

    const broken = structuredClone(raw) as typeof raw;
    broken.personnel[0].history = ["isla-nublar-1993", "no-such-operation-1999"];
    broken.specimens[0].incidents = ["also-not-real-2001"];
    const issues = validateCrossLinks(broken, divisions);
    expect(issues).toContain(
      `personnel[${broken.personnel[0].id}]: "history" cites unknown operation slug "no-such-operation-1999"`
    );
    expect(issues).toContain(
      `specimens[${broken.specimens[0].id}]: "incidents" cites unknown operation slug "also-not-real-2001"`
    );
  });
});
