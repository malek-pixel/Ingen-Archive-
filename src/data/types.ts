export type StatBlock = Record<string, number>;

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
}

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

/** A specimen or person with its image path resolved. */
export type WithImage<T> = T & { img: string };

export interface Archive {
  specimens: WithImage<Specimen>[];
  personnel: WithImage<Person>[];
  stats: ArchiveStats;
  specimenById: Map<string, WithImage<Specimen>>;
  personById: Map<string, WithImage<Person>>;
}
