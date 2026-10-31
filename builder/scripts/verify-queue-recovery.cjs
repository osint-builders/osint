#!/usr/bin/env node
// Integration check for expired-tip deletion and bounded backlog planning.
const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const builder = path.resolve(__dirname, "..");
const root = fs.mkdtempSync(path.join(os.tmpdir(), "osint-queue-recovery-"));
const pending = path.join(root, "data", "queue", "pending");

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { cwd: root, encoding: "utf8", ...options });
  assert.equal(result.status, 0, `${command} failed:\n${result.stdout}\n${result.stderr}`);
  return result.stdout;
}

function tip(name, end) {
  return {
    source_id: name,
    source_name: name,
    type: "webpage",
    window_start: new Date(Date.parse(end) - 60 * 60_000).toISOString(),
    window_end: end,
    identified_at: end,
    candidates: [{ url: `https://example.com/${name}`, snippet: "", published_at: end }],
  };
}

function write(directory, name, value) {
  fs.writeFileSync(path.join(directory, `${name}.json`), JSON.stringify(value));
}

try {
  fs.mkdirSync(pending, { recursive: true });
  fs.mkdirSync(path.join(root, "source"), { recursive: true });
  fs.writeFileSync(path.join(root, "source", "manifest.json"), '{"sources":[]}');
  run("git", ["init", "-q"]);
  run("git", ["remote", "add", "origin", "https://github.com/osint-builders/osint.git"]);

  write(pending, "stale", tip("stale", "2026-10-29T00:00:00Z"));
  write(pending, "older", tip("older", "2026-10-30T22:00:00Z"));
  write(pending, "newest", tip("newest", "2026-10-30T23:00:00Z"));
  run("git", ["add", "-A"]);
  run("git", ["-c", "user.name=fixture", "-c", "user.email=fixture@example.com", "commit", "-qm", "Fixture"]);

  const cleanupArgs = [
    path.join(builder, "runtime", "expire-tips.cjs"),
    "--max-age-hours", "24", "--now", "2026-10-31T01:00:00Z",
    "--repo-root", root,
  ];
  assert.match(run(process.execPath, [...cleanupArgs, "--dry-run"]), /1 older/);
  assert.equal(fs.existsSync(path.join(pending, "stale.json")), true);
  const cleanup = run(process.execPath, cleanupArgs);
  assert.match(cleanup, /1 older/);
  assert.equal(fs.existsSync(path.join(pending, "stale.json")), false);
  assert.equal(fs.existsSync(path.join(root, "data", "queue", "expired")), false);

  const tsx = path.join(builder, "node_modules", "tsx", "dist", "cli.mjs");
  const qualify = path.join(builder, "qualify.ts");
  const env = { ...process.env, REPO_ROOT: root, QUALIFY_BATCH_SIZE: "1", QUALIFY_MAX_BATCHES: "1" };
  const limited = run(process.execPath, [tsx, qualify, "--dry-run"], { env });
  assert.match(limited, /Found 2 pending tip\(s\); selecting 1 newest tip\(s\)/);
  assert.match(limited, /Built 1 prompts/);
  const prompt = fs.readFileSync(path.join(root, ".dry-run-prompts", "qualify-batch-1.md"), "utf8");
  assert.match(prompt, /https:\/\/example.com\/newest/);
  assert.doesNotMatch(prompt, /https:\/\/example.com\/older/);

  const complete = run(process.execPath, [tsx, qualify, "--dry-run"], {
    env: { ...env, QUALIFY_MAX_BATCHES: "10" },
  });
  assert.match(complete, /Built 2 prompts/);

  run("git", ["add", "-A", "data/queue"]);
  const deletions = run("git", ["diff", "--cached", "--no-renames", "--name-status", "--", "data/queue/pending"]);
  assert.match(deletions, /^D\s/m);
  assert.doesNotMatch(deletions, /^[AM]\s/m);
  write(pending, "older", { ...tip("older", "2026-10-30T22:00:00Z"), source_name: "rewritten" });
  run("git", ["add", "-A", "data/queue"]);
  const rewritten = run("git", ["diff", "--cached", "--no-renames", "--name-status", "--", "data/queue/pending"]);
  assert.match(rewritten, /^M\s+data\/queue\/pending\/older.json$/m);
  console.log("Queue recovery check passed.");
} finally {
  const prefix = path.join(os.tmpdir(), "osint-queue-recovery-");
  if (root.startsWith(prefix)) fs.rmSync(root, { recursive: true, force: true });
}
