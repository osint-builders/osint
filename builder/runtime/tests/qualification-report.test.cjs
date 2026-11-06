const { test } = require('node:test');
const assert = require('node:assert/strict');
const { renderReport } = require('../qualification-report.cjs');

test('reports each decision and missing candidates without exposing free text', () => {
  const report = renderReport([
    'telegram-clashreport\t1\tSTALE',
    'telegram-clashreport\t2\tQUALIFIED',
    'telegram-clashreport\t2\tFETCH_FAILED',
    'https://example.org/private?token=secret\t3\tOTHER',
    'twitter-foo\t1\tBAD: secret',
    'unknown-but-valid\t1\tOTHER',
  ].join('\n'), 4, new Set(['telegram-clashreport']));

  assert.match(report, /expected=4 recorded=2 unreported=2 invalid=4/);
  assert.match(report, /telegram-clashreport 1=STALE 2=QUALIFIED/);
  assert.doesNotMatch(report, /secret|https:\/\//);
});

test('bounds a large batch report', () => {
  const input = Array.from({ length: 100 }, (_, index) =>
    `source-${String(index).padStart(3, '0')}\t1\tOFF_TOPIC`
  ).join('\n');
  const allowed = new Set(Array.from({ length: 100 }, (_, index) =>
    `source-${String(index).padStart(3, '0')}`
  ));
  const report = renderReport(input, 100, allowed);
  assert.ok(report.length <= 3000);
  assert.match(report, /omitted=\d+ tip\(s\)/);
});
