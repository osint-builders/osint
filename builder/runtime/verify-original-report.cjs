#!/usr/bin/env node
// Candidate gate: reject missing or stale first-report evidence before image work.
const fs = require('node:fs');
const { validateOriginalReport } = require('../../data/scripts/lib/qualified-event');

try {
  const event = JSON.parse(fs.readFileSync(0, 'utf8'));
  const issues = validateOriginalReport(event);
  if (issues.length) {
    for (const issue of issues) console.error(`REJECT: ${issue}`);
    process.exitCode = 1;
  }
} catch (error) {
  console.error(`REJECT: invalid event JSON: ${error.message}`);
  process.exitCode = 1;
}
