import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: { target: "es2022", assetsInlineLimit: 0 },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./test/setup.ts"],
    include: ["test/**/*.test.{ts,tsx}"],
    // The Level 5 gate reads its code from the environment. Tests need a known
    // one; this is the test fixture, not the value any build ships with.
    env: { VITE_INGEN_LEVEL5_PASSWORD: "test-clearance-code" },
  },
});
