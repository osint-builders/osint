#!/usr/bin/env node

/**
 * validate-events.js
 * Validate JSONL files against World Event Entity schema
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// World Event Entity Schema Validation Rules
const SCHEMA = {
  required: ['id', 'source', 'title', 'summary', 'contents', 'date_published', 'links', 'image_urls'],
  types: {
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
    ingested_at: 'string'
  },
  constraints: {
    id: { minLength: 8 },
    title: { minLength: 3 },
    summary: { minLength: 10 },
    contents: { minLength: 20 },
    confidence: { min: 0, max: 1 }
  }
};

// Parse command line arguments
const args = process.argv.slice(2);
let targetFile = null;
let fromDate = null;
let toDate = null;
let validateAll = false;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--from' && args[i + 1]) {
    fromDate = args[++i];
  } else if (args[i] === '--to' && args[i + 1]) {
    toDate = args[++i];
  } else if (args[i] === '--all') {
    validateAll = true;
  } else if (args[i] === '--help' || args[i] === '-h') {
    console.log(`Usage: node validate-events.js [file] [options]

Validate JSONL files against World Event Entity schema.

Options:
  --from YYYY-MM-DD    Validate from date
  --to YYYY-MM-DD      Validate to date
  --all                Validate all events (expensive)
  --help, -h           Show this help message

Examples:
  node validate-events.js data/events/2026-04/2026-04-29.jsonl
  node validate-events.js --from 2026-04-01 --to 2026-04-29
  node validate-events.js --all
`);
    process.exit(0);
  } else if (!targetFile) {
    targetFile = args[i];
  }
}

// Validation state
let totalEvents = 0;
let validEvents = 0;
let invalidEvents = 0;
const errors = [];

/**
 * Validate a single event object
 */
function validateEvent(event, filename, lineNumber) {
  const issues = [];

  // Check required fields
  for (const field of SCHEMA.required) {
    if (!(field in event)) {
      issues.push(`Missing required field: ${field}`);
    }
  }

  // Validate types
  for (const [field, expectedType] of Object.entries(SCHEMA.types)) {
    if (field in event) {
      const value = event[field];
      const actualType = Array.isArray(value) ? 'array' : value === null ? 'null' : typeof value;

      if (Array.isArray(expectedType)) {
        if (!expectedType.includes(actualType)) {
          issues.push(`Field '${field}' has type '${actualType}', expected one of: ${expectedType.join(', ')}`);
        }
      } else if (actualType !== expectedType) {
        issues.push(`Field '${field}' has type '${actualType}', expected '${expectedType}'`);
      }
    }
  }

  // Validate constraints
  if (SCHEMA.constraints.id && event.id) {
    if (event.id.length < SCHEMA.constraints.id.minLength) {
      issues.push(`Field 'id' must be at least ${SCHEMA.constraints.id.minLength} characters`);
    }
  }

  if (SCHEMA.constraints.title && event.title) {
    if (event.title.length < SCHEMA.constraints.title.minLength) {
      issues.push(`Field 'title' must be at least ${SCHEMA.constraints.title.minLength} characters`);
    }
  }

  if (SCHEMA.constraints.summary && event.summary) {
    if (event.summary.length < SCHEMA.constraints.summary.minLength) {
      issues.push(`Field 'summary' must be at least ${SCHEMA.constraints.summary.minLength} characters`);
    }
  }

  if (SCHEMA.constraints.contents && event.contents) {
    if (event.contents.length < SCHEMA.constraints.contents.minLength) {
      issues.push(`Field 'contents' must be at least ${SCHEMA.constraints.contents.minLength} characters`);
    }
  }

  if (SCHEMA.constraints.confidence && typeof event.confidence === 'number') {
    if (event.confidence < SCHEMA.constraints.confidence.min || event.confidence > SCHEMA.constraints.confidence.max) {
      issues.push(`Field 'confidence' must be between ${SCHEMA.constraints.confidence.min} and ${SCHEMA.constraints.confidence.max}`);
    }
  }

  // Validate source object
  if (event.source && typeof event.source === 'object') {
    if (!event.source.name) {
      issues.push("Field 'source' must have required property 'name'");
    }
  }

  // Validate ISO 8601 dates
  if (event.date_published) {
    if (!isValidISO8601(event.date_published)) {
      issues.push(`Field 'date_published' is not a valid ISO 8601 datetime`);
    }
  }

  if (event.date_event && event.date_event !== null) {
    if (!isValidISO8601(event.date_event)) {
      issues.push(`Field 'date_event' is not a valid ISO 8601 datetime`);
    }
  }

  if (event.ingested_at) {
    if (!isValidISO8601(event.ingested_at)) {
      issues.push(`Field 'ingested_at' is not a valid ISO 8601 datetime`);
    }
  }

  // Validate geo coordinates
  if (event.geo && typeof event.geo === 'object') {
    if (event.geo.lat !== null && typeof event.geo.lat === 'number') {
      if (event.geo.lat < -90 || event.geo.lat > 90) {
        issues.push(`Field 'geo.lat' must be between -90 and 90`);
      }
    }
    if (event.geo.lon !== null && typeof event.geo.lon === 'number') {
      if (event.geo.lon < -180 || event.geo.lon > 180) {
        issues.push(`Field 'geo.lon' must be between -180 and 180`);
      }
    }
  }

  // Validate links array
  if (event.links && Array.isArray(event.links)) {
    event.links.forEach((link, index) => {
      if (!link.url) {
        issues.push(`Link at index ${index} missing required 'url' field`);
      }
    });
  }

  if (issues.length > 0) {
    errors.push({
      file: filename,
      line: lineNumber,
      id: event.id || 'unknown',
      issues
    });
    return false;
  }

  return true;
}

/**
 * Check if string is valid ISO 8601 datetime
 */
function isValidISO8601(dateString) {
  // Accept ISO 8601 with or without milliseconds
  const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;
  if (!iso8601Regex.test(dateString)) {
    return false;
  }
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

/**
 * Validate a single JSONL file
 */
async function validateFile(filepath) {
  return new Promise((resolve, reject) => {
    const fileStream = fs.createReadStream(filepath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    let lineNumber = 0;

    rl.on('line', (line) => {
      lineNumber++;
      totalEvents++;

      if (line.trim() === '') {
        return;
      }

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
          issues: [`JSON parse error: ${err.message}`]
        });
      }
    });

    rl.on('close', resolve);
    rl.on('error', reject);
  });
}

/**
 * Find JSONL files in date range
 */
function findFilesInDateRange(baseDir, from, to) {
  const files = [];

  if (!fs.existsSync(baseDir)) {
    return files;
  }

  const monthDirs = fs.readdirSync(baseDir)
    .filter(name => /^\d{4}-\d{2}$/.test(name))
    .sort();

  for (const monthDir of monthDirs) {
    const monthPath = path.join(baseDir, monthDir);
    const jsonlFiles = fs.readdirSync(monthPath)
      .filter(name => name.endsWith('.jsonl'))
      .filter(name => {
        const date = name.replace('.jsonl', '');
        return (!from || date >= from) && (!to || date <= to);
      })
      .map(name => path.join(monthPath, name));

    files.push(...jsonlFiles);
  }

  return files;
}

/**
 * Main validation logic
 */
async function main() {
  const dataDir = path.join(__dirname, '..');
  const eventsDir = path.join(dataDir, 'events');

  let filesToValidate = [];

  if (targetFile) {
    // Validate single file
    if (!fs.existsSync(targetFile)) {
      console.error(`Error: File not found: ${targetFile}`);
      process.exit(1);
    }
    filesToValidate = [targetFile];
  } else if (fromDate || toDate || validateAll) {
    // Validate date range or all
    filesToValidate = findFilesInDateRange(eventsDir, fromDate, toDate);

    if (filesToValidate.length === 0) {
      console.log('No files found in specified date range');
      process.exit(0);
    }
  } else {
    console.error('Error: No file specified and no date range provided');
    console.error('Use --help for usage information');
    process.exit(1);
  }

  console.log('=== Event Validation ===');
  console.log(`Files to validate: ${filesToValidate.length}`);
  console.log('');

  // Validate each file
  for (const file of filesToValidate) {
    console.log(`Validating: ${path.basename(file)}`);
    await validateFile(file);
  }

  // Report results
  console.log('');
  console.log('=== Validation Results ===');
  console.log(`Total events: ${totalEvents}`);
  console.log(`Valid events: ${validEvents}`);
  console.log(`Invalid events: ${invalidEvents}`);
  console.log('');

  if (errors.length > 0) {
    console.log('=== Validation Errors ===');
    errors.forEach(error => {
      console.log(`\nFile: ${error.file}, Line: ${error.line}, ID: ${error.id}`);
      error.issues.forEach(issue => {
        console.log(`  - ${issue}`);
      });
    });
    console.log('');
    process.exit(1);
  } else {
    console.log('✓ All events are valid');
    process.exit(0);
  }
}

main().catch(err => {
  console.error('Validation error:', err);
  process.exit(1);
});
