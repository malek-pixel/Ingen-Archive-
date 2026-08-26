import type { RecordKind } from "./types";

/**
 * The archive's division taxonomy — the single source of truth for navigation,
 * routing, search labelling and record identifiers. Adding a division means
 * adding an entry here and a data file; nothing else enumerates the list.
 */
export interface Division {
  kind: RecordKind;
  /** Route segment, e.g. /locations */
  path: string;
  /** Plural label, as shown in navigation and search results. */
  label: string;
  /** Singular label, for a record's own dossier. */
  singular: string;
  /** Short label used inside search results and cross-links. */
  badge: string;
  /** Identifier segment, e.g. ING-LOC-001 */
  prefix: string;
  /** Navigation grouping. */
  group: "biological" | "organization" | "infrastructure" | "operations";
  /** Whether records in this division carry photographic plates. */
  hasImagery: boolean;
  blurb: string;
}

export const DIVISIONS: Division[] = [
  {
    kind: "specimen",
    path: "assets",
    label: "Genetic assets",
    singular: "Genetic asset",
    badge: "GENETIC ASSET",
    prefix: "ING-DIN",
    group: "biological",
    hasImagery: true,
    blurb: "Every specimen indexed under InGen custodianship.",
  },
  {
    kind: "flora",
    path: "paleobotany",
    label: "Paleobotany",
    singular: "Botanical record",
    badge: "PALEOBOTANY",
    prefix: "ING-FLR",
    group: "biological",
    hasImagery: false,
    blurb: "Reconstructed and cultivated flora held under botanical research.",
  },
  {
    kind: "person",
    path: "personnel",
    label: "Personnel",
    singular: "Personnel file",
    badge: "PERSONNEL",
    prefix: "ING-CHR",
    group: "organization",
    hasImagery: true,
    blurb: "Employment records, consultants and persons of interest.",
  },
  {
    kind: "location",
    path: "locations",
    label: "Locations",
    singular: "Location",
    badge: "LOCATION",
    prefix: "ING-LOC",
    group: "infrastructure",
    hasImagery: false,
    blurb: "Sites, islands and operational territories on record.",
  },
  {
    kind: "facility",
    path: "facilities",
    label: "Facilities",
    singular: "Facility",
    badge: "FACILITY",
    prefix: "ING-FAC",
    group: "infrastructure",
    hasImagery: false,
    blurb: "Laboratories, enclosures and structures within recorded sites.",
  },
  {
    kind: "incident",
    path: "operations",
    label: "Operations",
    singular: "Operational record",
    badge: "OPERATION",
    prefix: "ING-OPS",
    group: "operations",
    hasImagery: false,
    blurb: "Incidents, expeditions and events of operational significance.",
  },
];

export const NAV_GROUPS: { key: Division["group"]; label: string }[] = [
  { key: "biological", label: "Biological" },
  { key: "organization", label: "Organization" },
  { key: "infrastructure", label: "Infrastructure" },
  { key: "operations", label: "Operations" },
];

const byKind = new Map(DIVISIONS.map((d) => [d.kind, d]));
const byPath = new Map(DIVISIONS.map((d) => [d.path, d]));

export const division = (kind: RecordKind): Division => {
  const found = byKind.get(kind);
  if (!found) throw new Error(`Unknown archive division: ${kind}`);
  return found;
};

export const divisionByPath = (path: string): Division | undefined => byPath.get(path);

/** Route to a record's dossier. */
export const recordHref = (kind: RecordKind, id: string) => `/${division(kind).path}/${id}`;
