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

/**
 * Records of one division.
 *
 * Cached by kind: this feeds the `records` prop of every index screen, and a
 * fresh array on each call would change identity every render and defeat the
 * memoised filter/sort inside it.
 */
const byKindCache = new Map<RecordKind, ArchiveEntry[]>();
export const getRecordsByType = (kind: RecordKind): ArchiveEntry[] => {
  let list = byKindCache.get(kind);
  if (!list) byKindCache.set(kind, (list = archive().entries.filter((e) => e.kind === kind)));
  return list;
};

export const getRecordById = (kind: RecordKind, id: string): ArchiveEntry | undefined =>
  archive().entryByKey.get(entryKey(kind, id));

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
  flora: "flora",
};

/**
 * Reverse index.
 *
 * Every link in the archive is stated once, on whichever record is its natural
 * home, and read in both directions from here. Built lazily and cached, so a
 * dossier that asks "what references me?" costs a map lookup rather than a scan.
 *
 * The two original divisions predate the `relations` object and carry their
 * links as plain fields instead. Those are folded in below rather than left
 * out: without them a specimen's dossier would list the island it was held on
 * while the island's own dossier listed no specimens, and the archive would be
 * connected in one direction only.
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
    // Flat fields on the base records, read into the same shape.
    ...a.specimens.map((r) => ({
      kind: "specimen" as const,
      id: r.id,
      relations: { locations: r.locations, personnel: r.personnel, specimens: r.specimens },
    })),
    ...a.personnel.map((r) => ({
      kind: "person" as const,
      id: r.id,
      relations: { locations: r.locations, specimens: r.specimens },
    })),
  ];

  for (const record of declared) {
    const from = entryKey(record.kind, record.id);
    for (const [key, ids] of Object.entries(record.relations ?? {})) {
      const kind = RELATION_KIND[key as keyof Relations];
      if (!kind || !Array.isArray(ids)) continue;
      for (const id of ids) link(from, entryKey(kind, id));
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
 * The links a record states itself, whatever shape its division stores them in.
 * The expansion divisions carry a `relations` object; the two original ones
 * carry the same information as plain fields.
 */
function declaredLinks(kind: RecordKind, id: string): Relations | undefined {
  const a = archive();
  switch (kind) {
    case "specimen": {
      const r = a.specimenById.get(id);
      return (
        r && {
          locations: r.locations,
          personnel: r.personnel,
          specimens: r.specimens,
        }
      );
    }
    case "person": {
      const r = a.personById.get(id);
      return (
        r && {
          locations: r.locations,
          specimens: r.specimens,
        }
      );
    }
    case "location":
      return a.locationById.get(id)?.relations;
    case "flora":
      return a.floraById.get(id)?.relations;
  }
}

/**
 * Every record connected to this one, in either direction, grouped by division.
 *
 * The record's own links are read here rather than passed in by the caller.
 * They used to be handed over as arguments, which meant a dossier that forgot
 * to pass them rendered as though the record were unconnected — a silent,
 * per-screen way for the archive to lose half its links.
 *
 * Unresolvable ids are dropped rather than rendered as dead links; validation
 * already fails the build on those, so this is belt and braces.
 */
export function getRelatedRecords(kind: RecordKind, id: string): RelatedGroup[] {
  const a = archive();
  const self = entryKey(kind, id);
  const keys = new Set<string>();

  for (const [key, ids] of Object.entries(declaredLinks(kind, id) ?? {})) {
    const target = RELATION_KIND[key as keyof Relations];
    if (!target || !Array.isArray(ids)) continue;
    for (const rid of ids) keys.add(entryKey(target, rid));
  }
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
export const getSpecimen = (id: string) => archive().specimenById.get(id);
export const getPerson = (id: string) => archive().personById.get(id);
export const getFlora = (id: string) => archive().floraById.get(id);

export { division, DIVISIONS };
