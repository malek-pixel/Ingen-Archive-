export type StatBlock = Record<string, number>;

/**
 * Security classification, used as metadata across every division.
 * Ordered least to most restricted.
 */
export const SECURITY_LEVELS = ["PUBLIC", "INTERNAL", "RESTRICTED", "CONFIDENTIAL", "CLASSIFIED", "CRITICAL"] as const;
export type SecurityLevel = (typeof SECURITY_LEVELS)[number];

/** The six archive divisions. */
export const RECORD_KINDS = ["specimen", "person", "location", "flora", "facility", "incident"] as const;
export type RecordKind = (typeof RECORD_KINDS)[number];

/**
 * What every archive record carries, whatever division it belongs to.
 * Division-specific metadata lives on the individual record types below —
 * fields are not forced to be shared just to fit one shape.
 */
export interface ArchiveCommon {
  id: string;
  fileId: string;
  name: string;
  status: string;
  notes: string;
  tags: string[];
  security: SecurityLevel;
}

/** Cross-division links. Each holds record ids of the named division. */
export interface Relations {
  specimens?: string[];
  personnel?: string[];
  locations?: string[];
  facilities?: string[];
  incidents?: string[];
  flora?: string[];
}

/* ---------------------------------------------------------------- divisions */

/**
 * Genetic assets. Predates the common shape, so `security` and `tags` are
 * derived at load rather than stored — see data/derive-common.ts.
 */
export interface Specimen {
  id: string;
  fileId: string;
  name: string;
  species: string;
  codename?: string;
  status: string;
  classification: string;
  threat: number;
  contain: string;
  length: string;
  weight: string;
  diet: string;
  habitat: string;
  genome: number;
  incidents: string[];
  stats: StatBlock;
  notes: string;
  classified: string;
  tag?: string;
  /** Optional cross-division links; absent on the original records. */
  locations?: string[];
  facilities?: string[];
  personnel?: string[];
}

export interface Person {
  id: string;
  fileId: string;
  name: string;
  status: string;
  clearance: number;
  dept: string;
  role: string;
  aff: string;
  nat: string;
  history: string[];
  stats: StatBlock;
  threat: string;
  psych: string;
  classified: string;
  tag?: string;
  quote?: string;
  locations?: string[];
  facilities?: string[];
  specimens?: string[];
}

export interface Location extends ArchiveCommon {
  designation: string;
  type: string;
  region: string;
  environment: string;
  terrain: string;
  climate: string;
  established: string;
  decommissioned?: string;
  primaryFunction: string;
  description: string;
  inGenInvolvement: string;
  historicalNotes?: string;
  relations: Relations;
}

export interface Flora extends ArchiveCommon {
  scientificName: string;
  classification: string;
  era: string;
  habitat: string;
  distribution: string;
  growth: string;
  toxicity: string;
  ecologicalRole: string;
  reconstruction: string;
  researchValue: string;
  genome?: number;
  relations: Relations;
}

export interface Facility extends ArchiveCommon {
  designation: string;
  type: string;
  /** Location record id this facility sits within. */
  location: string;
  established: string;
  decommissioned?: string;
  function: string;
  description: string;
  capacity?: string;
  condition: string;
  relations: Relations;
}

export interface Incident extends ArchiveCommon {
  /** Matches the slugs already referenced by specimen/personnel records. */
  slug: string;
  date: string;
  year: string;
  type: string;
  severity: number;
  classification: string;
  summary: string;
  timeline: { label: string; detail: string }[];
  outcome: string;
  relations: Relations;
}

/* -------------------------------------------------------------------- stats */

export interface ArchiveStats {
  dTotal: number;
  dActive: number;
  dDeceased: number;
  dFailed: number;
  dStable: number;
  dPartial: number;
  dExtreme: number;
  dHigh: number;
  pTotal: number;
  pAlive: number;
  pDeceased: number;
  pL5: number;
  pL4plus: number;
}

/** Counts derived from the loaded data — never hardcoded. */
export interface DivisionCounts {
  specimen: number;
  person: number;
  location: number;
  flora: number;
  facility: number;
  incident: number;
  total: number;
}

/* ------------------------------------------------------------------ runtime */

/** A record with its image path resolved. Empty string means no plate on file. */
export type WithImage<T> = T & { img: string; imgRatio?: number };

/**
 * The uniform view of any record, used by global search, cross-links and the
 * shared archive card. Division-specific data stays on `record`.
 */
export interface ArchiveEntry {
  kind: RecordKind;
  id: string;
  fileId: string;
  name: string;
  /** One-line subtitle: species, role, designation… */
  subtitle: string;
  status: string;
  security: SecurityLevel;
  img: string;
  /**
   * The plate's own width ÷ height, when known. The frame takes its shape from
   * this so the image fills it exactly: no crop, no margin. Absent for records
   * whose imagery predates dimension tracking, which fall back to a fixed frame.
   */
  imgRatio?: number;
  /** Route to this record's dossier. */
  href: string;
  /** Lowercased haystack for global search. */
  haystack: string;
}

export interface Archive {
  specimens: WithImage<Specimen>[];
  personnel: WithImage<Person>[];
  locations: WithImage<Location>[];
  flora: WithImage<Flora>[];
  facilities: WithImage<Facility>[];
  incidents: WithImage<Incident>[];

  stats: ArchiveStats;
  counts: DivisionCounts;

  specimenById: Map<string, WithImage<Specimen>>;
  personById: Map<string, WithImage<Person>>;
  locationById: Map<string, WithImage<Location>>;
  floraById: Map<string, WithImage<Flora>>;
  facilityById: Map<string, WithImage<Facility>>;
  incidentById: Map<string, WithImage<Incident>>;
  /** Every record, flattened, for global search and cross-links. */
  entries: ArchiveEntry[];
  entryByKey: Map<string, ArchiveEntry>;
}
