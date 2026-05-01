#!/usr/bin/env node

/**
 * validate-events.js
 *
 * Validates JSONL files against the World Event Entity schema.
 *
 * This is the canonical validation logic. The runtime collection prompt
 * (builder/prompts/collection-prompt.md) invokes this script in strict
 * mode at Step 4 instead of inlining its own bash. Keep them in sync by
 * routing every check through here.
 *
 * Modes:
 *   default                 baseline: required fields, types, ISO dates,
 *                           geo-coordinate ranges. Does NOT require a
 *                           geo object — historical events emitted before
 *                           the geo gate was tightened are tolerated.
 *   --strict                runtime mode: ALSO requires geo.lat/geo.lon
 *                           and rejects E-PRIME violations in `contents`.
 *   --time-window START END both ISO-8601; rejects events whose
 *                           `date_published` falls outside [START, END].
 *
 * Inputs:
 *   <file>                  validate one specific JSONL file
 *   --from YYYY-MM-DD       validate events/YYYY-MM/YYYY-MM-DD.jsonl from
 *                           that date forward
 *   --to YYYY-MM-DD         (with --from) up to and including this date
 *   --all                   validate every events/**.jsonl
 *
 * Exits 0 on all-valid, 1 on any failure or argument error.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const REQUIRED_BASE = [
  'id', 'source', 'title', 'summary', 'contents',
  'date_published', 'links', 'image_urls'
];

// Strict mode also requires geo.
const REQUIRED_STRICT = REQUIRED_BASE.concat(['geo']);

const TYPES = {
  id: 'string',
  source: 'object',
  title: 'string',
  summary: 'string',
  contents: 'string',
  date_published: 'string',
  date_event: ['string', 'null'],
  links: 'array',
  image_urls: 'array',
  geo: 'object',
  topics: 'array',
  confidence: 'number',
  ingested_at: 'string',
};

const CONSTRAINTS = {
  id: { minLength: 8 },
  title: { minLength: 3 },
  summary: { minLength: 10 },
  contents: { minLength: 20 },
  confidence: { min: 0, max: 1 },
};

// E-PRIME: forms of "to be" that must not appear in `contents`. Word-boundary
// matched, case-insensitive. The runtime prompt enforces the same set.
const EPRIME_RE = /\b(is|are|was|were|be|been|being)\b/i;

// ---------------------------------------------------------------------------
// Args
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
let targetFile = null;
let fromDate = null;
let toDate = null;
let validateAll = false;
let strict = false;
let timeWindowStart = null;
let timeWindowEnd = null;

function usage() {
  console.log(`Usage: node validate-events.js [file] [options]

Validate JSONL files against World Event Entity schema.

Options:
  --from YYYY-MM-DD               validate events/YYYY-MM/<date>.jsonl from this date
  --to YYYY-MM-DD                 (with --from) up to and including this date
  --all                           validate every events/**.jsonl
  --strict                        require geo.lat/geo.lon and reject E-PRIME violations
  --time-window START END         both ISO-8601; reject events whose date_published
                                  falls outside [START, END] (used by the runtime)
  --help, -h                      show this help

Examples:
  node validate-events.js data/events/2026-05/2026-05-01.jsonl
  node validate-events.js --from 2026-05-01 --strict
  node validate-events.js events.jsonl --strict \\
      --time-window 2026-05-01T14:00:00.000Z 2026-05-01T15:00:00.000Z
`);
}

for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--from' && args[i + 1]) {
    fromDate = args[++i];
  } else if (a === '--to' && args[i + 1]) {
    toDate = args[++i];
  } else if (a === '--all') {
    validateAll = true;
  } else if (a === '--strict') {
    strict = true;
  } else if (a === '--time-window' && args[i + 1] && args[i + 2]) {
    timeWindowStart = args[++i];
    timeWindowEnd = args[++i];
  } else if (a === '--help' || a === '-h') {
    usage();
    process.exit(0);
  } else if (a.startsWith('--')) {
    console.error(`Unknown flag: ${a}`);
    usage();
    process.exit(2);
  } else if (!targetFile) {
    targetFile = a;
  } else {
    console.error(`Unexpected positional arg: ${a}`);
    process.exit(2);
  }
}

// ---------------------------------------------------------------------------
// Per-event validation
// ---------------------------------------------------------------------------

function isValidISO8601(s) {
  if (typeof s !== 'string') return false;
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,6})?(Z|[+\-]\d{2}:?\d{2})$/.test(s)) {
    return false;
  }
  return !isNaN(new Date(s).getTime());
}

function validateEvent(event, filename, lineNumber) {
  const issues = [];
  const required = strict ? REQUIRED_STRICT : REQUIRED_BASE;

  // Required fields
  for (const field of required) {
    if (!(field in event)) {
      issues.push(`Missing required field: ${field}`);
    }
  }

  // Types
  for (const [field, expectedType] of Object.entries(TYPES)) {
    if (!(field in event)) continue;
    const value = event[field];
    const actualType =
      Array.isArray(value) ? 'array' :
      value === null ? 'null' :
      typeof value;
    if (Array.isArray(expectedType)) {
      if (!expectedType.includes(actualType)) {
        issues.push(`Field '${field}' has type '${actualType}', expected one of: ${expectedType.join(', ')}`);
      }
    } else if (actualType !== expectedType) {
      issues.push(`Field '${field}' has type '${actualType}', expected '${expectedType}'`);
    }
  }

  // String-length constraints
  for (const [field, c] of Object.entries(CONSTRAINTS)) {
    if (!(field in event)) continue;
    const v = event[field];
    if (c.minLength != null && typeof v === 'string' && v.length < c.minLength) {
      issues.push(`Field '${field}' must be at least ${c.minLength} characters`);
    }
    if (c.min != null && typeof v === 'number' && v < c.min) {
      issues.push(`Field '${field}' must be ≥ ${c.min}`);
    }
    if (c.max != null && typeof v === 'number' && v > c.max) {
      issues.push(`Field '${field}' must be ≤ ${c.max}`);
    }
  }

  // source.name
  if (event.source && typeof event.source === 'object' && !event.source.name) {
    issues.push("Field 'source' must have required property 'name'");
  }

  // ISO dates
  if (event.date_published && !isValidISO8601(event.date_published)) {
    issues.push(`Field 'date_published' is not a valid ISO 8601 datetime`);
  }
  if (event.date_event != null && !isValidISO8601(event.date_event)) {
    issues.push(`Field 'date_event' is not a valid ISO 8601 datetime`);
  }
  if (event.ingested_at && !isValidISO8601(event.ingested_at)) {
    issues.push(`Field 'ingested_at' is not a valid ISO 8601 datetime`);
  }

  // Time-window enforcement (runtime mode)
  if (timeWindowStart && timeWindowEnd && event.date_published) {
    if (event.date_published < timeWindowStart || event.date_published > timeWindowEnd) {
      issues.push(
        `Field 'date_published' (${event.date_published}) outside time window ` +
        `[${timeWindowStart}, ${timeWindowEnd}]`
      );
    }
  }

  // geo
  if (event.geo && typeof event.geo === 'object') {
    if (typeof event.geo.lat === 'number' && (event.geo.lat < -90 || event.geo.lat > 90)) {
      issues.push(`Field 'geo.lat' must be between -90 and 90`);
    }
    if (typeof event.geo.lon === 'number' && (event.geo.lon < -180 || event.geo.lon > 180)) {
      issues.push(`Field 'geo.lon' must be between -180 and 180`);
    }
    if (strict) {
      if (typeof event.geo.lat !== 'number') {
        issues.push(`Field 'geo.lat' is required (--strict) and must be a number`);
      }
      if (typeof event.geo.lon !== 'number') {
        issues.push(`Field 'geo.lon' is required (--strict) and must be a number`);
      }
    }
  } else if (strict) {
    issues.push(`Field 'geo' is required (--strict)`);
  }

  // links[*].url
  if (Array.isArray(event.links)) {
    event.links.forEach((link, index) => {
      if (!link || !link.url) {
        issues.push(`Link at index ${index} missing required 'url' field`);
      }
    });
  }

  // E-PRIME (strict mode only — historical data predates the rule)
  if (strict && typeof event.contents === 'string') {
    const m = event.contents.match(EPRIME_RE);
    if (m) {
      issues.push(
        `Field 'contents' contains E-PRIME violation: '${m[0]}' ` +
        `(forms of 'to be' are forbidden)`
      );
    }
  }

  if (issues.length > 0) {
    errors.push({ file: filename, line: lineNumber, id: event.id || 'unknown', issues });
    return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// File walking
// ---------------------------------------------------------------------------

let totalEvents = 0;
let validEvents = 0;
let invalidEvents = 0;
const errors = [];

async function validateFile(filepath) {
  return new Promise((resolve, reject) => {
    const rl = readline.createInterface({
      input: fs.createReadStream(filepath),
      crlfDelay: Infinity,
    });
    let lineNumber = 0;
    rl.on('line', (line) => {
      lineNumber++;
      if (line.trim() === '') return;
      totalEvents++;
      try {
        const event = JSON.parse(line);
        if (validateEvent(event, path.basename(filepath), lineNumber)) {
          validEvents++;
        } else {
          invalidEvents++;
        }
      } catch (err) {
        invalidEvents++;
        errors.push({
          file: path.basename(filepath),
          line: lineNumber,
          id: 'parse-error',
          issues: [`JSON parse error: ${err.message}`],
        });
      }
    });
    rl.on('close', resolve);
    rl.on('error', reject);
  });
}

function findFilesInDateRange(baseDir, from, to) {
  const files = [];
  if (!fs.existsSync(baseDir)) return files;
  const monthDirs = fs.readdirSync(baseDir)
    .filter((n) => /^\d{4}-\d{2}$/.test(n))
    .sort();
  for (const monthDir of monthDirs) {
    const monthPath = path.join(baseDir, monthDir);
    fs.readdirSync(monthPath)
      .filter((n) => n.endsWith('.jsonl'))
      .filter((n) => {
        const date = n.replace('.jsonl', '');
        return (!from || date >= from) && (!to || date <= to);
      })
      .map((n) => path.join(monthPath, n))
      .forEach((p) => files.push(p));
  }
  return files;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const eventsDir = path.join(__dirname, '..', 'events');

  let filesToValidate = [];
  if (targetFile) {
    if (!fs.existsSync(targetFile)) {
      console.error(`Error: file not found: ${targetFile}`);
      process.exit(1);
    }
    filesToValidate = [targetFile];
  } else if (fromDate || toDate || validateAll) {
    filesToValidate = findFilesInDateRange(eventsDir, fromDate, toDate);
    if (filesToValidate.length === 0) {
      console.log('No files found in specified date range.');
      process.exit(0);
    }
  } else {
    console.error('Error: no file specified and no date range provided. See --help.');
    process.exit(2);
  }

  console.log('=== Event Validation ===');
  console.log(`Mode:    ${strict ? 'strict (geo + E-PRIME enforced)' : 'baseline'}`);
  if (timeWindowStart) {
    console.log(`Window:  [${timeWindowStart}, ${timeWindowEnd}]`);
  }
  console.log(`Files:   ${filesToValidate.length}`);
  console.log('');

  for (const file of filesToValidate) {
    console.log(`Validating: ${path.basename(file)}`);
    await validateFile(file);
  }

  console.log('');
  console.log('=== Validation Results ===');
  console.log(`Total events:   ${totalEvents}`);
  console.log(`Valid events:   ${validEvents}`);
  console.log(`Invalid events: ${invalidEvents}`);
  console.log('');

  if (errors.length > 0) {
    console.log('=== Validation Errors ===');
    for (const err of errors) {
      console.log(`\nFile: ${err.file}, Line: ${err.line}, ID: ${err.id}`);
      for (const issue of err.issues) {
        console.log(`  - ${issue}`);
      }
    }
    console.log('');
    process.exit(1);
  }

  console.log('✓ All events are valid');
  process.exit(0);
}

main().catch((err) => {
  console.error('Validation error:', err);
  process.exit(1);
});
