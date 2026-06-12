#!/usr/bin/env node

/**
 * dedupe-events.js
 *
 * Cross-bucket safety net: parallel collection agents merge with dedup
 * locally, but they cannot see events that sibling buckets push at the same
 * moment. This script re-deduplicates committed day files after the fact,
 * keeping the FIRST occurrence of each content fingerprint and preserving
 * line order. embeddings.yml runs it after every collection run.
 *
 * Fingerprint: sha256(title|source.name|date_published|links[0].url) —
 * identical to builder/runtime/merge-events.sh.
 *
 * Usage:
 *   node data/scripts/dedupe-events.js              # last 7 days of files
 *   node data/scripts/dedupe-events.js --days 30    # custom window
 *   node data/scripts/dedupe-events.js --all        # every day file
 *   node data/scripts/dedupe-events.js --dry-run    # report only
 */

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const EVENTS_DIR = path.join(__dirname, '..', 'events');

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const all = args.includes('--all');
let days = 7;
const di = args.indexOf('--days');
if (di >= 0 && args[di + 1]) days = parseInt(args[di + 1], 10) || 7;

function fingerprint(event) {
  const parts = [
    event.title || '',
    (event.source && event.source.name) || '',
    event.date_published || '',
    (event.links && event.links[0] && event.links[0].url) || '',
  ];
  return crypto.createHash('sha256').update(parts.join('|')).digest('hex');
}

function dayFiles() {
  if (!fs.existsSync(EVENTS_DIR)) return [];
  const cutoff = new Date(Date.now() - days * 86_400_000)
    .toISOString()
    .slice(0, 10);
  const files = [];
  for (const month of fs.readdirSync(EVENTS_DIR).filter((d) => /^\d{4}-\d{2}$/.test(d)).sort()) {
    for (const f of fs.readdirSync(path.join(EVENTS_DIR, month)).filter((f) => f.endsWith('.jsonl')).sort()) {
      const day = f.replace('.jsonl', '');
      if (all || day >= cutoff) files.push(path.join(EVENTS_DIR, month, f));
    }
  }
  return files;
}

function main() {
  let totalRemoved = 0;
  for (const file of dayFiles()) {
    const lines = fs.readFileSync(file, 'utf-8').split('\n').filter((l) => l.trim());
    const seen = new Set();
    const kept = [];
    let removed = 0;
    for (const line of lines) {
      let event;
      try {
        event = JSON.parse(line);
      } catch {
        kept.push(line); // never drop lines this tool cannot parse
        continue;
      }
      const fp = fingerprint(event);
      if (seen.has(fp)) {
        removed++;
        continue;
      }
      seen.add(fp);
      kept.push(JSON.stringify(event));
    }
    if (removed > 0) {
      console.log(`${path.relative(process.cwd(), file)}: ${removed} duplicate(s)${dryRun ? ' (dry run)' : ' removed'}`);
      if (!dryRun) fs.writeFileSync(file, kept.join('\n') + '\n');
      totalRemoved += removed;
    }
  }
  console.log(`dedupe-events: ${totalRemoved} duplicate(s) ${dryRun ? 'found' : 'removed'}.`);
}

main();
