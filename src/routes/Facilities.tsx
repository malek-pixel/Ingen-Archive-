import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { ArchiveCard } from "../components/ArchiveCard";
import { IndexScreen } from "../components/IndexScreen";
import { Header } from "../components/Header";
import { Page } from "../components/Chrome";
import { NotFoundBlock } from "../components/States";
import { ExpansionDossier } from "../components/ExpansionDossier";
import { RecordSection } from "../components/RecordChrome";
import { Breadcrumb } from "./SpecimenDetail";
import { FACILITY_FILTERS, FACILITY_SORTS, entryHaystack } from "../lib/query";
import { getLocation, getRecordsByType } from "../lib/archive";
import { useArchive } from "../lib/useArchive";
import { useDocumentTitle } from "../lib/useDocumentTitle";

export default function Facilities() {
  const { facilities, counts } = useArchive();
  useDocumentTitle(
    "Facilities — InGen Archive",
    "Laboratories, enclosures and structures held within recorded InGen sites."
  );

  const entries = getRecordsByType("facility");
  const operational = facilities.filter((f) => /ACTIVE/i.test(f.status)).length;
  const lost = facilities.filter((f) => /DESTROYED|ABANDONED|DERELICT/i.test(f.status)).length;
  // Memoised: the index screen re-renders on every keystroke and this map
  // only changes when the data does.
  const byId = useMemo(() => new Map(facilities.map((f) => [f.id, f])), [facilities]);

  return (
    <IndexScreen
      eyebrow="Section 06 · Structure register"
      title="Facilities"
      intro="Laboratories, containment enclosures, guest structures and compounds recorded within archive sites, with function, condition and the events attached to each."
      summary={[
        { label: "On register", value: counts.facility, ink: "#E4E9EF" },
        { label: "Operational", value: operational, ink: "#7ACB9A" },
        { label: "Lost", value: lost, ink: "#E08A84" },
      ]}
      records={entries}
      filters={FACILITY_FILTERS}
      sorts={FACILITY_SORTS}
      haystack={entryHaystack}
      searchLabel="Search facilities"
      searchPlaceholder="Search structure, function, site…"
      gridMin={280}
      renderCard={(e, i) => {
        const rec = byId.get(e.id);
        const site = rec ? getLocation(rec.location) : undefined;
        return (
          <ArchiveCard
            key={e.id}
            entry={e}
            index={i}
            meta={
              rec
                ? [
                    { label: "Site", value: site?.name ?? "—" },
                    { label: "Type", value: rec.type },
                  ]
                : undefined
            }
          />
        );
      }}
      countLabel={(shown, total) =>
        shown === total ? `Showing all ${total} structures` : `Showing ${shown} of ${total} structures`
      }
      emptyHeadline={(q) => (q ? `No facility matches “${q}”` : "No facilities match the active filter")}
      emptyBody="No facility files match your current archive query. Broaden the term or clear the active filters."
    />
  );
}

export function FacilityDetail() {
  const { id = "" } = useParams();
  const { facilityById } = useArchive();
  const record = facilityById.get(id);
  const site = record ? getLocation(record.location) : undefined;

  useDocumentTitle(
    record ? `${record.name} · ${record.fileId} — InGen Archive` : "Facility not found — InGen Archive",
    record
      ? `${record.fileId} — ${record.designation}. ${record.type}.`
      : "The requested facility could not be resolved."
  );

  return (
    <Page>
      <Header />
      <Breadcrumb
        trail={[
          { label: "Archive", to: "/dashboard" },
          { label: "Facilities", to: "/facilities" },
          { label: record ? record.fileId : "—" },
        ]}
        backTo="/facilities"
        backLabel="Back to facilities"
      />
      <main id="main">
        {record ? (
          <ExpansionDossier
            kind="facility"
            id={record.id}
            fileId={record.fileId}
            name={record.name}
            designation={record.designation}
            status={record.status}
            security={record.security}
            tags={record.tags}
            plateCaption="Structure elevation"
            badges={[{ label: record.type }]}
            facts={[
              { label: "Type", value: record.type },
              { label: "Site", value: site?.name },
              { label: "Established", value: record.established },
              { label: "Decommissioned", value: record.decommissioned },
              { label: "Capacity", value: record.capacity },
              { label: "Condition", value: record.condition },
            ]}
            aside={
              site ? (
                <div>
                  <div
                    style={{
                      font: "500 11px 'IBM Plex Sans',sans-serif",
                      letterSpacing: ".13em",
                      color: "#788D9F",
                      textTransform: "uppercase",
                      marginBottom: 12,
                    }}
                  >
                    Located at
                  </div>
                  <Link
                    to={`/locations/${site.id}`}
                    className="ig-outline"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                      padding: "11px 13px",
                      border: "1px solid #1A222C",
                      textDecoration: "none",
                      color: "inherit",
                    }}
                  >
                    <span style={{ font: "500 13px 'IBM Plex Sans',sans-serif", color: "#E4E9EF" }}>{site.name}</span>
                    <span style={{ font: "400 10.5px 'IBM Plex Mono',monospace", color: "#6B8297" }}>
                      {site.fileId}
                    </span>
                  </Link>
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
              {record.function}
            </p>

            <RecordSection title="Structure profile" body={record.description} />
            <RecordSection title="Condition" body={record.condition} />
            <RecordSection title="Archive notes" body={record.notes} />
          </ExpansionDossier>
        ) : (
          <NotFoundBlock
            margin="40px clamp(20px,3vw,40px)"
            eyebrow="Facility file not found"
            headline={`No facility record for “${id}”`}
            body="The structure identifier could not be resolved. It may have been reclassified above your clearance, purged from the master index, or the identifier is malformed."
            actionLabel="Return to register"
            actionTo="/facilities"
          />
        )}
      </main>
    </Page>
  );
}
