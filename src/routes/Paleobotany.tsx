import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { ArchiveCard } from "../components/ArchiveCard";
import { IndexScreen } from "../components/IndexScreen";
import { Header } from "../components/Header";
import { Meter, Page } from "../components/Chrome";
import { NotFoundBlock } from "../components/States";
import { ExpansionDossier } from "../components/ExpansionDossier";
import { RecordSection } from "../components/RecordChrome";
import { Breadcrumb } from "./SpecimenDetail";
import { FLORA_FILTERS, FLORA_SORTS, entryHaystack } from "../lib/query";
import { getRecordsByType } from "../lib/archive";
import { cells } from "../lib/derive";
import { useArchive } from "../lib/useArchive";
import { useDocumentTitle } from "../lib/useDocumentTitle";

export default function Paleobotany() {
  const { flora, counts } = useArchive();
  useDocumentTitle(
    "Paleobotany — InGen Archive",
    "Reconstructed and cultivated flora held under InGen botanical research."
  );

  const entries = getRecordsByType("flora");
  const reconstructed = flora.filter((f) => f.genome != null).length;
  const toxic = flora.filter((f) => !/^none/i.test(f.toxicity)).length;
  // Memoised: the index screen re-renders on every keystroke and this map
  // only changes when the data does.
  const byId = useMemo(() => new Map(flora.map((f) => [f.id, f])), [flora]);

  return (
    <IndexScreen
      eyebrow="Section 05 · Botanical register"
      title="Paleobotany"
      intro="Reconstructed, cultivated and naturalised flora held under botanical research, with toxicity assessment, ecological role and reconstruction provenance."
      summary={[
        { label: "On register", value: counts.flora, ink: "#E4E9EF" },
        { label: "Reconstructed", value: reconstructed, ink: "#9FB2C4" },
        { label: "Toxic", value: toxic, ink: "#E0B36A" },
      ]}
      records={entries}
      filters={FLORA_FILTERS}
      sorts={FLORA_SORTS}
      haystack={entryHaystack}
      searchLabel="Search botanical records"
      searchPlaceholder="Search species, classification, era…"
      gridMin={280}
      renderCard={(e, i) => {
        const rec = byId.get(e.id);
        return (
          <ArchiveCard
            key={e.id}
            entry={e}
            index={i}
            meta={
              rec
                ? [
                    { label: "Era", value: rec.era.split(",")[0] },
                    { label: "Toxicity", value: rec.toxicity.split(".")[0] },
                  ]
                : undefined
            }
          />
        );
      }}
      countLabel={(shown, total) =>
        shown === total ? `Showing all ${total} records` : `Showing ${shown} of ${total} records`
      }
      emptyHeadline={(q) => (q ? `No botanical record matches “${q}”` : "No records match the active filter")}
      emptyBody="No botanical files match your current archive query. Broaden the term or clear the active filters."
    />
  );
}

export function FloraDetail() {
  const { id = "" } = useParams();
  const { floraById } = useArchive();
  const record = floraById.get(id);

  useDocumentTitle(
    record ? `${record.name} · ${record.fileId} — InGen Archive` : "Botanical record not found — InGen Archive",
    record
      ? `${record.fileId} — ${record.scientificName}. ${record.classification}.`
      : "The requested botanical record could not be resolved."
  );

  return (
    <Page>
      <Header />
      <Breadcrumb
        trail={[
          { label: "Archive", to: "/dashboard" },
          { label: "Paleobotany", to: "/paleobotany" },
          { label: record ? record.fileId : "—" },
        ]}
        backTo="/paleobotany"
        backLabel="Back to paleobotany"
      />
      <main id="main">
        {record ? (
          <ExpansionDossier
            kind="flora"
            id={record.id}
            fileId={record.fileId}
            name={record.name}
            designation={record.classification}
            status={record.status}
            security={record.security}
            tags={record.tags}
            plateCaption="Botanical figure"
            badges={[{ label: record.era }]}
            facts={[
              { label: "Scientific name", value: record.scientificName },
              { label: "Classification", value: record.classification },
              { label: "Era", value: record.era },
              { label: "Habitat", value: record.habitat },
              { label: "Distribution", value: record.distribution },
              { label: "Growth", value: record.growth },
            ]}
            aside={
              record.genome != null ? (
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      justifyContent: "space-between",
                      marginBottom: 12,
                    }}
                  >
                    <span
                      style={{
                        font: "500 11px 'IBM Plex Sans',sans-serif",
                        letterSpacing: ".13em",
                        color: "#788D9F",
                        textTransform: "uppercase",
                      }}
                    >
                      Genome completion
                    </span>
                    <span
                      style={{
                        font: "700 21px 'Archivo',sans-serif",
                        color: "#9FB2C4",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {record.genome}
                      <span style={{ font: "500 12px 'IBM Plex Mono',monospace", color: "#6F859D" }}> %</span>
                    </span>
                  </div>
                  <Meter cells={cells(Math.round(record.genome / 20), "#5A6E82")} height={5} gap={4} animate />
                  <p
                    style={{
                      margin: "11px 0 0",
                      font: "400 12.5px/1.5 'IBM Plex Sans',sans-serif",
                      color: "#7E8C9C",
                      textWrap: "pretty",
                    }}
                  >
                    {record.reconstruction}
                  </p>
                </div>
              ) : null
            }
          >
            <p
              style={{
                margin: 0,
                padding: "0 0 28px",
                borderBottom: "1px solid #1A222C",
                font: "400 21px/1.5 'IBM Plex Sans',sans-serif",
                color: "#9FB2C4",
                maxWidth: "60ch",
                textWrap: "pretty",
              }}
            >
              {record.ecologicalRole}
            </p>

            <RecordSection title="Toxicity assessment" body={record.toxicity} />
            <RecordSection title="Reconstruction" body={record.reconstruction} />
            <RecordSection title="Research value" body={record.researchValue} />
            <RecordSection title="Archive notes" body={record.notes} />
          </ExpansionDossier>
        ) : (
          <NotFoundBlock
            margin="40px clamp(20px,3vw,40px)"
            eyebrow="Botanical record not found"
            headline={`No botanical record for “${id}”`}
            body="The specimen identifier could not be resolved. It may have been reclassified above your clearance, purged from the master index, or the identifier is malformed."
            actionLabel="Return to register"
            actionTo="/paleobotany"
          />
        )}
      </main>
    </Page>
  );
}
