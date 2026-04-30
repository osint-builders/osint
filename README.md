# OSINT Data Collector

Automated intelligence gathering system that collects, structures, and archives world event data from multiple OSINT sources. Runs hourly via GitHub Actions using AI agents to transform raw intelligence into structured World Event Entities stored as JSONL with 90-day retention.

**Key Capabilities**:
- **Automated Collection**: Hourly GitHub Actions workflow triggering Warp cloud agents via `oz-agent-sdk`
- **Multi-Source**: Twitter, news websites, APIs, RSS feeds, email digests, webhooks
- **Structured Output**: World Event Entities following strict schema with Markdown content
- **E-PRIME Enforcement**: Objective, precise language without "to be" verbs
- **Persistent Learning**: remember-as-you-go pattern improves collection over time
- **Data Retention**: 90-day rolling window with JSONL storage and media archival

**Architecture**: GitHub Actions → `builder/` (oz-agent-sdk) → Warp Cloud Agent → Skills (agent-browser, perplexity-search, data-to-markdown) → World Event Entities → Data Folder (JSONL + Media)

---

## Quick Start

```bash
# Clone repository
git clone https://github.com/your-org/osint.git
cd osint

# Install builder dependencies
cd builder && npm install && cd ..

# Configure environment variables
export WARP_API_KEY="your-warp-api-key"
export WARP_ENVIRONMENT_ID="your-warp-environment-uid"

# View current sources
cat source/manifest.json | jq '.sources'

# Run collection manually
cd builder && npm run collect

# View collected data (after first run)
cat data/events/$(date +%Y-%m)/$(date +%Y-%m-%d).jsonl | jq .

# Validate data format
node data/scripts/validate-events.js --from $(date +%Y-%m-%d)
```

See [Local Development](#local-development) for manual collection workflow.

---

## GitHub Actions Status

![Hourly Collection](https://github.com/osint-builders/osint/actions/workflows/hourly-collection.yml/badge.svg)
![Data Release](https://github.com/osint-builders/osint/actions/workflows/create-release.yml/badge.svg)

**Automation**: Collection runs hourly via GitHub Actions. The `builder/index.ts` script (using `oz-agent-sdk`) spawns a Warp cloud agent that executes the instructions below, collecting events from active sources.

**Workflows**:
- **Hourly Collection** (`.github/workflows/hourly-collection.yml`): Runs every hour, collects events, commits to data/
- **Data Release** (`.github/workflows/create-release.yml`): Weekly releases with archived data

**Configuration**: See [.github/workflows/README.md](.github/workflows/README.md) for secrets, permissions, and troubleshooting.

---

## Automation Instructions

**AUDIENCE**: AI agents (Claude Code) executing in GitHub Actions  
**CONTEXT**: Hourly automated run, Node.js 18+, Docker, Git repository  
**GOAL**: Collect world events from active sources, structure as World Event Entities, save to data folder, commit results

### Prerequisites Validation

Before execution, verify:

1. **Directory Structure Exists**:
   ```bash
   test -d source/sources || exit 1
   test -f source/manifest.json || exit 1
   test -d data/events || exit 1
   test -f data/SCHEMA.md || exit 1
   test -d skills || exit 1
   ```

2. **Environment Variables Set** (configured in the Warp cloud environment):
   ```bash
   test -n "$ANTHROPIC_API_KEY" || { echo "ANTHROPIC_API_KEY required"; exit 1; }
   # TWITTER_BEARER_TOKEN, PERPLEXITY_API_KEY optional depending on sources
   ```

3. **CLI Tools Available**:
   ```bash
   command -v node >/dev/null 2>&1 || exit 1
   command -v git >/dev/null 2>&1 || exit 1
   command -v jq >/dev/null 2>&1 || exit 1
   ```

4. **Git Configuration**:
   ```bash
   git config user.name >/dev/null 2>&1 || git config user.name "OSINT Collector Bot"
   git config user.email >/dev/null 2>&1 || git config user.email "osint-bot@github-actions"
   ```

### Execution Workflow

#### Step 1: Load Active Sources from Manifest

```bash
# Set repository root (GitHub Actions provides this as GITHUB_WORKSPACE)
REPO_ROOT="${REPO_ROOT:-$(pwd)}"
cd "$REPO_ROOT"

# Load active sources from manifest
SOURCES=$(node -e "
  const manifest = require('./source/manifest.json');
  const active = manifest.sources.filter(s => s.status === 'active');
  if (active.length === 0) {
    console.log('[]');
    process.exit(0);
  }
  console.log(JSON.stringify(active, null, 2));
")

# Count active sources
SOURCE_COUNT=$(echo "$SOURCES" | jq 'length')

echo "Found $SOURCE_COUNT active source(s)"

# Exit gracefully if no active sources
if [ "$SOURCE_COUNT" -eq 0 ]; then
  echo "No active sources to process. Exiting successfully."
  exit 0
fi
```

**Output**: JSON array of active sources or empty array if none active.

#### Step 2: Create Temporary Work Directory

```bash
# Create timestamped work directory
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
WORK_DIR="/tmp/osint-collection-$TIMESTAMP"

mkdir -p "$WORK_DIR"
echo "Work directory: $WORK_DIR"

# Create subdirectories
mkdir -p "$WORK_DIR/raw"
mkdir -p "$WORK_DIR/media/images"
mkdir -p "$WORK_DIR/media/videos"
```

**Purpose**: Isolate collection work from repository, enable atomic operations, facilitate cleanup.

#### Step 3: Process Each Source Sequentially

**CRITICAL**: Process sources ONE AT A TIME (not parallel) to manage rate limits and memory.

```bash
# Ensure memory file exists
touch "$REPO_ROOT/memory.md"

# Process each source
echo "$SOURCES" | jq -c '.[]' | while read -r source; do
  SOURCE_ID=$(echo "$source" | jq -r '.id')
  SOURCE_FILE=$(echo "$source" | jq -r '.file')
  SOURCE_NAME=$(echo "$source" | jq -r '.name')
  
  echo ""
  echo "=========================================="
  echo "Processing: $SOURCE_NAME"
  echo "ID: $SOURCE_ID"
  echo "=========================================="
  
  # Create source-specific work directory
  SOURCE_WORK_DIR="$WORK_DIR/$SOURCE_ID"
  mkdir -p "$SOURCE_WORK_DIR"
  
  # Construct full path to source file
  SOURCE_PATH="$REPO_ROOT/source/$SOURCE_FILE"
  
  if [ ! -f "$SOURCE_PATH" ]; then
    echo "ERROR: Source file not found: $SOURCE_PATH"
    echo "## Source $SOURCE_ID Failed - $(date -u +%Y-%m-%dT%H:%M:%SZ)" >> "$REPO_ROOT/memory.md"
    echo "Source file missing: $SOURCE_PATH" >> "$REPO_ROOT/memory.md"
    echo "---" >> "$REPO_ROOT/memory.md"
    continue
  fi
  
  # The Warp cloud agent (spawned by builder/index.ts) processes this source.
  # It reads the collection prompt, uses skills, collects data, and writes JSONL.
  # On failure, it logs to memory.md and continues to the next source.
  
  cd "$REPO_ROOT"
  
  # Collect raw data using the appropriate method for each source type:
  
  # Twitter sources: Use agent-browser to fetch timeline or Twitter API with curl
  # Webpage sources: Use agent-browser with CSS selectors from source file
  # API sources: Use curl with appropriate auth headers
  # RSS feeds: Fetch with curl and parse XML
  
  # E-PRIME Rules for contents field:
  # ❌ "The earthquake is devastating" → ✅ "The earthquake devastated the region"
  # ❌ "This is important" → ✅ "This matters significantly"
  # ❌ "The tanker was loaded" → ✅ "The tanker loaded 2 million barrels"
  # Verify E-PRIME: grep -Ei '\b(is|are|was|were|be|been|being)\b' contents.md
  
  # Skills reference:
  # - agent-browser: skills/agent-browser/SKILL.md
  # - perplexity-search: skills/perplexity-search/SKILL.md
  # - data-to-markdown: skills/data-to-markdown/SKILL.md
  # - world-event-entities: skills/world-event-entities/SKILL.md
  # - remember-as-you-go: skills/remember-as-you-go/SKILL.md
  
  echo "✓ Completed processing $SOURCE_NAME"
done

cd "$REPO_ROOT"
```

**Key Points**:
- Sources processed sequentially to prevent rate limit violations
- Each source gets isolated work directory
- Warp cloud agent handles data collection, validation, and writing
- Failures logged to memory.md, workflow continues
- Agent has access to all skills and source documentation

#### Step 4: Validate Collected Events

```bash
echo ""
echo "=========================================="
echo "Validating Collected Events"
echo "=========================================="

# Find all JSONL files in work directory
JSONL_FILES=$(find "$WORK_DIR" -name "events.jsonl" -type f)

if [ -z "$JSONL_FILES" ]; then
  echo "No events collected (no JSONL files found)"
  echo "This is OK if sources had no new data"
  # Continue to commit step (will create empty commit)
else
  # Validate each JSONL file
  echo "$JSONL_FILES" | while read -r file; do
    echo "Validating: $file"
    
    LINE_NUM=0
    while IFS= read -r line; do
      LINE_NUM=$((LINE_NUM + 1))
      
      # Check line is valid JSON
      echo "$line" | jq empty 2>/dev/null || {
        echo "ERROR: Invalid JSON at line $LINE_NUM in $file"
        echo "Line: $line"
        exit 1
      }
      
      # Check required fields present
      REQUIRED_FIELDS="id source title summary contents date_published links image_urls"
      for field in $REQUIRED_FIELDS; do
        echo "$line" | jq -e ".$field" >/dev/null 2>&1 || {
          echo "ERROR: Missing required field '$field' at line $LINE_NUM in $file"
          exit 1
        }
      done
      
      # Validate date format
      DATE_PUBLISHED=$(echo "$line" | jq -r '.date_published')
      date -d "$DATE_PUBLISHED" >/dev/null 2>&1 || {
        echo "ERROR: Invalid date_published format at line $LINE_NUM: $DATE_PUBLISHED"
        exit 1
      }
      
      # Check contents is non-trivial (100+ characters minimum)
      CONTENTS_LENGTH=$(echo "$line" | jq -r '.contents | length')
      if [ "$CONTENTS_LENGTH" -lt 100 ]; then
        echo "WARNING: Contents field very short ($CONTENTS_LENGTH chars) at line $LINE_NUM"
      fi
      
    done < "$file"
    
    EVENT_COUNT=$(wc -l < "$file")
    echo "✓ Validated $EVENT_COUNT events in $file"
  done
  
  if [ $? -ne 0 ]; then
    echo "ERROR: Validation failed. Aborting."
    exit 1
  fi
fi

echo "✓ Validation complete"
```

**Validation Ensures**:
- Each line parses as valid JSON
- All required fields present
- Dates in valid ISO 8601 format
- Contents field substantive (100+ chars)
- No corrupt or incomplete events

#### Step 5: Move Events to Data Folder

```bash
echo ""
echo "=========================================="
echo "Moving Events to Data Folder"
echo "=========================================="

# Calculate date-based paths
YEAR_MONTH=$(date +%Y-%m)
DATE=$(date +%Y-%m-%d)

# Create directory structure
mkdir -p "$REPO_ROOT/data/events/$YEAR_MONTH"

# Target file for today's events
TARGET_FILE="$REPO_ROOT/data/events/$YEAR_MONTH/$DATE.jsonl"

# Create file if it doesn't exist
touch "$TARGET_FILE"

# Consolidate all collected JSONL files
TEMP_COMBINED="$WORK_DIR/combined.jsonl"
find "$WORK_DIR" -name "events.jsonl" -type f -exec cat {} \; > "$TEMP_COMBINED"

if [ -s "$TEMP_COMBINED" ]; then
  # Append to target file
  cat "$TEMP_COMBINED" >> "$TARGET_FILE"
  
  # Deduplicate by ID (keep first occurrence)
  # Format: Sort by ID field, use unique on ID
  TEMP_SORTED="$WORK_DIR/sorted.jsonl"
  sort -t'"' -k4,4 -u "$TARGET_FILE" > "$TEMP_SORTED"
  mv "$TEMP_SORTED" "$TARGET_FILE"
  
  FINAL_COUNT=$(wc -l < "$TARGET_FILE")
  echo "✓ Saved $FINAL_COUNT total events to $TARGET_FILE"
else
  echo "No new events to save"
fi
```

**Process**:
- Combine all JSONL files from work directory
- Append to today's JSONL file
- Deduplicate by event ID
- Preserve existing events in file

#### Step 6: Handle Media Files

```bash
echo ""
echo "=========================================="
echo "Organizing Media Files"
echo "=========================================="

# Create media directory structure
mkdir -p "$REPO_ROOT/data/media/$YEAR_MONTH/images/$DATE"
mkdir -p "$REPO_ROOT/data/media/$YEAR_MONTH/videos/$DATE"

# Find and move image files
if [ -d "$WORK_DIR/media" ]; then
  # Move images
  find "$WORK_DIR/media" -type f \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" -o -name "*.webp" -o -name "*.gif" \) \
    -exec mv {} "$REPO_ROOT/data/media/$YEAR_MONTH/images/$DATE/" \; 2>/dev/null
  
  IMG_COUNT=$(find "$REPO_ROOT/data/media/$YEAR_MONTH/images/$DATE" -type f 2>/dev/null | wc -l)
  
  # Move videos
  find "$WORK_DIR/media" -type f \( -name "*.mp4" -o -name "*.webm" -o -name "*.mov" \) \
    -exec mv {} "$REPO_ROOT/data/media/$YEAR_MONTH/videos/$DATE/" \; 2>/dev/null
  
  VID_COUNT=$(find "$REPO_ROOT/data/media/$YEAR_MONTH/videos/$DATE" -type f 2>/dev/null | wc -l)
  
  echo "✓ Moved $IMG_COUNT images and $VID_COUNT videos"
else
  echo "No media files to move"
fi
```

**Media Organization**:
- Images → `data/media/YYYY-MM/images/YYYY-MM-DD/`
- Videos → `data/media/YYYY-MM/videos/YYYY-MM-DD/`
- Filename format: `evt_{id}_img{N}.{ext}` or `evt_{id}_vid{N}.{ext}`

#### Step 7: Update Memory File

```bash
echo ""
echo "=========================================="
echo "Updating Memory File"
echo "=========================================="

# Consolidate new memory entries
find "$WORK_DIR" -name "new-memory.md" -type f | while read -r memory_file; do
  if [ -s "$memory_file" ]; then
    echo "" >> "$REPO_ROOT/memory.md"
    cat "$memory_file" >> "$REPO_ROOT/memory.md"
    echo "✓ Appended learnings from $memory_file"
  fi
done

# Trim memory file if it gets too large (keep last 500 lines)
if [ -f "$REPO_ROOT/memory.md" ]; then
  LINE_COUNT=$(wc -l < "$REPO_ROOT/memory.md")
  if [ "$LINE_COUNT" -gt 500 ]; then
    tail -n 500 "$REPO_ROOT/memory.md" > "$REPO_ROOT/memory.md.tmp"
    mv "$REPO_ROOT/memory.md.tmp" "$REPO_ROOT/memory.md"
    echo "✓ Trimmed memory file to 500 lines"
  fi
fi
```

**Memory Management**:
- Append new learnings from agents
- Trim to last 500 lines if file grows large
- Preserves important error patterns and solutions

#### Step 8: Commit Results

```bash
echo ""
echo "=========================================="
echo "Committing Results"
echo "=========================================="

cd "$REPO_ROOT"

# Stage data files
git add "data/events/$YEAR_MONTH/$DATE.jsonl" 2>/dev/null || true
git add "data/media/$YEAR_MONTH/" 2>/dev/null || true
git add "memory.md" 2>/dev/null || true

# Check if there are changes to commit
if git diff --cached --quiet; then
  echo "No changes to commit (no new events collected)"
  exit 0
fi

# Count events in today's file
if [ -f "data/events/$YEAR_MONTH/$DATE.jsonl" ]; then
  EVENTS_COUNT=$(wc -l < "data/events/$YEAR_MONTH/$DATE.jsonl")
else
  EVENTS_COUNT=0
fi

# Get list of source IDs that were processed
SOURCE_IDS=$(echo "$SOURCES" | jq -r '.[].id' | paste -sd ',' -)

# Create commit
git commit -m "Collect $EVENTS_COUNT world events on $DATE

Automated OSINT collection run at $(date -u +%Y-%m-%dT%H:%M:%SZ)

Sources processed: $SOURCE_IDS

Data format: JSONL (JSON Lines)
Storage: data/events/$YEAR_MONTH/$DATE.jsonl
Media: data/media/$YEAR_MONTH/{images,videos}/$DATE/

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

echo "✓ Created commit with $EVENTS_COUNT events"

# Push to repository
echo "Pushing to origin/main..."
git push origin main || {
  echo "Push failed. Attempting pull/rebase..."
  git pull --rebase origin main
  git push origin main || {
    echo "ERROR: Failed to push after retry"
    exit 1
  }
}

echo "✓ Pushed to remote repository"
```

**Commit Process**:
- Stage only data files (events, media, memory)
- Create descriptive commit message with event count
- Include source IDs and timestamp
- Push with retry on failure (pull/rebase once)

#### Step 9: Cleanup

```bash
echo ""
echo "=========================================="
echo "Cleanup"
echo "=========================================="

# Remove work directory
if [ -d "$WORK_DIR" ]; then
  rm -rf "$WORK_DIR"
  echo "✓ Removed work directory: $WORK_DIR"
fi

echo ""
echo "=========================================="
echo "Collection Complete"
echo "=========================================="
echo "Events collected: $EVENTS_COUNT"
echo "Date: $DATE"
echo "Storage: data/events/$YEAR_MONTH/$DATE.jsonl"
```

**Cleanup**:
- Remove temporary work directory
- Logs final statistics
- Exit successfully

### Error Handling Strategy

**Principles**:
- **Continue on source failure**: One broken source doesn't block others
- **Log all errors**: Document in memory.md for review
- **Validate before commit**: Catch issues early
- **Retry git operations**: Handle transient network issues
- **Exit codes**: 0 = success (even if zero events), non-zero = critical failure

**Error Scenarios**:

| Scenario | Handling | Exit Code |
|----------|----------|-----------|
| No active sources | Exit successfully (log message) | 0 |
| Source collection fails | Log to memory, continue to next | 0 (continue) |
| Validation fails | Abort, don't commit bad data | 1 |
| Git push fails | Retry with pull/rebase once | 1 if retry fails |
| Zero events collected | Commit with count=0, success | 0 |

### Execution Summary

After completing all 9 steps:
1. Active sources loaded from manifest ✓
2. Temporary work directory created ✓
3. Each source processed via Warp cloud agent ✓
4. Events validated against schema ✓
5. Events moved to data folder (JSONL) ✓
6. Media organized by date ✓
7. Memory file updated with learnings ✓
8. Results committed and pushed ✓
9. Cleanup completed ✓

---

## Data Structure

### World Event Entity Schema

**Required Fields** (must be present in every event):

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `id` | string | Unique identifier (8+ chars) | `"evt_20260429_001"` |
| `source` | object | Source info with `name` (required) | `{"name":"Reuters","provider":"news"}` |
| `title` | string | Event headline (3+ chars) | `"7.8 Earthquake Strikes Turkey"` |
| `summary` | string | Brief narrative (10+ chars) | `"A major earthquake..."` |
| `contents` | string | **Markdown description (100+ words)** | `"## Earthquake Event\n\n..."` |
| `date_published` | ISO 8601 | When info was published | `"2026-04-29T10:30:00Z"` |
| `links` | array | Source URLs `[{url, label?}]` | `[{"url":"https://...", "label":"Reuters"}]` |
| `image_urls` | array | Media paths/URLs | `["./media/2026-04/images/..."]` |

**Optional Fields** (include if available):

| Field | Type | Description |
|-------|------|-------------|
| `date_event` | ISO 8601 or null | When event occurred |
| `geo` | object | `{lat, lon, country, region, city}` |
| `topics` | array | Keywords `["earthquake", "disaster"]` |
| `confidence` | number | Quality score 0.0-1.0 |
| `ingested_at` | ISO 8601 | When ingested into system |

**Complete Schema**: See [data/SCHEMA.md](data/SCHEMA.md)

### File Format: JSONL (JSON Lines)

Events stored as **JSON Lines** - one complete JSON object per line:

```jsonl
{"id":"evt_20260429_001","source":{"name":"Reuters","provider":"news"},"title":"Earthquake...","summary":"...","contents":"## Event\n\n...","date_published":"2026-04-29T10:30:00Z","links":[{"url":"..."}],"image_urls":["..."],"geo":{"lat":37.27,"lon":37.02,"country":"Turkey"},"topics":["earthquake"],"confidence":0.95}
{"id":"evt_20260429_002","source":{"name":"Twitter","provider":"social"},"title":"Political...","summary":"...","contents":"## Announcement\n\n...","date_published":"2026-04-29T11:00:00Z","links":[],"image_urls":[],"topics":["politics"],"confidence":0.75}
```

**Benefits**: Append-only, line-oriented (grep/awk/jq work), fault-tolerant, streaming-friendly

### Storage Organization

```
data/
├── events/                    # JSONL event files
│   ├── 2026-04/
│   │   ├── 2026-04-01.jsonl  # Daily files
│   │   ├── 2026-04-02.jsonl
│   │   └── 2026-04-29.jsonl
│   ├── 2026-03/
│   └── 2026-02/
│
├── media/                     # Downloaded media
│   ├── 2026-04/
│   │   ├── images/
│   │   │   └── 2026-04-29/   # Images for specific date
│   │   └── videos/
│   │       └── 2026-04-29/   # Videos for specific date
│   ├── 2026-03/
│   └── 2026-02/
│
├── indexes/                   # Optional generated indexes
│   ├── by-source.json
│   ├── by-topic.json
│   └── stats.json
│
└── scripts/                   # Data management utilities
    ├── validate-events.js
    ├── cleanup-old-data.sh
    └── stats-report.js
```

**Retention**: 90-day rolling window (automated cleanup via `cleanup-old-data.sh`)

**Complete Documentation**: See [data/README.md](data/README.md)

---

## Sources

### Current Sources

View active sources:
```bash
cat source/manifest.json | jq '.sources[] | select(.status == "active")'
```

**Manifest Structure**: [source/manifest.json](source/manifest.json)
- Registry of all sources
- Status tracking (active/testing/inactive)
- Statistics by type, priority, reliability

### Adding New Sources

Use the **create-source** skill:

```bash
# Interactive source creation
node skills/create-source/scripts/create-source.js

# Follow prompts to configure:
# - Source type (twitter, webpage, api, email, rss, etc.)
# - Collection criteria
# - Authentication requirements
# - Quality indicators
# - Examples

# Validate new source
node skills/create-source/scripts/validate-source.js source/sources/your-source.md

# Test collection
node skills/create-source/scripts/test-source.js source/sources/your-source.md
```

### Source Types Supported

| Type | Description | Examples |
|------|-------------|----------|
| `twitter` | Twitter/X accounts | Breaking news accounts, analysts, officials |
| `webpage` | Web scraping | News sites, blogs, government portals |
| `api` | REST/GraphQL APIs | GDELT, news aggregators, data APIs |
| `email` | Email newsletters | Intel digests, alert services |
| `rss` | RSS/Atom feeds | News feeds, blog updates |
| `webhook` | Incoming webhooks | Push notifications, alerts |
| `websocket` | Real-time streams | Live data feeds |
| `file` | File sources | S3 buckets, SFTP, shared drives |
| `database` | Direct DB access | Intelligence databases |
| `other` | Custom types | Specialized or hybrid sources |

**Complete Documentation**: See [source/README.md](source/README.md) and [source/CONTRIBUTING.md](source/CONTRIBUTING.md)

---

## Skills Reference

AI agents use these skills during collection:

| Skill | Purpose | Location |
|-------|---------|----------|
| **agent-browser** | Browser automation for web scraping (Rust CLI, ref-based selection) | `skills/agent-browser/` |
| **perplexity-search** | AI-powered web search via Perplexity API (direct `curl` calls) | `skills/perplexity-search/` |
| **data-to-markdown** | Convert data to Markdown with **E-PRIME** enforcement | `skills/data-to-markdown/` |
| **world-event-entities** | World Event Entity schema and validation | `skills/world-event-entities/` |
| **create-source** | Source creation, validation, testing tools | `skills/create-source/` |
| **remember-as-you-go** | Learning pattern for error tracking and improvement | `skills/remember-as-you-go/` |

**E-PRIME Enforcement**: The `data-to-markdown` skill ensures contents fields use E-PRIME (English without "to be" verbs: is, are, was, were, be, been, being). This produces objective, precise language.

**Complete Skills Documentation**: See [skills/README.md](skills/README.md)

---

## Local Development

### Manual Collection Run

```bash
# 1. Set environment variables
export WARP_API_KEY="your-warp-api-key"
export WARP_ENVIRONMENT_ID="your-warp-environment-uid"

# 2. Set repository root
export REPO_ROOT=$(pwd)

# 3. Install builder dependencies
cd builder && npm install

# 4. Run collection
npm run collect

# 5. Verify results
ls -lh data/events/$(date +%Y-%m)/$(date +%Y-%m-%d).jsonl
cat data/events/$(date +%Y-%m)/$(date +%Y-%m-%d).jsonl | jq .
```

### Validate Collected Data

```bash
# Validate specific date
node data/scripts/validate-events.js --from 2026-04-29

# Validate date range
node data/scripts/validate-events.js --from 2026-04-01 --to 2026-04-29

# Validate all events (expensive)
node data/scripts/validate-events.js --all

# Check E-PRIME compliance
cat data/events/*/$(date +%Y-%m-%d).jsonl | jq -r '.contents' | \
  grep -Ei '\b(is|are|was|were|be|been|being)\b' && \
  echo "E-PRIME violation found" || \
  echo "E-PRIME compliance verified"
```

---

## GitHub Actions Setup

The workflow file already exists at `.github/workflows/hourly-collection.yml`.

### Configure Secrets

Add to repository **Settings → Secrets and variables → Actions**:

| Secret Name | Description | Required |
|-------------|-------------|----------|
| `WARP_API_KEY` | Warp API key for `oz-agent-sdk` | Yes |
| `WARP_ENVIRONMENT_ID` | UID of Warp cloud environment | Yes |

**Setting up the Warp environment**: In the Warp dashboard, create an environment with:
- Repository: `osint-builders/osint` cloned
- `agent-browser` installed globally (`npm install -g agent-browser && agent-browser install`)
- Environment variables: `ANTHROPIC_API_KEY`, `TWITTER_BEARER_TOKEN` (if needed), `PERPLEXITY_API_KEY` (if needed)
- Git configured with push credentials

### Enable Actions

1. Go to repository Settings → Actions → General
2. Enable "Read and write permissions"
3. Enable "Allow GitHub Actions to create and approve pull requests"

### Test Workflow

```bash
# Trigger manual run
gh workflow run hourly-collection.yml

# Or via GitHub UI: Actions tab → Hourly OSINT Collection → Run workflow

# Monitor execution
gh run watch

# View logs
gh run view
```

---

## Verification

### Check Data Files

```bash
# List today's events file
ls -lh data/events/$(date +%Y-%m)/$(date +%Y-%m-%d).jsonl

# Count events
wc -l data/events/$(date +%Y-%m)/$(date +%Y-%m-%d).jsonl

# View events (pretty-printed)
cat data/events/$(date +%Y-%m)/$(date +%Y-%m-%d).jsonl | jq .

# View specific event
cat data/events/$(date +%Y-%m)/$(date +%Y-%m-%d).jsonl | jq 'select(.id == "evt_20260429_001")'
```

### Validate Events

```bash
# Validate today's events
node data/scripts/validate-events.js --from $(date +%Y-%m-%d)

# Check schema compliance
node data/scripts/validate-events.js data/events/$(date +%Y-%m)/$(date +%Y-%m-%d).jsonl

# Output shows:
# ✓ Valid events
# ✗ Invalid events with line numbers and violations
```

### Check E-PRIME Compliance

```bash
# Search for "to be" verbs in contents fields
cat data/events/$(date +%Y-%m)/$(date +%Y-%m-%d).jsonl | \
  jq -r '.contents' | \
  grep -Ei '\b(is|are|was|were|be|been|being)\b' && \
  echo "❌ E-PRIME violation found" || \
  echo "✅ E-PRIME compliance verified"
```

### View GitHub Actions

```bash
# List recent workflow runs
gh run list --workflow=hourly-collection.yml --limit 10

# View specific run
gh run view <run-id>

# View logs
gh run view <run-id> --log

# Or via GitHub UI: Actions tab
```

### Review Memory

```bash
# View recent learnings
tail -50 memory.md

# Search for specific source issues
grep "Source twitter-tanker-trackers" memory.md

# Check for recurring errors
grep "ERROR:" memory.md | sort | uniq -c | sort -rn
```

### Generate Statistics

```bash
# Generate stats report
node data/scripts/stats-report.js

# Monthly report
node data/scripts/stats-report.js --month $(date +%Y-%m)

# JSON format
node data/scripts/stats-report.js --format json

# Output includes:
# - Total events
# - Events per source
# - Events per day
# - Media file counts
# - Average confidence scores
```

---

## Troubleshooting

### No Events Collected

**Symptoms**: JSONL file empty or missing  
**Causes**:
- No active sources in manifest
- Sources have no new data
- Collection criteria too strict
- Authentication failures

**Solutions**:
```bash
# Check active sources
cat source/manifest.json | jq '.sources[] | select(.status == "active")'

# Check source status (should be "active", not "testing")
cat source/manifest.json | jq '.sources[] | .status'

# Review memory for errors
tail -50 memory.md

# Test collection manually
cd builder && WARP_API_KEY=your-key WARP_ENVIRONMENT_ID=your-env npm run collect
```

### Validation Errors

**Symptoms**: `validate-events.js` reports errors  
**Common Issues**:
- Missing required fields
- Invalid date formats
- Contents field too short
- E-PRIME violations

**Solutions**:
```bash
# View validation output
node data/scripts/validate-events.js data/events/$(date +%Y-%m)/$(date +%Y-%m-%d).jsonl

# Fix specific event by ID
cat data/events/$(date +%Y-%m)/$(date +%Y-%m-%d).jsonl | \
  jq 'select(.id == "evt_20260429_001")'

# Remove invalid event (replace LINE_NUM)
sed -i 'LINE_NUMd' data/events/$(date +%Y-%m)/$(date +%Y-%m-%d).jsonl
```

### API Authentication Errors

**Symptoms**: "Authentication failed", "API key invalid"  
**Solutions**:
```bash
# Check environment variables set
echo "$ANTHROPIC_API_KEY" | head -c 20
echo "$TWITTER_BEARER_TOKEN" | head -c 20

# For GitHub Actions: verify secrets configured
gh secret list

# Test API key
curl -H "x-api-key: $ANTHROPIC_API_KEY" https://api.anthropic.com/v1/messages
```

### Git Push Failures

**Symptoms**: "failed to push", "permission denied"  
**Solutions**:
```bash
# Check Git configuration
git config user.name
git config user.email

# For GitHub Actions: verify permissions
# Settings → Actions → General → Workflow permissions
# Must have "Read and write permissions"

# Manual push after fixing
git pull --rebase origin main
git push origin main
```

### Warp Agent Errors

**Symptoms**: Run ends with state `FAILED` or `CANCELLED`  
**Solutions**:
```bash
# Check WARP_API_KEY is set
test -n "$WARP_API_KEY" || echo "WARP_API_KEY not set"

# Check WARP_ENVIRONMENT_ID is set
test -n "$WARP_ENVIRONMENT_ID" || echo "WARP_ENVIRONMENT_ID not set"

# Test builder locally
cd builder && npm run collect

# Check memory.md for error details logged by the agent
tail -50 memory.md
```

### E-PRIME Violations

**Symptoms**: Contents field contains "to be" verbs  
**Solution**:
```bash
# Find violations
cat data/events/$(date +%Y-%m)/$(date +%Y-%m-%d).jsonl | \
  jq -r '.contents' | \
  grep -Ein '\b(is|are|was|were|be|been|being)\b'

# Update event manually or re-run collection with corrected source instructions
```

### High Resource Usage

**Symptoms**: GitHub Actions timeout  
**Solutions**:
- Process fewer sources per run
- Increase GitHub Actions timeout (max 360 minutes on paid plan)
- Check `memory.md` for errors indicating long-running operations

### Source-Specific Issues

Check source file for known issues:
```bash
# View "Known Issues" section
cat source/sources/twitter-tanker-trackers.md | sed -n '/## Known Issues/,/## /p'

# Check memory for source-specific errors
grep "twitter-tanker-trackers" memory.md
```

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        GitHub Actions                            │
│                    (Hourly Cron Trigger)                         │
└────────────────────────────┤────────────────────────────────────┘
                             │
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                  builder/index.ts (oz-agent-sdk)                 │
│          Loads sources → client.agent.run() → polls state        │
└────────────────────────────┤────────────────────────────────────┘
                             │
                             ↓ (cloud)
┌─────────────────────────────────────────────────────────────────┐
│              Warp Cloud Agent (oz-agent-sdk)                     │
│  Skills: agent-browser, perplexity-search, data-to-markdown      │
│  Reads sources → collects data → writes JSONL → commits          │
└────────────────────────────┤────────────────────────────────────┘
                             │
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│  data/events/YYYY-MM/YYYY-MM-DD.jsonl (World Event Entities)     │
│  data/media/YYYY-MM/{images,videos}/YYYY-MM-DD/                  │
│  memory.md (agent learnings)                                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Related Documentation

- **Builder**: [builder/index.ts](builder/index.ts) - Warp SDK agent trigger
- **Data Folder**: [data/README.md](data/README.md) - Storage organization, JSONL format, retention policy
- **Data Schema**: [data/SCHEMA.md](data/SCHEMA.md) - World Event Entity complete specification
- **Sources**: [source/README.md](source/README.md) - Source system overview and schema
- **Source Contribution**: [source/CONTRIBUTING.md](source/CONTRIBUTING.md) - How to add sources
- **Skills**: [skills/README.md](skills/README.md) - All available skills and capabilities
- **World Event Entities**: [skills/world-event-entities/SKILL.md](skills/world-event-entities/SKILL.md) - Entity model details
- **Create Source**: [skills/create-source/SKILL.md](skills/create-source/SKILL.md) - Source creation framework
- **Data to Markdown**: [skills/data-to-markdown/SKILL.md](skills/data-to-markdown/SKILL.md) - E-PRIME transformation
- **Agent Browser**: [skills/agent-browser/SKILL.md](skills/agent-browser/SKILL.md) - Browser automation
- **GitHub Actions**: [.github/workflows/README.md](.github/workflows/README.md) - Workflow configuration

---

## License

MIT

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.

To add new OSINT sources, see [source/CONTRIBUTING.md](source/CONTRIBUTING.md).

---

**Last Updated**: 2026-04-29  
**Version**: 1.0.0
