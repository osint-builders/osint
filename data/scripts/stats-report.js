#!/usr/bin/env node

/**
 * stats-report.js
 * Generate comprehensive statistics report from event data
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync } = require('child_process');

const EVENTS_DIR = path.join(__dirname, '../events');
const MEDIA_DIR = path.join(__dirname, '../media');

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
            console.warn(`Skipping invalid JSON in ${monthDir}/${file}`);
          }
        }
      }
    }
  }

  return events;
}

function calculateStats(events) {
  // By source
  const bySource = {};
  events.forEach(evt => {
    const sourceId = evt.source?.id || 'unknown';
    bySource[sourceId] = (bySource[sourceId] || 0) + 1;
  });

  // By topic (top 20)
  const byTopic = {};
  events.forEach(evt => {
    (evt.topics || []).forEach(topic => {
      byTopic[topic] = (byTopic[topic] || 0) + 1;
    });
  });
  const topTopics = Object.entries(byTopic)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([topic, count]) => ({ topic, count }));

  // By country (top 20)
  const byCountry = {};
  events.forEach(evt => {
    const country = evt.geo?.country;
    if (country) {
      byCountry[country] = (byCountry[country] || 0) + 1;
    }
  });
  const topCountries = Object.entries(byCountry)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([country, count]) => ({ country, count }));

  // By date
  const byDate = {};
  events.forEach(evt => {
    const date = evt.date_published?.slice(0, 10);
    if (date) {
      byDate[date] = (byDate[date] || 0) + 1;
    }
  });

  // By month
  const byMonth = {};
  events.forEach(evt => {
    const month = evt.date_published?.slice(0, 7);
    if (month) {
      byMonth[month] = (byMonth[month] || 0) + 1;
    }
  });

  // Media files
  let imageCount = 0;
  let videoCount = 0;
  events.forEach(evt => {
    imageCount += (evt.image_urls || []).length;
    videoCount += (evt.video_urls || []).length;
  });

  // Storage size
  let totalSizeMB = 0;
  try {
    const duOutput = execSync(`du -sm "${EVENTS_DIR}"`, { encoding: 'utf-8' });
    totalSizeMB = parseInt(duOutput.split('\t')[0]);
  } catch (err) {
    // Ignore if du command fails
  }

  // Confidence scores
  let totalConfidence = 0;
  let confidenceCount = 0;
  events.forEach(evt => {
    if (evt.confidence_score != null) {
      totalConfidence += evt.confidence_score;
      confidenceCount++;
    }
  });

  return {
    total_events: events.length,
    by_source: bySource,
    top_topics: topTopics,
    top_countries: topCountries,
    by_date: byDate,
    by_month: byMonth,
    media: {
      images: imageCount,
      videos: videoCount
    },
    storage_mb: totalSizeMB,
    average_confidence: confidenceCount > 0 ? (totalConfidence / confidenceCount).toFixed(2) : null
  };
}

function formatMarkdown(stats) {
  let md = '# OSINT Data Statistics\n\n';
  md += `**Total Events**: ${stats.total_events}\n\n`;

  md += `## Events by Month\n\n`;
  Object.entries(stats.by_month)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .forEach(([month, count]) => {
      md += `- ${month}: ${count} events\n`;
    });

  md += `\n## Top 20 Topics\n\n`;
  stats.top_topics.forEach(({ topic, count }) => {
    md += `- ${topic}: ${count}\n`;
  });

  md += `\n## Top 20 Countries\n\n`;
  stats.top_countries.forEach(({ country, count }) => {
    md += `- ${country}: ${count}\n`;
  });

  md += `\n## Media Files\n\n`;
  md += `- Images: ${stats.media.images}\n`;
  md += `- Videos: ${stats.media.videos}\n`;

  md += `\n## Storage\n\n`;
  md += `- Total size: ${stats.storage_mb} MB\n`;

  if (stats.average_confidence) {
    md += `\n## Quality\n\n`;
    md += `- Average confidence score: ${stats.average_confidence}\n`;
  }

  return md;
}

async function main() {
  console.log('=== Generating Statistics Report ===\n');

  const events = await readAllEvents();
  console.log(`Loaded ${events.length} events\n`);

  const stats = calculateStats(events);

  // Output format (default JSON)
  const format = process.argv.includes('--format=markdown') ? 'markdown' : 'json';

  if (format === 'markdown') {
    console.log(formatMarkdown(stats));
  } else {
    console.log(JSON.stringify(stats, null, 2));
  }
}

main().catch(err => {
  console.error('Error generating stats:', err);
  process.exit(1);
});
