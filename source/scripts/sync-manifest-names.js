#!/usr/bin/env node

/**
 * sync-manifest-names.js
 *
 * Fills/repairs the `name` field of every entry in source/manifest.json from
 * the first `# ` header of the referenced source file. The collection prompt
 * requires `source.name` to match that header exactly, so the manifest must
 * mirror it.
 *
 * Usage:
 *   node source/scripts/sync-manifest-names.js           # write changes
 *   node source/scripts/sync-manifest-names.js --check   # exit 1 on drift
 */

'use strict';

const fs = require('fs');
const path = require('path');

const SOURCE_DIR = path.join(__dirname, '..');
const MANIFEST_PATH = path.join(SOURCE_DIR, 'manifest.json');

const checkOnly = process.argv.includes('--check');

function headerOf(file) {
  const text = fs.readFileSync(file, 'utf-8');
  for (const line of text.split('\n')) {
    if (line.startsWith('# ')) return line.slice(2).trim();
  }
  return null;
}

function main() {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
  let changed = 0;
  let missing = 0;

  for (const src of manifest.sources) {
    const filePath = path.join(SOURCE_DIR, src.file);
    if (!fs.existsSync(filePath)) {
      console.warn(`WARN ${src.id}: file not found (${src.file})`);
      missing++;
      continue;
    }
    const header = headerOf(filePath);
    if (!header) {
      console.warn(`WARN ${src.id}: no '# ' header in ${src.file}`);
      missing++;
      continue;
    }
    if (src.name !== header) {
      if (!checkOnly) src.name = header;
      console.log(`${checkOnly ? 'DRIFT' : 'SET'} ${src.id}: "${header}"`);
      changed++;
    }
  }

  if (checkOnly) {
    if (changed > 0) {
      console.error(`\n${changed} manifest name(s) drift from source headers.`);
      console.error('Run: node source/scripts/sync-manifest-names.js');
      process.exit(1);
    }
    console.log('All manifest names match source headers.');
    return;
  }

  if (changed > 0) {
    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n');
  }
  console.log(`\nDone: ${changed} name(s) updated, ${missing} warning(s).`);
}

main();
