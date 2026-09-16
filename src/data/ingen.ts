import raw from "./ingen.json";
import locationsRaw from "./locations.json";
import floraRaw from "./flora.json";
import locationImages from "./location-images.json";
import floraImages from "./flora-images.json";

import { ArchiveDataError, validateArchive, validateCrossLinks, validateDivisions } from "./validate";
import { recordHref } from "./divisions";
import type {
  Archive,
  ArchiveEntry,
  ArchiveStats,
  Flora,
  Location,
  Person,
  RecordKind,
  SecurityLevel,
  Specimen,
  WithImage,
} from "./types";

export type * from "./types";
export { ArchiveDataError } from "./validate";

interface RawArchive {
  specimens: Specimen[];
  personnel: Person[];
  specimenImages: Record<string, string>;
  personnelImages: Record<string, string>;
}

/** Key for the flat entry index — ids are only unique within a division. */
export const entryKey = (kind: RecordKind, id: string) => `${kind}:${id}`;

/**
 * Security classification for the two original divisions, which predate the
 * common shape. Derived rather than stored so the source records stay untouched.
 */
const specimenSecurity = (d: Specimen): SecurityLevel =>
  Number(d.threat) >= 5 ? "CRITICAL" : Number(d.threat) >= 4 ? "CLASSIFIED" : "RESTRICTED";

const personSecurity = (p: Person): SecurityLevel =>
  Number(p.clearance) >= 5 ? "CLASSIFIED" : Number(p.clearance) >= 4 ? "CONFIDENTIAL" : "INTERNAL";

const lower = (parts: unknown[]) => parts.filter(Boolean).join(" ").toLowerCase();

/**
 * The archive summary figures.
 *
 * Counted from the records every load rather than stored alongside them. The
 * dataset used to carry a written-down copy of these thirteen numbers, which
 * meant every added record silently made them wrong — and nothing rendered
 * them, so nothing would have caught it. Derivation is the only version that
 * stays true as the archive grows.
 */
function summarise(specimens: Specimen[], personnel: Person[]): ArchiveStats {
  const contain = (d: Specimen) => (d.contain || "").toUpperCase();
  const count = <T>(list: T[], match: (v: T) => boolean) => list.filter(match).length;

  return {
    dTotal: specimens.length,
    dActive: count(specimens, (d) => /^ACTIVE|^ALIVE/.test((d.status || "").toUpperCase())),
    dDeceased: count(specimens, (d) => /DECEASED/.test((d.status || "").toUpperCase())),
    dFailed: count(specimens, (d) => /FAIL|BREACH/.test(contain(d))),
    dStable: count(specimens, (d) => /^STABLE/.test(contain(d))),
    dPartial: count(specimens, (d) => /PARTIAL/.test(contain(d))),
    dExtreme: count(specimens, (d) => Number(d.threat) >= 5),
    dHigh: count(specimens, (d) => Number(d.threat) === 4),
    pTotal: personnel.length,
    pAlive: count(personnel, (p) => /ALIVE/.test((p.status || "").toUpperCase())),
    pDeceased: count(personnel, (p) => /DECEASED/.test((p.status || "").toUpperCase())),
    pL5: count(personnel, (p) => Number(p.clearance) >= 5),
    pL4plus: count(personnel, (p) => Number(p.clearance) >= 4),
  };
}

function build(source: unknown, locations: Location[], flora: Flora[]): Archive {
  const divisions = { locations, flora };
  const issues = [...validateArchive(source), ...validateDivisions(divisions)];

  // Cross-dataset links are only checkable once both halves are known to be
  // structurally sound — running it on a malformed payload would bury the real
  // failure under a cascade of unresolved-id noise.
  if (!issues.length) {
    issues.push(...validateCrossLinks(source as { specimens: Specimen[]; personnel: Person[] }, divisions));
  }
  if (issues.length) throw new ArchiveDataError(issues);

  const r = source as RawArchive;
  const withImg = <T extends { id: string }>(list: T[], images: Record<string, string>): WithImage<T>[] =>
    list.map((rec) => ({ ...rec, img: images[rec.id] ?? "" }));

  const specimens = withImg(r.specimens, r.specimenImages);
  const personnel = withImg(r.personnel, r.personnelImages);

  // Expansion divisions render a technical plate unless a real plate exists.
  // Locations and flora can carry photography per record — coverage is partial
  // by design, so this is resolved per id rather than per division.
  type Plate = { src: string; w: number; h: number };
  const platedBy =
    <T extends { id: string }>(plates: Record<string, Plate>) =>
    (rec: T): WithImage<T> => {
      const plate = plates[rec.id];
      return { ...rec, img: plate?.src ?? "", imgRatio: plate ? plate.w / plate.h : undefined };
    };
  const locationRecords: WithImage<Location>[] = locations.map(platedBy(locationImages as Record<string, Plate>));
  const floraRecords: WithImage<Flora>[] = flora.map(platedBy(floraImages as Record<string, Plate>));

  const entries: ArchiveEntry[] = [
    ...specimens.map((d) => ({
      kind: "specimen" as const,
      id: d.id,
      fileId: d.fileId,
      name: d.name,
      subtitle: d.species,
      status: d.status,
      security: specimenSecurity(d),
      img: d.img,
      href: recordHref("specimen", d.id),
      haystack: lower([
        d.name,
        d.species,
        d.fileId,
        d.codename,
        d.diet,
        d.classification,
        d.threat,
        d.contain,
        d.status,
        d.notes,
      ]),
    })),
    ...personnel.map((p) => ({
      kind: "person" as const,
      id: p.id,
      fileId: p.fileId,
      name: p.name,
      subtitle: p.role,
      status: p.status,
      security: personSecurity(p),
      img: p.img,
      href: recordHref("person", p.id),
      haystack: lower([p.name, p.role, p.dept, p.aff, p.nat, p.status, p.threat, p.tag, p.fileId, `L${p.clearance}`]),
    })),
    ...locationRecords.map((l) => ({
      kind: "location" as const,
      id: l.id,
      fileId: l.fileId,
      name: l.name,
      subtitle: l.designation,
      status: l.status,
      security: l.security,
      img: l.img,
      imgRatio: l.imgRatio,
      href: recordHref("location", l.id),
      haystack: lower([
        l.name,
        l.designation,
        l.fileId,
        l.type,
        l.region,
        l.status,
        l.primaryFunction,
        l.description,
        l.tags.join(" "),
      ]),
    })),
    ...floraRecords.map((f) => ({
      kind: "flora" as const,
      id: f.id,
      fileId: f.fileId,
      name: f.name,
      subtitle: f.scientificName,
      status: f.status,
      security: f.security,
      img: f.img,
      imgRatio: f.imgRatio,
      href: recordHref("flora", f.id),
      haystack: lower([
        f.name,
        f.scientificName,
        f.fileId,
        f.classification,
        f.habitat,
        f.era,
        f.status,
        f.notes,
        f.tags.join(" "),
      ]),
    })),
  ];

  return {
    specimens,
    personnel,
    locations: locationRecords,
    flora: floraRecords,

    stats: summarise(r.specimens, r.personnel),
    counts: {
      specimen: specimens.length,
      person: personnel.length,
      location: locationRecords.length,
      flora: floraRecords.length,
      total: entries.length,
    },

    specimenById: new Map(specimens.map((d) => [d.id, d])),
    personById: new Map(personnel.map((p) => [p.id, p])),
    locationById: new Map(locationRecords.map((l) => [l.id, l])),
    floraById: new Map(floraRecords.map((f) => [f.id, f])),
    entries,
    entryByKey: new Map(entries.map((e) => [entryKey(e.kind, e.id), e])),
  };
}

/** Parses and validates an arbitrary payload — exported for tests. */
export const buildArchive = (source: unknown, divisions?: { locations?: Location[]; flora?: Flora[] }) =>
  build(source, divisions?.locations ?? (locationsRaw as Location[]), divisions?.flora ?? (floraRaw as Flora[]));

let cached: Archive | null = null;
let failure: ArchiveDataError | null = null;

/**
 * The archive singleton. Throws in dev so a bad dataset is impossible to miss;
 * in production the caller catches and renders the designed error state.
 */
export function loadArchive(): Archive {
  if (cached) return cached;
  if (failure) throw failure;
  try {
    cached = build(raw, locationsRaw as Location[], floraRaw as Flora[]);
    return cached;
  } catch (err) {
    failure = err as ArchiveDataError;
    if (import.meta.env.DEV) console.error(failure);
    throw failure;
  }
}

export { division, recordHref } from "./divisions";
