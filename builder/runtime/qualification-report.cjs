#!/usr/bin/env node
// Render only known decision codes from the agent's temporary log. Never copy
// fetched text, URLs, or free-form notes into a commit or GitHub Actions log.
const fs = require('node:fs');
const path = require('node:path');

const CODES = new Set([
  'QUALIFIED', 'DUPLICATE', 'OFF_TOPIC', 'STALE', 'UNVERIFIABLE',
  'WEAK_EVIDENCE', 'NO_GEO', 'IMAGE_FAILED', 'FETCH_FAILED', 'OTHER',
]);
const MAX_BYTES = 64 * 1024;
const MAX_RECORDS = 1000;
const MAX_REPORT_CHARS = 3000;

function renderReport(input, expected, allowedKeys) {
  const decisions = new Map();
  let invalid = 0;
  const lines = input.split(/\r?\n/).filter(Boolean);
  for (const line of lines.slice(0, MAX_RECORDS)) {
    const fields = line.split('\t');
    const [tipKey, index, code] = fields;
    const decisionKey = `${tipKey}:${index}`;
    if (fields.length !== 3 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(tipKey) ||
        tipKey.length > 80 || !allowedKeys.has(tipKey) ||
        !/^[1-3]$/.test(index) || !CODES.has(code) ||
        decisions.has(decisionKey)) {
      invalid++;
      continue;
    }
    decisions.set(decisionKey, { tipKey, index: Number(index), code });
  }
  invalid += Math.max(0, lines.length - MAX_RECORDS);

  const recorded = decisions.size;
  const expectedLabel = expected > 0 ? String(expected) : 'unknown';
  const unreported = expected > 0 ? Math.max(0, expected - recorded) : 'unknown';
  const header = `Qualification: expected=${expectedLabel} recorded=${recorded} unreported=${unreported} invalid=${invalid}`;
  const grouped = new Map();
  for (const { tipKey, index, code } of [...decisions.values()].sort(
    (a, b) => a.tipKey.localeCompare(b.tipKey) || a.index - b.index
  )) {
    if (!grouped.has(tipKey)) grouped.set(tipKey, []);
    grouped.get(tipKey).push(`${index}=${code}`);
  }

  let report = header;
  let omitted = 0;
  for (const [tipKey, values] of grouped) {
    const line = `\nQualification: ${tipKey} ${values.join(' ')}`;
    if (report.length + line.length <= MAX_REPORT_CHARS - 48) report += line;
    else omitted++;
  }
  if (omitted) report += `\nQualification: omitted=${omitted} tip(s)`;
  return report;
}

function main() {
  const file = process.argv[2];
  const count = Number(process.argv[3]);
  const expected = Number.isSafeInteger(count) && count >= 0 ? count : 0;
  const allowedKeys = new Set(process.argv.slice(4)
    .filter((file) => /^data\/queue\/pending\/[a-z0-9-]+\.json$/.test(file))
    .map((file) => path.basename(file, '.json')));
  let input = '';
  let oversized = false;
  if (file && fs.existsSync(file)) {
    const size = fs.statSync(file).size;
    oversized = size > MAX_BYTES;
    if (!oversized) input = fs.readFileSync(file, 'utf8');
  }
  const report = renderReport(input, expected, allowedKeys);
  process.stdout.write(`${report}${oversized ? '\nQualification: log_oversized=1' : ''}\n`);
}

if (require.main === module) main();
module.exports = { renderReport };
