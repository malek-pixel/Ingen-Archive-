import raw from "./ingen.json";
import { ArchiveDataError, validateArchive } from "./validate";
import type { Archive, ArchiveStats, Person, Specimen, WithImage } from "./types";

export type { Specimen, Person, ArchiveStats, WithImage, Archive } from "./types";
export { ArchiveDataError } from "./validate";

interface RawArchive {
  specimens: Specimen[];
  personnel: Person[];
  specimenImages: Record<string, string>;
  personnelImages: Record<string, string>;
  stats: ArchiveStats;
}

function build(source: unknown): Archive {
  const issues = validateArchive(source);
  if (issues.length) throw new ArchiveDataError(issues);

  const r = source as RawArchive;
  const withImg = <T extends { id: string }>(list: T[], images: Record<string, string>): WithImage<T>[] =>
    list.map((rec) => ({ ...rec, img: images[rec.id] ?? "" }));

  const specimens = withImg(r.specimens, r.specimenImages);
  const personnel = withImg(r.personnel, r.personnelImages);

  return {
    specimens,
    personnel,
    stats: r.stats,
    specimenById: new Map(specimens.map((d) => [d.id, d])),
    personById: new Map(personnel.map((p) => [p.id, p])),
  };
}

/** Parses and validates an arbitrary payload — exported for tests. */
export const buildArchive = build;

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
    cached = build(raw);
    return cached;
  } catch (err) {
    failure = err as ArchiveDataError;
    if (import.meta.env.DEV) console.error(failure);
    throw failure;
  }
}
