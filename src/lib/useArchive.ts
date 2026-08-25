import { loadArchive } from "../data/ingen";
import type { Archive } from "../data/types";

/**
 * Reads the validated archive singleton. Any validation failure throws, and the
 * router's error boundary renders the designed error state — never a silent fallback.
 */
export function useArchive(): Archive {
  return loadArchive();
}
