const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { validateQualifiedEvent, DEFAULT_IMAGE_URL } = require('../lib/qualified-event');

const section = 'A source notice describes vessel traffic changes near a named port. Officials report a closure while crews inspect navigation channels and terminal equipment. The source gives the publication time and a clear geographic context. Allied planners can monitor routing delays without assuming an exact vessel position.';
const contents = [
  'Event', 'Location and Time', 'Evidence', 'Allied Relevance', 'Confidence and Gaps',
].map((heading) => `## ${heading}\n\n${section}`).join('\n\n');

function event() {
  return {
    id: 'evt_12345678901234567',
    source: { name: 'Example Maritime Authority' },
    title: 'Illustrative Port Closure During Regional Storm',
    summary: 'A maritime authority reports a port closure after a storm disrupted vessel traffic.',
    contents,
    date_published: '2026-10-30T18:00:00Z',
    source_window: { start: '2026-10-30T17:00:00Z', end: '2026-10-30T18:00:00Z' },
    links: [{ url: 'https://example.org/port-notice' }],
    image_urls: [DEFAULT_IMAGE_URL],
    image_origin: 'default',
    geo: { lat: 25.7617, lon: -80.1918, location_name: 'Miami, Florida', precision: 'city' },
    language: 'en',
    category: 'maritime-security',
    audience: 'united-states',
    allied_relevance: 'United States maritime planners can adjust routing around the reported closure.',
  };
}

test('qualified contract accepts a complete event', () => {
  assert.deepEqual(validateQualifiedEvent(event()), []);
});

test('schema example follows the qualified contract', () => {
  const schema = fs.readFileSync(path.resolve(__dirname, '..', '..', 'SCHEMA.md'), 'utf8');
  const sample = schema.match(/## Complete Example[\s\S]*?```json\s*([\s\S]*?)```/);
  assert.ok(sample, 'SCHEMA.md must include a JSON example');
  const example = JSON.parse(sample[1]);
  assert.deepEqual(validateQualifiedEvent(example), []);
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'osint-qualified-example-'));
  try {
    const file = path.join(directory, 'example.jsonl');
    fs.writeFileSync(file, `${JSON.stringify(example)}\n`);
    const validator = path.resolve(__dirname, '..', 'validate-events.js');
    const result = spawnSync(process.execPath, [validator, file, '--qualified'], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stdout + result.stderr);
  } finally {
    const prefix = path.join(os.tmpdir(), 'osint-qualified-example-');
    if (directory.startsWith(prefix)) fs.rmSync(directory, { recursive: true, force: true });
  }
});

test('qualified contract rejects missing imagery and a disguised default', () => {
  const missing = event();
  missing.image_urls = [];
  assert.match(validateQualifiedEvent(missing).join(' '), /image_urls/);
  const disguised = event();
  disguised.image_origin = 'article';
  assert.match(validateQualifiedEvent(disguised).join(' '), /default image/);
});

test('qualified contract rejects categorical certainty words in published prose', () => {
  for (const field of ['title', 'summary', 'contents']) {
    for (const word of ['confirmed', 'confirms', 'verified', 'verifies', 'corroborated', 'corroborates']) {
      const invalid = event();
      invalid[field] += ` ${word}`;
      assert.match(validateQualifiedEvent(invalid).join(' '), new RegExp(`Field '${field}' uses categorical certainty word '${word}'`));
    }
  }
});

test('qualified contract rejects local or credentialed image URLs', () => {
  for (const url of [
    'http://localhost/image.jpg',
    'http://127.0.0.1/image.jpg',
    'http://169.254.169.254/latest/meta-data',
    'http://[::1]/image.jpg',
    'http://intranet/image.jpg',
    'https://user:pass@example.org/photo.jpg',
    'https://example.org/photo.jpg\nX-Injected: yes',
  ]) {
    const invalid = event();
    invalid.image_urls = [url];
    invalid.image_origin = 'article';
    assert.match(validateQualifiedEvent(invalid).join(' '), /image_urls/, url);
  }
});

test('qualified contract requires Snowflake IDs while historical mode keeps legacy IDs', () => {
  const invalid = event();
  invalid.id = 'evt_20261030_001';
  assert.match(validateQualifiedEvent(invalid).join(' '), /snowflake/);
});

test('qualified contract rejects meaningless geo and missing declarations', () => {
  const invalid = event();
  invalid.geo = { lat: 0, lon: 0, location_name: 'Unknown', precision: 'exact' };
  invalid.language = 'ru';
  invalid.category = 'general-news';
  assert.match(validateQualifiedEvent(invalid).join(' '), /Null Island/);
  assert.match(validateQualifiedEvent(invalid).join(' '), /language/);
  assert.match(validateQualifiedEvent(invalid).join(' '), /category/);
});

test('qualified contract rejects events outside the original tip window', () => {
  const invalid = event();
  invalid.source_window = { start: '2026-10-30T19:00:00Z', end: '2026-10-30T20:00:00Z' };
  assert.match(validateQualifiedEvent(invalid).join(' '), /outside this tip's source_window/);
  invalid.source_window = { start: '2026-10-30T20:00:00Z', end: '2026-10-30T19:00:00Z' };
  assert.match(validateQualifiedEvent(invalid).join(' '), /ordered UTC/);
});

test('qualified contract enforces evidence-grounded body structure', () => {
  const invalid = event();
  invalid.contents = '## Overview\n\nIt\'s a short <b>report</b>.';
  const issues = validateQualifiedEvent(invalid).join(' ');
  assert.match(issues, /sections in order/);
  assert.match(issues, /100 prose words/);
  assert.match(issues, /HTML/);
  assert.match(issues, /contraction/);
  invalid.contents = `Preface\n\n${contents.replace('A source notice', "A notice doesn't")}`;
  const prefacedIssues = validateQualifiedEvent(invalid).join(' ');
  assert.match(prefacedIssues, /must begin/);
  assert.match(prefacedIssues, /contraction/);
});

test('validator rejects invalid time windows and non-object JSONL records', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'osint-qualified-input-'));
  try {
    const file = path.join(directory, 'invalid.jsonl');
    fs.writeFileSync(file, 'null\n');
    const validator = path.resolve(__dirname, '..', 'validate-events.js');
    const invalidWindow = spawnSync(process.execPath, [validator, file, '--qualified', '--time-window', 'bogus', 'also-bogus'], { encoding: 'utf8' });
    assert.equal(invalidWindow.status, 2);
    assert.match(invalidWindow.stderr, /ordered ISO-8601/);
    const invalidRecord = spawnSync(process.execPath, [validator, file, '--qualified'], { encoding: 'utf8' });
    assert.equal(invalidRecord.status, 1);
    assert.match(invalidRecord.stdout, /Event must be a JSON object/);
  } finally {
    const prefix = path.join(os.tmpdir(), 'osint-qualified-input-');
    if (directory.startsWith(prefix)) fs.rmSync(directory, { recursive: true, force: true });
  }
});

test('historical strict validation stays compatible while --qualified adds the gate', () => {
  const historical = event();
  for (const field of ['source_window', 'language', 'category', 'audience', 'allied_relevance', 'image_origin']) {
    delete historical[field];
  }
  historical.image_urls = [];
  historical.id = 'evt_20261030_001';
  historical.title = 'Confirmed Port Closure During Regional Storm';
  historical.summary = 'Officials verified a port closure after a storm disrupted vessel traffic.';
  delete historical.geo.location_name;
  delete historical.geo.precision;
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'osint-qualified-test-'));
  try {
    const file = path.join(directory, 'historical.jsonl');
    fs.writeFileSync(file, `${JSON.stringify(historical)}\n`);
    const validator = path.resolve(__dirname, '..', 'validate-events.js');
    const strict = spawnSync(process.execPath, [validator, file, '--strict'], { encoding: 'utf8' });
    const qualified = spawnSync(process.execPath, [validator, file, '--qualified'], { encoding: 'utf8' });
    assert.equal(strict.status, 0, strict.stdout + strict.stderr);
    assert.equal(qualified.status, 1, qualified.stdout + qualified.stderr);
    assert.match(qualified.stdout, /image_urls/);
    assert.match(qualified.stdout, /categorical certainty word/);
  } finally {
    const prefix = path.join(os.tmpdir(), 'osint-qualified-test-');
    if (directory.startsWith(prefix)) fs.rmSync(directory, { recursive: true, force: true });
  }
});
