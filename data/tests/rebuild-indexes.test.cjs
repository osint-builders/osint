const assert = require('node:assert/strict');
const test = require('node:test');
const { buildBySourceIndex } = require('../scripts/rebuild-indexes.js');

test('source index keeps name-only events from different sources distinct', () => {
  const events = [
    { source: { name: 'First Source' }, date_published: '2026-10-30T01:00:00Z' },
    { source: { name: 'Second Source' }, date_published: '2026-10-30T02:00:00Z' },
    { source: { name: 'First Source' }, date_published: '2026-10-31T01:00:00Z' },
  ];
  const rows = buildBySourceIndex(events, new Map([['First Source', 'first-source']]));
  assert.deepEqual(rows.map(row => [row.source_id, row.count]), [
    ['first-source', 2],
    ['name:Second Source', 1],
  ]);
});

test('ambiguous historical source names do not inherit the wrong manifest ID', () => {
  const rows = buildBySourceIndex([
    { source: { name: 'Shared Name' }, date_published: '2026-10-30T01:00:00Z' },
    { source: { id: 'telegram-shared', name: 'Shared Name' }, date_published: '2026-10-30T02:00:00Z' },
  ], new Map([['Shared Name', null]]));
  assert.deepEqual(rows.map(row => [row.source_id, row.count]), [
    ['name:Shared Name', 1],
    ['telegram-shared', 1],
  ]);
});
