import { defineConfig, type Options } from "tsup";

const shared: Options = {
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  treeshake: true,
  target: "es2020",
  external: ["react", "react-dom", "@floating-ui/react", "@floating-ui/dom"],
};

export default defineConfig([
  {
    // Main entry: exports client components. The "use client" directive is
    // added by scripts/add-use-client.mjs after build (esbuild strips a banner
    // directive during bundling).
    ...shared,
    entry: { index: "src/index.ts" },
    clean: true,
  },
  {
    // Framework-agnostic core: no React, no "use client".
    ...shared,
    entry: { "core/index": "src/core/index.ts" },
    clean: false,
  },
]);
