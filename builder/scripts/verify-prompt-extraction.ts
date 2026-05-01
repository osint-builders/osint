#!/usr/bin/env tsx
/**
 * Verifies that the new template-driven buildCollectionPrompt() produces
 * byte-identical output to the original inline template literal.
 *
 * Strategy:
 *  - Pin DateTime.now() to a fixed instant so timestamps are deterministic.
 *  - Build a small synthetic source list so sourceBlocks is non-empty.
 *  - Call the new builder.
 *  - Read the snapshot file scripts/__fixtures__/collection-prompt-pinned.txt
 *    (committed) and compare. On mismatch, write the actual output next to
 *    it and fail.
 *
 * To regenerate the snapshot after an intentional prompt change:
 *   UPDATE_SNAPSHOT=1 npx tsx scripts/verify-prompt-extraction.ts
 */
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import { Settings, DateTime } from "luxon";

// Pin "now" so DateTime.now() is deterministic.
// 2026-05-01T15:34:55Z (matches a real run from memory.md).
const PINNED_NOW_ISO = "2026-05-01T15:34:55.000Z";
const pinnedMs = new Date(PINNED_NOW_ISO).getTime();
Settings.now = () => pinnedMs;

// Sanity check
const tNow = DateTime.now().setZone("UTC").toISO();
if (tNow !== "2026-05-01T15:34:55.000Z") {
  console.error(`Time pinning failed; got ${tNow}`);
  process.exit(1);
}

// Build a synthetic source set on disk so readSourceFile() returns
// deterministic content. We point REPO_ROOT at a temp dir.
const tmpRoot = fs.mkdtempSync(path.join(require("os").tmpdir(), "osint-verify-"));
fs.mkdirSync(path.join(tmpRoot, "source", "sources"), { recursive: true });
fs.writeFileSync(
  path.join(tmpRoot, "source", "sources", "twitter-fixture.md"),
  "---\nid: twitter-fixture\nstatus: active\n---\n\nFixture body line 1.\nFixture body line 2.\n"
);
fs.writeFileSync(
  path.join(tmpRoot, "source", "sources", "webpage-fixture.md"),
  "---\nid: webpage-fixture\nstatus: testing\n---\n\nWebpage fixture content.\n"
);

// Import the builder. Because index.ts has top-level main() that calls
// process.exit, we cannot just require it. Instead, dynamically load the
// builder and pull the buildCollectionPrompt symbol. We do that by reading
// the file and re-exposing the function via an evaluated module.
//
// Simpler: re-implement the import path. The file we care about exports
// nothing today; for verification we directly invoke a second helper script.
// To keep this self-contained, we re-implement the call by spawning tsx with
// a tiny shim. But that's heavyweight. Instead, just run the builder's
// buildCollectionPrompt directly: refactor the builder to also export it
// when REQUIRED via require.cache injection.
//
// Pragmatic approach: copy the body of buildCollectionPrompt + helpers here.
// That defeats the purpose. Better: temporarily make index.ts importable by
// guarding main() behind `if (require.main === module)`.

// --- Use the safer route: monkey-patch and dynamic require.
process.env.REPO_ROOT = tmpRoot;

const indexPath = path.resolve(__dirname, "..", "index.ts");
const indexSrc = fs.readFileSync(indexPath, "utf-8");
if (!indexSrc.includes("require.main === module")) {
  console.error(
    "Expected index.ts to guard main() with `if (require.main === module)`.\n" +
    "Run the patch step that adds that guard, then re-run this verifier."
  );
  process.exit(2);
}

// eslint-disable-next-line @typescript-eslint/no-var-requires
const builderModule = require(indexPath);
if (typeof builderModule.buildCollectionPrompt !== "function") {
  console.error("index.ts must export buildCollectionPrompt for verification.");
  process.exit(2);
}

const sources = [
  { id: "twitter-fixture", name: "Twitter Fixture", file: "sources/twitter-fixture.md", status: "active" },
  { id: "webpage-fixture", name: "Webpage Fixture", file: "sources/webpage-fixture.md", status: "testing" },
];

const prompt: string = builderModule.buildCollectionPrompt(
  tmpRoot,
  sources,
  "git@github.com:osint-builders/osint.git",
  2,
  5
);

const fixtureDir = path.join(__dirname, "__fixtures__");
fs.mkdirSync(fixtureDir, { recursive: true });
const snapshotPath = path.join(fixtureDir, "collection-prompt-pinned.txt");

if (process.env.UPDATE_SNAPSHOT === "1" || !fs.existsSync(snapshotPath)) {
  fs.writeFileSync(snapshotPath, prompt);
  console.log(`Snapshot written: ${snapshotPath} (${prompt.length} chars)`);
  console.log(`SHA-256: ${crypto.createHash("sha256").update(prompt).digest("hex")}`);
  process.exit(0);
}

const expected = fs.readFileSync(snapshotPath, "utf-8");
if (expected === prompt) {
  console.log(`✓ Prompt output byte-identical to snapshot (${prompt.length} chars).`);
  console.log(`SHA-256: ${crypto.createHash("sha256").update(prompt).digest("hex")}`);
  process.exit(0);
}

const actualPath = snapshotPath + ".actual";
fs.writeFileSync(actualPath, prompt);
console.error(`✗ Prompt output diverged from snapshot.`);
console.error(`  expected: ${snapshotPath} (${expected.length} chars)`);
console.error(`  actual:   ${actualPath} (${prompt.length} chars)`);
console.error(`  Run: diff -u ${snapshotPath} ${actualPath}`);
process.exit(1);
