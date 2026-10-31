#!/usr/bin/env node
// Candidate gate: reject stale first-report evidence and missing attribution before image work.
const fs = require('node:fs');
const { validateOriginalReport, validateSingleSourceAttribution } = require('../../data/scripts/lib/qualified-event');

try {
  const event = JSON.parse(fs.readFileSync(0, 'utf8'));
  const issues = [...validateOriginalReport(event), ...validateSingleSourceAttribution(event)];
  if (issues.length) {
    for (const issue of issues) console.error(`REJECT: ${issue}`);
    process.exitCode = 1;
  }
} catch (error) {
  console.error(`REJECT: invalid event JSON: ${error.message}`);
  process.exitCode = 1;
}
