import { useEffect, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { SpecimenDossier } from "../components/SpecimenDossier";
import { PersonDossier } from "../components/PersonDossier";
import { useArchive } from "../lib/useArchive";
import { useDocumentTitle } from "../lib/useDocumentTitle";
import { useReveal, useScrolled } from "../lib/motion";

function RunShell({
  title,
  count,
  unit,
  children,
}: {
  title: string;
  count: number;
  unit: string;
  children: ReactNode;
}) {
  const { hash } = useLocation();
  const scrolled = useScrolled(24);

  // Deep links into a run (#owen-grady) must land on the right record.
  useEffect(() => {
    if (!hash) return;
    document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView();
  }, [hash]);

  return (
    <div
      className="ig-run"
      style={{
        width: "100%",
        maxWidth: 1440,
        margin: "0 auto",
        background: "#0B0F14",
        fontFamily: "'IBM Plex Sans',system-ui,sans-serif",
        color: "#E4E9EF",
      }}
    >
      <header
        className="ig-hdr ig-sticky"
        data-scrolled={scrolled}
        style={{
          position: "sticky",
          top: 0,
          zIndex: 30,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 36px",
          height: 52,
          borderBottom: "1px solid #1A222C",
          background: "#0B0F14",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
          <img
            src="/assets/ingen-mark.png"
            alt="InGen"
            width={22}
            height={23}
            style={{ display: "block", flex: "none" }}
          />
          <span style={{ font: "700 13.5px 'Archivo',sans-serif" }}>{title}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <span
            style={{ font: "500 11.5px 'IBM Plex Mono',monospace", letterSpacing: ".05em", color: "#788BA0" }}
          >{`${count} ${unit}`}</span>
          <Link
            to="/"
            className="ig-btn-ghost ig-back"
            style={{
              padding: "6px 12px",
              border: "1px solid #232D38",
              borderRadius: 2,
              font: "500 12px 'IBM Plex Sans',sans-serif",
              color: "#8895A5",
              textDecoration: "none",
            }}
          >
            ← Index
          </Link>
        </div>
      </header>
      <main id="main">{children}</main>
    </div>
  );
}

function RunRecord({
  id,
  n,
  name,
  fileId,
  children,
}: {
  id: string;
  n: string;
  name: string;
  fileId: string;
  children: ReactNode;
}) {
  const reveal = useReveal<HTMLElement>();
  return (
    <section ref={reveal} id={id} style={{ scrollMarginTop: 52, borderBottom: "8px solid #0E131A" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "14px 40px",
          background: "#0E131A",
          borderBottom: "1px solid #1A222C",
        }}
      >
        <span style={{ font: "500 12px 'IBM Plex Mono',monospace", color: "#7E8C9C", letterSpacing: ".05em" }}>
          {n}
        </span>
        <span style={{ font: "700 17px 'Archivo',sans-serif", letterSpacing: "-.015em" }}>{name}</span>
        <span style={{ flex: 1 }} />
        <span style={{ font: "400 11px 'IBM Plex Mono',monospace", letterSpacing: ".06em", color: "#748899" }}>
          {fileId}
        </span>
      </div>
      {children}
    </section>
  );
}

const numbered = <T extends { fileId: string }>(list: T[]) =>
  [...list]
    .sort((a, b) => a.fileId.localeCompare(b.fileId))
    .map((rec, i) => ({ rec, n: String(i + 1).padStart(2, "0") }));

export function AllSpecimens() {
  const { specimens } = useArchive();
  useDocumentTitle("Genetic assets — full dossier run · InGen Archive");
  const rows = numbered(specimens);
  return (
    <RunShell title="Genetic assets — full dossier run" count={rows.length} unit="records">
      {rows.map(({ rec, n }) => (
        <RunRecord key={rec.id} id={rec.id} n={n} name={rec.name} fileId={rec.fileId}>
          <SpecimenDossier d={rec} />
        </RunRecord>
      ))}
    </RunShell>
  );
}

export function AllPersonnel() {
  const { personnel } = useArchive();
  useDocumentTitle("Personnel — full dossier run · InGen Archive");
  const rows = numbered(personnel);
  return (
    <RunShell title="Personnel — full dossier run" count={rows.length} unit="files">
      {rows.map(({ rec, n }) => (
        <RunRecord key={rec.id} id={rec.id} n={n} name={rec.name} fileId={rec.fileId}>
          <PersonDossier p={rec} />
        </RunRecord>
      ))}
    </RunShell>
  );
}
