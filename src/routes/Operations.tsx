import { useParams } from "react-router-dom";
import { ArchiveCard } from "../components/ArchiveCard";
import { IndexScreen } from "../components/IndexScreen";
import { Header } from "../components/Header";
import { Meter, Page } from "../components/Chrome";
import { NotFoundBlock } from "../components/States";
import { ExpansionDossier } from "../components/ExpansionDossier";
import { RecordSection } from "../components/RecordChrome";
import { Breadcrumb } from "./SpecimenDetail";
import { OPERATION_FILTERS, OPERATION_SORTS, entryHaystack } from "../lib/query";
import { getRecordsByType } from "../lib/archive";
import { cells, threatInk } from "../lib/derive";
import { stagger, useReveal } from "../lib/motion";
import { useArchive } from "../lib/useArchive";
import { useDocumentTitle } from "../lib/useDocumentTitle";

const severityLabel = (n: number) =>
  n >= 5 ? "Catastrophic" : n >= 4 ? "Major" : n >= 3 ? "Serious" : n >= 2 ? "Moderate" : "Minor";

export default function Operations() {
  const { incidents, counts } = useArchive();
  useDocumentTitle(
    "Operations — InGen Archive",
    "Incidents, expeditions and events of operational significance on InGen record."
  );

  const entries = getRecordsByType("incident");
  const catastrophic = incidents.filter((i) => i.severity >= 5).length;
  const open = incidents.filter((i) => /OPEN|SEALED/i.test(i.status)).length;
  const byId = new Map(incidents.map((i) => [i.id, i]));

  return (
    <IndexScreen
      eyebrow="Section 07 · Operational record"
      title="Operations"
      intro="Containment failures, expeditions, dispersals and events of operational significance, with severity assessment, timeline and the records attached to each."
      summary={[
        { label: "On record", value: counts.incident, ink: "#E4E9EF" },
        { label: "Catastrophic", value: catastrophic, ink: "#D2564D" },
        { label: "Open files", value: open, ink: "#E0B36A" },
      ]}
      records={entries}
      filters={OPERATION_FILTERS}
      sorts={OPERATION_SORTS}
      haystack={entryHaystack}
      searchLabel="Search operational records"
      searchPlaceholder="Search event, year, classification…"
      gridMin={300}
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
                    { label: "Date", value: rec.date },
                    { label: "Severity", value: `${severityLabel(rec.severity)} · ${rec.severity}/5` },
                  ]
                : undefined
            }
          />
        );
      }}
      countLabel={(shown, total) =>
        shown === total ? `Showing all ${total} records` : `Showing ${shown} of ${total} records`
      }
      emptyHeadline={(q) => (q ? `No operational record matches “${q}”` : "No records match the active filter")}
      emptyBody="No operational files match your current archive query. Broaden the term or clear the active filters."
    />
  );
}

export function IncidentDetail() {
  const { id = "" } = useParams();
  const { incidentById } = useArchive();
  const record = incidentById.get(id);
  const timelineReveal = useReveal();

  useDocumentTitle(
    record ? `${record.name} · ${record.fileId} — InGen Archive` : "Operational record not found — InGen Archive",
    record
      ? `${record.fileId} — ${record.date}. ${record.classification}.`
      : "The requested operational record could not be resolved."
  );

  return (
    <Page>
      <Header icons={false} />
      <Breadcrumb
        trail={[
          { label: "Archive", to: "/dashboard" },
          { label: "Operations", to: "/operations" },
          { label: record ? record.fileId : "—" },
        ]}
        backTo="/operations"
        backLabel="Back to operations"
      />
      <main id="main">
        {record ? (
          <ExpansionDossier
            kind="incident"
            id={record.id}
            fileId={record.fileId}
            name={record.name}
            designation={`${record.date} · ${record.type}`}
            status={record.status}
            security={record.security}
            tags={record.tags}
            relations={record.relations}
            plateCaption="Event record"
            badges={[
              {
                label: record.classification,
                ink: record.severity >= 5 ? "#D2564D" : record.severity >= 4 ? "#E0B36A" : "#8895A5",
                border: record.severity >= 5 ? "#5E2F30" : record.severity >= 4 ? "#4A3E28" : "#232D38",
              },
            ]}
            facts={[
              { label: "Date", value: record.date },
              { label: "Type", value: record.type },
              { label: "Classification", value: record.classification },
              { label: "File status", value: record.status },
            ]}
            aside={
              <div>
                <div
                  style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12 }}
                >
                  <span
                    style={{
                      font: "500 11px 'IBM Plex Sans',sans-serif",
                      letterSpacing: ".13em",
                      color: "#788D9F",
                      textTransform: "uppercase",
                    }}
                  >
                    Severity
                  </span>
                  <span
                    style={{
                      font: "700 21px 'Archivo',sans-serif",
                      color: threatInk(record.severity),
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {record.severity}
                    <span style={{ font: "500 12px 'IBM Plex Mono',monospace", color: "#6F859D" }}> / 5</span>
                  </span>
                </div>
                <Meter cells={cells(record.severity, threatInk(record.severity))} height={5} gap={4} animate />
                <p
                  style={{
                    margin: "11px 0 0",
                    font: "400 12.5px/1.5 'IBM Plex Sans',sans-serif",
                    color: "#7E8C9C",
                    textWrap: "pretty",
                  }}
                >
                  {severityLabel(record.severity)} — {record.classification.toLowerCase()}.
                </p>
              </div>
            }
          >
            <p
              style={{
                margin: 0,
                padding: "0 0 28px",
                borderBottom: "1px solid #1A222C",
                font: "400 21px/1.5 'IBM Plex Sans',sans-serif",
                color: "#9FB2C4",
                maxWidth: "62ch",
                textWrap: "pretty",
              }}
            >
              {record.summary}
            </p>

            {record.timeline.length > 0 && (
              <RecordSection title="Event sequence" aside={`${record.timeline.length} entries`}>
                <div ref={timelineReveal} style={{ display: "flex", flexDirection: "column" }}>
                  {record.timeline.map((ev, i) => (
                    <div
                      key={ev.label}
                      data-reveal
                      style={{ ...stagger(i), display: "grid", gridTemplateColumns: "44px 1fr", gap: 20 }}
                    >
                      <div
                        style={{
                          position: "relative",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-start",
                        }}
                      >
                        <span
                          style={{
                            font: "500 13px 'IBM Plex Mono',monospace",
                            color: "#9FB2C4",
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span
                          style={{
                            position: "absolute",
                            left: 3,
                            top: 22,
                            bottom: -2,
                            width: 1,
                            background: "#1F2833",
                          }}
                        />
                        <span
                          style={{
                            position: "absolute",
                            left: 0,
                            top: 23,
                            width: 7,
                            height: 7,
                            borderRadius: "50%",
                            background: "#3D5568",
                            boxShadow: "0 0 0 3px #0B0F14",
                          }}
                        />
                      </div>
                      <div style={{ paddingBottom: 22 }}>
                        <div
                          style={{ font: "600 14.5px 'IBM Plex Sans',sans-serif", color: "#E4E9EF", lineHeight: 1.4 }}
                        >
                          {ev.label}
                        </div>
                        <div
                          style={{
                            font: "400 13.5px/1.6 'IBM Plex Sans',sans-serif",
                            color: "#9FB2C4",
                            marginTop: 5,
                            maxWidth: "68ch",
                            textWrap: "pretty",
                          }}
                        >
                          {ev.detail}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </RecordSection>
            )}

            <RecordSection title="Outcome" body={record.outcome} />
            <RecordSection title="Archive notes" body={record.notes} />
          </ExpansionDossier>
        ) : (
          <NotFoundBlock
            margin="40px clamp(20px,3vw,40px)"
            eyebrow="Operational record not found"
            headline={`No operational record for “${id}”`}
            body="The event identifier could not be resolved. It may have been reclassified above your clearance, purged from the master index, or the identifier is malformed."
            actionLabel="Return to record"
            actionTo="/operations"
          />
        )}
      </main>
    </Page>
  );
}
