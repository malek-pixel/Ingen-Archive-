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

const taxon = (d: Specimen) => `${d.classification || ""} ${d.diet || ""} ${d.species || ""}`;

export const SPECIMEN_FILTERS: FilterDef<Specimen>[] = [
  { key: "all", label: "All", match: () => true },
  { key: "carn", label: "Carnivore", match: (d) => /Carn/i.test(d.diet || "") },
  { key: "herb", label: "Herbivore", match: (d) => /Herb/i.test(d.diet || "") },
  { key: "mar", label: "Marine", match: (d) => /Marine|Mosasaur|Plesiosaur|Aquatic/i.test(taxon(d)) },
  { key: "fly", label: "Flying", match: (d) => /Ptero|Flying|Avian|Volant/i.test(taxon(d)) },
  { key: "hyb", label: "Hybrid", match: (d) => /Hybrid|Transgenic/i.test(taxon(d)) },
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
  [
    d.name,
    d.species,
    d.fileId,
    d.diet,
    d.classification,
    d.threat,
    d.contain,
    d.status,
    d.notes,
    (d.incidents || []).join(" "),
  ]
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
