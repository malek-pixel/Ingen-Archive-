import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { ArchiveCard } from "../components/ArchiveCard";
import { IndexScreen } from "../components/IndexScreen";
import { Header } from "../components/Header";
import { Page } from "../components/Chrome";
import { NotFoundBlock } from "../components/States";
import { ExpansionDossier } from "../components/ExpansionDossier";
import { RecordSection } from "../components/RecordChrome";
import { Breadcrumb } from "./SpecimenDetail";
import { LOCATION_FILTERS, LOCATION_SORTS, entryHaystack } from "../lib/query";
import { getRecordsByType } from "../lib/archive";
import { useArchive } from "../lib/useArchive";
import { useDocumentTitle } from "../lib/useDocumentTitle";

export default function Locations() {
  const { locations, counts } = useArchive();
  useDocumentTitle("Locations — InGen Archive", "Sites, islands and operational territories held on record by InGen.");

  const entries = getRecordsByType("location");
  const active = locations.filter((l) => /ACTIVE/i.test(l.status)).length;
  const lost = locations.filter((l) => /DESTROYED|ABANDONED/i.test(l.status)).length;
  // Memoised: the index screen re-renders on every keystroke and this map
  // only changes when the data does.
  const byId = useMemo(() => new Map(locations.map((l) => [l.id, l])), [locations]);

  return (
    <IndexScreen
      eyebrow="Section 04 · Site register"
      title="Locations"
      intro="Islands, estates and operational territories on record, with site status, security classification and the records attached to each."
      summary={[
        { label: "On register", value: counts.location, ink: "#E4E9EF" },
        { label: "Operational", value: active, ink: "#7ACB9A" },
        { label: "Lost", value: lost, ink: "#E08A84" },
      ]}
      records={entries}
      filters={LOCATION_FILTERS}
      sorts={LOCATION_SORTS}
      haystack={entryHaystack}
      searchLabel="Search locations"
      searchPlaceholder="Search site, region, designation…"
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
                    { label: "Region", value: rec.region.split(",")[0] },
                    { label: "Type", value: rec.type.split("—")[0].trim() },
                  ]
                : undefined
            }
          />
        );
      }}
      countLabel={(shown, total) =>
        shown === total ? `Showing all ${total} sites` : `Showing ${shown} of ${total} sites`
      }
      emptyHeadline={(q) => (q ? `No site matches “${q}”` : "No sites match the active filter")}
      emptyBody="No location files match your current archive query. Broaden the term or clear the active filters."
    />
  );
}

export function LocationDetail() {
  const { id = "" } = useParams();
  const { locationById } = useArchive();
  const record = locationById.get(id);

  useDocumentTitle(
    record ? `${record.name} · ${record.fileId} — InGen Archive` : "Location not found — InGen Archive",
    record
      ? `${record.fileId} — ${record.designation}. ${record.region}.`
      : "The requested location could not be resolved."
  );

  return (
    <Page>
      <Header />
      <Breadcrumb
        trail={[
          { label: "Archive", to: "/dashboard" },
          { label: "Locations", to: "/locations" },
          { label: record ? record.fileId : "—" },
        ]}
        backTo="/locations"
        backLabel="Back to locations"
      />
      <main id="main">
        {record ? (
          <ExpansionDossier
            kind="location"
            id={record.id}
            fileId={record.fileId}
            name={record.name}
            designation={record.designation}
            status={record.status}
            security={record.security}
            tags={record.tags}
            plateCaption={record.img ? "Site survey" : "Site plan"}
            img={record.img}
            badges={[{ label: record.type }]}
            facts={[
              { label: "Region", value: record.region },
              { label: "Type", value: record.type },
              { label: "Environment", value: record.environment },
              { label: "Terrain", value: record.terrain },
              { label: "Climate", value: record.climate },
              { label: "Established", value: record.established },
              { label: "Decommissioned", value: record.decommissioned },
            ]}
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
              {record.primaryFunction}
            </p>

            <RecordSection title="Site profile" body={record.description} />
            <RecordSection title="InGen involvement" body={record.inGenInvolvement} />
            <RecordSection title="Historical notes" body={record.historicalNotes} />
            <RecordSection title="Archive notes" body={record.notes} />
          </ExpansionDossier>
        ) : (
          <NotFoundBlock
            margin="40px clamp(20px,3vw,40px)"
            eyebrow="Location file not found"
            headline={`No location record for “${id}”`}
            body="The site identifier could not be resolved. It may have been reclassified above your clearance, purged from the master index, or the identifier is malformed."
            actionLabel="Return to register"
            actionTo="/locations"
          />
        )}
      </main>
    </Page>
  );
}
