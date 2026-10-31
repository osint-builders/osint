#!/usr/bin/env node
// Remove pending tips too old for the live qualification queue.
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
  return NaN;
}

const pending = path.join(repoRoot, "data", "queue", "pending");
if (!fs.existsSync(pending)) {
  console.log("No pending tip directory.");
  process.exit(0);
}

const stale = [];
const unknown = [];
for (const name of fs.readdirSync(pending).filter((name) => name.endsWith(".json")).sort()) {
  const file = path.join(pending, name);
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
console.log(
  `Queue cleanup at ${new Date(now).toISOString()}: ` +
  `${stale.length} older than ${new Date(cutoff).toISOString()}`
);
if (!dryRun) {
  for (const file of stale) fs.unlinkSync(file);
}
