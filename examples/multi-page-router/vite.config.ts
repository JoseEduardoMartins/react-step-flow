import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const here = dirname(fileURLToPath(import.meta.url));

/**
 * Standalone Vite dev server for the multi-page-router example.
 *
 * It aliases `react-step-flow` to the library source so the example always runs
 * against the current working tree (no build/link step), and reuses the repo's
 * root `node_modules` for React, react-router-dom and the lib's own deps.
 */
export default defineConfig({
  root: here,
  plugins: [react()],
  resolve: {
    alias: {
      "react-step-flow": resolve(here, "../../src/index.ts"),
    },
  },
});
