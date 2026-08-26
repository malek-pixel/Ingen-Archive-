import { describe, expect, it, beforeEach, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "../src/App";
import { loadArchive } from "../src/data/ingen";
import { DIVISIONS } from "../src/data/divisions";
import { getArchiveStats, getRecordsByType, getRelatedRecords, searchRecords } from "../src/lib/archive";
import { validateDivisions } from "../src/data/validate";
import locations from "../src/data/locations.json";
import flora from "../src/data/flora.json";
import facilities from "../src/data/facilities.json";
import operations from "../src/data/operations.json";
import type { Facility, Flora, Incident, Location } from "../src/data/types";

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
  facilities: facilities as Facility[],
  incidents: operations as Incident[],
};

describe("expansion divisions", () => {
  it("validates with no issues, including referential integrity", () => {
    expect(validateDivisions(divisionData)).toEqual([]);
  });

  it("loads every division", () => {
    const a = loadArchive();
    expect(a.locations.length).toBeGreaterThanOrEqual(10);
    expect(a.flora.length).toBeGreaterThanOrEqual(12);
    expect(a.facilities.length).toBeGreaterThanOrEqual(8);
    expect(a.incidents.length).toBeGreaterThanOrEqual(8);
  });

  it("derives counts from the data rather than a literal", () => {
    const a = loadArchive();
    const counts = getArchiveStats();
    expect(counts.specimen).toBe(a.specimens.length);
    expect(counts.location).toBe(a.locations.length);
    expect(counts.flora).toBe(a.flora.length);
    expect(counts.facility).toBe(a.facilities.length);
    expect(counts.incident).toBe(a.incidents.length);
    expect(counts.total).toBe(
      a.specimens.length +
        a.personnel.length +
        a.locations.length +
        a.flora.length +
        a.facilities.length +
        a.incidents.length
    );
  });

  it("keeps every record identifier unique across the whole archive", () => {
    const ids = loadArchive().entries.map((e) => e.fileId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("gives every division a distinct identifier prefix", () => {
    const a = loadArchive();
    for (const rec of a.locations) expect(rec.fileId).toMatch(/^ING-LOC-/);
    for (const rec of a.flora) expect(rec.fileId).toMatch(/^ING-FLR-/);
    for (const rec of a.facilities) expect(rec.fileId).toMatch(/^ING-FAC-/);
    for (const rec of a.incidents) expect(rec.fileId).toMatch(/^ING-OPS-/);
  });

  it("rejects a relation pointing at a record that does not exist", () => {
    const broken = structuredClone(divisionData);
    broken.facilities[0].relations = { locations: ["atlantis"] };
    expect(validateDivisions(broken).some((i) => i.includes("unknown record"))).toBe(true);
  });

  it("rejects a facility sited at an unknown location", () => {
    const broken = structuredClone(divisionData);
    broken.facilities[0].location = "nowhere";
    expect(validateDivisions(broken).some((i) => i.includes("not a known location"))).toBe(true);
  });
});

describe("global search", () => {
  it("reaches every division", () => {
    for (const d of DIVISIONS) {
      expect(getRecordsByType(d.kind).length, d.label).toBeGreaterThan(0);
    }
  });

  it("ranks an exact record identifier first", () => {
    expect(searchRecords("ING-LOC-002")[0].name).toBe("Isla Sorna");
    expect(searchRecords("ING-OPS-001")[0].fileId).toBe("ING-OPS-001");
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
  it("reaches a specimen from the incident that names it", () => {
    const groups = getRelatedRecords("incident", "jurassic-world-2015");
    const specimens = groups.find((g) => g.kind === "specimen");
    expect(specimens?.entries.some((e) => e.id === "indominus-rex")).toBe(true);
  });

  it("reaches the incident back from the specimen, which declares nothing", () => {
    const groups = getRelatedRecords("specimen", "indominus-rex");
    const incidents = groups.find((g) => g.kind === "incident");
    expect(incidents?.entries.some((e) => e.id === "jurassic-world-2015")).toBe(true);
  });

  it("links a facility to the location it sits in, and back", () => {
    const fromFacility = getRelatedRecords("facility", "raptor-paddock");
    expect(fromFacility.find((g) => g.kind === "location")?.entries.some((e) => e.id === "isla-nublar")).toBe(true);

    const fromLocation = getRelatedRecords("location", "isla-nublar");
    expect(fromLocation.find((g) => g.kind === "facility")?.entries.some((e) => e.id === "raptor-paddock")).toBe(true);
  });

  it("resolves personnel links through the original history slugs", () => {
    const groups = getRelatedRecords("person", "owen-grady");
    expect(groups.find((g) => g.kind === "incident")?.entries.length).toBeGreaterThan(0);
  });

  it("never links a record to itself", () => {
    for (const kind of ["location", "facility", "incident", "flora"] as const) {
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
  it.each([
    ["/locations", "Locations", "Showing all 12 sites"],
    ["/paleobotany", "Paleobotany", "Showing all 15 records"],
    ["/facilities", "Facilities", "Showing all 14 structures"],
    ["/operations", "Operations", "Showing all 10 records"],
  ])("renders the %s index", async (path, heading, count) => {
    renderAt(path);
    expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent(heading);
    expect(await screen.findByText(count)).toBeTruthy();
  });

  it.each([
    ["/locations/isla-nublar", "Isla Nublar"],
    ["/paleobotany/serenna-veriformans", "Serenna veriformans"],
    ["/facilities/raptor-paddock", "Velociraptor Research Paddock"],
    ["/operations/isla-nublar-1993", "Isla Nublar Containment Failure"],
  ])("renders the dossier at %s", async (path, name) => {
    renderAt(path);
    expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent(name);
    expect(await screen.findByText("Associated records")).toBeTruthy();
  });

  it.each([
    ["/locations/atlantis", "No location record for “atlantis”"],
    ["/paleobotany/triffid", "No botanical record for “triffid”"],
    ["/facilities/nowhere", "No facility record for “nowhere”"],
    ["/operations/never-happened", "No operational record for “never-happened”"],
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
  it("links to all six registers", async () => {
    renderAt("/dashboard");
    const nav = await screen.findByRole("navigation", { name: "Primary" });
    for (const d of DIVISIONS) {
      const link = within(nav).getByRole("link", { name: new RegExp(d.label, "i") });
      expect(link.getAttribute("href")).toBe(`/${d.path}`);
    }
  });
});
