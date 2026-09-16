import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Footer, Page } from "../components/Chrome";
import { Header } from "../components/Header";
import { SecurityBadge } from "../components/RecordChrome";
import { SearchBar, useSearchHotkeys } from "../components/Toolbar";
import { useDocumentTitle } from "../lib/useDocumentTitle";
import { stagger } from "../lib/motion";
import { SECURITY_LEVELS } from "../data/types";
import type { SecurityLevel } from "../data/types";
import { loadClassified, NOT_AVAILABLE } from "../level5/data";
import type { ClassifiedProject, ClassifiedRecord, ProjectPanel } from "../level5/data";
import { useLevel5 } from "../level5/session";
import { Gate } from "../level5/components/Gate";
import {
  AccessLog,
  ClassifiedCard,
  ConfidentialBanner,
  Dot,
  EmptyState,
  L5_INK,
  LockGlyph,
  Panel,
  Stamp,
  StatusRail,
  Tag,
} from "../level5/components/Chrome5";

/* ============================================================================
   Level 5 // Classified.

   Three screens — dashboard, category index, project dossier — behind one
   gate. Every screen is assembled from the archive's existing chrome plus the
   Level 5 layer in `src/level5/components`, and every record it renders is a
   record the open archive already holds. See `src/level5/data.ts` for why.
   ========================================================================== */

const MONO = "'IBM Plex Mono',monospace";
const SANS = "'IBM Plex Sans',sans-serif";

/**
 * The gate every Level 5 route sits behind.
 *
 * The check is here rather than in each screen so a new classified route
 * cannot accidentally ship unguarded.
 */
function Guarded({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  const { state, previouslyOpened } = useLevel5();
  useDocumentTitle(state === "authorized" ? title : "Level 5 — authorization required", description);

  return (
    <Page minHeight>
      <div className="ig-l5">
        <Header />
        {state === "authorized" ? children : <Gate locked={previouslyOpened} />}
      </div>
    </Page>
  );
}

/* --------------------------------------------------------------- dashboard */

export default function Classified() {
  return (
    <Guarded title="Level 5 // Classified — InGen Archive" description="Restricted material held at Level 5 clearance.">
      <ClassifiedDashboard />
    </Guarded>
  );
}

function ClassifiedDashboard() {
  const { lock } = useLevel5();
  const { categories, projects, counts } = loadClassified();

  return (
    <>
      <main
        id="main"
        className="ig-l5-seq"
        style={{ display: "grid", gap: 18, padding: "18px clamp(16px,3vw,40px) 8px" }}
      >
        <div data-seq="" style={stagger(0)}>
          <ConfidentialBanner />
        </div>

        {/* ------------------------------------------------------ identity */}
        <header data-seq="" style={{ ...stagger(1), display: "grid", gap: 14 }}>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: "14px 26px" }}>
            <div style={{ display: "grid", gap: 8 }}>
              <Tag ink="#9FB2C4">INGEN INTERNAL ARCHIVE</Tag>
              <h1
                style={{
                  margin: 0,
                  font: "800 clamp(28px,4.4vw,42px) 'Archivo',sans-serif",
                  letterSpacing: "-.035em",
                  lineHeight: 1.04,
                }}
              >
                Level 5 <span style={{ color: L5_INK }}>// Classified</span>
              </h1>
            </div>
            <span style={{ flex: 1 }} />
            <div style={{ display: "flex", gap: 24 }}>
              <div style={{ display: "grid", gap: 6 }}>
                <Tag>ACCESS STATUS</Tag>
                <span
                  style={{ display: "flex", alignItems: "center", gap: 7, font: `600 13px ${MONO}`, color: "#7ACB9A" }}
                >
                  <Dot ink="#7ACB9A" />
                  AUTHORIZED
                </span>
              </div>
              <div style={{ display: "grid", gap: 6 }}>
                <Tag>CLEARANCE</Tag>
                <span style={{ font: `600 13px ${MONO}`, color: L5_INK }}>LEVEL 5</span>
              </div>
            </div>
          </div>
          <p style={{ margin: 0, font: `400 14px/1.65 ${SANS}`, color: "#8895A5", maxWidth: "76ch" }}>
            {counts.records} records and {counts.projects} compiled programme files, drawn from the divisions of the
            open archive and held here at restricted classification. Every file links back to its own dossier.
          </p>
        </header>

        <div data-seq="" style={stagger(2)}>
          <StatusRail onLock={lock} />
        </div>

        {/* --------------------------------------------------- project files */}
        <section data-seq="" style={{ ...stagger(3), display: "grid", gap: 12 }}>
          <SectionHead
            title="Project files"
            note={`${projects.length} programme files`}
            hint="Compiled groupings — see each file for the records it is drawn from."
          />
          <div
            className="ig-l5-results"
            style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(268px,1fr))", gap: 12 }}
          >
            {projects.map((p, i) => (
              <ProjectTile key={p.id} project={p} index={i} />
            ))}
          </div>
        </section>

        {/* ------------------------------------------------------ categories */}
        <section data-seq="" style={{ ...stagger(4), display: "grid", gap: 12 }}>
          <SectionHead title="Classified categories" note={`${categories.length} registers`} />
          <div
            className="ig-l5-results"
            style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 12 }}
          >
            {categories.map((c, i) => (
              <Link
                key={c.id}
                to={`/classified/${c.id}`}
                data-seq=""
                className="ig-l5-card ig-l5-panel ig-l5-ticked"
                style={{
                  ...stagger(i),
                  display: "grid",
                  gap: 10,
                  padding: "16px",
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <span className="ig-l5-read" aria-hidden="true" />
                <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                  <Tag ink="#6F859D">{c.code}</Tag>
                  <span style={{ font: `600 15px ${MONO}`, color: "#DCE6EF", fontVariantNumeric: "tabular-nums" }}>
                    {String(c.records.length).padStart(2, "0")}
                  </span>
                </span>
                <span style={{ font: "700 17px 'Archivo',sans-serif", letterSpacing: "-.015em", color: "#E4E9EF" }}>
                  {c.label}
                </span>
                <span style={{ font: `400 12.5px/1.6 ${SANS}`, color: "#8895A5" }}>{c.blurb}</span>
                <span
                  className="ig-l5-reveal"
                  style={{ font: `600 9.5px ${MONO}`, letterSpacing: ".14em", color: L5_INK }}
                >
                  OPEN REGISTER →
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* ---------------------------------------------------------- search */}
        <section data-seq="" style={{ ...stagger(5), display: "grid", gap: 12 }}>
          <SectionHead title="Classified search" note="Level 5 records only" />
          <ClassifiedSearch />
        </section>

        <div data-seq="" style={{ ...stagger(6), display: "grid", gap: 12 }}>
          <AccessLog />
        </div>
      </main>
      <Footer total={counts.records} />
    </>
  );
}

function SectionHead({ title, note, hint }: { title: string; note: string; hint?: string }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: "6px 14px" }}>
      <h2 style={{ margin: 0, font: "700 17px 'Archivo',sans-serif", letterSpacing: "-.015em" }}>{title}</h2>
      <span style={{ font: `400 12px ${SANS}`, color: "#7D91A7" }}>{note}</span>
      {hint ? (
        <>
          <span style={{ flex: 1 }} />
          <span style={{ font: `400 11.5px ${SANS}`, color: "#6B8297" }}>{hint}</span>
        </>
      ) : null}
    </div>
  );
}

function ProjectTile({ project, index }: { project: ClassifiedProject; index: number }) {
  const statusInk = project.status === "ACTIVE" ? "#7ACB9A" : project.status === "TERMINATED" ? "#E08A84" : "#E0B36A";
  return (
    <Link
      to={`/classified/project/${project.id}`}
      data-seq=""
      className="ig-l5-card ig-l5-panel ig-l5-ticked"
      style={{ ...stagger(index), display: "grid", gap: 11, padding: "16px", textDecoration: "none", color: "inherit" }}
    >
      <span className="ig-l5-read" aria-hidden="true" />
      <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <Tag ink="#6F859D">{project.fileId}</Tag>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Dot ink={statusInk} still />
          <Tag ink={statusInk}>{project.status}</Tag>
        </span>
      </span>
      <span style={{ font: "700 18px 'Archivo',sans-serif", letterSpacing: "-.02em", color: "#E4E9EF" }}>
        {project.name}
      </span>
      <span style={{ font: `400 12.5px/1.6 ${SANS}`, color: "#8895A5" }}>{project.summary}</span>
      <span style={{ height: 1, background: "#1E2732" }} aria-hidden="true" />
      <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <span style={{ font: `500 11px ${MONO}`, color: "#788BA0" }}>
          {project.members.length} record{project.members.length === 1 ? "" : "s"}
        </span>
        <span className="ig-l5-reveal" style={{ font: `600 9.5px ${MONO}`, letterSpacing: ".14em", color: L5_INK }}>
          OPEN DOSSIER →
        </span>
      </span>
    </Link>
  );
}

/* ------------------------------------------------------------------ search */

/**
 * Search across the classified layer only.
 *
 * The scan banner is a fixed short beat rather than a fake delay on every
 * keystroke: results are already computed synchronously, so the banner shows
 * while the deferred value catches up and then gets out of the way.
 */
function ClassifiedSearch() {
  const { all, projects } = loadClassified();
  const [query, setQuery] = useState("");
  const deferred = useDeferredValue(query);
  const inputRef = useRef<HTMLInputElement>(null);
  useSearchHotkeys(inputRef, () => setQuery(""));

  const results = useMemo<{ programme?: ClassifiedProject; record?: ClassifiedRecord }[]>(() => {
    const q = deferred.trim().toLowerCase();
    if (!q) return [];
    const hits = all.filter((r) => r.haystack.includes(q));
    const programmes = projects.filter((p) => p.haystack.includes(q));
    return [...programmes.map((p) => ({ programme: p })), ...hits.map((r) => ({ record: r }))];
  }, [deferred, all, projects]);

  const scanning = query.trim() !== "" && query !== deferred;

  return (
    <Panel
      title="SEARCH CLASSIFIED DATABASE"
      aside={<Tag ink="#6B8297">PROJECT · PERSONNEL · LOCATION · SPECIES · INCIDENT · CLASSIFICATION</Tag>}
    >
      <div style={{ display: "grid", gap: 14, padding: 16 }}>
        <SearchBar
          value={query}
          onChange={setQuery}
          label="Search the classified database"
          placeholder="Search classified records…"
          inputRef={inputRef}
        />

        <div aria-live="polite" style={{ display: "grid", gap: 12 }}>
          {scanning ? (
            <div style={{ display: "grid", gap: 8 }}>
              <Tag ink="#9FB2C4">SEARCHING CLASSIFIED DATABASE...</Tag>
              <div className="ig-l5-rail" aria-hidden="true" />
            </div>
          ) : query.trim() === "" ? (
            <p style={{ margin: 0, font: `400 12.5px ${SANS}`, color: "#7E8C9C" }}>
              Enter a term to search {all.length} classified records and {projects.length} programme files.
            </p>
          ) : results.length === 0 ? (
            <EmptyState note={`No classified record matches “${query.trim()}”.`} />
          ) : (
            <>
              <Tag ink="#788BA0">{results.length} CLASSIFIED RESULTS</Tag>
              <ul className="ig-l5-results" style={{ listStyle: "none", margin: 0, padding: 0, display: "grid" }}>
                {results.slice(0, 40).map((hit, i) => {
                  const to = hit.programme ? `/classified/project/${hit.programme.id}` : hit.record!.href;
                  const name = hit.programme ? hit.programme.name : hit.record!.name;
                  const fileId = hit.programme ? hit.programme.fileId : hit.record!.fileId;
                  const sub = hit.programme ? "Programme file" : hit.record!.subtitle;
                  return (
                    <li key={fileId + i} data-seq="" style={stagger(i)}>
                      <Link
                        to={to}
                        className="ig-index-row"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          padding: "11px 0",
                          borderBottom: "1px solid #161D26",
                          textDecoration: "none",
                          color: "inherit",
                        }}
                      >
                        <span
                          className="ig-row-marker"
                          aria-hidden="true"
                          style={{ width: 2, height: 22, background: L5_INK, flex: "none" }}
                        />
                        <span
                          style={{
                            flex: 1,
                            minWidth: 0,
                            font: `500 13.5px ${SANS}`,
                            color: "#E4E9EF",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {name}
                          <span style={{ color: "#6B8297" }}> — {sub}</span>
                        </span>
                        <span style={{ font: `400 10.5px ${MONO}`, color: "#6F859D", flex: "none" }}>{fileId}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
      </div>
    </Panel>
  );
}

/* -------------------------------------------------------------- category */

export function ClassifiedCategoryScreen() {
  const { id = "" } = useParams();
  const category = loadClassified().categoryById.get(id);

  return (
    <Guarded
      title={category ? `${category.label} — Level 5 // Classified` : "Level 5 — register not found"}
      description={category?.blurb ?? "Classified register."}
    >
      {category ? <CategoryBody categoryId={id} /> : <CategoryMissing id={id} />}
    </Guarded>
  );
}

function CategoryMissing({ id }: { id: string }) {
  return (
    <main id="main" style={{ display: "grid", gap: 16, padding: "22px clamp(16px,3vw,40px) 40px" }}>
      <ConfidentialBanner />
      <EmptyState note={`No classified register is filed under “${id}”.`} />
      <Link to="/classified" className="ig-textlink" style={{ font: `500 12.5px ${SANS}`, color: "#8FA6BC" }}>
        ← Back to the classified dashboard
      </Link>
    </main>
  );
}

/** Filters over the classified layer. Every facet is read from the records. */
function CategoryBody({ categoryId }: { categoryId: string }) {
  const { lock } = useLevel5();
  const category = loadClassified().categoryById.get(categoryId)!;
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState<SecurityLevel | "ALL">("ALL");
  const [status, setStatus] = useState("ALL");
  const inputRef = useRef<HTMLInputElement>(null);
  useSearchHotkeys(inputRef, () => setQuery(""));

  // Reset when moving between registers, or a filter from the last one hides
  // everything in this one with no visible cause.
  useEffect(() => {
    setQuery("");
    setLevel("ALL");
    setStatus("ALL");
  }, [categoryId]);

  const statuses = useMemo(() => {
    const seen = new Map<string, number>();
    for (const r of category.records) {
      const key = statusBucket(r.status);
      seen.set(key, (seen.get(key) ?? 0) + 1);
    }
    return [...seen.entries()].sort((a, b) => b[1] - a[1]);
  }, [category]);

  const levels = useMemo(
    () => SECURITY_LEVELS.filter((l) => category.records.some((r) => r.security === l)),
    [category]
  );

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return category.records.filter(
      (r) =>
        (level === "ALL" || r.security === level) &&
        (status === "ALL" || statusBucket(r.status) === status) &&
        (!q || r.haystack.includes(q))
    );
  }, [category, query, level, status]);

  return (
    <>
      <main
        id="main"
        className="ig-l5-seq"
        style={{ display: "grid", gap: 16, padding: "18px clamp(16px,3vw,40px) 8px" }}
      >
        <div data-seq="" style={stagger(0)}>
          <ConfidentialBanner />
        </div>

        <header data-seq="" style={{ ...stagger(1), display: "grid", gap: 10 }}>
          <nav aria-label="Breadcrumb" style={{ display: "flex", gap: 8, font: `400 11.5px ${SANS}` }}>
            <Link to="/classified" style={{ color: "#8FA6BC" }}>
              Level 5 // Classified
            </Link>
            <span style={{ color: "#4E5D6E" }}>/</span>
            <span style={{ color: "#7E8C9C" }}>{category.label}</span>
          </nav>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: "12px 20px" }}>
            <h1 style={{ margin: 0, font: "800 clamp(24px,3.6vw,34px) 'Archivo',sans-serif", letterSpacing: "-.03em" }}>
              {category.label}
            </h1>
            <Tag ink="#6F859D">{category.code}</Tag>
            <span style={{ flex: 1 }} />
            <Stamp text="LEVEL 5 // CLASSIFIED" />
          </div>
          <p style={{ margin: 0, font: `400 13.5px/1.65 ${SANS}`, color: "#8895A5", maxWidth: "78ch" }}>
            {category.blurb} <span style={{ color: "#6B8297" }}>Source: {category.source}</span>
          </p>
        </header>

        <div data-seq="" style={stagger(2)}>
          <StatusRail onLock={lock} />
        </div>

        {/* --------------------------------------------------------- filters */}
        <div data-seq="" className="ig-l5-panel" style={{ ...stagger(3), display: "grid", gap: 14, padding: 16 }}>
          <SearchBar
            value={query}
            onChange={setQuery}
            label={`Search ${category.label}`}
            placeholder="Search this register…"
            inputRef={inputRef}
          />
          <FacetRow
            label="Classification"
            options={[{ key: "ALL", label: "All" }, ...levels.map((l) => ({ key: l, label: l }))]}
            active={level}
            onSelect={(k) => setLevel(k as SecurityLevel | "ALL")}
          />
          <FacetRow
            label="Status"
            options={[{ key: "ALL", label: "All" }, ...statuses.map(([s, n]) => ({ key: s, label: `${s} ${n}` }))]}
            active={status}
            onSelect={setStatus}
          />
        </div>

        {/* --------------------------------------------------------- results */}
        <div aria-live="polite" style={{ display: "grid", gap: 12 }}>
          <Tag ink="#788BA0">
            {shown.length} OF {category.records.length} RECORDS SHOWN
          </Tag>
          {shown.length === 0 ? (
            <EmptyState note="No record in this register matches the active filters." />
          ) : (
            <div
              className="ig-l5-results"
              style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(258px,1fr))", gap: 12 }}
            >
              {shown.map((r, i) => (
                <ClassifiedCard key={r.key} record={r} index={i} />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer total={category.records.length} />
    </>
  );
}

/** Coarse status bucket, so the filter row stays readable. */
function statusBucket(status: string): string {
  const s = (status || "").toUpperCase();
  if (/^ACTIVE|^ALIVE|CULTIVATED|NATURALISED/.test(s)) return "ACTIVE";
  if (/DECEASED|DESTROYED|EXTINCT/.test(s)) return "LOST";
  if (/ABANDONED|COMPROMISED|UNCONTAINED|RESTRICTED|NEVER OPENED|UNKNOWN/.test(s)) return "RESTRICTED";
  return "OTHER";
}

function FacetRow({
  label,
  options,
  active,
  onSelect,
}: {
  label: string;
  options: { key: string; label: string }[];
  active: string;
  onSelect: (key: string) => void;
}) {
  if (options.length <= 2) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
      <Tag style={{ width: 96 }}>{label.toUpperCase()}</Tag>
      {options.map((o) => {
        const on = o.key === active;
        return (
          <button
            key={o.key}
            type="button"
            className="ig-chip"
            aria-pressed={on}
            onClick={() => onSelect(o.key)}
            style={{
              minHeight: 34,
              padding: "6px 11px",
              background: on ? "#12141A" : "#0E131A",
              border: `1px solid ${on ? "#5E2F30" : "#232D38"}`,
              color: on ? "#DCE6EF" : "#8895A5",
              font: `500 11px ${MONO}`,
              letterSpacing: ".08em",
              cursor: "pointer",
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/* --------------------------------------------------------------- dossier */

export function ClassifiedProjectScreen() {
  const { id = "" } = useParams();
  const project = loadClassified().projectById.get(id);

  return (
    <Guarded
      title={project ? `${project.name} · ${project.fileId} — Level 5` : "Level 5 — programme file not found"}
      description={project?.summary ?? "Classified programme file."}
    >
      {project ? <ProjectBody project={project} /> : <ProjectMissing id={id} />}
    </Guarded>
  );
}

function ProjectMissing({ id }: { id: string }) {
  return (
    <main id="main" style={{ display: "grid", gap: 16, padding: "22px clamp(16px,3vw,40px) 40px" }}>
      <ConfidentialBanner />
      <EmptyState note={`No programme file is filed under “${id}”.`} />
      <Link to="/classified" className="ig-textlink" style={{ font: `500 12.5px ${SANS}`, color: "#8FA6BC" }}>
        ← Back to the classified dashboard
      </Link>
    </main>
  );
}

function ProjectBody({ project }: { project: ClassifiedProject }) {
  const { lock } = useLevel5();
  const [tab, setTab] = useState(project.panels[0].id);
  const panel = project.panels.find((p) => p.id === tab) ?? project.panels[0];
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const statusInk = project.status === "ACTIVE" ? "#7ACB9A" : project.status === "TERMINATED" ? "#E08A84" : "#E0B36A";

  // Arrow-key movement inside the tab list, as the tabs pattern requires.
  const onKeyDown = (e: React.KeyboardEvent) => {
    const ids = project.panels.map((p) => p.id);
    const i = ids.indexOf(tab);
    const next =
      e.key === "ArrowRight"
        ? ids[(i + 1) % ids.length]
        : e.key === "ArrowLeft"
          ? ids[(i - 1 + ids.length) % ids.length]
          : null;
    if (!next) return;
    e.preventDefault();
    setTab(next);
    tabRefs.current[next]?.focus();
  };

  return (
    <>
      <main
        id="main"
        className="ig-l5-seq"
        style={{ display: "grid", gap: 16, padding: "18px clamp(16px,3vw,40px) 8px" }}
      >
        <div data-seq="" style={stagger(0)}>
          <ConfidentialBanner />
        </div>

        <header data-seq="" style={{ ...stagger(1), display: "grid", gap: 12 }}>
          <nav aria-label="Breadcrumb" style={{ display: "flex", gap: 8, font: `400 11.5px ${SANS}` }}>
            <Link to="/classified" style={{ color: "#8FA6BC" }}>
              Level 5 // Classified
            </Link>
            <span style={{ color: "#4E5D6E" }}>/</span>
            <span style={{ color: "#7E8C9C" }}>Project files</span>
          </nav>

          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", gap: "14px 24px" }}>
            <div style={{ display: "grid", gap: 9 }}>
              <Tag ink="#6F859D">{project.fileId}</Tag>
              <h1
                style={{
                  margin: 0,
                  font: "800 clamp(26px,4vw,38px) 'Archivo',sans-serif",
                  letterSpacing: "-.032em",
                  lineHeight: 1.06,
                  textTransform: "uppercase",
                }}
              >
                {project.name}
              </h1>
            </div>
            <span style={{ flex: 1 }} />
            <div style={{ display: "flex", gap: 22, alignItems: "flex-start" }}>
              <div style={{ display: "grid", gap: 6 }}>
                <Tag>CLASSIFICATION</Tag>
                <span style={{ font: `600 12px ${MONO}`, letterSpacing: ".08em", color: L5_INK }}>
                  {project.marking}
                </span>
              </div>
              <div style={{ display: "grid", gap: 6 }}>
                <Tag>STATUS</Tag>
                <span
                  style={{ display: "flex", alignItems: "center", gap: 7, font: `600 12px ${MONO}`, color: statusInk }}
                >
                  <Dot ink={statusInk} still />
                  {project.status}
                </span>
              </div>
              <Stamp text="LEVEL 5" />
            </div>
          </div>

          <p style={{ margin: 0, font: `400 13.5px/1.65 ${SANS}`, color: "#8895A5", maxWidth: "78ch" }}>
            Compiled grouping — {project.summary.toLowerCase()} The archive holds no programme name of its own for this
            set; the label above is descriptive of the {project.members.length} records it draws on.
          </p>
        </header>

        <div data-seq="" style={stagger(2)}>
          <StatusRail onLock={lock} />
        </div>

        {/* ------------------------------------------------------------ tabs */}
        <div data-seq="" className="ig-l5-panel ig-l5-ticked" style={{ ...stagger(3) }}>
          <div
            role="tablist"
            aria-label="Programme file sections"
            onKeyDown={onKeyDown}
            style={{
              display: "flex",
              gap: 2,
              overflowX: "auto",
              borderBottom: "1px solid #1E2732",
              padding: "0 6px",
            }}
          >
            {project.panels.map((p) => {
              const on = p.id === tab;
              return (
                <button
                  key={p.id}
                  ref={(el) => {
                    tabRefs.current[p.id] = el;
                  }}
                  role="tab"
                  id={`l5-tab-${p.id}`}
                  aria-selected={on}
                  aria-controls={`l5-panel-${p.id}`}
                  tabIndex={on ? 0 : -1}
                  className="ig-l5-tab"
                  onClick={() => setTab(p.id)}
                  style={{
                    flex: "none",
                    minHeight: 44,
                    padding: "0 14px",
                    background: "none",
                    border: 0,
                    color: on ? "#E4E9EF" : "#7E8C9C",
                    font: `600 11px ${MONO}`,
                    letterSpacing: ".13em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          <div
            key={panel.id}
            className="ig-l5-panelbody"
            role="tabpanel"
            id={`l5-panel-${panel.id}`}
            aria-labelledby={`l5-tab-${panel.id}`}
            tabIndex={0}
            style={{ padding: 16 }}
          >
            <PanelBody panel={panel} />
          </div>
        </div>

        {/* --------------------------------------------------- related files */}
        <section data-seq="" style={{ ...stagger(4), display: "grid", gap: 12 }}>
          <SectionHead title="Related files" note={`${project.members.length} on file`} />
          {project.members.length === 0 ? (
            <EmptyState note="No records are grouped under this programme file." />
          ) : (
            <div
              className="ig-l5-results"
              style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(258px,1fr))", gap: 12 }}
            >
              {project.members.map((r, i) => (
                <ClassifiedCard key={r.key} record={r} index={i} />
              ))}
            </div>
          )}
        </section>

        <div data-seq="" style={stagger(5)}>
          <AccessLog max={6} />
        </div>
      </main>
      <Footer total={project.members.length} />
    </>
  );
}

function PanelBody({ panel }: { panel: ProjectPanel }) {
  const hasRows = (panel.rows?.length ?? 0) > 0;
  const hasRecords = (panel.records?.length ?? 0) > 0;

  if (panel.body) {
    return (
      <p style={{ margin: 0, font: `400 14.5px/1.72 ${SANS}`, color: "#BAC6D2", maxWidth: "76ch" }}>{panel.body}</p>
    );
  }

  if (hasRecords) {
    return (
      <div style={{ display: "grid", gap: 10 }}>
        {panel.records!.map((r) => (
          <Link
            key={r.key}
            to={r.href}
            className="ig-index-row"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "11px 0",
              borderBottom: "1px solid #161D26",
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <SecurityBadge level={r.security} />
            <span style={{ flex: 1, minWidth: 0, font: `500 13.5px ${SANS}`, color: "#E4E9EF" }}>
              {r.name}
              <span style={{ color: "#6B8297" }}> — {r.status}</span>
            </span>
            <span style={{ font: `400 10.5px ${MONO}`, color: "#6F859D", flex: "none" }}>{r.fileId}</span>
          </Link>
        ))}
      </div>
    );
  }

  if (hasRows) {
    return (
      <dl style={{ margin: 0, display: "grid", gap: 1 }}>
        {panel.rows!.map((row, i) => (
          <div
            key={`${row.label}-${i}`}
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 16,
              padding: "10px 0",
              borderBottom: "1px solid #161D26",
            }}
          >
            <dt
              style={{
                font: `500 11px ${MONO}`,
                letterSpacing: ".06em",
                color: "#6F859D",
                flex: "none",
                minWidth: 110,
              }}
            >
              {row.label}
            </dt>
            <dd style={{ margin: 0, flex: 1, font: `400 13px ${SANS}`, color: "#BAC6D2" }}>
              {row.href ? (
                <Link to={row.href} className="ig-textlink" style={{ color: "#BAC6D2" }}>
                  {row.value}
                </Link>
              ) : (
                row.value
              )}
            </dd>
          </div>
        ))}
      </dl>
    );
  }

  return (
    <div style={{ display: "grid", gap: 8, padding: "18px 0" }}>
      <span style={{ display: "flex", alignItems: "center", gap: 9 }}>
        <LockGlyph size={13} ink="#5E2F30" />
        <Tag ink="#E0B36A">{NOT_AVAILABLE}</Tag>
      </span>
      <p style={{ margin: 0, font: `400 13px ${SANS}`, color: "#7E8C9C", maxWidth: "68ch" }}>
        {panel.empty ?? "The source archive holds nothing for this section."}
      </p>
    </div>
  );
}
