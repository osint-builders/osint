#!/usr/bin/env node

// Check ID integrity across every retained event file before indexing or release.
const fs = require('node:fs');
const path = require('node:path');

function eventFiles(eventsDir) {
  return fs.readdirSync(eventsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && /^\d{4}-\d{2}$/.test(entry.name))
    .flatMap((month) => fs.readdirSync(path.join(eventsDir, month.name))
      .filter((name) => /^\d{4}-\d{2}-\d{2}\.jsonl$/.test(name))
      .map((name) => path.join(eventsDir, month.name, name)))
    .sort();
}

function verifyEventIds(eventsDir) {
  const firstById = new Map();
  const duplicates = [];
  const missing = [];
  const malformed = [];
  const files = eventFiles(eventsDir);
  let rows = 0;

  for (const file of files) {
    const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
    for (let index = 0; index < lines.length; index++) {
      if (!lines[index].trim()) continue;
      rows++;
      const location = `${path.relative(eventsDir, file)}:${index + 1}`;
      let event;
      try {
        event = JSON.parse(lines[index]);
      } catch {
        malformed.push(location);
        continue;
      }
      if (!event || typeof event.id !== 'string' || !event.id.trim()) {
        missing.push(location);
        continue;
      }
      const first = firstById.get(event.id);
      if (first) duplicates.push({ id: event.id, first, repeated: location });
      else firstById.set(event.id, location);
    }
  }
  return { files: files.length, rows, uniqueIds: firstById.size, duplicates, missing, malformed };
}

if (require.main === module) {
  if (process.argv.length > 3) {
    console.error('Usage: node data/scripts/verify-event-ids.js [events-directory]');
    process.exit(2);
  }
  try {
    const eventsDir = path.resolve(process.argv[2] || path.join(__dirname, '..', 'events'));
    const result = verifyEventIds(eventsDir);
    const groups = new Set(result.duplicates.map((entry) => entry.id)).size;
    console.log(`Event IDs: ${result.rows} rows in ${result.files} files, ${result.uniqueIds} unique nonempty IDs; ` +
      `${groups} duplicate groups (${result.duplicates.length} extra rows), ` +
      `${result.missing.length} missing IDs, ${result.malformed.length} malformed rows.`);
    for (const entry of result.duplicates.slice(0, 50)) {
      console.error(`Duplicate ${entry.id}: ${entry.first} and ${entry.repeated}`);
    }
    for (const location of result.missing.slice(0, 50)) console.error(`Missing ID: ${location}`);
    for (const location of result.malformed.slice(0, 50)) console.error(`Malformed JSON: ${location}`);
    if (result.duplicates.length || result.missing.length || result.malformed.length) process.exitCode = 1;
  } catch (error) {
    console.error(`Event ID check failed: ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = { verifyEventIds };
