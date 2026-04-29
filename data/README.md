# Data Folder

World event entity storage for OSINT intelligence gathering. This folder contains event data collected from sources defined in the `source/` directory.

## Purpose

The data folder stores **World Event Entities** in JSONL format with associated media files. Data collection happens continuously from multiple OSINT sources (Twitter, news APIs, RSS feeds, web scraping, etc.) and events are organized by date for efficient querying and automated retention management.

**Key Characteristics:**
- **High Volume**: Thousands of events per day from multiple sources
- **Rolling Window**: Only keeps data from past 90 days (3 months)
- **JSONL Format**: Append-only, line-oriented JSON for streaming and efficiency
- **Media Included**: Images and videos stored alongside event data
- **Source Attribution**: Every event traces back to originating source

## Directory Structure

```
data/
├── README.md              # This file
├── SCHEMA.md             # World Event Entity schema specification
├── manifest.json          # Data collection metadata and statistics
├── .gitignore            # Git exclusions (actual data not versioned)
│
├── events/               # Event data organized by date
│   ├── 2026-04/         # Year-month folders
│   │   ├── 2026-04-01.jsonl    # Daily JSONL files
│   │   ├── 2026-04-02.jsonl
│   │   └── ...
│   ├── 2026-03/
│   └── 2026-02/
│
├── media/                # Downloaded media files
│   ├── 2026-04/
│   │   ├── images/      # Images organized by date
│   │   │   ├── 2026-04-01/
│   │   │   ├── 2026-04-02/
│   │   │   └── ...
│   │   └── videos/      # Videos organized by date
│   │       └── ...
│   ├── 2026-03/
│   └── 2026-02/
│
├── indexes/              # Optional generated indexes
│   ├── by-source.json   # Events grouped by source
│   ├── by-topic.json    # Events grouped by topic
│   ├── by-location.json # Events grouped by location
│   └── stats.json       # Daily/monthly statistics
│
├── scripts/              # Data management utilities
│   ├── cleanup-old-data.sh      # Remove data older than 90 days
│   ├── validate-events.js       # Validate JSONL against schema
│   ├── rebuild-indexes.js       # Regenerate index files
│   ├── stats-report.js          # Generate statistics report
│   └── export-date-range.sh     # Export data for date range
│
└── examples/             # Example data (not actual data)
    ├── 2026-04/
    │   ├── 2026-04-29.jsonl     # Sample events
    │   ├── images/
    │   └── videos/
    └── README.md         # Explains example structure
```

## Data Retention Policy

**Retention Period**: 90 days (3 months)

Data older than 90 days is automatically removed by the cleanup script:
- **Schedule**: Daily at 00:00 UTC
- **Granularity**: Entire month folders removed atomically
- **Safety**: Cleanup waits until day 91+ to ensure 90 days always available
- **Media**: Corresponding media folders removed with events

**Manual cleanup**:
```bash
# Dry run (show what would be deleted)
./data/scripts/cleanup-old-data.sh --dry-run

# Execute cleanup
./data/scripts/cleanup-old-data.sh
```

## File Formats

### JSONL (JSON Lines)

Event data stored as **JSON Lines** - one complete JSON object per line.

**Format**:
```jsonl
{"id":"evt_20260429_001","source":{"name":"Reuters","provider":"news"},"title":"Major Earthquake Strikes Region","summary":"A 7.8 magnitude earthquake...","contents":"## Earthquake Event\n\n### Overview\nDetailed markdown content...","date_published":"2026-04-29T10:30:00Z","date_event":"2026-04-29T10:15:00Z","geo":{"lat":37.27,"lon":37.02,"country":"Turkey"},"links":[{"url":"https://...","label":"Reuters"}],"image_urls":["./media/2026-04/images/2026-04-29/evt_20260429_001_img1.jpg"],"topics":["disaster","earthquake"],"confidence":0.95,"ingested_at":"2026-04-29T10:35:00Z"}
{"id":"evt_20260429_002","source":{"name":"Twitter","provider":"social"},"title":"Political Announcement","summary":"Government announces...","contents":"## Announcement\n\nDetails...","date_published":"2026-04-29T11:00:00Z","links":[],"image_urls":[],"topics":["politics"],"confidence":0.75,"ingested_at":"2026-04-29T11:05:00Z"}
```

**Benefits**:
- **Append-only**: Real-time event streaming without file rewrites
- **Line-oriented**: Use standard Unix tools (grep, awk, sed)
- **Fault-tolerant**: Partial writes only corrupt one line
- **Streaming-friendly**: Process without loading entire file into memory
- **Tool-compatible**: Works with jq, jsonlines libraries, CLI tools

**File Naming**: `YYYY-MM-DD.jsonl` (ISO 8601 date)

**Location**: `data/events/YYYY-MM/YYYY-MM-DD.jsonl`

### Media Files

**Path Pattern**: `media/YYYY-MM/{images|videos}/YYYY-MM-DD/evt_{eventid}_{index}.{ext}`

**Examples**:
```
media/2026-04/images/2026-04-29/evt_20260429_001_img1.jpg
media/2026-04/images/2026-04-29/evt_20260429_001_img2.png
media/2026-04/videos/2026-04-29/evt_20260429_003_vid1.mp4
```

**Linking**: Events reference media using relative paths:
```json
{
  "image_urls": [
    "./media/2026-04/images/2026-04-29/evt_20260429_001_img1.jpg",
    "./media/2026-04/images/2026-04-29/evt_20260429_001_img2.png"
  ]
}
```

**Benefits**:
- **Portable**: Relative paths work if data folder moves
- **Date-aligned**: Media organized same way as events
- **Event-linked**: Filename prefix links to specific event
- **Cleanup-friendly**: Removing month folder removes all associated media

## Usage Examples

### Query Events

```bash
# All events on specific date
cat data/events/2026-04/2026-04-29.jsonl

# Pretty-print with jq
cat data/events/2026-04/2026-04-29.jsonl | jq .

# Count events in a day
wc -l data/events/2026-04/2026-04-29.jsonl

# Search by keyword
grep -i "earthquake" data/events/2026-04/*.jsonl

# Extract specific field
cat data/events/2026-04/2026-04-29.jsonl | jq -r '.title'

# Filter by source
cat data/events/2026-04/2026-04-29.jsonl | jq 'select(.source.name == "Reuters")'

# Events with high confidence
cat data/events/2026-04/2026-04-29.jsonl | jq 'select(.confidence >= 0.9)'

# Events with geo data
cat data/events/2026-04/2026-04-29.jsonl | jq 'select(.geo != null)'
```

### Date Range Queries

```bash
# All events in a month
cat data/events/2026-04/*.jsonl

# All events in date range
cat data/events/2026-04/2026-04-{15..20}.jsonl

# Count total events in month
cat data/events/2026-04/*.jsonl | wc -l

# All events across 3 months
cat data/events/*/*.jsonl
```

### Export Data

```bash
# Export single day
./data/scripts/export-date-range.sh 2026-04-29

# Export date range
./data/scripts/export-date-range.sh 2026-04-01 2026-04-29

# Export with media files
./data/scripts/export-date-range.sh --with-media 2026-04-15 2026-04-20

# Output: Creates ZIP archive with events and media
```

### Validation

```bash
# Validate single file
node data/scripts/validate-events.js data/events/2026-04/2026-04-29.jsonl

# Validate date range
node data/scripts/validate-events.js --from 2026-04-01 --to 2026-04-29

# Validate all events (expensive)
node data/scripts/validate-events.js --all

# Output: Reports invalid events with line numbers and violations
```

### Statistics

```bash
# Generate statistics report
node data/scripts/stats-report.js

# Generate for specific month
node data/scripts/stats-report.js --month 2026-04

# Output formats
node data/scripts/stats-report.js --format json
node data/scripts/stats-report.js --format markdown
```

### Rebuild Indexes

```bash
# Rebuild all indexes
node data/scripts/rebuild-indexes.js

# Rebuild specific index
node data/scripts/rebuild-indexes.js --index by-source

# Indexes generated:
# - indexes/by-source.json
# - indexes/by-topic.json
# - indexes/by-location.json
# - indexes/stats.json
```

## Maintenance

### Daily Automated Tasks

1. **Cleanup** (00:00 UTC)
   - Remove data older than 90 days
   - Update manifest with new date ranges
   - Log cleanup operations

2. **Index Rebuilding** (Optional, 01:00 UTC)
   - Regenerate indexes from JSONL data
   - Update statistics

### Manual Maintenance

**Check data health**:
```bash
# Validate recent data
node data/scripts/validate-events.js --from $(date -d '7 days ago' +%Y-%m-%d)

# Generate statistics
node data/scripts/stats-report.js
```

**Monitor storage**:
```bash
# Check folder sizes
du -sh data/events/ data/media/

# Count events per month
for dir in data/events/*/; do
  month=$(basename "$dir")
  count=$(cat "$dir"/*.jsonl 2>/dev/null | wc -l)
  echo "$month: $count events"
done
```

**Verify manifest accuracy**:
```bash
# Compare manifest statistics with actual data
node data/scripts/stats-report.js --verify-manifest
```

## Scripts Reference

### cleanup-old-data.sh
Remove events and media older than retention period (90 days).

**Usage**:
```bash
./data/scripts/cleanup-old-data.sh [--dry-run]
```

**Options**:
- `--dry-run`: Show what would be deleted without actually deleting

**Cron Setup**:
```bash
# Add to crontab for daily execution at 00:00 UTC
0 0 * * * /path/to/osint/data/scripts/cleanup-old-data.sh
```

### validate-events.js
Validate JSONL files against World Event Entity schema.

**Usage**:
```bash
node data/scripts/validate-events.js [file] [options]
```

**Options**:
- `--from YYYY-MM-DD`: Validate from date
- `--to YYYY-MM-DD`: Validate to date
- `--all`: Validate all events (expensive)

### rebuild-indexes.js
Regenerate index files from JSONL data.

**Usage**:
```bash
node data/scripts/rebuild-indexes.js [--index <name>]
```

**Indexes**:
- `by-source`: Events grouped by source name
- `by-topic`: Events grouped by topics
- `by-location`: Events grouped by country/region
- `stats`: Daily and monthly statistics

### stats-report.js
Generate comprehensive statistics report.

**Usage**:
```bash
node data/scripts/stats-report.js [options]
```

**Options**:
- `--month YYYY-MM`: Report for specific month
- `--format json|markdown`: Output format
- `--verify-manifest`: Compare manifest with actual data

### export-date-range.sh
Export events and media for specified date range.

**Usage**:
```bash
./data/scripts/export-date-range.sh [start] [end] [options]
```

**Options**:
- `--with-media`: Include media files in export
- `--output <path>`: Specify output ZIP file

## Volume Estimates

**Current assumptions** (conservative):
- **Events per day**: 5,000
- **Avg event size**: 400 bytes
- **Daily JSONL**: ~2 MB
- **Monthly JSONL**: ~60 MB
- **3-month JSONL**: ~180 MB

**With media**:
- **Events with images**: 10%
- **Avg images per event**: 2
- **Avg image size**: 3 MB
- **Daily media**: ~3 GB
- **Monthly media**: ~90 GB
- **3-month total**: ~270 GB

**Scalability**:
- JSONL files up to 10 MB process efficiently
- Consider hourly files if exceeding 10k events/day: `YYYY-MM-DD-HH.jsonl`
- Indexes optional but helpful for frequent queries

## Version Control

**Git Strategy**: Structure is versioned, actual data is not.

**Tracked**:
- `data/README.md` (this file)
- `data/SCHEMA.md` (schema reference)
- `data/manifest.json` (metadata template)
- `data/scripts/` (all scripts)
- `data/examples/` (sample data)
- `.gitkeep` files (preserve folder structure)

**Ignored** (see `.gitignore`):
- `data/events/` (except examples)
- `data/media/` (except examples)
- `data/indexes/` (can regenerate)

**Rationale**: Data is ephemeral (90-day window), large (hundreds of GB), and continuously changing.

## Related Documentation

- **Schema**: See [SCHEMA.md](SCHEMA.md) for World Event Entity specification
- **Sources**: See [../source/README.md](../source/README.md) for data collection sources
- **Skills**: See [../skills/word-event-entities/SKILL.md](../skills/world-event-entities/SKILL.md) for entity model
- **Examples**: See [examples/README.md](examples/README.md) for sample data

## Troubleshooting

### Issue: JSONL file corrupt
**Symptom**: `jq` reports parse error
**Solution**: Find corrupt line, remove it, re-ingest event if needed
```bash
# Find corrupt lines
cat file.jsonl | jq -c . >/dev/null
# Remove corrupt line (replace N with line number)
sed -i 'Nd' file.jsonl
```

### Issue: Media file missing
**Symptom**: Event references image that doesn't exist
**Solution**: Check if media was downloaded, update event or re-fetch
```bash
# Find events with missing media
cat data/events/2026-04/2026-04-29.jsonl | jq -r '.image_urls[]' | while read url; do
  [ ! -f "$url" ] && echo "Missing: $url"
done
```

### Issue: Cleanup script not running
**Symptom**: Data older than 90 days still present
**Solution**: Check cron configuration, run manually with `--dry-run`
```bash
# Check cron
crontab -l | grep cleanup-old-data

# Test manually
./data/scripts/cleanup-old-data.sh --dry-run
```

### Issue: Manifest statistics outdated
**Symptom**: Manifest totals don't match actual data
**Solution**: Rebuild statistics
```bash
node data/scripts/stats-report.js --verify-manifest
node data/scripts/rebuild-indexes.js
```

## Future Enhancements

1. **Compression**: Gzip older JSONL files (transparent with `zcat`)
2. **Partitioning**: Hourly files if volume exceeds 10k events/day
3. **Indexes**: Build as query patterns emerge
4. **Archival**: Long-term storage beyond 3 months (separate system)
5. **Deduplication**: Track and handle duplicate events across sources
6. **Backup**: Strategy for backing up critical data before cleanup
7. **Database**: Consider database storage for complex querying needs
