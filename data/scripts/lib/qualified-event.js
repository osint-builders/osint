/** Additional contract for newly qualified events. Historical JSONL uses the baseline validator. */
const { isIP } = require('node:net');
const CATEGORIES = new Set([
  'armed-conflict',
  'geopolitics',
  'defense',
  'electronic-warfare',
  'major-disaster',
  'civil-unrest',
  'maritime-security',
]);
const AUDIENCES = new Set(['united-states', 'allied-forces']);
const GEO_PRECISIONS = new Set(['exact', 'city', 'region', 'country', 'sea-area']);
const IMAGE_ORIGINS = new Set(['article', 'source', 'default']);
const DEFAULT_IMAGE_URL = 'https://osint.builders/favicon.svg';
const CATEGORICAL_CERTAINTY_RE = /\b(?:confirmed|confirms|verified|verifies|corroborated|corroborates)\b/i;
const CONTENT_HEADINGS = [
  'Event',
  'Location and Time',
  'Evidence',
  'Allied Relevance',
  'Confidence and Gaps',
];

function isRemoteUrl(value) {
  if (typeof value !== 'string' || /\s/.test(value)) return false;
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase().replace(/\.$/, '');
    const literalHost = host.replace(/^\[/, '').replace(/\]$/, '');
    return ['http:', 'https:'].includes(url.protocol) &&
      !!host && host.includes('.') &&
      host !== 'localhost' && !host.endsWith('.localhost') &&
      !host.endsWith('.local') && !host.endsWith('.internal') &&
      !isIP(literalHost) && !url.username && !url.password;
  } catch {
    return false;
  }
}

function validateContents(contents, issues) {
  if (typeof contents !== 'string') return;
  const normalized = contents.replace(/\r\n/g, '\n').trim();
  const matches = [...normalized.matchAll(/^## ([^\n]+)$/gm)];
  const headings = matches.map((match) => match[1].trim());
  if (matches.length && matches[0].index !== 0) {
    issues.push("Field 'contents' must begin with the '## Event' heading");
  }
  if (headings.length !== CONTENT_HEADINGS.length ||
      headings.some((heading, index) => heading !== CONTENT_HEADINGS[index])) {
    issues.push(`Field 'contents' must use these H2 sections in order: ${CONTENT_HEADINGS.join(' | ')}`);
  } else {
    for (let index = 0; index < matches.length; index++) {
      const start = matches[index].index + matches[index][0].length;
      const end = index + 1 < matches.length ? matches[index + 1].index : normalized.length;
      if (!normalized.slice(start, end).trim()) {
        issues.push(`Field 'contents' has an empty '${CONTENT_HEADINGS[index]}' section`);
      }
    }
  }
  const prose = normalized.replace(/^## [^\n]+$/gm, '').trim();
  const words = prose ? prose.split(/\s+/).filter(Boolean).length : 0;
  if (words < 100) issues.push(`Field 'contents' must contain at least 100 prose words (found ${words})`);
  if (/<\/?[a-z][^>]*>/i.test(contents) || /&(?:#\d+|[a-z]+);/i.test(contents)) {
    issues.push("Field 'contents' must not contain HTML or HTML entities");
  }
  if (/\b(?:[a-z]+['’](?:s|re|ve|ll|d|m|t)|y['’]all)\b/i.test(contents)) {
    issues.push("Field 'contents' contains an E-PRIME contraction");
  }
}

function validateQualifiedEvent(event) {
  const issues = [];
  if (typeof event.id !== 'string' || !/^evt_\d{15,20}$/.test(event.id)) {
    issues.push("Field 'id' must use the evt_<snowflake> format for newly qualified events");
  }
  const window = event.source_window;
  const utcTimestamp = (value) => typeof value === 'string' &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(value) &&
    Number.isFinite(Date.parse(value));
  if (!window || typeof window !== 'object' ||
      !utcTimestamp(window.start) || !utcTimestamp(window.end) ||
      Date.parse(window.start) >= Date.parse(window.end)) {
    issues.push("Field 'source_window' must contain ordered UTC start and end timestamps");
  } else if (typeof event.date_published === 'string' && Number.isFinite(Date.parse(event.date_published))) {
    const published = Date.parse(event.date_published);
    if (published < Date.parse(window.start) || published > Date.parse(window.end)) {
      issues.push("Field 'date_published' falls outside this tip's source_window");
    }
  }
  if (typeof event.date_event === 'string' &&
      /^\d{4}-\d{2}-\d{2}T00:00:00(?:\.0+)?(?:Z|[+-]00:00)$/i.test(event.date_event)) {
    issues.push("Field 'date_event' must omit a midnight UTC placeholder; include an event time only when the source supplies an exact time");
  }
  if (event.language !== 'en') issues.push("Field 'language' must equal 'en'");
  if (!CATEGORIES.has(event.category)) {
    issues.push(`Field 'category' must be one of: ${[...CATEGORIES].join(', ')}`);
  }
  if (!AUDIENCES.has(event.audience)) {
    issues.push("Field 'audience' must be 'united-states' or 'allied-forces'");
  }
  if (typeof event.allied_relevance !== 'string' || event.allied_relevance.trim().length < 30) {
    issues.push("Field 'allied_relevance' must explain concrete situational-awareness value (at least 30 characters)");
  }
  if (!IMAGE_ORIGINS.has(event.image_origin)) {
    issues.push("Field 'image_origin' must be 'article', 'source', or 'default'");
  }
  if (!Array.isArray(event.image_urls) || !event.image_urls.length ||
      event.image_urls.some((url) => !isRemoteUrl(url))) {
    issues.push("Field 'image_urls' must contain at least one remote HTTP(S) image URL");
  }
  if (Array.isArray(event.image_urls) && event.image_urls.includes(DEFAULT_IMAGE_URL) &&
      event.image_origin !== 'default') {
    issues.push("The default image must use image_origin 'default'");
  }
  if (event.image_origin === 'default' &&
      (!Array.isArray(event.image_urls) || event.image_urls[0] !== DEFAULT_IMAGE_URL)) {
    issues.push("image_origin 'default' requires the approved default image as image_urls[0]");
  }

  if (!Array.isArray(event.links) || !event.links.length ||
      event.links.some((link) => !link || !isRemoteUrl(link.url))) {
    issues.push("Field 'links' must contain at least one remote HTTP(S) source URL");
  }
  if (!event.geo || typeof event.geo !== 'object' || Array.isArray(event.geo)) {
    issues.push("Field 'geo' must name a real event location");
  } else {
    const { lat, lon, location_name: locationName, precision } = event.geo;
    if (!Number.isFinite(lat) || !Number.isFinite(lon) ||
        lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      issues.push("Fields 'geo.lat' and 'geo.lon' must be finite coordinates within valid ranges");
    } else if ((lat === 0 && lon === 0) || (lat === 37.7749 && lon === -122.4194)) {
      issues.push("Field 'geo' cannot use Null Island or the old global fallback point");
    }
    if (typeof locationName !== 'string' || !locationName.trim()) {
      issues.push("Field 'geo.location_name' must name the event location");
    }
    if (!GEO_PRECISIONS.has(precision)) {
      issues.push(`Field 'geo.precision' must be one of: ${[...GEO_PRECISIONS].join(', ')}`);
    }
  }
  for (const field of ['title', 'summary']) {
    const value = event[field];
    if (typeof value === 'string' && (/\r|\n/.test(value) || /<\/?[a-z][^>]*>/i.test(value) || /&(?:#\d+|[a-z]+);/i.test(value))) {
      issues.push(`Field '${field}' must be single-line plain English text without HTML entities`);
    }
  }
  for (const field of ['title', 'summary', 'contents']) {
    const value = event[field];
    const match = typeof value === 'string' && value.match(CATEGORICAL_CERTAINTY_RE);
    if (match) {
      issues.push(`Field '${field}' uses categorical certainty word '${match[0]}'; describe evidence or attribute the claim directly`);
    }
  }
  validateContents(event.contents, issues);
  return issues;
}

module.exports = { validateQualifiedEvent, isRemoteUrl, CONTENT_HEADINGS, CATEGORIES, DEFAULT_IMAGE_URL };
