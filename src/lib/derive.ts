import type { Person, Specimen, WithImage } from "../data/types";

/* ---- Semantics lifted verbatim from the frozen mockups ---- */

export interface Semantic {
  ink: string;
  border: string;
  label: string;
}

export function specimenStatus(status: string): Semantic {
  const st = (status || "").toUpperCase();
  const isActive = /^ACTIVE|^ALIVE/.test(st);
  const isDead = /DECEASED/.test(st);
  return {
    ink: isActive ? "#7ACB9A" : isDead ? "#E08A84" : "#E0B36A",
    border: isActive ? "#2C4A3A" : isDead ? "#4A2C2C" : "#4A3E28",
    label: st ? st.charAt(0) + st.slice(1).toLowerCase() : "Unknown",
  };
}

/** Card-level short status: "Active" / "Deceased" / titled raw value. */
export function specimenStatusShort(status: string): Semantic {
  const st = (status || "").toUpperCase();
  const base = specimenStatus(status);
  const label = /^ACTIVE|^ALIVE/.test(st)
    ? "Active"
    : /DECEASED/.test(st)
      ? "Deceased"
      : st
        ? st.charAt(0) + st.slice(1).toLowerCase()
        : "Unknown";
  return { ...base, label };
}

export function containment(contain: string): Semantic {
  const cc = (contain || "").toUpperCase();
  const failed = /FAIL|BREACH/.test(cc);
  const partial = /PARTIAL/.test(cc);
  return {
    ink: failed ? "#E08A84" : partial ? "#E0B36A" : "#7ACB9A",
    border: failed ? "#4A2C2C" : partial ? "#4A3E28" : "#2C4A3A",
    label: /FAILED PERMANENTLY/.test(cc)
      ? "Containment failed — permanent"
      : failed
        ? "Containment failed"
        : partial
          ? "Partial containment"
          : cc
            ? cc.charAt(0) + cc.slice(1).toLowerCase()
            : "Containment unknown",
  };
}

/** Card variant: muted ink, no "— permanent" tail. */
export function containmentShort(contain: string): Semantic {
  const cc = (contain || "").toUpperCase();
  const failed = /FAIL|BREACH/.test(cc);
  const partial = /PARTIAL/.test(cc);
  return {
    ink: failed ? "#D2564D" : partial ? "#C98A2E" : "#788BA0",
    border: containment(contain).border,
    label: failed ? "Containment failed" : partial ? "Partial containment" : "Contained",
  };
}

/** Dashboard "security intelligence" phrasing. */
export function containmentTidy(contain: string): string {
  const u = (contain || "").toUpperCase();
  return /FAILED PERMANENTLY/.test(u)
    ? "Containment failed — permanent"
    : /FAIL|BREACH/.test(u)
      ? "Containment failed"
      : /PARTIAL/.test(u)
        ? "Partial containment"
        : u
          ? u.charAt(0) + u.slice(1).toLowerCase()
          : "—";
}

export const threatInk = (t: number, muted = false) =>
  t >= 5 ? "#D2564D" : t >= 4 ? "#C98A2E" : muted ? (t >= 3 ? "#8FA6BC" : "#6B7A8A") : "#8FA6BC";

export const threatLabel = (t: number) =>
  t >= 5
    ? "Extreme — lethal to personnel without full containment protocol."
    : t >= 4
      ? "High — armed escort required for all proximity work."
      : t >= 3
        ? "Moderate — standard handling precautions apply."
        : "Low — routine keeper access permitted.";

export const cells = (value: number, ink: string, track = "#1F2833") =>
  Array.from({ length: 5 }, (_, i) => (i < value ? ink : track));

export const dietLabel = (diet: string) =>
  /Carn/i.test(diet || "") ? "Carnivore" : /Herb/i.test(diet || "") ? "Herbivore" : "Omnivore";

/** Alpha cutouts composite normally; white-plate sources multiply onto the plate. */
const ALPHA_CUTOUTS = new Set(["ankylosaurus", "mosasaurus"]);
export const plateBlend = (id: string) => (ALPHA_CUTOUTS.has(id) ? "normal" : "multiply");

export function personStatus(status: string): Semantic {
  const st = (status || "").toUpperCase();
  const isAlive = /ALIVE/.test(st);
  const isDead = /DECEASED/.test(st);
  return {
    ink: isAlive ? "#7ACB9A" : isDead ? "#E08A84" : "#E0B36A",
    border: isAlive ? "#2C4A3A" : isDead ? "#4A2C2C" : "#4A3E28",
    label: isAlive ? "Active" : isDead ? "File closed" : st ? st.charAt(0) + st.slice(1).toLowerCase() : "Unknown",
  };
}

/** Card badge wording differs from the detail badge: "Closed", not "File closed". */
export function personStatusShort(status: string): Semantic {
  const st = (status || "").toUpperCase();
  const base = personStatus(status);
  return {
    ...base,
    label: /ALIVE/.test(st)
      ? "Active"
      : /DECEASED/.test(st)
        ? "Closed"
        : st
          ? st.charAt(0) + st.slice(1).toLowerCase()
          : "—",
  };
}

export interface Clearance {
  ink: string;
  border: string;
  fill: string;
  word: string;
  label: string;
}

export function clearance(level: number): Clearance {
  const c = Number(level) || 0;
  return {
    ink: c >= 5 ? "#7CB9E0" : c >= 4 ? "#9FB2C4" : "#6B7A8A",
    border: c >= 5 ? "#2E5C7A" : c >= 4 ? "#33414F" : "#28323D",
    fill: c >= 5 ? "rgba(46,92,122,.16)" : "transparent",
    word: c >= 5 ? "Full access" : c >= 4 ? "Operational" : c >= 3 ? "Departmental" : "Restricted",
    label:
      c >= 5
        ? "Full archive access, including classified genetic records."
        : c >= 4
          ? "Operational access to asset and containment records."
          : c >= 3
            ? "Departmental access, no classified material."
            : "Restricted access, escorted areas only.",
  };
}

/** Index-row clearance ink (a shorter scale than the badge). */
export const clearanceRowInk = (c: number) => (c >= 5 ? "#7CB9E0" : c >= 4 ? "#9FB2C4" : "#788BA0");

/** Index-row threat ink for the archive index list. */
export const threatRowInk = (t: number) => (t >= 5 ? "#D2564D" : t >= 4 ? "#C98A2E" : t >= 3 ? "#3D5568" : "#232D38");

export const humanizeStat = (k: string) =>
  k
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (m) => m.toUpperCase())
    .trim();

export interface TimelineEvent {
  year: string;
  label: string;
  slug: string;
}

/** Incident/assignment slugs carry their own year: "fallen-kingdom-2018". */
export function parseSlug(slug: string): TimelineEvent {
  const parts = (slug || "").split("-");
  const last = parts[parts.length - 1];
  const year = /^\d{4}$/.test(last) ? last : "";
  const raw = (year ? parts.slice(0, -1) : parts).join(" ");
  return { year: year || "—", label: raw.replace(/\b\w/g, (m) => m.toUpperCase()) || slug, slug };
}

export const byYear = (a: TimelineEvent, b: TimelineEvent) => (a.year || "").localeCompare(b.year || "");

/** Primary department only — drops the "(Former) / …" affiliation tail. */
export const deptShort = (dept: string) =>
  (dept || "")
    .split(/\s*[/–]\s*/)[0]
    .replace(/\s*\(Former\)/i, "")
    .trim() || "—";

export const deptGroup = (p: Person): "ext" | "sec" | "exec" | "gen" | "ops" => {
  const d = p.dept || "";
  if (/^External/i.test(d)) return "ext";
  if (/Security/i.test(d)) return "sec";
  if (/Executive|Founding Directorate/i.test(d)) return "exec";
  if (/Genetic|Veterinary|Field Research/i.test(d)) return "gen";
  return "ops";
};

export const personThreatLabel = (threat: string) => {
  const t = (threat || "").toUpperCase();
  return t ? t.charAt(0) + t.slice(1).toLowerCase() : "Unassessed";
};

export type Specimens = WithImage<Specimen>[];
export type People = WithImage<Person>[];
