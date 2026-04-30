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
    (evt.topics || []).forEach(topic => {
      if (!byTopic[topic]) {
        byTopic[topic] = { topic, count: 0 };
      }
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

  if (!fs.existsSync(INDEXES_DIR)) {
    fs.mkdirSync(INDEXES_DIR, { recursive: true });
  }

  console.log('Building by-source index...');
  const bySource = buildBySourceIndex(events);
  fs.writeFileSync(
    path.join(INDEXES_DIR, 'by-source.json'),
    JSON.stringify(bySource, null, 2)
  );

  console.log('Building by-topic index...');
  const byTopic = buildByTopicIndex(events);
  fs.writeFileSync(
    path.join(INDEXES_DIR, 'by-topic.json'),
    JSON.stringify(byTopic, null, 2)
  );

  console.log('Building by-location index...');
  const byLocation = buildByLocationIndex(events);
  fs.writeFileSync(
    path.join(INDEXES_DIR, 'by-location.json'),
    JSON.stringify(byLocation, null, 2)
  );

  console.log('Building stats index...');
  const stats = buildStatsIndex(events);
  fs.writeFileSync(
    path.join(INDEXES_DIR, 'stats.json'),
    JSON.stringify(stats, null, 2)
  );

  console.log('\nIndexes rebuilt successfully:');
  console.log(`  - by-source.json (${bySource.length} sources)`);
  console.log(`  - by-topic.json (${byTopic.length} topics)`);
  console.log(`  - by-location.json (${byLocation.length} countries)`);
  console.log(`  - stats.json`);
}

main().catch(err => {
  console.error('Error rebuilding indexes:', err);
  process.exit(1);
});
