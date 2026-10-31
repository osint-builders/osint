import { test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { prepareQualifyBatches } from "./qualify-batches";

function fixture(): { root: string; pending: string; processed: string; cleanup(): void } {
  const prefix = path.join(os.tmpdir(), "osint-qualify-batches-");
  const root = fs.mkdtempSync(prefix);
  const pending = path.join(root, "data", "queue", "pending");
  const processed = path.join(root, "data", "queue", "processed");
  fs.mkdirSync(pending, { recursive: true });
  fs.mkdirSync(processed, { recursive: true });
  fs.mkdirSync(path.join(root, "source", "sources"), { recursive: true });
  fs.writeFileSync(path.join(root, "source", "manifest.json"), JSON.stringify({
    sources: [{ id: "fixture", name: "Fixture Source", file: "sources/fixture.md", status: "testing" }],
  }));
  fs.writeFileSync(path.join(root, "source", "sources", "fixture.md"), "# Fixture Source\nSource context body.\n");
  return {
    root,
    pending,
    processed,
    cleanup: () => {
      if (!root.startsWith(prefix)) throw new Error("Unexpected test cleanup path");
      fs.rmSync(root, { recursive: true, force: true });
    },
  };
}

function writeTip(directory: string, name: string, end: string): void {
  fs.writeFileSync(path.join(directory, `${name}.json`), JSON.stringify({
    source_id: "fixture",
    source_name: "Fixture Source",
    type: "webpage",
    window_start: new Date(Date.parse(end) - 60 * 60_000).toISOString(),
    window_end: end,
    identified_at: end,
    candidates: [{ url: `https://example.com/${name}`, snippet: name, published_at: end }],
  }));
}

test("prepares newest tips within the batch cap and renders complete prompts", () => {
  const { root, pending, cleanup } = fixture();
  try {
    writeTip(pending, "oldest", "2026-10-01T00:00:00Z");
    writeTip(pending, "middle", "2026-10-02T00:00:00Z");
    writeTip(pending, "newest", "2026-10-03T00:00:00Z");
    const plan = prepareQualifyBatches(root, 1, 2);
    assert.equal(plan.pendingTipCount, 3);
    assert.equal(plan.selectedTipCount, 2);
    assert.equal(plan.jobs.length, 2);
    assert.match(plan.jobs[0].prompt, /https:\/\/example.com\/newest/);
    assert.match(plan.jobs[1].prompt, /https:\/\/example.com\/middle/);
    assert.doesNotMatch(plan.jobs[0].prompt + plan.jobs[1].prompt, /example.com\/oldest/);
    assert.match(plan.jobs[0].prompt, /Source context body/);
    assert.doesNotMatch(plan.jobs[0].prompt, /\$\{[a-zA-Z]/);
    assert.deepEqual(plan.jobs.map((job) => job.itemCount), [1, 1]);
  } finally {
    cleanup();
  }
});

test("skips an already processed duplicate and names a malformed pending file", () => {
  const { root, pending, processed, cleanup } = fixture();
  try {
    writeTip(processed, "duplicate", "2026-10-01T00:00:00Z");
    fs.writeFileSync(path.join(pending, "duplicate.json"), '{"source_id":"fixture","urls":[]}');
    writeTip(pending, "valid", "2026-10-02T00:00:00Z");
    assert.equal(prepareQualifyBatches(root, 3, 10).pendingTipCount, 1);
    fs.writeFileSync(path.join(pending, "invalid.json"), '{"source_id":"fixture","urls":[]}');
    assert.throws(() => prepareQualifyBatches(root, 3, 10), /Invalid pending tip invalid.json/);
    fs.rmSync(path.join(pending, "invalid.json"));
    fs.writeFileSync(path.join(pending, "no-window.json"), JSON.stringify({
      source_id: "fixture", source_name: "Fixture Source", type: "webpage",
      identified_at: "2026-10-02T00:00:00Z",
      candidates: [{ url: "https://example.com/item", snippet: "item", published_at: "2026-10-02T00:00:00Z" }],
    }));
    assert.throws(() => prepareQualifyBatches(root, 3, 10), /window_start/);
  } finally {
    cleanup();
  }
});

test("rejects invalid bounds before reading the queue", () => {
  assert.throws(() => prepareQualifyBatches("unused", 0, 1), /positive integers/);
  assert.throws(() => prepareQualifyBatches("unused", 1, NaN), /positive integers/);
});
