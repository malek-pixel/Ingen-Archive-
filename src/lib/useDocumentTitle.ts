import { useEffect } from "react";

const BASE_DESCRIPTION = "International Genetic Technologies — internal records infrastructure.";

function setMeta(name: string, content: string) {
  let tag = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute("name", name);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
}

/**
 * Sets the document title and, optionally, the page description.
 *
 * Without a per-route description every dossier shares one link preview, so a
 * shared record is indistinguishable from the archive index.
 */
export function useDocumentTitle(title: string, description?: string) {
  useEffect(() => {
    document.title = title;
    setMeta("description", description ?? BASE_DESCRIPTION);
  }, [title, description]);
}
