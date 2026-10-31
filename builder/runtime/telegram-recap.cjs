#!/usr/bin/env node
// Reject clearly retrospective Telegram posts before candidate enrichment.
// This checks the post itself; it does not search a channel's history or infer
// whether earlier reporting exists when no retrospective wording is present.
const fs = require('node:fs');

const MAX_HTML_BYTES = 512 * 1024;
const FETCH_TIMEOUT_MS = 8000;
const RETROSPECTIVE = /^(earlier today|earlier this (?:morning|afternoon|evening)|yesterday|last night|previously reported)\b/i;
const FRESH_MARKER = /\b(?:now|since then|later)\b|\b(?:update|breaking)\s*:/i;
const NEW_DEVELOPMENT = /\b(?:rose|risen|increas(?:ed|es)|climb(?:ed|s)|additional|another|second|renewed|resumed|new (?:strike|attack|evacuation)|fresh (?:strike|attack))\b/i;

function telegramPostUrl(value) {
  let url;
  try { url = new URL(value); } catch { return null; }
  if (url.protocol !== 'https:' || !['t.me', 'www.t.me'].includes(url.hostname) ||
      url.username || url.password || url.port) return null;
  const match = url.pathname.match(/^\/(?:s\/)?([A-Za-z0-9_]{5,32})\/([1-9]\d*)\/?$/);
  if (!match) return null;
  return {
    channel: match[1],
    id: match[2],
    embedUrl: `https://t.me/${match[1]}/${match[2]}?embed=1`,
  };
}

function decodeEntities(value) {
  return value.replace(/&(#(?:x[0-9a-f]+|\d+)|amp|lt|gt|quot|apos|nbsp);/gi, (whole, entity) => {
    const named = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
    if (entity[0] !== '#') return named[entity.toLowerCase()] ?? whole;
    const radix = entity[1].toLowerCase() === 'x' ? 16 : 10;
    const number = Number.parseInt(entity.slice(radix === 16 ? 2 : 1), radix);
    return Number.isInteger(number) && number >= 0 && number <= 0x10ffff
      ? String.fromCodePoint(number) : whole;
  });
}

function extractTelegramPostText(html, post) {
  // The embed endpoint contains one requested post. Still verify its ID so a
  // challenge or channel landing page cannot masquerade as the target post.
  const markers = [...html.matchAll(/<div\b[^>]*\bdata-post=["']([^"']+)["'][^>]*>/gi)];
  const marker = markers.find((match) => match[1].toLowerCase() === `${post.channel}/${post.id}`.toLowerCase());
  if (!marker) throw new Error('Telegram did not return the requested post');
  const nextMarker = markers.find((match) => match.index > marker.index);
  const section = html.slice(marker.index, nextMarker?.index ?? html.length);
  const textMatch = section.match(/<div\b[^>]*\bclass="[^"]*\btgme_widget_message_text\b[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
  if (!textMatch) throw new Error('Telegram post has no extractable text');
  return decodeEntities(textMatch[1]
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ').trim();
}

function classifyTelegramText(text) {
  const opening = text.normalize('NFKC').trim()
    .replace(/^[\p{P}\p{S}\s]+/gu, '')
    .replace(/^breaking\s*[|:-]\s*/i, '');
  const retrospective = RETROSPECTIVE.exec(opening);
  if (!retrospective) return { reject: false, reason: 'no explicit retrospective wording' };
  // Only wording in the fetched post can establish a new development. A field
  // supplied by an LLM is intentionally ignored.
  const laterText = opening.slice(retrospective[0].length);
  if (FRESH_MARKER.test(laterText) && NEW_DEVELOPMENT.test(laterText)) {
    return { reject: false, reason: 'post describes a specific later development' };
  }
  return { reject: true, reason: `retrospective wording: ${retrospective[0]}` };
}

async function fetchBoundedHtml(url, fetchImpl = fetch) {
  const response = await fetchImpl(url, {
    redirect: 'error',
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: { accept: 'text/html' },
  });
  if (!response.ok) throw new Error(`Telegram returned HTTP ${response.status}`);
  if (!response.headers.get('content-type')?.toLowerCase().includes('text/html')) {
    throw new Error('Telegram returned a non-HTML response');
  }
  if (!response.body) throw new Error('Telegram returned an empty response');
  const chunks = [];
  let bytes = 0;
  const reader = response.body.getReader();
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_HTML_BYTES) throw new Error('Telegram response exceeds size limit');
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(chunks).toString('utf8');
}

async function checkTelegramRecap(event, fetchImpl = fetch) {
  const url = event?.original_report?.url;
  if (typeof url !== 'string') throw new Error('missing original_report.url');
  const post = telegramPostUrl(url);
  if (!post) return { reject: false, reason: 'not a public Telegram post' };
  const html = await fetchBoundedHtml(post.embedUrl, fetchImpl);
  return classifyTelegramText(extractTelegramPostText(html, post));
}

async function main() {
  try {
    const raw = fs.readFileSync(0, 'utf8');
    if (Buffer.byteLength(raw) > 1024 * 1024) throw new Error('event JSON exceeds size limit');
    const result = await checkTelegramRecap(JSON.parse(raw));
    if (result.reject) {
      console.error(`REJECT: Telegram original report uses ${result.reason}`);
      process.exitCode = 1;
    }
  } catch (error) {
    console.error(`REJECT: Telegram recap check failed: ${error.message}`);
    process.exitCode = 1;
  }
}

if (require.main === module) main();

module.exports = { telegramPostUrl, extractTelegramPostText, classifyTelegramText, checkTelegramRecap };
