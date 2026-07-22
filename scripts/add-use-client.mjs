// Prepend the "use client" directive to the main bundle entries so the library
// can be imported directly in React Server Component trees (Next.js App Router).
// esbuild strips a module-level directive during bundling, so we add it here.
import { readFile, writeFile } from "node:fs/promises";

const DIRECTIVE = '"use client";\n';
const targets = ["dist/index.js", "dist/index.cjs"];

for (const file of targets) {
  try {
    const content = await readFile(file, "utf8");
    if (content.startsWith(DIRECTIVE)) continue;
    await writeFile(file, DIRECTIVE + content, "utf8");
    console.log(`[add-use-client] prepended directive to ${file}`);
  } catch (error) {
    console.warn(`[add-use-client] skipped ${file}: ${error.message}`);
  }
}
