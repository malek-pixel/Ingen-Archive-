import { Link, useParams } from "react-router-dom";
import { Header } from "../components/Header";
import { Page } from "../components/Chrome";
import { NotFoundBlock } from "../components/States";
import { SpecimenDossier } from "../components/SpecimenDossier";
import { useArchive } from "../lib/useArchive";
import { useDocumentTitle } from "../lib/useDocumentTitle";

export function Breadcrumb({
  trail,
  backTo,
  backLabel,
}: {
  trail: { label: string; to?: string; mono?: boolean }[];
  backTo: string;
  backLabel: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        padding: "14px clamp(20px,3vw,40px)",
        flexWrap: "wrap",
      }}
    >
      <nav
        aria-label="Breadcrumb"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 9,
          font: "400 12.5px 'IBM Plex Sans',sans-serif",
          color: "#788BA0",
        }}
      >
        {trail.map((c, i) => (
          <span key={c.label} style={{ display: "contents" }}>
            {i > 0 && <span style={{ color: "#333F4C" }}>/</span>}
            {c.to ? (
              <Link to={c.to} className="ig-quiet" style={{ textDecoration: "none" }}>
                {c.label}
              </Link>
            ) : (
              <span style={{ font: "500 12px 'IBM Plex Mono',monospace", color: "#BAC6D2" }} aria-current="page">
                {c.label}
              </span>
            )}
          </span>
        ))}
      </nav>
      <Link
        to={backTo}
        className="ig-quiet ig-back"
        style={{ font: "500 12.5px 'IBM Plex Sans',sans-serif", textDecoration: "none" }}
      >
        ← {backLabel}
      </Link>
    </div>
  );
}

export default function SpecimenDetail() {
  const { id = "" } = useParams();
  const { specimenById } = useArchive();
  const d = specimenById.get(id);

  useDocumentTitle(
    d ? `${d.name} · ${d.fileId} — InGen Archive` : "Record not found — InGen Archive",
    d
      ? `${d.fileId} — ${d.species}. ${d.classification}. Threat level ${d.threat} of 5, ${d.status.toLowerCase()}.`
      : "The requested asset record could not be resolved."
  );

  return (
    <Page>
      <Header />
      <Breadcrumb
        trail={[
          { label: "Archive", to: "/dashboard" },
          { label: "Genetic assets", to: "/assets" },
          { label: d ? d.fileId : "—" },
        ]}
        backTo="/assets"
        backLabel="Back to genetic assets"
      />
      <main id="main">
        {d ? (
          <SpecimenDossier d={d} />
        ) : (
          <NotFoundBlock
            margin="40px clamp(20px,3vw,40px)"
            eyebrow="Archive record not found"
            headline={`No asset record for “${id}”`}
            body="The record ID could not be resolved. It may have been reclassified above your clearance, purged from the master index, or the identifier is malformed."
            actionLabel="Return to index"
            actionTo="/assets"
          />
        )}
      </main>
    </Page>
  );
}
