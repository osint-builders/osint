#!/usr/bin/env node
// Archive pending tips too old for the live qualification queue. The original
// JSON stays under expired/ for audit or deliberate backfill. If a basename
// already exists under processed/, its pending copy is redundant and removed.
const fs = require("node:fs");
const path = require("node:path");

function argument(name, fallback) {
  const index = process.argv.indexOf(name);
  return index < 0 ? fallback : process.argv[index + 1];
}

const maxAgeHours = Number(argument("--max-age-hours", ""));
const repoRoot = argument("--repo-root", process.cwd());
const nowString = argument("--now", new Date().toISOString());
const dryRun = process.argv.includes("--dry-run");
const now = Date.parse(nowString);
if (!Number.isFinite(maxAgeHours) || maxAgeHours <= 0 || !Number.isFinite(now)) {
  throw new Error("Usage: expire-tips.cjs --max-age-hours <positive number> [--repo-root path] [--now ISO] [--dry-run]");
}
const cutoff = now - maxAgeHours * 60 * 60 * 1000;

function tipTime(tip) {
  for (const field of ["window_end", "identified_at"]) {
    const parsed = Date.parse(tip[field] || "");
    if (Number.isFinite(parsed)) return parsed;
  }
  // The three original Oct 1 queue tips used urls[].published.
  const published = Array.isArray(tip.urls)
    ? tip.urls.map((item) => Date.parse(item?.published || "")).filter(Number.isFinite)
    : [];
  return published.length ? Math.max(...published) : NaN;
}

const queue = path.join(repoRoot, "data", "queue");
const pending = path.join(queue, "pending");
const processed = path.join(queue, "processed");
const expired = path.join(queue, "expired");
if (!fs.existsSync(pending)) {
  console.log("No pending tip directory.");
  process.exit(0);
}

const duplicates = [];
const stale = [];
const unknown = [];
for (const name of fs.readdirSync(pending).filter((name) => name.endsWith(".json")).sort()) {
  const file = path.join(pending, name);
  if (fs.existsSync(path.join(processed, name))) {
    duplicates.push(file);
    continue;
  }
  let observed;
  try {
    observed = tipTime(JSON.parse(fs.readFileSync(file, "utf8")));
  } catch {
    observed = NaN;
  }
  if (!Number.isFinite(observed)) unknown.push(name);
  else if (observed < cutoff) stale.push(file);
}

if (unknown.length) {
  throw new Error(`Cannot date ${unknown.length} pending tip(s): ${unknown.slice(0, 5).join(", ")}`);
}
const collisions = stale.filter((file) => fs.existsSync(path.join(expired, path.basename(file))));
if (collisions.length) {
  throw new Error(`Expired archive already contains ${collisions.length} pending tip basename(s)`);
}

console.log(
  `Queue cleanup at ${new Date(now).toISOString()}: ${duplicates.length} already processed, ` +
  `${stale.length} older than ${new Date(cutoff).toISOString()}`
);
if (!dryRun) {
  if (stale.length) fs.mkdirSync(expired, { recursive: true });
  for (const file of duplicates) fs.unlinkSync(file);
  for (const file of stale) fs.renameSync(file, path.join(expired, path.basename(file)));
}
