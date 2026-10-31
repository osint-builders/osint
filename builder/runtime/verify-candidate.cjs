#!/usr/bin/env node
// Candidate gate: reject stale provenance, incorrect source names, and missing attribution before image work.
const fs = require('node:fs');
const path = require('node:path');
const { validateOriginalReport, validateSingleSourceAttribution } = require('../../data/scripts/lib/qualified-event');

try {
  const event = JSON.parse(fs.readFileSync(0, 'utf8'));
  const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '../../source/manifest.json'), 'utf8'));
  const sourceNames = new Set(manifest.sources.map(({ name }) => name));
  const issues = [...validateOriginalReport(event), ...validateSingleSourceAttribution(event)];
  if (!sourceNames.has(event.source?.name)) {
    issues.push("Field 'source.name' must exactly match a source/manifest.json name");
  }
  if (issues.length) {
    for (const issue of issues) console.error(`REJECT: ${issue}`);
    process.exitCode = 1;
  }
} catch (error) {
  console.error(`REJECT: candidate validation failed: ${error.message}`);
  process.exitCode = 1;
}
