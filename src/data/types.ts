export type StatBlock = Record<string, number>;

/**
 * Security classification, used as metadata across every division.
 * Ordered least to most restricted.
 */
export const SECURITY_LEVELS = ["PUBLIC", "INTERNAL", "RESTRICTED", "CONFIDENTIAL", "CLASSIFIED", "CRITICAL"] as const;
export type SecurityLevel = (typeof SECURITY_LEVELS)[number];

/** The four archive divisions. */
export const RECORD_KINDS = ["specimen", "person", "location", "flora"] as const;
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
  /**
   * Sequencing completion, where the file records one. Absent on records whose
   * source dossier states no figure — the dossier prints "—" rather than a
   * number nobody measured.
   */
  genome?: number;
  stats: StatBlock;
  notes: string;
  classified: string;
  tag?: string;
  /** Optional cross-division links; absent on the original records. */
  locations?: string[];
  personnel?: string[];
  /** Other assets this one is filed against — shared range, rivalry, competition. */
  specimens?: string[];
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

  stats: ArchiveStats;
  counts: DivisionCounts;

  specimenById: Map<string, WithImage<Specimen>>;
  personById: Map<string, WithImage<Person>>;
  locationById: Map<string, WithImage<Location>>;
  floraById: Map<string, WithImage<Flora>>;
  /** Every record, flattened, for global search and cross-links. */
  entries: ArchiveEntry[];
  entryByKey: Map<string, ArchiveEntry>;
}
