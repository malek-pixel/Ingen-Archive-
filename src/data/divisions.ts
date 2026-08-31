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
  /**
   * How a division's imagery is drawn.
   *
   * "cutout" — a subject rendered on a neutral ground, as the specimen plates
   *            are. It is letterboxed whole on the light engineering plate:
   *            cropping a cutout severs the subject.
   * "plate"  — an opaque photograph, survey chart or site map, edge to edge.
   *            It fills the card frame, and the dossier shows it uncropped at
   *            its own proportions, because a map loses its meaning the moment
   *            a corner is cut off.
   * "none"   — never photographed; the drawn technical plate stands in.
   */
  imagery: "cutout" | "plate" | "none";
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
    imagery: "cutout",
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
    imagery: "plate",
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
    imagery: "plate",
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
    imagery: "plate",
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
    imagery: "none",
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
    imagery: "none",
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

export const division = (kind: RecordKind): Division => {
  const found = byKind.get(kind);
  if (!found) throw new Error(`Unknown archive division: ${kind}`);
  return found;
};

/** Route to a record's dossier. */
export const recordHref = (kind: RecordKind, id: string) => `/${division(kind).path}/${id}`;
