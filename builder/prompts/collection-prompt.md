# OSINT World Event Collection Task (Bucket ${bucketNum} of ${totalBuckets})

You are an AI agent tasked with collecting OSINT world events.
This agent is processing **bucket ${bucketNum} of ${totalBuckets}**.

**Execution time**: ${executionTimestamp} (UTC)
**Extraction time**: ${extractionTimestamp} (EST)
**Target date**: ${extractionDate} (EST)
**Time window**: ${timeWindowStart} to ${timeWindowEnd} (UTC, 1 hour)
**Repository**: ${originUrl}
**Bucket**: ${bucketNum} / ${totalBuckets} (${bucketSourceCount} sources in this bucket)

This agent collects events from approximately **${extractionTimeHHMM} EST** on **${extractionDate}** (1 hour lookback from execution).

**CRITICAL**: Only collect events with `date_published` within the time window above. Events outside this window must be rejected and logged.

## Your Mission

Collect world events from **every** source listed in the "Sources to Process"
section below, structure them as World Event Entities, and commit the results
to the repository.

You MUST process every source. The orchestrator already pre-filtered sources
from `source/manifest.json`; the section below is the authoritative worklist.
If you skip a source, the run is considered failed.

## Prior Learnings (from previous runs)

The following findings from earlier runs apply to this run. Treat them as
authoritative unless they contradict the source files in this prompt. They
have been pre-filtered by the orchestrator (expired entries dropped, capped
at 100 entries / 30 KB).

${learnings}

If any of these are stale, contradicted by what you observe this run, or
have been resolved upstream, do NOT silently ignore them — write a new
LEARNINGS entry that supersedes the stale one (see Step 7).

## Step 0: Clone and Enter the Repository

Before doing anything else, ensure you are working inside the correct repository:

```bash
# If the repo is not already cloned, clone it
if [ ! -d "osint/.git" ]; then
  git clone ${originUrl} osint
fi
cd osint
REPO_ROOT=$(pwd)
```

All subsequent steps must run from **inside the cloned repo directory**.

## Sources to Process (${bucketSourceCount} in this bucket — process ONE AT A TIME, do NOT skip any)

Expected source IDs for this run (sentinel — used by the cross-check below):

${expectedIdsList}

Full source definitions follow. The agent must process **every** one of them.

${sourceBlocks}

## Step-by-Step Execution

### Step 0.5: Confirm This Bucket's Source IDs Are Still in the Manifest

The orchestrator has already verified that the union of every bucket equals
the manifest's processable set, so no source can be silently dropped between
prompt construction and dispatch. What remains for *this* bucket: confirm
that none of its assigned IDs were removed from `source/manifest.json`
between dispatch and your run, and that none flipped to a skip status
(`inactive`, `archived`, `deprecated`). This catches the rare race where
someone edits the manifest mid-run.

```bash
# IDs the orchestrator embedded in this prompt for THIS bucket
EXPECTED_IDS=(${expectedIdsBash})

# IDs currently in the manifest with a processable status, as a set we
# can grep against in O(1).
MANIFEST_PROCESSABLE=$(jq -r \
  '.sources[] | select((.status // "") | ascii_downcase | IN("inactive","archived","deprecated") | not) | .id' \
  source/manifest.json)

MISSING=()
for id in "${EXPECTED_IDS[@]}"; do
  if ! printf "%s\n" "$MANIFEST_PROCESSABLE" | grep -Fxq "$id"; then
    MISSING+=("$id")
  fi
done

if [ "${#MISSING[@]}" -gt 0 ]; then
  echo "ERROR: bucket ${bucketNum} contains source IDs that are no longer processable" >&2
  echo "in source/manifest.json (status changed or entry removed):" >&2
  printf "  %s\n" "${MISSING[@]}" >&2
  echo "Aborting bucket so no agent processes a stale source list." >&2
  exit 1
fi

echo "Bucket ${bucketNum} subset check passed: ${#EXPECTED_IDS[@]} sources verified."
```

If this check fails, do NOT continue. Investigate the mismatch and either
(a) re-dispatch this bucket from a fresh orchestrator run, or (b) update
the manifest status if the source genuinely should be skipped now.

### Step 1: Validate Prerequisites

```bash
test -d source/sources || exit 1
test -f source/manifest.json || exit 1
test -d data/events || exit 1
test -f data/SCHEMA.md || exit 1
test -d skills || exit 1
command -v node >/dev/null 2>&1 || exit 1
command -v git >/dev/null 2>&1 || exit 1
command -v jq >/dev/null 2>&1 || exit 1
```

### Step 2: Create Temporary Work Directory

```bash
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BUCKET_ID="bucket${bucketNum}"
WORK_DIR="/tmp/osint-collection-$TIMESTAMP-$BUCKET_ID"
mkdir -p "$WORK_DIR/raw" "$WORK_DIR/media/images" "$WORK_DIR/media/videos"

# Time window for filtering events (1-hour lookback)
TIME_WINDOW_START="${timeWindowStart}"
TIME_WINDOW_END="${timeWindowEnd}"

echo "Time window: $TIME_WINDOW_START to $TIME_WINDOW_END"
```

### Step 3: Process Each Source Sequentially

For each source listed above:

1. **Read source file** — understand collection method, selectors, auth requirements, quality indicators

2. **Collect raw data with time filtering** using the appropriate approach:
   - **Twitter/X**: Use `agent-browser` to navigate and extract tweets, or use Twitter API with `curl` and `$TWITTER_BEARER_TOKEN`
     - **Add time filtering**: For Twitter API, add `start_time=$TIME_WINDOW_START&end_time=$TIME_WINDOW_END` to queries
     - **Filter by timestamp**: If using agent-browser, parse tweet timestamps and keep only those within window
   - **Webpage**: Use `agent-browser` with CSS selectors from the source file
     - **Parse published dates**: Extract article publication timestamps
     - **Filter before processing**: Skip articles published outside time window
   - **API**: Use `curl` with appropriate auth headers
     - **Add time range parameters**: Include date/time filters in API queries where supported
   - **RSS**: Fetch with `curl` and parse XML
     - **Filter by pubDate**: Parse RSS pubDate fields and filter to time window
   - **Time window validation**: After collecting raw data, verify all items have timestamps within `$TIME_WINDOW_START` to `$TIME_WINDOW_END`. Reject and log any items outside the window to `$WORK_DIR/{source_id}/new-memory.md` (consolidated into `data/run-logs/` in Step 7a; never goes into `LEARNINGS.md`).

3. **Extract World Event Entities** from raw data following the schema in `data/SCHEMA.md`

4. **Transform contents to E-PRIME** — rewrite `contents` field removing all "to be" verbs (is, are, was, were, be, been, being). Use active, specific verbs. See `skills/data-to-markdown/SKILL.md` for guidance.

5. **Geocode all events** (REQUIRED - every event must have geo.lat and geo.lon):
   - **Extract location**: Identify city, region, country from title/summary/contents
   - **Geocode to coordinates**: Use Nominatim API (see geocoding function below)
   - **Add geo field**: Set `geo.lat`, `geo.lon`, `geo.country`, `geo.region`, `geo.city`
   - **Fallback**: If specific location unavailable, use country-level coordinates
   - **Rate limiting**: Respect 1 request/second limit for Nominatim
   - **Caching**: Cache results in `/tmp/geocoding-cache-${bucketNum}.json` to avoid repeated lookups

6. **Runtime confidence validation** (for high-priority events only):
   - **Criteria**: Event has `priority="high"` OR topics contain ["conflict", "military", "attack", "disaster", "sanctions", "nuclear"]
   - **Research**: Use Perplexity API (`sonar-pro` model with `search_recency_filter: "hour"`) to verify key claims
   - **Adjust confidence**: Based on corroboration (see function below)
   - **Limit**: Maximum 50 research calls per bucket to control costs
   - **Document**: Add "Confidence Assessment" section to contents field with research findings

7. **Save to `$WORK_DIR/{source_id}/events.jsonl`** — one JSON object per line

8. **Extract and process media** using `skills/image-extraction/SKILL.md`:
   - Identify all images in source data (social media attachments, webpage hero images, video thumbnails)
   - Download/screenshot using appropriate method (curl for direct URLs, agent-browser for protected images, ffmpeg for video frames)
   - Process each image to 720x720 PNG: `magick image -resize 720x720^ -gravity center -extent 720x720 +repage -strip -define png:compression-level=9 output.png`
   - Save to `$WORK_DIR/{source_id}/media/images/{event_id}_img{N}.png`
   - Update `image_urls` array with relative paths: `./media/YYYY-MM/images/YYYY-MM-DD/{event_id}_img{N}.png`
   - Limit to 3-5 images per event (first is primary), handle failures gracefully

9. **Log issues** to `$WORK_DIR/{source_id}/new-memory.md`: errors, rate limits, rejected events (outside time window), geocoding failures, research findings

**Required JSONL fields per event**: `id`, `source`, `title`, `summary`, `contents` (100+ words, E-PRIME), `date_published`, `links`, `image_urls`, **`geo` (with lat/lon)**

**ID format**: `evt_YYYYMMDD_NNN` using extraction date (e.g., `evt_${extractionDateCompact}_001`)

**Skills available** (read the SKILL.md for each before using):
- `skills/agent-browser/SKILL.md` — web scraping, Twitter data
- `skills/perplexity-search/SKILL.md` — AI-powered web research via Perplexity API (`$PERPLEXITY_API_KEY`)
- `skills/data-to-markdown/SKILL.md` — E-PRIME transformation and markdown structuring
- `skills/world-event-entities/SKILL.md` — entity schema reference
- `skills/remember-as-you-go/SKILL.md` — when and how to log learnings

### Geocoding Helper Function (for Step 3.5)

```bash
# Initialize geocoding cache
GEOCODING_CACHE="/tmp/geocoding-cache-${bucketNum}.json"
echo '{}' > "$GEOCODING_CACHE"

# Function to geocode a location using OpenStreetMap Nominatim (free, no API key)
geocode_location() {
  local location="$1"

  # Check cache first
  cached=$(jq -r --arg loc "$location" '.[$loc] // empty' "$GEOCODING_CACHE" 2>/dev/null)
  if [ -n "$cached" ]; then
    echo "$cached"
    return 0
  fi

  # URL encode location
  local encoded=$(printf '%s' "$location" | jq -sRr @uri)

  # Rate limit: 1 request/second for Nominatim
  sleep 1

  # Query Nominatim API
  result=$(curl -s "https://nominatim.openstreetmap.org/search?q=$encoded&format=json&limit=1" \\
    | jq -r 'if length > 0 then {lat: .[0].lat, lon: .[0].lon, display_name: .[0].display_name} else {lat: null, lon: null, display_name: null} end')

  # Cache result
  tmp_cache=$(jq --arg loc "$location" --argjson res "$result" '. + {($loc): $res}' "$GEOCODING_CACHE")
  echo "$tmp_cache" > "$GEOCODING_CACHE"

  echo "$result"
}

# Usage example:
# LOCATION="Gaziantep, Turkey"
# GEO_RESULT=$(geocode_location "$LOCATION")
# LAT=$(echo "$GEO_RESULT" | jq -r '.lat')
# LON=$(echo "$GEO_RESULT" | jq -r '.lon')
# Then add to event JSON with: jq --argjson geo "{lat: $LAT, lon: $LON, city: \"Gaziantep\", country: \"Turkey\"}" '. + {geo: $geo}'
```

### Runtime Confidence Validation Helper Function (for Step 3.6)

```bash
# Track research API calls
RESEARCH_COUNT=0
MAX_RESEARCH_CALLS=50

# Function to research and validate event confidence
validate_event_confidence() {
  local event_json="$1"
  local event_id=$(echo "$event_json" | jq -r '.id')
  local title=$(echo "$event_json" | jq -r '.title')
  local summary=$(echo "$event_json" | jq -r '.summary')
  local priority=$(echo "$event_json" | jq -r '.priority // "medium"')
  local topics=$(echo "$event_json" | jq -r '.topics // [] | join(",")')
  local initial_confidence=$(echo "$event_json" | jq -r '.confidence // 0.7')

  # Check if event qualifies for research
  if [[ "$priority" != "high" ]] && ! echo "$topics" | grep -qiE "(conflict|military|attack|disaster|sanctions|nuclear)"; then
    echo "$event_json"
    return 0
  fi

  # Check research budget
  if [[ $RESEARCH_COUNT -ge $MAX_RESEARCH_CALLS ]]; then
    echo "$event_json"
    return 0
  fi

  RESEARCH_COUNT=$((RESEARCH_COUNT + 1))

  # Construct research query
  RESEARCH_QUERY="Verify this OSINT event from the last hour. Provide confirmation or contradictions with recent sources. Event: $title. Details: $summary. Search only sources from the last few hours."

  # Query Perplexity API if key is available
  if [ -n "$PERPLEXITY_API_KEY" ]; then
    research_result=$(curl -s https://api.perplexity.ai/chat/completions \\
      -H "Authorization: Bearer $PERPLEXITY_API_KEY" \\
      -H "Content-Type: application/json" \\
      -d "$(jq -n \\
        --arg model "sonar-pro" \\
        --arg content "$RESEARCH_QUERY" \\
        --arg recency "hour" \\
        '{model: $model, search_recency_filter: $recency, messages: [{role: "user", content: $content}]}')" \\
      | jq -r '.choices[0].message.content // "Research unavailable"')

    # Analyze research and adjust confidence
    confidence_adjustment=0
    if echo "$research_result" | grep -qi "confirmed\|verified\|corroborated"; then
      confidence_adjustment=$(echo "$confidence_adjustment + 0.1" | bc)
    fi
    if echo "$research_result" | grep -qi "contradicts\|disputed\|false"; then
      confidence_adjustment=$(echo "$confidence_adjustment - 0.3" | bc)
    fi
    if echo "$research_result" | grep -qi "no information\|unconfirmed\|unable to verify"; then
      confidence_adjustment=$(echo "$confidence_adjustment - 0.1" | bc)
    fi
    # Check for multiple major sources
    source_count=$(echo "$research_result" | grep -oiE "(reuters|bbc|ap|cnn|nyt)" | sort -u | wc -l)
    if [ "$source_count" -ge 3 ]; then
      confidence_adjustment=$(echo "$confidence_adjustment + 0.2" | bc)
    fi

    final_confidence=$(echo "$initial_confidence + $confidence_adjustment" | bc)
    # Clamp to 0.0-1.0
    if (( $(echo "$final_confidence > 1.0" | bc -l) )); then
      final_confidence="1.0"
    elif (( $(echo "$final_confidence < 0.0" | bc -l) )); then
      final_confidence="0.0"
    fi

    # Append confidence assessment to contents
    confidence_section="\\n\\n## Confidence Assessment\\n\\nInitial confidence: $initial_confidence\\nRuntime research: Perplexity API verification\\nAdjustment: $confidence_adjustment\\n\\nResearch summary (first 500 chars):\\n$(echo \"$research_result\" | head -c 500)...\\n\\nFinal confidence: $final_confidence"

    echo "$event_json" | jq --arg conf "$final_confidence" --arg section "$confidence_section" \\
      '.confidence = ($conf | tonumber) | .contents += $section'
  else
    # No API key, return original
    echo "$event_json"
  fi
}

# Usage: updated_event=$(validate_event_confidence "$original_event_json")
```

### Step 4: Validate Collected Events

The canonical validator lives at `data/scripts/validate-events.js`. It enforces
required fields, types, ISO-8601 dates, geo-coordinate ranges, time-window
membership, and E-PRIME compliance — all in one place. Run it on every
`events.jsonl` file in this bucket's work directory before consolidating:

```bash
find "$WORK_DIR" -name "events.jsonl" -type f | while read f; do
  echo "Validating $f"
  node "$REPO_ROOT/data/scripts/validate-events.js" "$f" \
    --strict \
    --time-window "$TIME_WINDOW_START" "$TIME_WINDOW_END" \
    || { echo "ERROR: validation failed for $f"; exit 1; }
done
```

`--strict` requires `geo.lat`/`geo.lon` and rejects forms of "to be" in
`contents`. `--time-window` rejects events whose `date_published` falls
outside the run's 1-hour window. Any failure aborts the bucket — do not
proceed to Step 5 with invalid data.

### Step 5: Move Events to Data Folder

```bash
YEAR_MONTH="${yearMonth}"
DATE="${extractionDate}"
# Note: Use extraction date (EST), not execution date (UTC)
mkdir -p "data/events/$YEAR_MONTH"
TARGET="data/events/$YEAR_MONTH/$DATE.jsonl"
touch "$TARGET"

# Phase A: URL pre-filter — skip events whose primary URL already exists in today's file
if [ -f "$TARGET" ]; then
  SEEN_URLS=$(jq -r '.links[0].url // empty' "$TARGET" 2>/dev/null | sort -u)
else
  SEEN_URLS=""
fi

find "$WORK_DIR" -name "events.jsonl" -type f | while read f; do
  while IFS= read -r line; do
    EVENT_URL=$(printf '%s' "$line" | jq -r '.links[0].url // empty')
    if [ -z "$EVENT_URL" ] || ! printf '%s\n' "$SEEN_URLS" | grep -qF "$EVENT_URL"; then
      printf '%s\n' "$line"
    fi
  done < "$f"
done >> "$TARGET"

# Phase B: ID post-dedup — collapse any ID collisions within the merged file
jq -s 'unique_by(.id) | .[]' "$TARGET" > "$TARGET.tmp" && mv "$TARGET.tmp" "$TARGET"
```

### Step 6: Handle Media Files

```bash
mkdir -p "data/media/$YEAR_MONTH/images/$DATE" "data/media/$YEAR_MONTH/videos/$DATE"
find "$WORK_DIR/media" -type f \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" -o -name "*.webp" \) \
  -exec mv {} "data/media/$YEAR_MONTH/images/$DATE/" \; 2>/dev/null || true
find "$WORK_DIR/media" -type f \( -name "*.mp4" -o -name "*.webm" -o -name "*.mov" \) \
  -exec mv {} "data/media/$YEAR_MONTH/videos/$DATE/" \; 2>/dev/null || true
```

### Step 7: Write the run log + maybe a learning

You write to **two** files at the end of the run. Don't conflate them.

#### 7a. `data/run-logs/${yearMonth}/${extractionDate}.log` — the firehose

Append per-source operational telemetry: `## Processing <id>` blocks,
`Created event: …` lines, `[skip] dup url`, `[snap]`, parse counts, time-window
outcomes. The next run does **not** read this file. This path is gitignored —
write freely for in-run diagnostics; nothing here ever gets committed.

```bash
mkdir -p "data/run-logs/$YEAR_MONTH"
RUN_LOG="data/run-logs/$YEAR_MONTH/$DATE.log"
{
  echo ""
  echo "## Bucket ${bucketNum} run @ ${executionTimestamp}"
  cat "$WORK_DIR"/*/new-memory.md 2>/dev/null || true
} >> "$RUN_LOG"
```

#### 7b. `LEARNINGS.md` — cross-run knowledge, **only when justified**

Append a new entry to `LEARNINGS.md` (at the repo root) **only** when at
least one of these triggers:

1. A source's selectors / handle / auth changed and you found a working approach.
2. A non-obvious shortcut that saved time or API calls.
3. A repeated failure pattern across ≥3 runs with a known mitigation.
4. A schema or validation gap that bit you, plus the workaround.
5. A cost or budget signal worth surfacing to the next run.

Do **not** write per-source telemetry, dedup skips, or "no events parsed"
into LEARNINGS.md. Those go in 7a.

Required entry format (append to the end of the file, after the
`<!-- entries below this line; newest first -->` marker):

```markdown
## YYYY-MM-DD HH:MMZ — <one-line topic>
**Trigger:** <what surfaced this — failure, repeated pattern, optimization spotted>
**Finding:** <what is true, in 1-3 sentences>
**Action for next run:** <concrete instruction the next agent should follow>
**Expires:** YYYY-MM-DD | permanent
```

The orchestrator prunes expired entries before the next run. Do not modify
or delete existing entries; only append new ones (use entries to *supersede*
older ones rather than editing them).

If nothing this run met the criteria, leave LEARNINGS.md untouched.

### Step 8: Commit and Push

```bash
git config user.name "OSINT Collector Bot"
git config user.email "osint-bot@github-actions"
git add "data/events/$YEAR_MONTH/$DATE.jsonl" "data/media/$YEAR_MONTH/" "LEARNINGS.md" 2>/dev/null || true

if ! git diff --cached --quiet; then
  EVENT_COUNT=$(wc -l < "data/events/$YEAR_MONTH/$DATE.jsonl")
  git commit -m "Collect $EVENT_COUNT world events on $DATE

Automated OSINT collection run
- Execution time: ${executionTimestamp} (UTC)
- Extraction time: ${extractionTimestamp} (EST)
- Data collected from 1-hour lookback window

Data format: JSONL (JSON Lines)
Storage: data/events/$YEAR_MONTH/$DATE.jsonl

[skip ci]"

  # Pick the push token. Prefer OSINT_GH_TOKEN (fine-grained PAT with
  # Contents:write on osint-builders/osint); fall back to GH_TOKEN.
  PUSH_TOKEN="${OSINT_GH_TOKEN:-$GH_TOKEN}"
  if [ -z "$PUSH_TOKEN" ]; then
    echo "ERROR: No push token available (set OSINT_GH_TOKEN or GH_TOKEN)." >&2
    exit 1
  fi

  # Derive owner/repo from the configured origin URL (handles SSH or HTTPS form).
  REPO_PATH=$(git remote get-url origin \
    | sed -E 's|^git@github\.com:|https://github.com/|; s|^https?://github\.com/||; s|\.git$||')
  PUSH_URL="https://x-access-token:$PUSH_TOKEN@github.com/$REPO_PATH.git"

  # Redact the token from any output that gets logged.
  REDACT='s|https://[^@]+@|https://<redacted>@|g'

  git push "$PUSH_URL" main 2>&1 | sed -E "$REDACT"
  PUSH_RC=${PIPESTATUS[0]}
  if [ "$PUSH_RC" -ne 0 ]; then
    git pull --rebase "$PUSH_URL" main 2>&1 | sed -E "$REDACT"
    git push "$PUSH_URL" main 2>&1 | sed -E "$REDACT"
  fi
fi
```

### Step 8.5: Update Indexes and Statistics

```bash
# Rebuild all indexes from collected data
echo "Rebuilding data indexes..."
node data/scripts/rebuild-indexes.js

# Generate statistics and update data/stats.json
echo "Updating data/stats.json..."
STATS_JSON=$(node data/scripts/stats-report.js)
TOTAL_EVENTS=$(echo "$STATS_JSON" | jq -r '.total_events')
OLDEST_DATE=$(jq -s 'map(.date_published) | sort | .[0] // null' data/events/*/*.jsonl 2>/dev/null || echo "null")
NEWEST_DATE=$(jq -s 'map(.date_published) | sort | .[-1] // null' data/events/*/*.jsonl 2>/dev/null || echo "null")

# data/stats.json schema (PR-F):
#   { last_updated, data_range:{oldest_date,newest_date},
#     statistics:{total_events, events_by_month, events_by_source, media_files} }
jq --arg updated "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
   --arg oldest "$OLDEST_DATE" \
   --arg newest "$NEWEST_DATE" \
   --argjson total "$TOTAL_EVENTS" \
   --argjson by_month "$(echo "$STATS_JSON" | jq '.by_month')" \
   --argjson by_source "$(echo "$STATS_JSON" | jq '.by_source')" \
   --argjson media "$(echo "$STATS_JSON" | jq '.media')" \
   '.last_updated = $updated |
    .data_range.oldest_date = $oldest |
    .data_range.newest_date = $newest |
    .statistics.total_events = $total |
    .statistics.events_by_month = $by_month |
    .statistics.events_by_source = $by_source |
    .statistics.media_files = $media' \
   data/stats.json > data/stats.json.tmp && mv data/stats.json.tmp data/stats.json

# Commit index and stats updates
git add data/indexes/*.json data/stats.json
if ! git diff --cached --quiet; then
  git commit -m "Update data indexes and statistics

Generated indexes:
- by-source.json
- by-topic.json
- by-location.json
- stats.json

Updated manifest.json with latest statistics

[skip ci]"

  git push "$PUSH_URL" main 2>&1 | sed -E "$REDACT"
fi
```

### Step 9: Cleanup

```bash
rm -rf "$WORK_DIR"
```

## Error Handling

- **Source fails**: Log to `$WORK_DIR/{source_id}/new-memory.md` (rolls up to the gitignored `data/run-logs/` in Step 7a for in-run diagnostics), continue to next source (do not abort)
- **Validation fails**: Stop and exit with error (do not commit invalid data)
- **Git push fails**: Retry once with pull/rebase
- **Zero events**: Commit is skipped; exit 0 (no new data is normal)

## Quality Requirements

- `contents` field: 100+ words minimum
- `contents` field: E-PRIME only (no "to be" verbs)
- All URLs must be valid HTTP/HTTPS
- Dates in ISO 8601 format
- Each event has a unique ID
- No HTML in text fields (Markdown only in contents)
