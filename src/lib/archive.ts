import { entryKey, loadArchive } from "../data/ingen";
import { DIVISIONS, division } from "../data/divisions";
import type { Archive, ArchiveEntry, Relations, RecordKind } from "../data/types";

/* ============================================================================
   Archive access layer.

   One place that knows how to look a record up, search across every division,
   and resolve the links between them. Pages ask questions here rather than
   reaching into the data themselves.
   ========================================================================== */

export const archive = (): Archive => loadArchive();

export const getAllRecords = (): ArchiveEntry[] => archive().entries;

export const getRecordsByType = (kind: RecordKind): ArchiveEntry[] => archive().entries.filter((e) => e.kind === kind);

export const getRecordById = (kind: RecordKind, id: string): ArchiveEntry | undefined =>
  archive().entryByKey.get(entryKey(kind, id));

/** Finds a record in any division by id — used when a link omits its kind. */
export const findRecord = (id: string): ArchiveEntry | undefined => archive().entries.find((e) => e.id === id);

export const getArchiveStats = () => archive().counts;

/* ------------------------------------------------------------------ search */

/**
 * Global search across every division. Results are ordered by how directly they
 * match — an exact file id first, then a name match, then anything else — so the
 * record someone typed the id of is never buried under prose matches.
 */
export function searchRecords(query: string, opts?: { kinds?: RecordKind[]; limit?: number }): ArchiveEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const pool = opts?.kinds?.length ? archive().entries.filter((e) => opts.kinds!.includes(e.kind)) : archive().entries;

  const scored: { entry: ArchiveEntry; score: number }[] = [];
  for (const entry of pool) {
    let score = -1;
    if (entry.fileId.toLowerCase() === q) score = 0;
    else if (entry.name.toLowerCase() === q) score = 1;
    else if (entry.fileId.toLowerCase().includes(q)) score = 2;
    else if (entry.name.toLowerCase().startsWith(q)) score = 3;
    else if (entry.name.toLowerCase().includes(q)) score = 4;
    else if (entry.subtitle.toLowerCase().includes(q)) score = 5;
    else if (entry.haystack.includes(q)) score = 6;
    if (score >= 0) scored.push({ entry, score });
  }

  scored.sort((a, b) => a.score - b.score || a.entry.name.localeCompare(b.entry.name));
  const results = scored.map((s) => s.entry);
  return opts?.limit ? results.slice(0, opts.limit) : results;
}

/* ----------------------------------------------------------- relationships */

/** Relation key on a record → the division it points at. */
const RELATION_KIND: Record<keyof Relations, RecordKind> = {
  specimens: "specimen",
  personnel: "person",
  locations: "location",
  facilities: "facility",
  incidents: "incident",
  flora: "flora",
};

/**
 * Reverse index.
 *
 * The two original divisions predate the relationship system and declare no
 * links, so the connections are stated once — on the newer record — and read in
 * both directions from here. Built lazily and cached, so a dossier that asks
 * "what references me?" costs a map lookup rather than a scan.
 */
let reverse: Map<string, Set<string>> | null = null;

function reverseIndex(): Map<string, Set<string>> {
  if (reverse) return reverse;
  const a = archive();
  const index = new Map<string, Set<string>>();

  const link = (fromKey: string, toKey: string) => {
    if (fromKey === toKey) return;
    let set = index.get(toKey);
    if (!set) index.set(toKey, (set = new Set()));
    set.add(fromKey);
  };

  const declared: { kind: RecordKind; id: string; relations?: Relations }[] = [
    ...a.locations.map((r) => ({ kind: "location" as const, id: r.id, relations: r.relations })),
    ...a.flora.map((r) => ({ kind: "flora" as const, id: r.id, relations: r.relations })),
    ...a.facilities.map((r) => ({ kind: "facility" as const, id: r.id, relations: r.relations })),
    ...a.incidents.map((r) => ({ kind: "incident" as const, id: r.id, relations: r.relations })),
  ];

  for (const record of declared) {
    const from = entryKey(record.kind, record.id);
    for (const [key, ids] of Object.entries(record.relations ?? {})) {
      const kind = RELATION_KIND[key as keyof Relations];
      if (!kind || !Array.isArray(ids)) continue;
      for (const id of ids) link(from, entryKey(kind, id));
    }
  }

  // A facility's `location` is a relationship too, even though it is a plain field.
  for (const f of a.facilities) {
    link(entryKey("facility", f.id), entryKey("location", f.location));
  }

  // Incident slugs already carried on the original specimen and personnel
  // records — the links that existed before this system did.
  const incidentBySlug = new Map(a.incidents.map((i) => [i.slug, i.id]));
  for (const d of a.specimens) {
    for (const slug of d.incidents ?? []) {
      const incidentId = incidentBySlug.get(slug);
      if (incidentId) link(entryKey("specimen", d.id), entryKey("incident", incidentId));
    }
  }
  for (const p of a.personnel) {
    for (const slug of p.history ?? []) {
      const incidentId = incidentBySlug.get(slug);
      if (incidentId) link(entryKey("person", p.id), entryKey("incident", incidentId));
    }
  }

  reverse = index;
  return index;
}

export interface RelatedGroup {
  kind: RecordKind;
  label: string;
  entries: ArchiveEntry[];
}

/**
 * Every record connected to this one, in either direction, grouped by division.
 * Unresolvable ids are dropped rather than rendered as dead links — validation
 * already fails the build on those, so this is belt and braces.
 */
export function getRelatedRecords(
  kind: RecordKind,
  id: string,
  declared?: Relations,
  extra?: { specimens?: string[]; personnel?: string[]; locations?: string[]; facilities?: string[] }
): RelatedGroup[] {
  const a = archive();
  const self = entryKey(kind, id);
  const keys = new Set<string>();

  const addAll = (relations: Relations | undefined) => {
    for (const [key, ids] of Object.entries(relations ?? {})) {
      const target = RELATION_KIND[key as keyof Relations];
      if (!target || !Array.isArray(ids)) continue;
      for (const rid of ids) keys.add(entryKey(target, rid));
    }
  };

  addAll(declared);
  addAll(extra as Relations | undefined);
  for (const key of reverseIndex().get(self) ?? []) keys.add(key);
  keys.delete(self);

  const groups: RelatedGroup[] = [];
  for (const d of DIVISIONS) {
    const entries: ArchiveEntry[] = [];
    for (const key of keys) {
      const entry = a.entryByKey.get(key);
      if (entry && entry.kind === d.kind) entries.push(entry);
    }
    if (entries.length) {
      entries.sort((x, y) => x.name.localeCompare(y.name));
      groups.push({ kind: d.kind, label: d.label, entries });
    }
  }
  return groups;
}

/** Convenience lookups used by dossiers to resolve a single linked record. */
export const getLocation = (id: string) => archive().locationById.get(id);
export const getFacility = (id: string) => archive().facilityById.get(id);
export const getIncident = (id: string) => archive().incidentById.get(id);
export const getSpecimen = (id: string) => archive().specimenById.get(id);
export const getPerson = (id: string) => archive().personById.get(id);
export const getFlora = (id: string) => archive().floraById.get(id);

export { division, DIVISIONS };

/** Test hook — the reverse index is cached for the life of the module. */
export const __resetRelationCache = () => {
  reverse = null;
};
