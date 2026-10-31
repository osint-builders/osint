const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const script = path.join(__dirname, '..', 'scripts', 'verify-event-ids.js');

function fixture(run) {
  const prefix = path.join(os.tmpdir(), 'osint-event-ids-');
  const root = fs.mkdtempSync(prefix);
  try {
    run(root);
  } finally {
    if (!root.startsWith(prefix)) throw new Error('Unexpected test cleanup path');
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function day(root, date, lines) {
  const directory = path.join(root, date.slice(0, 7));
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, `${date}.jsonl`), `${lines.join('\n')}\n`);
}

function verify(root) {
  return spawnSync(process.execPath, [script, root], { encoding: 'utf8' });
}

test('accepts distinct IDs across separate day files', () => fixture((root) => {
  day(root, '2026-08-01', ['{"id":"evt_1"}', '{"id":"evt_2"}']);
  day(root, '2026-09-01', ['{"id":"evt_3"}']);
  const result = verify(root);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /3 rows in 2 files, 3 unique nonempty IDs/);
}));

test('rejects cross-file duplicate IDs and empty IDs with locations', () => fixture((root) => {
  day(root, '2026-08-01', ['{"id":"evt_1"}']);
  day(root, '2026-09-01', ['{"id":"evt_1"}', '{"id":""}']);
  const result = verify(root);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /1 duplicate groups \(1 extra rows\), 1 missing IDs/);
  assert.match(result.stderr, /2026-08[\\/]2026-08-01\.jsonl:1 and 2026-09[\\/]2026-09-01\.jsonl:1/);
  assert.match(result.stderr, /Missing ID: 2026-09[\\/]2026-09-01\.jsonl:2/);
}));

test('rejects malformed JSON without hiding later rows', () => fixture((root) => {
  day(root, '2026-08-01', ['{bad JSON', '{"id":"evt_2"}']);
  const result = verify(root);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /1 unique nonempty IDs/);
  assert.match(result.stderr, /Malformed JSON: 2026-08[\\/]2026-08-01\.jsonl:1/);
}));
