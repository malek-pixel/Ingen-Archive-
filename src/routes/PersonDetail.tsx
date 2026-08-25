import { useParams } from "react-router-dom";
import { Header } from "../components/Header";
import { Page } from "../components/Chrome";
import { NotFoundBlock } from "../components/States";
import { PersonDossier } from "../components/PersonDossier";
import { Breadcrumb } from "./SpecimenDetail";
import { useArchive } from "../lib/useArchive";
import { useDocumentTitle } from "../lib/useDocumentTitle";

export default function PersonDetail() {
  const { id = "" } = useParams();
  const { personById } = useArchive();
  const p = personById.get(id);

  useDocumentTitle(
    p ? `${p.name} · ${p.fileId} — InGen Archive` : "File not found — InGen Archive",
    p
      ? `${p.fileId} — ${p.role}, ${p.dept}. Level ${p.clearance} clearance.`
      : "The requested personnel file could not be resolved."
  );

  return (
    <Page>
      <Header icons={false} />
      <Breadcrumb
        trail={[
          { label: "Archive", to: "/dashboard" },
          { label: "Personnel", to: "/personnel" },
          { label: p ? p.fileId : "—" },
        ]}
        backTo="/personnel"
        backLabel="Back to personnel"
      />
      <main id="main">
        {p ? (
          <PersonDossier p={p} />
        ) : (
          <NotFoundBlock
            margin="40px clamp(20px,3vw,40px)"
            eyebrow="Personnel file not found"
            headline={`No personnel file for “${id}”`}
            body="The file ID could not be resolved. It may have been sealed above your clearance, purged from the master index, or the identifier is malformed."
            actionLabel="Return to index"
            actionTo="/personnel"
          />
        )}
      </main>
    </Page>
  );
}
