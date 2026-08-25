import "@testing-library/jest-dom/vitest";
import { configure } from "@testing-library/react";

// Routes are lazily loaded, so every findBy* waits on a dynamic import. The
// 1s default races that on a cold module graph — the first assertion in a file
// pays for the chunk. Raise the async ceiling; it only affects failure timing.
configure({ asyncUtilTimeout: 8000 });
