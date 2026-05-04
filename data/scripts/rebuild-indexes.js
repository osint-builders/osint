#!/usr/bin/env node

/**
 * rebuild-indexes.js
 * Regenerate index files from JSONL event data
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const EVENTS_DIR = path.join(__dirname, '../events');
const INDEXES_DIR = path.join(__dirname, '../indexes');
const DATA_DIR = path.join(__dirname, '..');

// ── Topic normalization (mirrors normalize-topics.py rules) ──────────────────
function normalizeTopic(raw) {
  let t = raw.trim().toLowerCase();
  t = t.replace(/[ _]+/g, '-');          // spaces/underscores → hyphens
  t = t.replace(/[^a-z0-9-]/g, '');      // keep only a-z 0-9 hyphen
  t = t.replace(/-{2,}/g, '-');           // collapse multiple hyphens
  t = t.replace(/^-|-$/g, '');           // strip leading/trailing hyphens
  if (t.length < 2 || /^\d+$/.test(t)) return null;
  // Simple singularization: strip trailing 's' unless it changes meaning badly
  // (full inflect library runs in Python; JS does a conservative subset)
  if (t.endsWith('ies') && t.length > 4) t = t.slice(0, -3) + 'y';
  else if (t.endsWith('sses') || t.endsWith('xes') || t.endsWith('zes')) t = t.slice(0, -2);
  else if (t.endsWith('s') && !t.endsWith('ss') && !t.endsWith('us') && t.length > 3) t = t.slice(0, -1);
  return t || null;
}

function normalizeTopics(topics) {
  const seen = new Set();
  const result = [];
  for (const raw of (topics || [])) {
    const norm = normalizeTopic(String(raw));
    if (norm && !seen.has(norm)) { seen.add(norm); result.push(norm); }
  }
  return result;
}

async function readAllEvents() {
  const events = [];
  const monthDirs = fs.readdirSync(EVENTS_DIR).filter(d => d.match(/^\d{4}-\d{2}$/));

  for (const monthDir of monthDirs) {
    const monthPath = path.join(EVENTS_DIR, monthDir);
    const jsonlFiles = fs.readdirSync(monthPath).filter(f => f.endsWith('.jsonl'));

    for (const file of jsonlFiles) {
      const filePath = path.join(monthPath, file);
      const fileStream = fs.createReadStream(filePath);
      const rl = readline.createInterface({ input: fileStream });

      for await (const line of rl) {
        if (line.trim()) {
          try {
            events.push(JSON.parse(line));
          } catch (err) {
            console.warn(`Skipping invalid JSON in ${monthDir}/${file}: ${err.message}`);
          }
        }
      }
    }
  }

  return events;
}

function buildBySourceIndex(events) {
  const bySource = {};
  events.forEach(evt => {
    const sourceId = evt.source?.id || 'unknown';
    if (!bySource[sourceId]) {
      bySource[sourceId] = {
        source_id: sourceId,
        source_name: evt.source?.name || 'Unknown',
        count: 0,
        earliest_date: null,
        latest_date: null
      };
    }
    bySource[sourceId].count++;
    const date = evt.date_published;
    if (!bySource[sourceId].earliest_date || date < bySource[sourceId].earliest_date) {
      bySource[sourceId].earliest_date = date;
    }
    if (!bySource[sourceId].latest_date || date > bySource[sourceId].latest_date) {
      bySource[sourceId].latest_date = date;
    }
  });
  return Object.values(bySource);
}

function buildByTopicIndex(events) {
  const byTopic = {};
  events.forEach(evt => {
    // Normalize topics inline so indexes always reflect clean data
    normalizeTopics(evt.topics || []).forEach(topic => {
      if (!byTopic[topic]) byTopic[topic] = { topic, count: 0 };
      byTopic[topic].count++;
    });
  });
  return Object.values(byTopic).sort((a, b) => b.count - a.count);
}

function buildByLocationIndex(events) {
  const byLocation = {};
  events.forEach(evt => {
    const country = evt.geo?.country;
    if (country) {
      if (!byLocation[country]) {
        byLocation[country] = { country, count: 0 };
      }
      byLocation[country].count++;
    }
  });
  return Object.values(byLocation).sort((a, b) => b.count - a.count);
}

function buildStatsIndex(events) {
  const byDate = {};
  const byMonth = {};
  let totalConfidence = 0;
  let confidenceCount = 0;

  events.forEach(evt => {
    const date = evt.date_published?.slice(0, 10);
    const month = date?.slice(0, 7);

    if (date) {
      byDate[date] = (byDate[date] || 0) + 1;
    }
    if (month) {
      byMonth[month] = (byMonth[month] || 0) + 1;
    }

    if (evt.confidence_score != null) {
      totalConfidence += evt.confidence_score;
      confidenceCount++;
    }
  });

  return {
    total_events: events.length,
    by_date: byDate,
    by_month: byMonth,
    average_confidence: confidenceCount > 0 ? totalConfidence / confidenceCount : null,
    last_updated: new Date().toISOString()
  };
}

async function main() {
  console.log('=== Rebuilding Indexes ===\n');

  console.log('Reading all events...');
  const events = await readAllEvents();
  console.log(`Loaded ${events.length} events\n`);

  if (!fs.existsSync(INDEXES_DIR)) fs.mkdirSync(INDEXES_DIR, { recursive: true });

  console.log('Building by-source index...');
  const bySource = buildBySourceIndex(events);
  fs.writeFileSync(path.join(INDEXES_DIR, 'by-source.json'), JSON.stringify(bySource, null, 2));

  console.log('Building by-topic index...');
  const byTopic = buildByTopicIndex(events);
  fs.writeFileSync(path.join(INDEXES_DIR, 'by-topic.json'), JSON.stringify(byTopic, null, 2));

  console.log('Building by-location index...');
  const byLocation = buildByLocationIndex(events);
  fs.writeFileSync(path.join(INDEXES_DIR, 'by-location.json'), JSON.stringify(byLocation, null, 2));

  // Build unified stats and write ONLY to data/stats.json (single source of truth).
  // Also write data/indexes/stats.json as a backward-compat alias.
  console.log('Building unified stats...');
  const baseStats = buildStatsIndex(events);

  const dates = events.map(e => e.date_published).filter(Boolean).sort();
  const bySourceMap = {};
  events.forEach(e => {
    const n = e.source?.name || e.source_name || 'Unknown';
    bySourceMap[n] = (bySourceMap[n] || 0) + 1;
  });
  const mediaImages = events.reduce((n, e) => n + (e.image_urls?.length || 0), 0);

  const unified = {
    last_updated: new Date().toISOString(),
    data_range: {
      oldest_date: dates[0]?.slice(0, 10) || null,
      newest_date: dates[dates.length - 1]?.slice(0, 10) || null
    },
    statistics: {
      total_events: events.length,
      events_by_month: baseStats.by_month,
      events_by_source: bySourceMap,
      media_files: { images: mediaImages, videos: 0 }
    },
    // Extended fields
    by_date: baseStats.by_date,
    average_confidence: baseStats.average_confidence
  };

  fs.writeFileSync(path.join(DATA_DIR, 'stats.json'), JSON.stringify(unified, null, 2));
  // Keep indexes/stats.json as an alias for backward compat
  fs.writeFileSync(path.join(INDEXES_DIR, 'stats.json'), JSON.stringify(unified, null, 2));

  console.log('\nIndexes rebuilt successfully:');
  console.log(`  by-source.json (${bySource.length} sources)`);
  console.log(`  by-topic.json  (${byTopic.length} unique topics — was 1684)`);
  console.log(`  by-location.json (${byLocation.length} countries)`);
  console.log(`  data/stats.json (unified — ${events.length} events)`);
}

main().catch(err => {
  console.error('Error rebuilding indexes:', err);
  process.exit(1);
});
