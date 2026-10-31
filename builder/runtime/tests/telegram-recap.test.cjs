const assert = require('node:assert/strict');
const test = require('node:test');
const {
  telegramPostUrl,
  extractTelegramPostText,
  classifyTelegramText,
  checkTelegramRecap,
} = require('../telegram-recap.cjs');

const recap = 'Earlier today, Israeli aircraft bombarded a phone charging point in the Turkish Abattoir area, west of Khan Younis in the southern Gaza Strip, injuring 14 Palestinians, mostly children.';
const development = 'After detonating two homes in the area, Israeli occupation forces renewed the forced evacuation of hundreds of families in a Hebron neighborhood as a prolonged form of collective punishment. Israeli soldiers were documented detaining Palestinians near the area after forcibly displacing their families.';

function embed(channel, id, text) {
  return `<div class="tgme_widget_message" data-post="${channel}/${id}">` +
    `<div class="tgme_widget_message_text js-message_text" dir="auto">${text}</div></div>`;
}

function mockFetch(html) {
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url, options });
    return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } });
  };
  return { calls, fetchImpl };
}

test('accepts only a public Telegram post URL', () => {
  assert.deepEqual(telegramPostUrl('https://t.me/s/QudsNen/243851'), {
    channel: 'QudsNen', id: '243851', embedUrl: 'https://t.me/QudsNen/243851?embed=1',
  });
  for (const url of [
    'http://t.me/QudsNen/243851',
    'https://t.me.evil.example/QudsNen/243851',
    'https://user:password@t.me/QudsNen/243851',
    'https://t.me/QudsNen',
  ]) assert.equal(telegramPostUrl(url), null);
});

test('extracts only requested post text, including HTML entities', () => {
  const post = telegramPostUrl('https://t.me/QudsNen/243851');
  const html = embed('QudsNen', '243850', 'Different post') +
    embed('QudsNen', '243851', 'Earlier today, <b>14</b> were injured &amp; evacuated.<br>Details follow.');
  assert.equal(extractTelegramPostText(html, post),
    'Earlier today, 14 were injured & evacuated. Details follow.');
  assert.throws(() => extractTelegramPostText(html, { ...post, id: '999999' }), /requested post/);
});

test('rejects the Quds 243851 recap based on the fetched text, regardless of event metadata', async () => {
  const { calls, fetchImpl } = mockFetch(embed('QudsNen', '243851', recap));
  const event = {
    original_report: { url: 'https://t.me/QudsNen/243851' },
    newDevelopment: true,
    summary: 'New strike confirmed',
  };
  assert.deepEqual(await checkTelegramRecap(event, fetchImpl), {
    reject: true, reason: 'retrospective wording: Earlier today',
  });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://t.me/QudsNen/243851?embed=1');
  assert.equal(calls[0].options.redirect, 'error');
});

test('does not reject the Quds 243854 post: it reports a renewed evacuation', async () => {
  const { fetchImpl } = mockFetch(embed('QudsNen', '243854', development));
  assert.equal((await checkTelegramRecap({
    original_report: { url: 'https://t.me/QudsNen/243854' },
  }, fetchImpl)).reject, false);
});

test('allows an explicit newer outcome described in the source post itself', () => {
  assert.equal(classifyTelegramText(
    'Earlier today, a strike injured three people. Update: the injury count has risen to five.'
  ).reject, false);
  assert.equal(classifyTelegramText(
    'Earlier today, a strike injured three people. Officials now say three were injured.'
  ).reject, true);
  assert.equal(classifyTelegramText(
    'Today, a new strike injured three people near the site of yesterday\'s fighting.'
  ).reject, false);
});

test('rejects failed or oversized Telegram responses instead of treating them as fresh', async () => {
  const event = { original_report: { url: 'https://t.me/QudsNen/243851' } };
  await assert.rejects(checkTelegramRecap(event, async () =>
    new Response('unavailable', { status: 503, headers: { 'content-type': 'text/html' } })), /503/);
  await assert.rejects(checkTelegramRecap(event, async () =>
    new Response('a'.repeat(512 * 1024 + 1), { headers: { 'content-type': 'text/html' } })), /size limit/);
});
