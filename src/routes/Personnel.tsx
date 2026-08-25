import { PersonnelCard } from "../components/PersonnelCard";
import { IndexScreen } from "../components/IndexScreen";
import { PERSON_FILTERS, PERSON_SORTS, personHaystack } from "../lib/query";
import { useArchive } from "../lib/useArchive";
import { useDocumentTitle } from "../lib/useDocumentTitle";

export default function Personnel() {
  useDocumentTitle(
    "Personnel — InGen Archive",
    "Searchable index of every InGen employment record, with clearance level and assignment history."
  );
  const { personnel, stats } = useArchive();

  return (
    <IndexScreen
      eyebrow="Section 02 · Personnel records"
      title="Personnel"
      intro="Employment records, external consultants and persons of interest connected to InGen operations, with clearance level and assignment history."
      summary={[
        { label: "On file", value: stats.pTotal, ink: "#E4E9EF" },
        { label: "L5 access", value: stats.pL5, ink: "#9FB2C4" },
        { label: "Closed", value: stats.pDeceased, ink: "#E08A84" },
      ]}
      records={personnel}
      filters={PERSON_FILTERS}
      sorts={PERSON_SORTS}
      haystack={personHaystack}
      searchLabel="Search personnel"
      searchPlaceholder="Search name, role, department…"
      gridMin={280}
      renderCard={(p, i) => <PersonnelCard key={p.id} p={p} index={i} />}
      countLabel={(shown, total) =>
        shown === total ? `Showing all ${total} files` : `Showing ${shown} of ${total} files`
      }
      emptyHeadline={(q) => (q ? `No file matches “${q}”` : "No files in this department")}
      emptyBody="No records match your current archive query. Broaden the term or clear the active department filter."
    />
  );
}
