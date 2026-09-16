import { loadArchive } from "../data/ingen";
import { getRelatedRecords } from "../lib/archive";
import { recordHref } from "../data/divisions";
import type { RecordKind, SecurityLevel, Specimen, WithImage } from "../data/types";

/* ============================================================================
   The classified layer.

   NOTHING HERE IS AUTHORED. Every field on every card and every dossier below
   is read from the records the archive already holds — `src/data/ingen.json`,
   `locations.json`, `flora.json` — and the groupings are predicates over those
   records, not a second dataset with its own facts in it.

   That constraint is the whole design. A Level 5 layer that invented incidents,
   project codenames and personnel to fill its panels would look richer and be
   worthless: the archive's value is that it is traceable to source. Where the
   source holds nothing for a panel, the panel says so — `NOT_AVAILABLE` below —
   rather than being filled in.

   The one thing this file does author is the *organisation*: which records are
   grouped, and what that grouping is called. Group labels are descriptive of
   the records in them ("HYBRID ASSET SERIES" is the ING-HYB records) and are
   marked in the UI as compiled groupings, so they are never mistaken for a
   project name the source archive attests to.
   ========================================================================== */

/** The wording used wherever the source archive holds no value for a field. */
export const NOT_AVAILABLE = "DATA NOT AVAILABLE";

export interface ClassifiedRecord {
  /** Unique across the classified layer: a record can appear in two categories. */
  key: string;
  kind: RecordKind;
  id: string;
  fileId: string;
  name: string;
  /** Species, role or designation — whatever the division uses as its subtitle. */
  subtitle: string;
  status: string;
  security: SecurityLevel;
  /** Level 5 marking, derived from the record's own security classification. */
  marking: string;
  /** The record's own classified annotation, where the source carries one. */
  brief: string;
  meta: { label: string; value: string }[];
  /** Route to the record's dossier in the open archive. */
  href: string;
  haystack: string;
}

export interface ClassifiedCategory {
  id: string;
  label: string;
  code: string;
  /** What the category is, and — importantly — what it is drawn from. */
  blurb: string;
  source: string;
  records: ClassifiedRecord[];
}

export interface ProjectPanel {
  id: string;
  label: string;
  /** Prose, when the source carries some. */
  body?: string;
  /** Row entries; each may link into the open archive. */
  rows?: { label: string; value: string; href?: string }[];
  /** Records to render as linked file rows. */
  records?: ClassifiedRecord[];
  /** Rendered when there is nothing on file, instead of an empty panel. */
  empty?: string;
}

export interface ClassifiedProject {
  id: string;
  fileId: string;
  name: string;
  /** ACTIVE / ARCHIVED / TERMINATED, derived from the member records' statuses. */
  status: string;
  marking: string;
  summary: string;
  members: ClassifiedRecord[];
  panels: ProjectPanel[];
  haystack: string;
}

/* ------------------------------------------------------------------ helpers */

const upper = (s: string) => (s || "").toUpperCase();
const lower = (parts: unknown[]) => parts.filter(Boolean).join(" ").toLowerCase();

/** Level 5 marking. The record's own security level decides it — nothing new. */
const markingFor = (security: SecurityLevel): string =>
  security === "CRITICAL"
    ? "LEVEL 5 // ULTRA RESTRICTED"
    : security === "CLASSIFIED"
      ? "LEVEL 5 // RESTRICTED"
      : "LEVEL 5 // INTERNAL";

const specimenSecurity = (d: { threat: number }): SecurityLevel =>
  Number(d.threat) >= 5 ? "CRITICAL" : Number(d.threat) >= 4 ? "CLASSIFIED" : "RESTRICTED";

const personSecurity = (p: { clearance: number }): SecurityLevel =>
  Number(p.clearance) >= 5 ? "CLASSIFIED" : Number(p.clearance) >= 4 ? "CONFIDENTIAL" : "INTERNAL";

function fromSpecimen(d: WithImage<Specimen>, categoryId: string): ClassifiedRecord {
  const security = specimenSecurity(d);
  return {
    key: `${categoryId}:specimen:${d.id}`,
    kind: "specimen",
    id: d.id,
    fileId: d.fileId,
    name: d.name,
    subtitle: d.species,
    status: d.status,
    security,
    marking: markingFor(security),
    brief: d.classified ?? "",
    meta: [
      { label: "Classification", value: d.classification || NOT_AVAILABLE },
      { label: "Containment", value: d.contain || NOT_AVAILABLE },
      { label: "Threat", value: `${d.threat} / 5` },
      { label: "Genome", value: d.genome != null ? `${d.genome}%` : NOT_AVAILABLE },
    ],
    href: recordHref("specimen", d.id),
    haystack: lower([d.name, d.species, d.fileId, d.classification, d.contain, d.status, d.codename, d.classified]),
  };
}

/* --------------------------------------------------------------- categories */

/**
 * Builds the classified layer from the loaded archive.
 *
 * Cached because it is a pure derivation and every Level 5 screen asks for it:
 * the predicates run once per session rather than once per navigation.
 */
let cached: ClassifiedArchive | null = null;

export interface ClassifiedArchive {
  categories: ClassifiedCategory[];
  projects: ClassifiedProject[];
  categoryById: Map<string, ClassifiedCategory>;
  projectById: Map<string, ClassifiedProject>;
  /** Every classified record, deduplicated by division and id, for search. */
  all: ClassifiedRecord[];
  counts: { records: number; projects: number; categories: number };
}

export function loadClassified(): ClassifiedArchive {
  if (cached) return cached;
  const a = loadArchive();

  /* -- Restricted experiments: the engineered and directed-use assets. Read
        from each record's own species and classification wording. ---------- */
  const engineered = a.specimens.filter((d) =>
    /hybrid|bio-weapon|test asset|enhanced cognitive|tactical support|directed|abomination/i.test(
      `${d.species} ${d.classification}`
    )
  );

  /* -- Genetic programs: assets whose file records a sequencing figure. ---- */
  const sequenced = [...a.specimens]
    .filter((d) => d.genome != null)
    .sort((x, y) => (y.genome ?? 0) - (x.genome ?? 0) || x.name.localeCompare(y.name));

  /* -- Incident reports: containment as the source records state it. The
        operations division was removed from this archive, so these are the
        containment failures the asset files themselves carry — no incident
        narrative is invented to stand in for the division that is gone. ---- */
  const breached = a.specimens.filter((d) => /FAIL|BREACH|SELF-RELEASED/i.test(`${d.contain} ${d.status}`));

  /* -- Corporate operations: personnel the archive marks at the top of the
        clearance ladder, plus the record filed as a genetic subject. ------- */
  const restrictedPersonnel = a.personnel.filter(
    (p) => Number(p.clearance) >= 5 || /CLASSIFIED/i.test(p.dept) || /Executive|Founding/i.test(p.dept)
  );

  /* -- Site blacklist: every site not currently operational. --------------- */
  const blacklisted = a.locations.filter((l) => !/^ACTIVE/i.test(l.status));

  const categories: ClassifiedCategory[] = [
    {
      id: "restricted-experiments",
      label: "Restricted experiments",
      code: "L5-RX",
      blurb: "Engineered, hybridised and directed-use assets held under restricted research.",
      source: "Genetic assets whose own file records engineering, hybridisation or directed use.",
      records: engineered.map((d) => fromSpecimen(d, "restricted-experiments")),
    },
    {
      id: "genetic-programs",
      label: "Genetic programs",
      code: "L5-GP",
      blurb: "Sequencing and reconstruction work, ordered by recorded genome completion.",
      source: "Genetic assets carrying a sequencing figure on file.",
      records: sequenced.map((d) => fromSpecimen(d, "genetic-programs")),
    },
    {
      id: "incident-reports",
      label: "Incident reports",
      code: "L5-IR",
      blurb: "Containment failures and breach records, as the asset files state them.",
      source: "Genetic assets whose containment or status records a failure or breach.",
      records: breached.map((d) => fromSpecimen(d, "incident-reports")),
    },
    {
      id: "corporate-operations",
      label: "Corporate operations",
      code: "L5-CO",
      blurb: "Executive, founding and top-clearance personnel files.",
      source: "Personnel at clearance level 5, executive and founding departments.",
      records: restrictedPersonnel.map((p) => {
        const security = personSecurity(p);
        return {
          key: `corporate-operations:person:${p.id}`,
          kind: "person" as const,
          id: p.id,
          fileId: p.fileId,
          name: p.name,
          subtitle: p.role,
          status: p.status,
          security,
          marking: markingFor(security),
          brief: p.classified ?? "",
          meta: [
            { label: "Department", value: p.dept || NOT_AVAILABLE },
            { label: "Affiliation", value: p.aff || NOT_AVAILABLE },
            { label: "Clearance", value: `L${p.clearance}` },
            { label: "Risk", value: p.threat || NOT_AVAILABLE },
          ],
          href: recordHref("person", p.id),
          haystack: lower([p.name, p.role, p.dept, p.aff, p.fileId, p.status, p.classified]),
        };
      }),
    },
    {
      id: "site-blacklist",
      label: "Site blacklist",
      code: "L5-SB",
      blurb: "Sites lost, abandoned, restricted or otherwise not operational.",
      source: "Location records whose status is anything other than active.",
      records: blacklisted.map((l) => ({
        key: `site-blacklist:location:${l.id}`,
        kind: "location" as const,
        id: l.id,
        fileId: l.fileId,
        name: l.name,
        subtitle: l.designation,
        status: l.status,
        security: l.security,
        marking: markingFor(l.security),
        brief: l.historicalNotes || l.notes || "",
        meta: [
          { label: "Region", value: l.region || NOT_AVAILABLE },
          { label: "Established", value: l.established || NOT_AVAILABLE },
          { label: "Decommissioned", value: l.decommissioned || NOT_AVAILABLE },
          { label: "Function", value: l.primaryFunction || NOT_AVAILABLE },
        ],
        href: recordHref("location", l.id),
        haystack: lower([l.name, l.designation, l.fileId, l.region, l.status, l.type, l.notes, l.tags.join(" ")]),
      })),
    },
  ];

  /* ------------------------------------------------------------- projects */

  const projects = buildProjects(a, categories);

  // Deduplicate for search: the same asset is legitimately filed under more
  // than one category, but it is one record and should be one search hit.
  const seen = new Set<string>();
  const all: ClassifiedRecord[] = [];
  for (const c of categories) {
    for (const r of c.records) {
      const id = `${r.kind}:${r.id}`;
      if (seen.has(id)) continue;
      seen.add(id);
      all.push(r);
    }
  }

  cached = {
    categories,
    projects,
    categoryById: new Map(categories.map((c) => [c.id, c])),
    projectById: new Map(projects.map((p) => [p.id, p])),
    all,
    counts: { records: all.length, projects: projects.length, categories: categories.length },
  };
  return cached;
}

/* ----------------------------------------------------------------- projects */

/** A compiled grouping: a label and the predicate that selects its members. */
interface ProgramSpec {
  id: string;
  fileId: string;
  name: string;
  /** Stated in the UI so the grouping is never read as a source-attested project. */
  basis: string;
  match: (r: ClassifiedRecord) => boolean;
  pool: "specimen" | "flora";
}

const PROGRAMS: ProgramSpec[] = [
  {
    id: "hybrid-asset-series",
    fileId: "ING-L5-P01",
    name: "Hybrid asset series",
    basis: "Assets filed under the ING-HYB identifier block.",
    match: (r) => r.fileId.startsWith("ING-HYB"),
    pool: "specimen",
  },
  {
    id: "directed-use-series",
    fileId: "ING-L5-P02",
    name: "Directed-use asset series",
    basis: "Assets whose classification records military, tactical, directed or enhanced-cognition use.",
    match: (r) => /military test asset|tactical support|directed|enhanced cognitive/i.test(r.meta[0]?.value ?? ""),
    pool: "specimen",
  },
  {
    id: "marine-asset-series",
    fileId: "ING-L5-P03",
    name: "Marine asset series",
    basis: "Assets filed under the ING-MAR identifier block.",
    match: (r) => r.fileId.startsWith("ING-MAR"),
    pool: "specimen",
  },
  {
    id: "aerial-asset-series",
    fileId: "ING-L5-P04",
    name: "Aerial asset series",
    basis: "Assets filed under the ING-AIR and ING-AVI identifier blocks.",
    match: (r) => r.fileId.startsWith("ING-AIR") || r.fileId.startsWith("ING-AVI"),
    pool: "specimen",
  },
  {
    id: "botanical-reconstruction",
    fileId: "ING-L5-P05",
    name: "Botanical reconstruction series",
    basis: "Paleobotany records held at restricted classification.",
    match: (r) => r.security === "RESTRICTED",
    pool: "flora",
  },
];

/**
 * Programme status, read from the member records rather than assigned.
 *
 * TERMINATED when nothing in the grouping is still active, ACTIVE when
 * everything is, ARCHIVED for the mixed case — which is most of them.
 */
function programStatus(members: ClassifiedRecord[]): string {
  if (!members.length) return NOT_AVAILABLE;
  const active = members.filter((m) => /^ACTIVE|^ALIVE|CULTIVATED|NATURALISED/i.test(upper(m.status))).length;
  if (active === 0) return "TERMINATED";
  if (active === members.length) return "ACTIVE";
  return "ARCHIVED";
}

function buildProjects(a: ReturnType<typeof loadArchive>, categories: ClassifiedCategory[]): ClassifiedProject[] {
  const specimenPool = a.specimens.map((d) => fromSpecimen(d, "project"));
  const floraPool: ClassifiedRecord[] = a.flora.map((f) => ({
    key: `project:flora:${f.id}`,
    kind: "flora" as const,
    id: f.id,
    fileId: f.fileId,
    name: f.name,
    subtitle: f.scientificName,
    status: f.status,
    security: f.security,
    marking: markingFor(f.security),
    brief: f.researchValue || f.notes || "",
    meta: [
      { label: "Classification", value: f.classification || NOT_AVAILABLE },
      { label: "Era", value: f.era || NOT_AVAILABLE },
      { label: "Toxicity", value: f.toxicity || NOT_AVAILABLE },
      { label: "Genome", value: f.genome != null ? `${f.genome}%` : NOT_AVAILABLE },
    ],
    href: recordHref("flora", f.id),
    haystack: lower([f.name, f.scientificName, f.fileId, f.classification, f.era, f.status, f.notes]),
  }));

  const byCategory = new Map(categories.map((c) => [c.id, c]));

  return PROGRAMS.map((spec) => {
    const members = (spec.pool === "specimen" ? specimenPool : floraPool).filter(spec.match);
    const status = programStatus(members);

    // Everything below is resolved through the archive's own relationship
    // layer, so a programme's personnel and sites are the ones its member
    // records actually link to — not a list assembled here.
    const related = members.flatMap((m) => getRelatedRecords(m.kind, m.id));
    const personnel = dedupeEntries(related, "person");
    const sites = dedupeEntries(related, "location");

    const breachRecords = (byCategory.get("incident-reports")?.records ?? []).filter((r) =>
      members.some((m) => m.kind === r.kind && m.id === r.id)
    );

    const sequencing = members
      .map((m) => ({ label: m.name, value: m.meta.find((x) => x.label === "Genome")?.value ?? NOT_AVAILABLE }))
      .filter((row) => row.value !== NOT_AVAILABLE);

    // Timeline comes from the sites the members are held at — those records
    // carry real dates. The asset files themselves carry none, so a programme
    // with no sited member has no timeline, and says so.
    const timeline = sites
      .map((s) => a.locationById.get(s.id))
      .filter((l): l is NonNullable<typeof l> => Boolean(l))
      .flatMap((l) => [
        { label: l.established || "", value: `${l.name} — established`, href: recordHref("location", l.id) },
        ...(l.decommissioned
          ? [{ label: l.decommissioned, value: `${l.name} — decommissioned`, href: recordHref("location", l.id) }]
          : []),
      ])
      .filter((row) => row.label)
      .sort((x, y) => x.label.localeCompare(y.label));

    const panels: ProjectPanel[] = [
      {
        id: "objective",
        label: "Objective",
        rows: members.map((m) => ({
          label: m.fileId,
          value: m.meta[0]?.value ?? NOT_AVAILABLE,
          href: m.href,
        })),
        empty: "No member records are held for this grouping.",
      },
      {
        id: "personnel",
        label: "Lead personnel",
        rows: personnel.map((p) => ({ label: p.fileId, value: `${p.name} — ${p.subtitle}`, href: p.href })),
        empty: "No personnel are cross-referenced to these records.",
      },
      {
        id: "location",
        label: "Location",
        rows: sites.map((s) => ({ label: s.fileId, value: `${s.name} — ${s.status}`, href: s.href })),
        empty: "No sites are cross-referenced to these records.",
      },
      { id: "assets", label: "Species / assets", records: members, empty: "No assets on file." },
      {
        id: "research",
        label: "Research",
        rows: sequencing,
        empty: "No sequencing figures are held for these records.",
      },
      {
        id: "operations",
        label: "Operations",
        empty: "No operational records are held in this archive.",
      },
      {
        id: "incidents",
        label: "Incidents",
        records: breachRecords,
        empty: "No containment failure is recorded against these assets.",
      },
      {
        id: "timeline",
        label: "Timeline",
        rows: timeline,
        empty: "No dated events are held for these records.",
      },
      {
        id: "status",
        label: "Current status",
        rows: members.map((m) => ({ label: m.fileId, value: m.status, href: m.href })),
        empty: "No status is held for this grouping.",
      },
    ];

    return {
      id: spec.id,
      fileId: spec.fileId,
      name: spec.name,
      status,
      marking: members.some((m) => m.security === "CRITICAL") ? "LEVEL 5 // ULTRA RESTRICTED" : "LEVEL 5 // RESTRICTED",
      summary: spec.basis,
      members,
      panels,
      haystack: lower([spec.name, spec.fileId, spec.basis, status, members.map((m) => m.haystack).join(" ")]),
    };
  });
}

/** Related entries of one division, deduplicated, in the shape cards expect. */
function dedupeEntries(groups: ReturnType<typeof getRelatedRecords>, kind: RecordKind) {
  const seen = new Set<string>();
  const out: { id: string; fileId: string; name: string; subtitle: string; status: string; href: string }[] = [];
  for (const g of groups) {
    if (g.kind !== kind) continue;
    for (const e of g.entries) {
      if (seen.has(e.id)) continue;
      seen.add(e.id);
      out.push({ id: e.id, fileId: e.fileId, name: e.name, subtitle: e.subtitle, status: e.status, href: e.href });
    }
  }
  return out.sort((x, y) => x.name.localeCompare(y.name));
}
