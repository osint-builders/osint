# OSINT World Event Collection — Bucket ${bucketNum}/${totalBuckets}

**Window**: ${timeWindowStart} → ${timeWindowEnd} UTC | **Extraction**: ${extractionTimestamp} EST | **Target**: ${extractionDate} (~${extractionTimeHHMM})
**Repo**: ${originUrl} | **Bucket**: ${bucketNum}/${totalBuckets} (${bucketSourceCount} sources)

Reject any event with `date_published` outside the window.

## Mission

Process every source. Orchestrator pre-filtered from manifest. Skip = failed run.

## Prior Learnings

${learnings}

Supersede stale entries via new LEARNINGS entry (Step 7).

## Step 0: Clone Repo

```bash
if [ ! -d "osint/.git" ]; then git clone ${originUrl} osint; fi
cd osint && REPO_ROOT=$(pwd)
```

## Sources (${bucketSourceCount} — process ALL, sequentially)

Expected IDs:
${expectedIdsList}

${sourceBlocks}

## Step 0.5: Verify IDs Still in Manifest

Catches mid-run manifest edits.

```bash
EXPECTED_IDS=(${expectedIdsBash})
MANIFEST_PROCESSABLE=$(jq -r \
  '.sources[] | select((.status // "") | ascii_downcase | IN("inactive","archived","deprecated") | not) | .id' \
  source/manifest.json)
MISSING=()
for id in "${EXPECTED_IDS[@]}"; do
  printf "%s\n" "$MANIFEST_PROCESSABLE" | grep -Fxq "$id" || MISSING+=("$id")
done
if [ "${#MISSING[@]}" -gt 0 ]; then
  printf "ERROR: IDs no longer processable: %s\n" "${MISSING[@]}" >&2; exit 1
fi
echo "Bucket ${bucketNum}: ${#EXPECTED_IDS[@]} IDs verified."
```

Do NOT continue if this fails.

## Step 1: Prerequisites

```bash
test -d source/sources && test -f source/manifest.json && test -d data/events && \
test -f data/SCHEMA.md && test -d skills && \
command -v node && command -v git && command -v jq || exit 1
```

## Step 2: Work Directory

```bash
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
WORK_DIR="/tmp/osint-collection-$TIMESTAMP-bucket${bucketNum}"
mkdir -p "$WORK_DIR/raw" "$WORK_DIR/media/images" "$WORK_DIR/media/videos"
TIME_WINDOW_START="${timeWindowStart}"
TIME_WINDOW_END="${timeWindowEnd}"
```

## Step 2.5: Pre-check All Sources

Before starting collection, verify every source in this bucket is reachable and has posted content in the past 6 hours. Run all checks **in parallel** using background bash jobs. Results are written to per-source files, then merged. Step 3 skips any source that fails.

**Non-blocking rule**: If `$TWITTER_BEARER_TOKEN` is unset, all Twitter checks automatically pass. If any individual check itself errors (network timeout, API 5xx), that source defaults to **pass** — false negatives are worse than false positives.

```bash
PRE_CHECK_DIR="$WORK_DIR/pre-checks"
mkdir -p "$PRE_CHECK_DIR"
PRE_CHECK_LOG="$WORK_DIR/pre-check.log"

# 6-hours-ago timestamp (Linux gnu date; macOS fallback)
_SIX_H_AGO=$(date -u -d '6 hours ago' +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || \
             date -u -v-6H +%Y-%m-%dT%H:%M:%SZ 2>/dev/null)

# Writes one JSON result file per source (no locking needed — one file per source)
_write_precheck() {
  local sid="$1" status="$2" reason="$3"
  printf '{"status":"%s","reason":"%s"}\n' "$status" "$reason" \
    > "$PRE_CHECK_DIR/$sid.json"
  printf '%s [%s] %s: %s\n' "$(date -u +%H:%M:%SZ)" "$status" "$sid" "$reason" \
    >> "$PRE_CHECK_LOG"
}

# --- Twitter pre-check ---
_check_twitter() {
  local sid="$1" handle="$2"
  if [ -z "$TWITTER_BEARER_TOKEN" ]; then
    _write_precheck "$sid" "pass" "TWITTER_BEARER_TOKEN not set — skipping"; return
  fi
  # 1. Verify account exists and is not protected
  local resp
  resp=$(curl -sf --max-time 10 \
    "https://api.twitter.com/2/users/by/username/$handle?user.fields=protected" \
    -H "Authorization: Bearer $TWITTER_BEARER_TOKEN" 2>/dev/null)
  if [ $? -ne 0 ] || echo "$resp" | jq -e '.errors' >/dev/null 2>&1; then
    _write_precheck "$sid" "pass" "user lookup error — defaulting to pass"; return
  fi
  if ! echo "$resp" | jq -e '.data' >/dev/null 2>&1; then
    _write_precheck "$sid" "fail" "@$handle: account not found or suspended"; return
  fi
  if echo "$resp" | jq -e '.data.protected == true' >/dev/null 2>&1; then
    _write_precheck "$sid" "fail" "@$handle: account is protected (private)"; return
  fi
  local uid
  uid=$(echo "$resp" | jq -r '.data.id')
  # 2. Check for tweets in the past 6 hours
  local tweets
  tweets=$(curl -sf --max-time 10 \
    "https://api.twitter.com/2/users/$uid/tweets?max_results=5&start_time=$_SIX_H_AGO&tweet.fields=created_at" \
    -H "Authorization: Bearer $TWITTER_BEARER_TOKEN" 2>/dev/null)
  if [ $? -ne 0 ]; then
    _write_precheck "$sid" "pass" "tweet lookup error — defaulting to pass"; return
  fi
  local count
  count=$(echo "$tweets" | jq -r '.meta.result_count // 0')
  if [ "$count" -eq 0 ]; then
    _write_precheck "$sid" "fail" "@$handle: no tweets in the past 6 hours"; return
  fi
  _write_precheck "$sid" "pass" "@$handle: $count tweet(s) in past 6h"
}

# --- Webpage pre-check ---
_check_webpage() {
  local sid="$1" url="$2" keywords="$3"
  # 1. Reachability: HTTP HEAD
  local http_code
  http_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 -L "$url" 2>/dev/null)
  if [[ ! "$http_code" =~ ^[23] ]]; then
    _write_precheck "$sid" "fail" "$url unreachable: HTTP ${http_code:-000}"; return
  fi
  # 2. Fetch first 20 KB for freshness + keyword checks
  local body
  body=$(curl -sf --max-time 15 -L -r 0-20480 "$url" 2>/dev/null)
  if [ -z "$body" ]; then
    _write_precheck "$sid" "pass" "$url resolves (HTTP $http_code) — body empty, continuing"; return
  fi
  # Freshness: look for ISO datetime strings within the past 6 hours
  local six_h_ts
  six_h_ts=$(date -u -d '6 hours ago' +%s 2>/dev/null || date -u -v-6H +%s 2>/dev/null)
  local recent=false
  while IFS= read -r ds; do
    local ts
    ts=$(date -u -d "$ds" +%s 2>/dev/null) && [ -n "$ts" ] && [ "$ts" -gt "$six_h_ts" ] && { recent=true; break; }
  done < <(echo "$body" | grep -oP '\d{4}-\d{2}-\d{2}T\d{2}:\d{2}' | head -20)
  # Keyword presence (at least one keyword from the source Keywords line)
  local kw_found=false
  for kw in $(echo "$keywords" | tr ',' ' ' | tr -d '\r'); do
    echo "$body" | grep -qi "$kw" && { kw_found=true; break; }
  done
  if [ "$recent" = "false" ] && [ "$kw_found" = "false" ]; then
    _write_precheck "$sid" "fail" "$url: no recent content (<6h) and no matching keywords"; return
  fi
  _write_precheck "$sid" "pass" "$url resolves (HTTP $http_code) — content appears fresh and relevant"
}

# Launch all checks in parallel
PCHECK_PIDS=()
for sid in "${EXPECTED_IDS[@]}"; do
  src_file="$REPO_ROOT/$(jq -r --arg id "$sid" '.sources[] | select(.id==$id) | .file' source/manifest.json)"
  src_type=$(jq -r --arg id "$sid" '.sources[] | select(.id==$id) | .type' source/manifest.json)
  if [ "$src_type" = "twitter" ]; then
    handle=$(grep -oP '(?<=\(@)\w+(?=\))' "$src_file" | head -1)
    [ -n "$handle" ] && { _check_twitter "$sid" "$handle" & PCHECK_PIDS+=($!); } || \
      _write_precheck "$sid" "pass" "handle not parseable — skipping"
  elif [ "$src_type" = "webpage" ]; then
    url=$(grep -m1 '^url:' "$src_file" | awk '{print $2}')
    keywords=$(grep -m1 '^Keywords:' "$src_file" | sed 's/^Keywords:[[:space:]]*//')
    [ -n "$url" ] && { _check_webpage "$sid" "$url" "$keywords" & PCHECK_PIDS+=($!); } || \
      _write_precheck "$sid" "pass" "url field missing — skipping"
  else
    _write_precheck "$sid" "pass" "type '$src_type' has no pre-check"
  fi
done

# Wait for all background checks to finish
for pid in "${PCHECK_PIDS[@]}"; do wait "$pid" 2>/dev/null || true; done

# Merge per-source files into a single results JSON
PRE_CHECK_RESULTS="$WORK_DIR/pre-check-results.json"
result='{}'
for f in "$PRE_CHECK_DIR"/*.json; do
  [ -f "$f" ] || continue
  sid=$(basename "$f" .json)
  data=$(cat "$f")
  result=$(printf '%s' "$result" | jq --arg id "$sid" --argjson d "$data" '. + {($id): $d}')
done
printf '%s\n' "$result" > "$PRE_CHECK_RESULTS"

pass_count=$(jq '[.[] | select(.status=="pass")] | length' "$PRE_CHECK_RESULTS")
fail_count=$(jq '[.[] | select(.status=="fail")] | length' "$PRE_CHECK_RESULTS")
echo "Pre-check: $pass_count pass, $fail_count skip"
if [ "$fail_count" -gt 0 ]; then
  jq -r 'to_entries[] | select(.value.status=="fail") | "  SKIP \(.key): \(.value.reason)"' \
    "$PRE_CHECK_RESULTS"
fi
```

## Step 3: Process Each Source

Per source:

1. **Read** source file — collection method, selectors, auth, quality indicators.
   **Skip if pre-check failed**: Before doing anything else for each source, check:
   ```bash
   pc_status=$(jq -r --arg id "$source_id" '.[$id].status // "pass"' "$WORK_DIR/pre-check-results.json" 2>/dev/null)
   if [ "$pc_status" = "fail" ]; then
     reason=$(jq -r --arg id "$source_id" '.[$id].reason' "$WORK_DIR/pre-check-results.json")
     printf '[SKIP] %s: pre-check failed: %s\n' "$source_id" "$reason" \
       >> "$WORK_DIR/$source_id/new-memory.md"
     continue  # move to next source
   fi
   ```
2. **Collect** with time filtering:
   - Twitter/X: `agent-browser` or Twitter API (`$TWITTER_BEARER_TOKEN`); filter by timestamp to window.
     - **Tweet permalink REQUIRED as `links[0]`**: The direct tweet URL (`https://x.com/{handle}/status/{tweet_id}`) MUST be the FIRST entry in `links[]` labeled `"Original Tweet"`. Corroborating article links follow. Never omit the original tweet URL.
   - Webpage: `agent-browser` + CSS selectors; parse publish dates; skip outside window.
   - API: `curl` with auth; add time range params where supported.
   - RSS: `curl` + XML parse; filter by `pubDate`.
   - Log and reject anything outside `$TIME_WINDOW_START`→`$TIME_WINDOW_END`.
3. **Translate to English** — if raw content contains non-English text, translate `title`, `summary`, and all body text to English before extraction. Agent translates directly using its own capabilities — no external API needed. Preserve proper nouns (person names, place names, organization names) verbatim. Apply E-PRIME after translation.
4. **Extract** World Event Entities per `data/SCHEMA.md`.
   - Topics: lowercase, hyphenated, singular (`missile` not `Missiles`). Deduplicate per event.
   - `source.name`: exact text from source file `#` header. No variants.
5. **Transform** `contents` to E-PRIME — strip all `is/are/was/were/be/been/being`. Active verbs only. See `skills/data-to-markdown/SKILL.md`.
6. **Geocode** every event — REQUIRED. Every event needs `geo.lat` and `geo.lon`.
   - Extract city/region/country from title+summary+contents.
   - Run `geocode_location()` (defined below).
   - Fallback: specific city → country → region center → global default (37.7749, −122.4194).
   - Nominatim rate limit: 1 req/sec.
7. **Confidence validation** (high-priority events only):
   - Trigger: `priority="high"` OR topics include `conflict/military/attack/disaster/sanctions/nuclear`.
   - Run `validate_event_confidence()` (defined below); cap at 50 calls/bucket.
8. **Images** (non-Twitter only — Twitter images require auth, skip):
   For Twitter/X sources, set `image_urls: []` immediately and skip the rest of this step.
   - `curl` og:image or article hero; normalize: `magick INPUT -resize 720x720^ -gravity center -extent 720x720 +repage -strip -define png:compression-level=9 OUTPUT.png`
   - Save to `$WORK_DIR/{source_id}/media/images/{event_id}_img1.png`.
   - Update `image_urls`: `["./media/YYYY-MM/images/YYYY-MM-DD/{event_id}_img1.png"]`.
   - Image failure never blocks an event.
8.5. **Fetch link preview for `links[0]`** (all sources — non-blocking):

Before saving each event to JSONL, store the finalized event JSON in `$event_json` and run:

```bash
# event_json must hold the complete event JSON object at this point.
# Fetch link preview — enriches event with title/description/image from its primary URL.
if [ -n "$LINKPREVIEW_API_KEY" ]; then
  FIRST_LINK=$(echo "$event_json" | jq -r '.links[0].url // empty')
  if [ -n "$FIRST_LINK" ]; then
    ENCODED_URL=$(printf '%s' "$FIRST_LINK" | jq -sRr @uri)
    PREVIEW_JSON=$(curl -sf --max-time 8 \
      "https://api.linkpreview.net/?q=$ENCODED_URL" \
      -H "X-Linkpreview-Api-Key: $LINKPREVIEW_API_KEY" 2>/dev/null || echo '{}')
    if echo "$PREVIEW_JSON" | jq -e '.image | type == "string"' >/dev/null 2>&1; then
      event_json=$(echo "$event_json" | jq --argjson preview "$PREVIEW_JSON" \
        '. + {link_preview: $preview}')
    fi
    sleep 1  # respect rate limits (one request per second)
  fi
fi
# Use $event_json (now enriched with link_preview) as the value written in step 8.
```

9. **Save** to `$WORK_DIR/{source_id}/events.jsonl` — one JSON object per line.
10. **Log** errors, rate limits, rejects to `$WORK_DIR/{source_id}/new-memory.md`.

Required event fields: `id`, `source`, `title`, `summary`, `contents` (≥100 words, E-PRIME), `date_published`, `links`, `geo` (lat+lon), `image_urls`.
ID format: `evt_${extractionDateCompact}_NNN`

Skills (read SKILL.md first): `agent-browser`, `perplexity-search`, `data-to-markdown`, `world-event-entities`, `remember-as-you-go`.

### Geocoding Helper

```bash
GEOCODING_CACHE="/tmp/geocoding-cache-${bucketNum}.json"
echo '{}' > "$GEOCODING_CACHE"

geocode_location() {
  local location="$1"
  cached=$(jq -r --arg loc "$location" '.[$loc] // empty' "$GEOCODING_CACHE" 2>/dev/null)
  [ -n "$cached" ] && { echo "$cached"; return 0; }
  local encoded=$(printf '%s' "$location" | jq -sRr @uri)
  sleep 1
  result=$(curl -s "https://nominatim.openstreetmap.org/search?q=$encoded&format=json&limit=1" \
    | jq -r 'if length > 0 then {lat: .[0].lat, lon: .[0].lon, display_name: .[0].display_name} else {lat: null, lon: null, display_name: null} end')
  tmp_cache=$(jq --arg loc "$location" --argjson res "$result" '. + {($loc): $res}' "$GEOCODING_CACHE")
  echo "$tmp_cache" > "$GEOCODING_CACHE"
  echo "$result"
}
# GEO=$(geocode_location "Gaziantep, Turkey"); LAT=$(echo "$GEO" | jq -r '.lat'); LON=$(echo "$GEO" | jq -r '.lon')
```

### Confidence Validation Helper

```bash
RESEARCH_COUNT=0
MAX_RESEARCH_CALLS=50

validate_event_confidence() {
  local event_json="$1"
  local priority=$(echo "$event_json" | jq -r '.priority // "medium"')
  local topics=$(echo "$event_json" | jq -r '.topics // [] | join(",")')
  local initial_confidence=$(echo "$event_json" | jq -r '.confidence // 0.7')
  local title=$(echo "$event_json" | jq -r '.title')
  local summary=$(echo "$event_json" | jq -r '.summary')

  if [[ "$priority" != "high" ]] && ! echo "$topics" | grep -qiE "(conflict|military|attack|disaster|sanctions|nuclear)"; then
    echo "$event_json"; return 0
  fi
  [[ $RESEARCH_COUNT -ge $MAX_RESEARCH_CALLS ]] && { echo "$event_json"; return 0; }
  RESEARCH_COUNT=$((RESEARCH_COUNT + 1))

  RESEARCH_QUERY="Verify this OSINT event from the last hour. Event: $title. Details: $summary. Search only sources from the last few hours."

  if [ -n "$PERPLEXITY_API_KEY" ]; then
    research_result=$(curl -s https://api.perplexity.ai/chat/completions \
      -H "Authorization: Bearer $PERPLEXITY_API_KEY" \
      -H "Content-Type: application/json" \
      -d "$(jq -n \
        --arg model "sonar-pro" \
        --arg content "$RESEARCH_QUERY" \
        --arg recency "hour" \
        '{model: $model, search_recency_filter: $recency, messages: [{role: "user", content: $content}]}')" \
      | jq -r '.choices[0].message.content // "Research unavailable"')

    adj=0
    echo "$research_result" | grep -qi "confirmed\|verified\|corroborated" && adj=$(echo "$adj + 0.1" | bc)
    echo "$research_result" | grep -qi "contradicts\|disputed\|false" && adj=$(echo "$adj - 0.3" | bc)
    echo "$research_result" | grep -qi "no information\|unconfirmed\|unable to verify" && adj=$(echo "$adj - 0.1" | bc)
    source_count=$(echo "$research_result" | grep -oiE "(reuters|bbc|ap|cnn|nyt)" | sort -u | wc -l)
    [ "$source_count" -ge 3 ] && adj=$(echo "$adj + 0.2" | bc)

    final=$(echo "$initial_confidence + $adj" | bc)
    (( $(echo "$final > 1.0" | bc -l) )) && final="1.0"
    (( $(echo "$final < 0.0" | bc -l) )) && final="0.0"

    confidence_section="\n\n## Confidence Assessment\n\nInitial: $initial_confidence | Adjustment: $adj | Final: $final\n\nResearch (500 chars): $(echo "$research_result" | head -c 500)..."
    echo "$event_json" | jq --arg conf "$final" --arg section "$confidence_section" \
      '.confidence = ($conf | tonumber) | .contents += $section'
  else
    echo "$event_json"
  fi
}
```

## Step 4: Validate

```bash
find "$WORK_DIR" -name "events.jsonl" -type f | while read f; do
  node "$REPO_ROOT/data/scripts/validate-events.js" "$f" \
    --strict \
    --time-window "$TIME_WINDOW_START" "$TIME_WINDOW_END" \
    || { echo "ERROR: validation failed for $f"; exit 1; }
done
```

`--strict`: requires `geo.lat`/`geo.lon`, rejects "to be". `--time-window`: rejects outside window. Failure → abort — do not proceed to Step 5.

## Step 5: Move Events

```bash
YEAR_MONTH="${yearMonth}"
DATE="${extractionDate}"
mkdir -p "data/events/$YEAR_MONTH"
TARGET="data/events/$YEAR_MONTH/$DATE.jsonl"
touch "$TARGET"
SEEN_URLS=$(jq -r '.links[0].url // empty' "$TARGET" 2>/dev/null | sort -u)

find "$WORK_DIR" -name "events.jsonl" -type f | while read f; do
  while IFS= read -r line; do
    EVENT_URL=$(printf '%s' "$line" | jq -r '.links[0].url // empty')
    if [ -z "$EVENT_URL" ] || ! printf '%s\n' "$SEEN_URLS" | grep -qF "$EVENT_URL"; then
      printf '%s\n' "$line"
    fi
  done < "$f"
done >> "$TARGET"

jq -sc 'unique_by(.id) | .[]' "$TARGET" > "$TARGET.tmp" && mv "$TARGET.tmp" "$TARGET"
```

## Step 6: Move Media

```bash
mkdir -p "data/media/$YEAR_MONTH/images/$DATE" "data/media/$YEAR_MONTH/videos/$DATE"
find "$WORK_DIR/media" -type f \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" -o -name "*.webp" \) \
  -exec mv {} "data/media/$YEAR_MONTH/images/$DATE/" \; 2>/dev/null || true
find "$WORK_DIR/media" -type f \( -name "*.mp4" -o -name "*.webm" -o -name "*.mov" \) \
  -exec mv {} "data/media/$YEAR_MONTH/videos/$DATE/" \; 2>/dev/null || true
```

## Step 7: Logs + Learnings

### 7a. Run Log (every run — gitignored)

```bash
mkdir -p "data/run-logs/$YEAR_MONTH"
{ echo ""; echo "## Bucket ${bucketNum} @ ${executionTimestamp}"; cat "$WORK_DIR"/*/new-memory.md 2>/dev/null || true; } \
  >> "data/run-logs/$YEAR_MONTH/$DATE.log"
```

Per-source telemetry goes here. Next run ignores.

### 7b. LEARNINGS.md (only when justified)

See `skills/remember-as-you-go/SKILL.md` for full criteria. Append only when:
1. Source selector/handle/auth changed — working approach found.
2. Non-obvious shortcut saved time or API calls.
3. Repeated failure (≥3 runs) with a known mitigation.
4. Schema/validation gap — plus the workaround.
5. Cost or budget signal worth surfacing.

No telemetry in LEARNINGS.md. Dedup check first:

```bash
if grep -qi "KEYWORD" LEARNINGS.md 2>/dev/null; then
  echo "[skip] Similar LEARNINGS entry exists"
else
  # append after <!-- entries below this line; newest first --> marker
fi
```

Required format:
```markdown
## YYYY-MM-DD HH:MMZ — <topic>
**Trigger:** ...
**Finding:** ...
**Action for next run:** ...
**Expires:** YYYY-MM-DD | permanent
```

## Step 8: Commit + Push

**CRITICAL: Never open a pull request. Never use `gh pr create` or any equivalent. Commit directly to `main`. If all push attempts fail, exit 1 — never open a PR.**

```bash
git config user.name "OSINT Collector Bot"
git config user.email "osint-bot@github-actions"
git add "data/events/$YEAR_MONTH/$DATE.jsonl" "data/media/$YEAR_MONTH/" "LEARNINGS.md" 2>/dev/null || true

if ! git diff --cached --quiet; then
  EVENT_COUNT=$(wc -l < "data/events/$YEAR_MONTH/$DATE.jsonl")
  git commit -m "Collect $EVENT_COUNT world events on $DATE

Bucket ${bucketNum}/${totalBuckets} | ${executionTimestamp} UTC | [skip ci]"

  PUSH_TOKEN="${OSINT_GH_TOKEN:-$GH_TOKEN}"
  [ -z "$PUSH_TOKEN" ] && { echo "ERROR: No push token." >&2; exit 1; }
  REPO_PATH=$(git remote get-url origin | sed -E 's|^git@github\.com:|https://github.com/|; s|^https?://github\.com/||; s|\.git$||')
  PUSH_URL="https://x-access-token:$PUSH_TOKEN@github.com/$REPO_PATH.git"
  REDACT='s|https://[^@]+@|https://<redacted>@|g'

  PUSHED=0
  for ATTEMPT in 1 2 3 4 5; do
    git pull --rebase "$PUSH_URL" main 2>&1 | sed -E "$REDACT"
    git push "$PUSH_URL" main 2>&1 | sed -E "$REDACT"
    PUSH_RC=${PIPESTATUS[0]}
    if [ "$PUSH_RC" -eq 0 ]; then PUSHED=1; break; fi
    JITTER=$(( RANDOM % 9 + 2 ))
    echo "Push attempt $ATTEMPT/5 failed; retrying in $JITTER seconds..."
    sleep "$JITTER"
  done

  if [ "$PUSHED" -eq 0 ]; then
    echo "ERROR: Push to main failed after 5 attempts. Do NOT open a pull request — exit and let the next scheduled run collect fresh events." >&2
    exit 1
  fi
fi
```

Indexes + `data/stats.json` rebuild via `embeddings.yml` post-run — agent does not run `rebuild-indexes.js`.

## Step 9: Cleanup

```bash
rm -rf "$WORK_DIR"
```

## Error Handling

- **Source fails**: log to `$WORK_DIR/{source_id}/new-memory.md`, continue.
- **Validation fails**: exit — never commit invalid data.
- **Git push fails**: pull/rebase + retry up to 5 attempts with random jitter. Never open a PR on failure.
- **Zero events**: skip commit, exit 0.

## Quality Requirements

- `contents`: ≥100 words, E-PRIME, Markdown (no HTML).
- URLs: valid HTTP/HTTPS. Dates: ISO 8601. IDs: unique per event.
