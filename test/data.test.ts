import { describe, expect, it } from "vitest";
import raw from "../src/data/ingen.json";
import { buildArchive, loadArchive } from "../src/data/ingen";
import { ArchiveDataError, validateArchive } from "../src/data/validate";

describe("archive dataset", () => {
  it("validates the shipped data with no issues", () => {
    expect(validateArchive(raw)).toEqual([]);
  });

  it("loads all 43 dossiers", () => {
    const a = loadArchive();
    expect(a.specimens).toHaveLength(21);
    expect(a.personnel).toHaveLength(22);
    expect(a.specimens.length + a.personnel.length).toBe(43);
  });

  it("resolves an image for every record", () => {
    const a = loadArchive();
    for (const r of [...a.specimens, ...a.personnel]) {
      expect(r.img, r.id).toMatch(/^\/media\/(dinos|personnel)\//);
    }
  });

  it("indexes records by id", () => {
    const a = loadArchive();
    expect(a.specimenById.get("indominus-rex")?.fileId).toBe("ING-HYB-001");
    expect(a.personById.get("owen-grady")?.name).toBe("Owen Grady");
    expect(a.specimenById.get("nope")).toBeUndefined();
  });

  it("agrees with the published summary counts", () => {
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
});
