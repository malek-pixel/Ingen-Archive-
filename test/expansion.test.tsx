import { describe, expect, it, beforeEach, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "../src/App";
import { loadArchive } from "../src/data/ingen";
import { DIVISIONS } from "../src/data/divisions";
import { getAllRecords, getArchiveStats, getRecordsByType, getRelatedRecords, searchRecords } from "../src/lib/archive";
import { validateDivisions } from "../src/data/validate";
import locations from "../src/data/locations.json";
import flora from "../src/data/flora.json";
import locationImages from "../src/data/location-images.json";
import type { Flora, Location } from "../src/data/types";

const archive = loadArchive();

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>
  );

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
  window.scrollTo = vi.fn();
});

const divisionData = {
  locations: locations as Location[],
  flora: flora as Flora[],
};

describe("expansion divisions", () => {
  it("validates with no issues, including referential integrity", () => {
    expect(validateDivisions(divisionData)).toEqual([]);
  });

  it("loads every division", () => {
    const a = loadArchive();
    expect(a.locations.length).toBeGreaterThanOrEqual(10);
    expect(a.flora.length).toBeGreaterThanOrEqual(11);
  });

  it("derives counts from the data rather than a literal", () => {
    const a = loadArchive();
    const counts = getArchiveStats();
    expect(counts.specimen).toBe(a.specimens.length);
    expect(counts.location).toBe(a.locations.length);
    expect(counts.flora).toBe(a.flora.length);
    expect(counts.total).toBe(a.specimens.length + a.personnel.length + a.locations.length + a.flora.length);
  });

  it("keeps every record identifier unique across the whole archive", () => {
    const ids = loadArchive().entries.map((e) => e.fileId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("gives every division a distinct identifier prefix", () => {
    const a = loadArchive();
    for (const rec of a.locations) expect(rec.fileId).toMatch(/^ING-LOC-/);
    for (const rec of a.flora) expect(rec.fileId).toMatch(/^ING-FLR-/);
  });

  it("rejects a relation pointing at a record that does not exist", () => {
    const broken = structuredClone(divisionData);
    broken.locations[0].relations = { flora: ["nothing-grows-here"] };
    expect(validateDivisions(broken).some((i) => i.includes("unknown record"))).toBe(true);
  });
});

describe("global search", () => {
  it("returns a stable array per division so index screens can memoise", () => {
    // A fresh array each call changes the `records` prop identity every render
    // and defeats the memoised filter/sort inside the index screen.
    expect(getRecordsByType("location")).toBe(getRecordsByType("location"));
    expect(getRecordsByType("flora")).toBe(getRecordsByType("flora"));
  });

  it("reaches every division", () => {
    for (const d of DIVISIONS) {
      expect(getRecordsByType(d.kind).length, d.label).toBeGreaterThan(0);
    }
  });

  it("ranks an exact record identifier first", () => {
    expect(searchRecords("ING-LOC-002")[0].name).toBe("Isla Sorna");
  });

  it("returns results from more than one division for a shared term", () => {
    const kinds = new Set(searchRecords("nublar").map((r) => r.kind));
    expect(kinds.size).toBeGreaterThan(1);
  });

  it("can be scoped to a single division", () => {
    const scoped = searchRecords("isla", { kinds: ["location"] });
    expect(scoped.length).toBeGreaterThan(0);
    expect(scoped.every((r) => r.kind === "location")).toBe(true);
  });

  it("returns nothing for an unmatched term", () => {
    expect(searchRecords("qqqzzz")).toHaveLength(0);
  });

  it("is empty for an empty query", () => {
    expect(searchRecords("   ")).toHaveLength(0);
  });
});

describe("relationships resolve in both directions", () => {
  // Regression guard. Links used to be handed to getRelatedRecords by each
  // dossier, and the base divisions' own link fields were never read back into
  // the reverse index — so a specimen listed its island while the island listed
  // no specimens. Both ends of every link are now read from one place; this
  // pins that for the divisions that state links on every record. Assets and
  // personnel carry theirs optionally, so some are genuinely unconnected.
  it("connects every location and botanical record to at least one other", () => {
    const orphans = getAllRecords()
      .filter((e) => e.kind === "location" || e.kind === "flora")
      .filter((e) => getRelatedRecords(e.kind, e.id).length === 0)
      .map((e) => e.fileId);
    expect(orphans, `unconnected records: ${orphans.join(", ")}`).toHaveLength(0);
  });

  it("reads links in both directions", () => {
    // Stated on the specimen as a plain field; must surface on the location.
    const onLocation = getRelatedRecords("location", "isla-nublar").find((g) => g.kind === "specimen");
    expect(onLocation?.entries.some((e) => e.id === "tyrannosaurus-rex")).toBe(true);
    const onSpecimen = getRelatedRecords("specimen", "tyrannosaurus-rex").find((g) => g.kind === "location");
    expect(onSpecimen?.entries.some((e) => e.id === "isla-nublar")).toBe(true);
  });

  it("never links a record to itself", () => {
    for (const kind of ["location", "flora"] as const) {
      for (const entry of getRecordsByType(kind)) {
        const groups = getRelatedRecords(kind, entry.id);
        const self = groups.flatMap((g) => g.entries).filter((e) => e.kind === kind && e.id === entry.id);
        expect(self, `${entry.fileId} links to itself`).toHaveLength(0);
      }
    }
  });

  it("only ever produces links that resolve to a real record", () => {
    for (const d of DIVISIONS) {
      for (const entry of getRecordsByType(d.kind)) {
        for (const group of getRelatedRecords(d.kind, entry.id)) {
          for (const linked of group.entries) {
            expect(linked.href, `${entry.fileId} → dead link`).toMatch(/^\/[a-z]+\/[a-z0-9-]+$/);
          }
        }
      }
    }
  });
});

describe("expansion routes", () => {
  // The noun differs per division; the number comes from the data, so adding a
  // record does not turn this into a test edit.
  it.each([
    ["/locations", "Locations", `Showing all ${archive.locations.length} sites`],
    ["/paleobotany", "Paleobotany", `Showing all ${archive.flora.length} records`],
  ])("renders the %s index", async (path, heading, count) => {
    renderAt(path);
    expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent(heading);
    expect(await screen.findByText(count)).toBeTruthy();
  });

  it.each([
    ["/locations/isla-nublar", "Isla Nublar"],
    ["/paleobotany/serenna-veriformans", "Serenna veriformans"],
  ])("renders the dossier at %s", async (path, name) => {
    renderAt(path);
    expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent(name);
    expect(await screen.findByText("Associated records")).toBeTruthy();
  });

  it.each([
    ["/locations/atlantis", "No location record for “atlantis”"],
    ["/paleobotany/triffid", "No botanical record for “triffid”"],
  ])("surfaces the designed 404 at %s", async (path, message) => {
    renderAt(path);
    expect(await screen.findByText(message)).toBeTruthy();
  });

  it("renders the global search landing with every division", async () => {
    renderAt("/search");
    expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent("Search the archive");
    for (const d of DIVISIONS) {
      expect(await screen.findAllByText(d.label)).not.toHaveLength(0);
    }
  });

  it("returns cross-division results from a URL query", async () => {
    renderAt("/search?q=nublar");
    await waitFor(() => expect(screen.getByText(/records matching/)).toBeTruthy());
    expect(await screen.findByText("ING-LOC-001")).toBeTruthy();
  });

  it("keeps the division filter in the URL, in both directions", async () => {
    // The whole search must be shareable, not just the query. Holding the
    // divisions in component state let the URL and the chips drift apart.
    renderAt("/search?q=isla&in=location");
    await screen.findByText(/records matching/);

    const pressed = () =>
      screen.getAllByRole("button", { pressed: true }).map((b) => b.textContent?.replace(/\d+$/, "").trim());
    expect(pressed()).toEqual(["Locations"]);

    // Toggling a chip writes to the URL.
    fireEvent.click(screen.getByRole("button", { name: /^Paleobotany/ }));
    await waitFor(() => expect(pressed()).toContain("Paleobotany"));
  });

  it("reads multiple divisions from the URL", async () => {
    renderAt("/search?q=isla&in=location&in=flora");
    await screen.findByText(/records matching/);
    const pressed = screen
      .getAllByRole("button", { pressed: true })
      .map((b) => b.textContent?.replace(/\d+$/, "").trim());
    expect(pressed).toEqual(expect.arrayContaining(["Locations", "Paleobotany"]));
  });

  it("ignores an unknown division in the URL rather than filtering to nothing", async () => {
    renderAt("/search?q=isla&in=dragons");
    await screen.findByText(/records matching/);
    expect(screen.queryAllByRole("button", { pressed: true })).toHaveLength(0);
    expect(await screen.findByText("ING-LOC-002")).toBeTruthy();
  });

  it("shows the designed empty state when nothing matches", async () => {
    renderAt("/search?q=qqqzzz");
    expect(await screen.findByText("No record matches “qqqzzz”")).toBeTruthy();
  });
});

describe("the dashboard reflects the whole archive", () => {
  it("counts every division dynamically", async () => {
    renderAt("/dashboard");
    await screen.findByRole("heading", { level: 1 });
    const counts = getArchiveStats();
    expect(await screen.findByText(`${counts.total} records indexed`)).toBeTruthy();
    for (const d of DIVISIONS) {
      expect(await screen.findAllByText(d.label)).not.toHaveLength(0);
    }
  });
});

describe("navigation covers every division", () => {
  it("links to every register", async () => {
    renderAt("/dashboard");
    const nav = await screen.findByRole("navigation", { name: "Primary" });
    for (const d of DIVISIONS) {
      const link = within(nav).getByRole("link", { name: new RegExp(d.label, "i") });
      expect(link.getAttribute("href")).toBe(`/${d.path}`);
    }
  });
});

describe("record imagery is drawn according to its division", () => {
  it("fills the card frame with the whole plate — no crop, no margin", async () => {
    // Both at once is only possible if the frame matches the image, so the
    // test checks the frame's ratio against the plate's real dimensions.
    renderAt("/locations");
    await screen.findByRole("heading", { level: 1 });

    for (const [id, name] of [
      ["isla-nublar", "Isla Nublar"],
      ["jurassic-world", "Jurassic World"],
      ["jurassic-park", "Jurassic Park"],
      ["lockwood-estate", "Lockwood Estate"],
    ] as const) {
      const img = (await screen.findByAltText(name)) as HTMLImageElement;
      // Fills: the image covers its frame edge to edge.
      expect(img.style.objectFit, name).toBe("cover");
      expect(img.style.width, name).toBe("100%");
      expect(img.style.height, name).toBe("100%");

      // Whole: the frame is the plate's own shape, so cover crops nothing.
      const plate = (locationImages as Record<string, { w: number; h: number }>)[id];
      const frame = img.parentElement as HTMLElement;
      expect(Number(frame.style.aspectRatio), name).toBeCloseTo(plate.w / plate.h, 5);
    }
  });

  it("knows the real proportions of every plate it ships", async () => {
    // A frame can only match a plate it has measured; a missing ratio silently
    // falls back to a fixed frame, which is the crop this all came from.
    for (const entry of getRecordsByType("location")) {
      if (!entry.img) continue;
      expect(entry.imgRatio, `${entry.fileId} has no recorded ratio`).toBeGreaterThan(0);
    }
  });

  it("keeps the specimen cutout letterboxed whole, uncropped", async () => {
    // Cropping a cutout severs the subject, so specimens keep `contain`.
    renderAt("/assets");
    await screen.findByRole("heading", { level: 1 });
    const imgs = screen.getAllByRole("img").filter((el) => el.tagName === "IMG");
    const specimen = imgs.find((el) => (el as HTMLImageElement).style.objectFit === "contain");
    expect(specimen, "no specimen image is drawn with object-fit: contain").toBeTruthy();
  });

  it("shows a location plate at its own proportions on the dossier", async () => {
    // These run from 2.4:1 panoramas to 1:1.5 portraits; a fixed frame would
    // crop the legend off a map.
    renderAt("/locations/isla-sorna");
    await screen.findByRole("heading", { level: 1 });
    const img = (await screen.findByAltText(/Isla Sorna — /)) as HTMLImageElement;
    expect(img.style.width).toBe("100%");
    expect(img.style.height).toBe("auto");
    // No max-height: a cap would letterbox the tall charts it was meant to fit.
    expect(img.style.maxHeight).toBe("");
  });

  it("declares an imagery treatment for every division", () => {
    for (const d of DIVISIONS) {
      expect(["cutout", "plate", "none"], d.label).toContain(d.imagery);
    }
  });

  it("never marks a division 'none' while its records carry images", () => {
    for (const d of DIVISIONS) {
      if (d.imagery !== "none") continue;
      const withImg = getRecordsByType(d.kind).filter((e) => e.img);
      expect(
        withImg.map((e) => e.fileId),
        `${d.label} has imagery but is marked "none"`
      ).toEqual([]);
    }
  });
});
