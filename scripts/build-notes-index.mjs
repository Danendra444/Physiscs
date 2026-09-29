// Scans content/notes/*.mdx and writes content/notes/index.json (used by the topic hub
// and the notes page contents list). Fails loudly if any note has a content mistake.
// Runs automatically before `npm run dev` and `npm run build`.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { scanDir, serializeIndex } from "../lib/notes/scan.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dir = path.join(root, "content", "notes");
const { index, problems } = scanDir(dir);

if (problems.length > 0) {
  console.error(`\nNotes content problems (${problems.length}):`);
  for (const problem of problems) console.error(`  - ${problem}`);
  console.error("");
  process.exit(1);
}

fs.writeFileSync(path.join(dir, "index.json"), serializeIndex(index));
const topics = Object.keys(index).length;
const checks = Object.values(index).reduce((n, t) => n + t.checks.length, 0);
console.log(`Notes index: ${topics} topic${topics === 1 ? "" : "s"}, ${checks} self-checks.`);
