#!/usr/bin/env tsx
/** Pin the rendered legacy collection prompt so template changes get reviewed. */
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import * as crypto from "node:crypto";
import { Settings } from "luxon";
import { buildCollectionPrompt } from "../lib/collection-prompt";

const pinnedMs = Date.parse("2026-05-01T15:34:55.000Z");
const snapshotPath = path.join(__dirname, "__fixtures__", "collection-prompt-pinned.txt");
const update = process.argv.includes("--update");
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "osint-prompt-verify-"));
const priorNow = Settings.now;

try {
  Settings.now = () => pinnedMs;
  const sourceDir = path.join(tempRoot, "source", "sources");
  fs.mkdirSync(sourceDir, { recursive: true });
  fs.writeFileSync(path.join(sourceDir, "twitter-fixture.md"),
    "---\nid: twitter-fixture\nstatus: active\n---\n\nFixture body line 1.\nFixture body line 2.\n");
  fs.writeFileSync(path.join(sourceDir, "webpage-fixture.md"),
    "---\nid: webpage-fixture\nstatus: testing\n---\n\nWebpage fixture content.\n");

  const prompt = buildCollectionPrompt(tempRoot, [
    { id: "twitter-fixture", name: "Twitter Fixture", file: "sources/twitter-fixture.md", status: "active" },
    { id: "webpage-fixture", name: "Webpage Fixture", file: "sources/webpage-fixture.md", status: "testing" },
  ], "git@github.com:osint-builders/osint.git", 2, 5);
  const checksum = crypto.createHash("sha256").update(prompt).digest("hex");

  if (update) {
    fs.mkdirSync(path.dirname(snapshotPath), { recursive: true });
    fs.writeFileSync(snapshotPath, prompt);
    console.log(`Updated prompt snapshot: ${snapshotPath} (${checksum})`);
  } else if (!fs.existsSync(snapshotPath)) {
    console.error(`Missing prompt snapshot: ${snapshotPath}`);
    process.exitCode = 1;
  } else if (fs.readFileSync(snapshotPath, "utf8") !== prompt) {
    const actualPath = `${snapshotPath}.actual`;
    fs.writeFileSync(actualPath, prompt);
    console.error(`Prompt differs from snapshot. Review ${actualPath}, then run npm run update-prompt-snapshot.`);
    process.exitCode = 1;
  } else {
    console.log(`Prompt matches snapshot (${checksum}).`);
  }
} finally {
  Settings.now = priorNow;
  if (!tempRoot.startsWith(path.join(os.tmpdir(), "osint-prompt-verify-"))) {
    throw new Error("Unexpected prompt fixture cleanup path");
  }
  fs.rmSync(tempRoot, { recursive: true, force: true });
}
