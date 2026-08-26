/**
 * Hand-rolled structural validation for the archive dataset.
 * Fails loud in dev; the caller degrades to the designed error state in prod.
 */
export class ArchiveDataError extends Error {
  constructor(readonly issues: string[]) {
    super(`Archive data failed validation:\n- ${issues.join("\n- ")}`);
    this.name = "ArchiveDataError";
  }
}

type Kind = "string" | "number" | "string[]" | "stats";

/** Inclusive value ranges for the fields the UI renders as a fixed-scale meter. */
const RANGES: Record<string, [number, number]> = {
  threat: [0, 5],
  clearance: [0, 5],
  genome: [0, 100],
};

/** Every stat block feeds a five-cell meter, so values outside 0–5 would overflow it. */
const STAT_RANGE: [number, number] = [0, 5];

const describe = (v: unknown) => (Array.isArray(v) ? "array" : v === null ? "null" : typeof v);

function checkField(issues: string[], where: string, key: string, value: unknown, kind: Kind, optional = false) {
  if (value == null) {
    if (!optional) issues.push(`${where}: missing "${key}"`);
    return;
  }
  const ok =
    kind === "string"
      ? typeof value === "string"
      : kind === "number"
        ? typeof value === "number" && Number.isFinite(value)
        : kind === "string[]"
          ? Array.isArray(value) && value.every((v) => typeof v === "string")
          : typeof value === "object" &&
            !Array.isArray(value) &&
            Object.values(value as object).every((v) => typeof v === "number");
  if (!ok) {
    issues.push(`${where}: "${key}" expected ${kind}, got ${describe(value)}`);
    return;
  }

  // Type alone is not enough: a threat of 99 or a negative genome passes every
  // type check and then renders as a broken meter or an impossible figure.
  if (kind === "number") {
    const range = RANGES[key];
    const n = value as number;
    if (range && (n < range[0] || n > range[1])) {
      issues.push(`${where}: "${key}" out of range ${range[0]}–${range[1]} (got ${n})`);
    }
  }

  if (kind === "stats") {
    for (const [statKey, statVal] of Object.entries(value as Record<string, number>)) {
      if (statVal < STAT_RANGE[0] || statVal > STAT_RANGE[1]) {
        issues.push(`${where}: stat "${statKey}" out of range ${STAT_RANGE[0]}–${STAT_RANGE[1]} (got ${statVal})`);
      }
    }
  }
}

const SPECIMEN_FIELDS: [string, Kind, boolean?][] = [
  ["id", "string"],
  ["fileId", "string"],
  ["name", "string"],
  ["species", "string"],
  ["codename", "string", true],
  ["status", "string"],
  ["classification", "string"],
  ["threat", "number"],
  ["contain", "string"],
  ["length", "string"],
  ["weight", "string"],
  ["diet", "string"],
  ["habitat", "string"],
  ["genome", "number"],
  ["incidents", "string[]"],
  ["stats", "stats"],
  ["notes", "string"],
  ["classified", "string"],
  ["tag", "string", true],
];

const PERSON_FIELDS: [string, Kind, boolean?][] = [
  ["id", "string"],
  ["fileId", "string"],
  ["name", "string"],
  ["status", "string"],
  ["clearance", "number"],
  ["dept", "string"],
  ["role", "string"],
  ["aff", "string"],
  ["nat", "string"],
  ["history", "string[]"],
  ["stats", "stats"],
  ["threat", "string"],
  ["psych", "string"],
  ["classified", "string"],
  ["tag", "string", true],
  ["quote", "string", true],
];

const STAT_KEYS = [
  "dTotal",
  "dActive",
  "dDeceased",
  "dFailed",
  "dStable",
  "dPartial",
  "dExtreme",
  "dHigh",
  "pTotal",
  "pAlive",
  "pDeceased",
  "pL5",
  "pL4plus",
];

export function validateArchive(raw: unknown): string[] {
  const issues: string[] = [];
  if (typeof raw !== "object" || raw === null) return ["root: expected an object"];
  const r = raw as Record<string, unknown>;

  for (const [collection, fields, imageKey] of [
    ["specimens", SPECIMEN_FIELDS, "specimenImages"],
    ["personnel", PERSON_FIELDS, "personnelImages"],
  ] as const) {
    const list = r[collection];
    if (!Array.isArray(list) || list.length === 0) {
      issues.push(`${collection}: expected a non-empty array`);
      continue;
    }
    const images = (r[imageKey] ?? {}) as Record<string, unknown>;
    const seen = new Set<string>();
    list.forEach((rec, i) => {
      const where = `${collection}[${i}]`;
      if (typeof rec !== "object" || rec === null) {
        issues.push(`${where}: expected an object`);
        return;
      }
      const o = rec as Record<string, unknown>;
      for (const [key, kind, optional] of fields) checkField(issues, where, key, o[key], kind, optional);
      const id = o.id;
      if (typeof id === "string") {
        if (seen.has(id)) issues.push(`${where}: duplicate id "${id}"`);
        seen.add(id);
        if (typeof images[id] !== "string") issues.push(`${where}: no image mapped for "${id}"`);
      }
    });
  }

  const stats = r.stats;
  if (typeof stats !== "object" || stats === null) {
    issues.push("stats: expected an object");
  } else {
    for (const k of STAT_KEYS) {
      if (typeof (stats as Record<string, unknown>)[k] !== "number") issues.push(`stats: "${k}" expected number`);
    }
  }
  return issues;
}

/* ========================================================================== */
/*  Expansion divisions                                                        */
/* ========================================================================== */

import { SECURITY_LEVELS } from "./types";
import type { Facility, Flora, Incident, Location } from "./types";

const SECURITY = new Set<string>(SECURITY_LEVELS);

const COMMON: [string, Kind, boolean?][] = [
  ["id", "string"],
  ["fileId", "string"],
  ["name", "string"],
  ["status", "string"],
  ["notes", "string"],
  ["tags", "string[]"],
  ["security", "string"],
];

const LOCATION_FIELDS: [string, Kind, boolean?][] = [
  ...COMMON,
  ["designation", "string"],
  ["type", "string"],
  ["region", "string"],
  ["environment", "string"],
  ["terrain", "string"],
  ["climate", "string"],
  ["established", "string"],
  ["decommissioned", "string", true],
  ["primaryFunction", "string"],
  ["description", "string"],
  ["inGenInvolvement", "string"],
  ["historicalNotes", "string", true],
];

const FLORA_FIELDS: [string, Kind, boolean?][] = [
  ...COMMON,
  ["scientificName", "string"],
  ["classification", "string"],
  ["era", "string"],
  ["habitat", "string"],
  ["distribution", "string"],
  ["growth", "string"],
  ["toxicity", "string"],
  ["ecologicalRole", "string"],
  ["reconstruction", "string"],
  ["researchValue", "string"],
  ["genome", "number", true],
];

const FACILITY_FIELDS: [string, Kind, boolean?][] = [
  ...COMMON,
  ["designation", "string"],
  ["type", "string"],
  ["location", "string"],
  ["established", "string"],
  ["decommissioned", "string", true],
  ["function", "string"],
  ["description", "string"],
  ["capacity", "string", true],
  ["condition", "string"],
];

const INCIDENT_FIELDS: [string, Kind, boolean?][] = [
  ...COMMON,
  ["slug", "string"],
  ["date", "string"],
  ["year", "string"],
  ["type", "string"],
  ["severity", "number"],
  ["classification", "string"],
  ["summary", "string"],
  ["outcome", "string"],
];

const RELATION_KEYS = ["specimens", "personnel", "locations", "facilities", "incidents", "flora"];

export interface DivisionData {
  locations: Location[];
  flora: Flora[];
  facilities: Facility[];
  incidents: Incident[];
}

/**
 * Validates the expansion divisions, including referential integrity: a
 * cross-link pointing at a record that does not exist would render a dead
 * link in a dossier, so it fails here instead.
 */
export function validateDivisions(data: DivisionData): string[] {
  const issues: string[] = [];

  const sets: Record<string, Set<string>> = {
    locations: new Set(data.locations.map((r) => r.id)),
    flora: new Set(data.flora.map((r) => r.id)),
    facilities: new Set(data.facilities.map((r) => r.id)),
    incidents: new Set(data.incidents.map((r) => r.id)),
  };

  const check = (name: keyof DivisionData, list: unknown[], fields: [string, Kind, boolean?][], prefix: string) => {
    if (!Array.isArray(list) || list.length === 0) {
      issues.push(`${name}: expected a non-empty array`);
      return;
    }
    const seen = new Set<string>();
    list.forEach((rec, i) => {
      const where = `${name}[${i}]`;
      if (typeof rec !== "object" || rec === null) {
        issues.push(`${where}: expected an object`);
        return;
      }
      const o = rec as Record<string, unknown>;
      for (const [key, kind, optional] of fields) checkField(issues, where, key, o[key], kind, optional);

      if (typeof o.id === "string") {
        if (seen.has(o.id)) issues.push(`${where}: duplicate id "${o.id}"`);
        seen.add(o.id);
      }
      if (typeof o.fileId === "string" && !o.fileId.startsWith(prefix)) {
        issues.push(`${where}: fileId "${o.fileId}" should start with "${prefix}"`);
      }
      if (typeof o.security === "string" && !SECURITY.has(o.security)) {
        issues.push(`${where}: unknown security level "${o.security}"`);
      }

      const rel = o.relations;
      if (rel != null) {
        if (typeof rel !== "object" || Array.isArray(rel)) {
          issues.push(`${where}: "relations" expected an object`);
        } else {
          for (const [key, ids] of Object.entries(rel as Record<string, unknown>)) {
            if (!RELATION_KEYS.includes(key)) {
              issues.push(`${where}: unknown relation "${key}"`);
              continue;
            }
            if (!Array.isArray(ids) || !ids.every((v) => typeof v === "string")) {
              issues.push(`${where}: relation "${key}" expected string[]`);
              continue;
            }
            // Only divisions defined here can be checked; specimen and personnel
            // ids are verified against the base archive in validateCrossLinks.
            const target = sets[key];
            if (!target) continue;
            for (const id of ids as string[]) {
              if (!target.has(id)) issues.push(`${where}: relation "${key}" points at unknown record "${id}"`);
            }
          }
        }
      }
    });
  };

  check("locations", data.locations, LOCATION_FIELDS, "ING-LOC");
  check("flora", data.flora, FLORA_FIELDS, "ING-FLR");
  check("facilities", data.facilities, FACILITY_FIELDS, "ING-FAC");
  check("incidents", data.incidents, INCIDENT_FIELDS, "ING-OPS");

  // Every facility must sit at a real location.
  for (const f of data.facilities) {
    if (typeof f.location === "string" && !sets.locations.has(f.location)) {
      issues.push(`facilities[${f.id}]: location "${f.location}" is not a known location record`);
    }
  }

  for (const i of data.incidents) {
    if (typeof i.severity === "number" && (i.severity < 1 || i.severity > 5)) {
      issues.push(`incidents[${i.id}]: severity out of range 1-5 (got ${i.severity})`);
    }
  }

  return issues;
}
