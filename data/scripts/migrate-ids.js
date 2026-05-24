#!/usr/bin/env node

/**
 * migrate-ids.js
 *
 * One-time migration: assigns Snowflake IDs to every event in data/events/,
 * deduplicates by content fingerprint, and rewrites JSONL files in-place.
 *
 * Produces data/scripts/id-migration-map.json for audit.
 *
 * Usage:
 *   node data/scripts/migrate-ids.js              # run migration
 *   node data/scripts/migrate-ids.js --dry-run    # preview without writing
 */

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { SnowflakeGenerator } = require('./snowflake.js');

const EVENTS_DIR = path.join(__dirname, '..', 'events');
const MAP_PATH = path.join(__dirname, 'id-migration-map.json');

const dryRun = process.argv.includes('--dry-run');

// ---------------------------------------------------------------------------
// Fingerprinting — deterministic content hash for deduplication
// ---------------------------------------------------------------------------

function fingerprint(event) {
  const parts = [
    event.title || '',
    event.source?.name || '',
    event.date_published || '',
    (event.links && event.links[0]?.url) || '',
  ];
  return crypto.createHash('sha256').update(parts.join('|')).digest('hex');
}

// ---------------------------------------------------------------------------
// Read all JSONL files
// ---------------------------------------------------------------------------

function findJsonlFiles(baseDir) {
  const files = [];
  if (!fs.existsSync(baseDir)) return files;
  for (const monthDir of fs.readdirSync(baseDir).filter(d => /^\d{4}-\d{2}$/.test(d)).sort()) {
    const monthPath = path.join(baseDir, monthDir);
    for (const file of fs.readdirSync(monthPath).filter(f => f.endsWith('.jsonl')).sort()) {
      files.push(path.join(monthPath, file));
    }
  }
  return files;
}

function readJsonl(filePath) {
  const lines = fs.readFileSync(filePath, 'utf-8').split('\n');
  const events = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      events.push(JSON.parse(trimmed));
    } catch (err) {
      console.warn(`  WARN: skipping unparseable line in ${path.basename(filePath)}: ${err.message}`);
    }
  }
  return events;
}

// ---------------------------------------------------------------------------
// Migration
// ---------------------------------------------------------------------------

function main() {
  console.log('=== Snowflake ID Migration ===\n');
  if (dryRun) console.log('  [DRY RUN — no files will be modified]\n');

  const files = findJsonlFiles(EVENTS_DIR);
  if (files.length === 0) {
    console.log('No JSONL files found.');
    process.exit(0);
  }

  console.log(`Found ${files.length} JSONL files\n`);

  // Phase 1: Read everything, collect fingerprints
  const allEntries = []; // { file, event, fingerprint }
  let totalBefore = 0;

  for (const filePath of files) {
    const events = readJsonl(filePath);
    totalBefore += events.length;
    for (const event of events) {
      allEntries.push({
        file: filePath,
        event,
        fp: fingerprint(event),
      });
    }
  }

  console.log(`Total events read: ${totalBefore}`);

  // Phase 2: Deduplicate by fingerprint (keep first occurrence)
  const seenFp = new Set();
  const deduped = [];
  let dupsRemoved = 0;

  for (const entry of allEntries) {
    if (seenFp.has(entry.fp)) {
      dupsRemoved++;
      continue;
    }
    seenFp.add(entry.fp);
    deduped.push(entry);
  }

  console.log(`Duplicates removed: ${dupsRemoved}`);
  console.log(`Events after dedup: ${deduped.length}\n`);

  // Phase 3: Assign new Snowflake IDs, preserving time order
  // Sort by date_published so IDs are monotonically increasing
  deduped.sort((a, b) => {
    const da = a.event.date_published || '';
    const db = b.event.date_published || '';
    return da.localeCompare(db);
  });

  const gen = new SnowflakeGenerator(0);
  const migrationMap = {};

  for (const entry of deduped) {
    const oldId = entry.event.id;
    const pubDate = entry.event.date_published;
    let newId;

    if (pubDate) {
      let dateMs = new Date(pubDate).getTime();
      if (!isNaN(dateMs)) {
        // Clamp pre-epoch dates to epoch to avoid negative snowflakes
        const epochMs = Number(1767225600000n);
        if (dateMs < epochMs) dateMs = epochMs;
        newId = gen.idFromTimestamp(dateMs);
      } else {
        newId = gen.nextId();
      }
    } else {
      newId = gen.nextId();
    }

    migrationMap[oldId] = newId;
    entry.event.id = newId;
  }

  // Phase 4: Group back by file and rewrite
  const byFile = new Map();
  for (const entry of deduped) {
    if (!byFile.has(entry.file)) byFile.set(entry.file, []);
    byFile.get(entry.file).push(entry.event);
  }

  let filesRewritten = 0;
  for (const [filePath, events] of byFile) {
    const content = events.map(e => JSON.stringify(e)).join('\n') + '\n';
    if (!dryRun) {
      fs.writeFileSync(filePath, content, 'utf-8');
    }
    filesRewritten++;
    console.log(`  ${dryRun ? '[dry-run] ' : ''}${path.basename(filePath)}: ${events.length} events`);
  }

  // Check for any files that lost all events (shouldn't happen, but be safe)
  for (const filePath of files) {
    if (!byFile.has(filePath)) {
      console.log(`  WARN: ${path.basename(filePath)}: all events removed by dedup`);
    }
  }

  // Phase 5: Write migration map
  if (!dryRun) {
    fs.writeFileSync(MAP_PATH, JSON.stringify(migrationMap, null, 2), 'utf-8');
  }

  // Phase 6: Verify no duplicate IDs in output
  const allNewIds = deduped.map(e => e.event.id);
  const uniqueNewIds = new Set(allNewIds);
  const newIdDups = allNewIds.length - uniqueNewIds.size;

  console.log('\n=== Migration Summary ===');
  console.log(`  Events before:        ${totalBefore}`);
  console.log(`  Duplicates removed:   ${dupsRemoved}`);
  console.log(`  Events after:         ${deduped.length}`);
  console.log(`  Files rewritten:      ${filesRewritten}`);
  console.log(`  New ID duplicates:    ${newIdDups}${newIdDups > 0 ? ' ← ERROR' : ' ✓'}`);
  console.log(`  Migration map:        ${dryRun ? '[not written]' : MAP_PATH}`);

  if (newIdDups > 0) {
    console.error('\nERROR: New IDs have duplicates — this should never happen.');
    process.exit(1);
  }

  if (!dryRun) {
    console.log('\n✓ Migration complete.');
  } else {
    console.log('\n[DRY RUN] No files modified.');
  }
}

main();
