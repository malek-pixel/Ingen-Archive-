import type { Person, Specimen, WithImage } from "../data/types";
import { deptGroup } from "./derive";

export interface FilterDef<T> {
  key: string;
  label: string;
  /** Semantic filters carry a meaning dot; taxonomy filters stay neutral. */
  dotInk?: string;
  match: (record: T) => boolean;
}

export interface SortDef<T> {
  label: string;
  dir: "↑" | "↓";
  cmp: (a: T, b: T) => number;
}

const byName = (a: { name?: string }, b: { name?: string }) => (a.name || "").localeCompare(b.name || "");

/* ---------- Specimens ---------- */

/**
 * The taxonomic register a specimen is filed under, read from its file id:
 * ING-AIR/ING-AVI (aerial), ING-MAR (marine), ING-HYB (engineered), ING-DIN
 * otherwise.
 *
 * Aerial assets carry two prefixes because the source archive does: the
 * reference files number Quetzalcoatlus ING-AVI-003 while filing Pteranodon,
 * Dimorphodon and Geosternbergia under ING-AIR. Both are folded to AIR here
 * rather than normalised in the data, because the file id is the record's
 * catalogue number and rewriting it to tidy a filter would put the archive out
 * of step with its own paperwork.
 *
 * These filters used to pattern-match the classification, diet and species
 * prose instead, which was wrong in both directions. "Flying" tested for
 * "Ptero" and so returned Pteranodon alone, leaving out every other aerial
 * asset; "Marine" tested for "marine" anywhere and so caught Geosternbergia,
 * a pterosaur, because its diet line mentions marine surface prey. The
 * register is the archive's own classification and cannot drift with wording.
 */
const AERIAL = new Set(["AIR", "AVI"]);
const register = (d: Specimen) => {
  const code = (d.fileId || "").split("-")[1] || "";
  return AERIAL.has(code) ? "AIR" : code;
};

export const SPECIMEN_FILTERS: FilterDef<Specimen>[] = [
  { key: "all", label: "All", match: () => true },
  { key: "carn", label: "Carnivore", match: (d) => /Carn/i.test(d.diet || "") },
  { key: "herb", label: "Herbivore", match: (d) => /Herb/i.test(d.diet || "") },
  { key: "mar", label: "Marine", match: (d) => register(d) === "MAR" },
  { key: "fly", label: "Flying", match: (d) => register(d) === "AIR" },
  { key: "hyb", label: "Hybrid", match: (d) => register(d) === "HYB" },
  { key: "threat", label: "Threat 4+", dotInk: "#E0B36A", match: (d) => Number(d.threat) >= 4 },
  { key: "failed", label: "Breached", dotInk: "#D2564D", match: (d) => /FAIL|BREACH/i.test(d.contain || "") },
];

export const SPECIMEN_SORTS: SortDef<Specimen>[] = [
  { label: "Record ID", dir: "↑", cmp: (a, b) => (a.fileId || "").localeCompare(b.fileId || "") },
  { label: "Threat", dir: "↓", cmp: (a, b) => Number(b.threat || 0) - Number(a.threat || 0) || byName(a, b) },
  { label: "Name", dir: "↑", cmp: byName },
  { label: "Status", dir: "↑", cmp: (a, b) => (a.status || "").localeCompare(b.status || "") || byName(a, b) },
];

const specimenHaystack = (d: Specimen) =>
  [d.name, d.species, d.fileId, d.diet, d.classification, d.threat, d.contain, d.status, d.notes]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

/* ---------- Personnel ---------- */

export const PERSON_FILTERS: FilterDef<Person>[] = [
  { key: "all", label: "All", match: () => true },
  { key: "exec", label: "Executive", match: (p) => deptGroup(p) === "exec" },
  { key: "gen", label: "Research", match: (p) => deptGroup(p) === "gen" },
  { key: "ops", label: "Operations", match: (p) => deptGroup(p) === "ops" },
  { key: "sec", label: "Security", match: (p) => deptGroup(p) === "sec" },
  { key: "ext", label: "External", match: (p) => deptGroup(p) === "ext" },
  { key: "l4", label: "Level 4+", dotInk: "#7CB9E0", match: (p) => Number(p.clearance || 0) >= 4 },
];

export const PERSON_SORTS: SortDef<Person>[] = [
  { label: "Clearance", dir: "↓", cmp: (a, b) => (b.clearance || 0) - (a.clearance || 0) || byName(a, b) },
  { label: "Name", dir: "↑", cmp: byName },
  { label: "Record ID", dir: "↑", cmp: (a, b) => (a.fileId || "").localeCompare(b.fileId || "") },
];

const personHaystack = (p: Person) =>
  [p.name, p.role, p.dept, p.aff, p.nat, p.status, p.threat, p.tag, `L${p.clearance}`]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

/* ---------- Shared pipeline ---------- */

export interface QueryInput<T> {
  records: T[];
  query: string;
  filter: string;
  sortIndex: number;
  filters: FilterDef<T>[];
  sorts: SortDef<T>[];
  haystack: (record: T) => string;
}

export function runQuery<T>({ records, query, filter, sortIndex, filters, sorts, haystack }: QueryInput<T>) {
  const q = query.trim().toLowerCase();
  const active = filters.find((f) => f.key === filter) ?? filters[0];
  const sort = sorts[((sortIndex % sorts.length) + sorts.length) % sorts.length];
  const results = records.filter((r) => active.match(r) && (!q || haystack(r).includes(q))).sort(sort.cmp);
  return { results, sort, active, isFiltered: active.key !== "all" || q !== "" };
}

export const querySpecimens = (records: WithImage<Specimen>[], query: string, filter: string, sortIndex: number) =>
  runQuery({
    records,
    query,
    filter,
    sortIndex,
    filters: SPECIMEN_FILTERS,
    sorts: SPECIMEN_SORTS,
    haystack: specimenHaystack,
  });

export const queryPersonnel = (records: WithImage<Person>[], query: string, filter: string, sortIndex: number) =>
  runQuery({
    records,
    query,
    filter,
    sortIndex,
    filters: PERSON_FILTERS,
    sorts: PERSON_SORTS,
    haystack: personHaystack,
  });

export { specimenHaystack, personHaystack };

/* ========================================================================== */
/*  Expansion divisions                                                        */
/*                                                                             */
/*  These filter ArchiveEntry rather than the raw record: the shared card and  */
/*  the global search both work in entry space, so the index screens do too.   */
/* ========================================================================== */

import type { ArchiveEntry } from "../data/types";

export const entryHaystack = (e: ArchiveEntry) => e.haystack;

const statusIs = (re: RegExp) => (e: ArchiveEntry) => re.test(e.status.toUpperCase());
const tagged = (tag: string) => (e: ArchiveEntry) => e.haystack.includes(tag);

const byEntryName = (a: ArchiveEntry, b: ArchiveEntry) => a.name.localeCompare(b.name);
const byFileId = (a: ArchiveEntry, b: ArchiveEntry) => a.fileId.localeCompare(b.fileId);

/** Security runs least to most restricted; sorting descending surfaces the sensitive files. */
const SECURITY_ORDER: Record<string, number> = {
  PUBLIC: 0,
  INTERNAL: 1,
  RESTRICTED: 2,
  CONFIDENTIAL: 3,
  CLASSIFIED: 4,
  CRITICAL: 5,
};
const bySecurity = (a: ArchiveEntry, b: ArchiveEntry) =>
  (SECURITY_ORDER[b.security] ?? 0) - (SECURITY_ORDER[a.security] ?? 0) || byEntryName(a, b);

const ENTRY_SORTS: SortDef<ArchiveEntry>[] = [
  { label: "Record ID", dir: "↑", cmp: byFileId },
  { label: "Name", dir: "↑", cmp: byEntryName },
  { label: "Classification", dir: "↓", cmp: bySecurity },
  { label: "Status", dir: "↑", cmp: (a, b) => a.status.localeCompare(b.status) || byEntryName(a, b) },
];

export const LOCATION_FILTERS: FilterDef<ArchiveEntry>[] = [
  { key: "all", label: "All", match: () => true },
  { key: "island", label: "Islands", match: tagged("island") },
  { key: "park", label: "Park sites", match: tagged("park") },
  { key: "operational", label: "Operational", dotInk: "#7ACB9A", match: statusIs(/ACTIVE/) },
  { key: "lost", label: "Lost", dotInk: "#E08A84", match: statusIs(/DESTROYED|ABANDONED/) },
  {
    key: "uncontained",
    label: "Uncontained",
    dotInk: "#E0B36A",
    match: (e) => /UNCONTAINED|ABANDONED|RESTRICTED/.test(e.status.toUpperCase()),
  },
];
export const LOCATION_SORTS = ENTRY_SORTS;

export const FLORA_FILTERS: FilterDef<ArchiveEntry>[] = [
  { key: "all", label: "All", match: () => true },
  { key: "cycad", label: "Cycads", match: tagged("cycad") },
  { key: "conifer", label: "Conifers", match: tagged("conifer") },
  { key: "angiosperm", label: "Angiosperms", match: tagged("angiosperm") },
  { key: "fern", label: "Ferns", match: (e) => e.haystack.includes("fern") || e.haystack.includes("horsetail") },
  { key: "toxic", label: "Toxic", dotInk: "#E0B36A", match: tagged("toxic") },
  { key: "naturalised", label: "Naturalised", dotInk: "#7ACB9A", match: statusIs(/NATURALISED/) },
];
export const FLORA_SORTS = ENTRY_SORTS;
