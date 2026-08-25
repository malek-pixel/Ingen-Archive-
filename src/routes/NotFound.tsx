import { useLocation } from "react-router-dom";
import { Header } from "../components/Header";
import { Page } from "../components/Chrome";
import { NotFoundBlock } from "../components/States";
import { useDocumentTitle } from "../lib/useDocumentTitle";

export default function NotFound() {
  const { pathname } = useLocation();
  useDocumentTitle("Record not found — InGen Archive", "The requested archive address could not be resolved.");
  return (
    <Page minHeight>
      <Header descriptor="Master directory" />
      <main id="main">
        <NotFoundBlock
          watermark
          margin="40px clamp(20px,3vw,40px)"
          eyebrow="Archive record not found"
          headline={`No record at ${pathname}`}
          body="The record ID could not be resolved. It may have been reclassified above your clearance, purged from the master index, or the identifier is malformed."
          actionLabel="Return to archive"
          actionTo="/"
        />
      </main>
    </Page>
  );
}
