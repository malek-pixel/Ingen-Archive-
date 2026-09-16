import { DinoCard } from "../components/DinoCard";
import { IndexScreen } from "../components/IndexScreen";
import { SPECIMEN_FILTERS, SPECIMEN_SORTS, specimenHaystack } from "../lib/query";
import { useArchive } from "../lib/useArchive";
import { useDocumentTitle } from "../lib/useDocumentTitle";

export default function Database() {
  useDocumentTitle(
    "Genetic assets — InGen Archive",
    "Searchable index of every indexed specimen, with containment status and threat assessment."
  );
  const { specimens, stats } = useArchive();

  return (
    <IndexScreen
      eyebrow="Section 01 · Specimen index"
      title="Genetic assets"
      intro="Every specimen indexed under InGen custodianship, with current containment status and threat assessment."
      summary={[
        { label: "Indexed", value: stats.dTotal, ink: "#E4E9EF" },
        { label: "Threat 4+", value: (stats.dExtreme || 0) + (stats.dHigh || 0), ink: "#E0B36A" },
        { label: "Breached", value: stats.dFailed, ink: "#D2564D" },
      ]}
      records={specimens}
      filters={SPECIMEN_FILTERS}
      sorts={SPECIMEN_SORTS}
      haystack={specimenHaystack}
      searchLabel="Search genetic assets"
      searchPlaceholder="Search name, species, classification…"
      gridMin={248}
      renderCard={(d, i) => <DinoCard key={d.id} d={d} index={i} />}
      countLabel={(shown, total) =>
        shown === total ? `Showing all ${total} records` : `Showing ${shown} of ${total} records`
      }
      emptyHeadline={(q) => (q ? `No asset matches “${q}”` : "No assets match the active filter")}
      emptyBody="No records match your current archive query. Broaden the term or clear the active filters."
    />
  );
}
