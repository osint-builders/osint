import { test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { prepareQualifyBatches } from "./qualify-batches";

function fixture(): { root: string; pending: string; cleanup(): void } {
  const prefix = path.join(os.tmpdir(), "osint-qualify-batches-");
  const root = fs.mkdtempSync(prefix);
  const pending = path.join(root, "data", "queue", "pending");
  fs.mkdirSync(pending, { recursive: true });
  fs.mkdirSync(path.join(root, "source", "sources"), { recursive: true });
  fs.writeFileSync(path.join(root, "source", "manifest.json"), JSON.stringify({
    sources: [{ id: "fixture", name: "Fixture Source", file: "sources/fixture.md", status: "testing" }],
  }));
  fs.writeFileSync(path.join(root, "source", "sources", "fixture.md"), "# Fixture Source\nSource context body.\n");
  return {
    root,
    pending,
    cleanup: () => {
      if (!root.startsWith(prefix)) throw new Error("Unexpected test cleanup path");
      fs.rmSync(root, { recursive: true, force: true });
    },
  };
}

function writeTip(directory: string, name: string, end: string, identifiedAt = end, publishedAt = end): void {
  fs.writeFileSync(path.join(directory, `${name}.json`), JSON.stringify({
    source_id: "fixture",
    source_name: "Fixture Source",
    type: "webpage",
    window_start: new Date(Date.parse(end) - 60 * 60_000).toISOString(),
    window_end: end,
    identified_at: identifiedAt,
    candidates: [{ url: `https://example.com/${name}`, snippet: name, published_at: publishedAt }],
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
    assert.match(plan.jobs[0].prompt, /Decision key:\*\* newest/);
    assert.match(plan.jobs[0].prompt, /QUALIFICATION_EXPECTED_CANDIDATES=1/);
    assert.doesNotMatch(plan.jobs[0].prompt, /\$\{[a-zA-Z_][a-zA-Z0-9_]*\}/);
    assert.deepEqual(plan.jobs.map((job) => job.itemCount), [1, 1]);
  } finally {
    cleanup();
  }
});

test("uses publication time to select tips within one scan window", () => {
  const { root, pending, cleanup } = fixture();
  try {
    const windowEnd = "2026-10-03T01:00:00Z";
    writeTip(pending, "a-newest", windowEnd, "2026-10-03T01:00:01Z", "2026-10-03T00:59:00Z");
    writeTip(pending, "m-middle", windowEnd, "2026-10-03T01:00:03Z", "2026-10-03T00:30:00Z");
    writeTip(pending, "z-oldest", windowEnd, "2026-10-03T01:00:02Z", "2026-10-03T00:01:00Z");

    const plan = prepareQualifyBatches(root, 1, 2);
    assert.equal(plan.selectedTipCount, 2);
    assert.match(plan.jobs[0].prompt, /example.com\/a-newest/);
    assert.match(plan.jobs[1].prompt, /example.com\/m-middle/);
    assert.doesNotMatch(plan.jobs[0].prompt + plan.jobs[1].prompt, /example.com\/z-oldest/);
  } finally {
    cleanup();
  }
});

test("uses identification time only to break publication-time ties", () => {
  const { root, pending, cleanup } = fixture();
  try {
    const windowEnd = "2026-10-03T01:00:00Z";
    const publishedAt = "2026-10-03T00:30:00Z";
    writeTip(pending, "first", windowEnd, "2026-10-03T01:00:01Z", publishedAt);
    writeTip(pending, "second", windowEnd, "2026-10-03T01:00:02Z", publishedAt);
    const plan = prepareQualifyBatches(root, 1, 1);
    assert.match(plan.jobs[0].prompt, /example.com\/second/);
  } finally {
    cleanup();
  }
});

test("keeps source context for a tip whose source was deactivated after Identify", () => {
  const { root, pending, cleanup } = fixture();
  try {
    fs.writeFileSync(path.join(root, "source", "manifest.json"), JSON.stringify({
      sources: [{ id: "fixture", name: "Fixture Source", file: "sources/fixture.md", status: "inactive" }],
    }));
    writeTip(pending, "deactivated", "2026-10-03T00:00:00Z");
    const plan = prepareQualifyBatches(root, 1, 1);
    assert.match(plan.jobs[0].prompt, /Source context body/);
    assert.doesNotMatch(plan.jobs[0].prompt, /no longer registered/);
  } finally {
    cleanup();
  }
});

test("skips a malformed newest tip and still selects the next valid tip", () => {
  const { root, pending, cleanup } = fixture();
  const warnings: string[] = [];
  const originalWarn = console.warn;
  console.warn = (message) => { warnings.push(String(message)); };
  try {
    writeTip(pending, "valid", "2026-10-02T00:00:00Z");
    writeTip(pending, "malformed-newest", "2026-10-03T00:00:00Z");
    const malformedPath = path.join(pending, "malformed-newest.json");
    const malformed = JSON.parse(fs.readFileSync(malformedPath, "utf-8"));
    malformed.candidates[0].published_at = "not-a-time";
    fs.writeFileSync(malformedPath, JSON.stringify(malformed));

    const plan = prepareQualifyBatches(root, 1, 1);
    assert.equal(plan.pendingTipCount, 1);
    assert.equal(plan.selectedTipCount, 1);
    assert.match(plan.jobs[0].prompt, /https:\/\/example.com\/valid/);
    assert.doesNotMatch(plan.jobs[0].prompt, /malformed-newest/);
    assert.ok(warnings.some((warning) => warning.includes("malformed-newest.json")));
    assert.equal(fs.existsSync(malformedPath), true);
  } finally {
    console.warn = originalWarn;
    cleanup();
  }
});

test("a malformed tip outside the batch cap cannot block newer valid tips", () => {
  const { root, pending, cleanup } = fixture();
  const warnings: string[] = [];
  const originalWarn = console.warn;
  console.warn = (message) => { warnings.push(String(message)); };
  try {
    writeTip(pending, "newest", "2026-10-03T00:00:00Z");
    writeTip(pending, "middle", "2026-10-02T00:00:00Z");
    fs.writeFileSync(path.join(pending, "malformed-oldest.json"), "{not JSON");
    const plan = prepareQualifyBatches(root, 1, 1);
    assert.equal(plan.pendingTipCount, 2);
    assert.equal(plan.selectedTipCount, 1);
    assert.match(plan.jobs[0].prompt, /https:\/\/example.com\/newest/);
    assert.doesNotMatch(plan.jobs[0].prompt, /example.com\/middle/);
    assert.ok(warnings.some((warning) => warning.includes("malformed-oldest.json")));
    assert.equal(fs.existsSync(path.join(pending, "malformed-oldest.json")), true);
  } finally {
    console.warn = originalWarn;
    cleanup();
  }
});

test("skips a tip with an invalid identification timestamp", () => {
  const { root, pending, cleanup } = fixture();
  const originalWarn = console.warn;
  console.warn = () => {};
  try {
    writeTip(pending, "valid", "2026-10-02T00:00:00Z");
    writeTip(pending, "invalid-time", "2026-10-03T00:00:00Z", "not-a-time");
    const plan = prepareQualifyBatches(root, 1, 1);
    assert.equal(plan.pendingTipCount, 1);
    assert.match(plan.jobs[0].prompt, /example.com\/valid/);
  } finally {
    console.warn = originalWarn;
    cleanup();
  }
});

test("rejects invalid bounds before reading the queue", () => {
  assert.throws(() => prepareQualifyBatches("unused", 0, 1), /positive integers/);
  assert.throws(() => prepareQualifyBatches("unused", 1, NaN), /positive integers/);
});
