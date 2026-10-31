#!/usr/bin/env bash
# identify.sh — cheap, non-LLM "tip" scan across processable sources.
#
# For each source with new-in-window content, writes one lightweight tip
# record per source to data/queue/pending/<source-id>-<epoch>.json for the
# qualify workflow to pick up later. No LLM, no Warp agent — pure curl/jq
# (+ python3 for Telegram HTML parsing), meant to run directly on a GitHub
# Actions runner. This intentionally mirrors precheck.sh's per-type source
# parsing (same manifest/front-matter conventions) but captures actual
# candidate URLs + snippets instead of a pass/fail verdict.
#
# Usage (from repo root):
#   TIME_WINDOW_START=<ISO8601 UTC> TIME_WINDOW_END=<ISO8601 UTC> \
#     bash builder/runtime/identify.sh <id> [<id> ...]
# Env: TWITTER_BEARER_TOKEN (optional; twitter sources produce no tips without it)
set -uo pipefail

: "${TIME_WINDOW_START:?TIME_WINDOW_START must be an ISO8601 UTC timestamp}"
: "${TIME_WINDOW_END:?TIME_WINDOW_END must be an ISO8601 UTC timestamp}"
[ "$#" -ge 1 ] || { echo "usage: identify.sh <id> [<id> ...]" >&2; exit 2; }

QUEUE_DIR="data/queue/pending"
mkdir -p "$QUEUE_DIR"

MAX_CANDIDATES=3
# Worker exit code 10 means one tip was written; 0 means a clean no-hit scan.
TIP_WRITTEN_STATUS=10
WINDOW_START_TS=$(date -u -d "$TIME_WINDOW_START" +%s) || { echo "identify: invalid TIME_WINDOW_START" >&2; exit 2; }
WINDOW_END_TS=$(date -u -d "$TIME_WINDOW_END" +%s) || { echo "identify: invalid TIME_WINDOW_END" >&2; exit 2; }
[ "$WINDOW_START_TS" -lt "$WINDOW_END_TS" ] || { echo "identify: scan window must have start before end" >&2; exit 2; }

_warn() {
  printf 'WARN %s: %s\n' "$1" "$2" >&2
}

_write_tip() {
  # $1=sid $2=name $3=type $4=candidates(JSON array)
  local sid="$1" name="$2" type="$3" candidates="$4" n
  n=$(printf '%s' "$candidates" | jq -e 'if type == "array" then length else error("candidates must be an array") end' 2>/dev/null) || {
    _warn "$sid" "candidate parser returned invalid data"
    return 1
  }
  [ "$n" -gt 0 ] || return 0
  local out timestamp
  out="$QUEUE_DIR/${sid}-$(date +%s%N).json"
  timestamp=$(date -u +%Y-%m-%dT%H:%M:%S.%NZ)
  timestamp="${timestamp:0:23}Z"
  if ! jq -nc --arg sid "$sid" --arg name "$name" --arg type "$type" \
    --arg ws "$TIME_WINDOW_START" --arg we "$TIME_WINDOW_END" \
    --arg ts "$timestamp" --argjson candidates "$candidates" \
    '{source_id:$sid, source_name:$name, type:$type, window_start:$ws, window_end:$we, identified_at:$ts, candidates:$candidates}' \
    > "$out"; then
    rm -f -- "$out"
    _warn "$sid" "could not write pending tip"
    return 1
  fi
  echo "  TIP  $sid: $n candidate(s) -> $out"
  return "$TIP_WRITTEN_STATUS"
}

_identify_twitter() {
  local sid="$1" name="$2" handle="$3"
  local resp uid tweets candidates
  if ! resp=$(curl -sf --max-time 10 "https://api.twitter.com/2/users/by/username/$handle" \
    -H "Authorization: Bearer $TWITTER_BEARER_TOKEN" 2>/dev/null); then
    _warn "$sid" "Twitter account fetch failed"
    return 1
  fi
  if ! uid=$(printf '%s' "$resp" | jq -er '.data.id // empty' 2>/dev/null); then
    _warn "$sid" "Twitter account response lacked a user ID"
    return 1
  fi
  if ! tweets=$(curl -sf --max-time 10 \
    "https://api.twitter.com/2/users/$uid/tweets?max_results=10&start_time=$TIME_WINDOW_START&end_time=$TIME_WINDOW_END&tweet.fields=created_at,text" \
    -H "Authorization: Bearer $TWITTER_BEARER_TOKEN" 2>/dev/null); then
    _warn "$sid" "Twitter timeline fetch failed"
    return 1
  fi
  if ! candidates=$(printf '%s' "$tweets" | jq -c --arg handle "$handle" --argjson limit "$MAX_CANDIDATES" \
    '[.data[]? | {url: ("https://x.com/" + $handle + "/status/" + .id), snippet: ((.text // "")[0:280]), published_at: .created_at}] | .[0:$limit]' 2>/dev/null); then
    _warn "$sid" "Twitter timeline parser failed"
    return 1
  fi
  _write_tip "$sid" "$name" "twitter" "$candidates"
}

_identify_reddit() {
  local sid="$1" name="$2" subreddit="$3"
  local resp candidates
  if ! resp=$(curl -sf --max-time 10 "https://www.reddit.com/r/$subreddit/new.json?limit=25&raw_json=1" \
    -A "osint-bot/1.0" 2>/dev/null); then
    _warn "$sid" "Reddit feed fetch failed"
    return 1
  fi
  if ! candidates=$(printf '%s' "$resp" | jq -c --argjson ws "$WINDOW_START_TS" --argjson we "$WINDOW_END_TS" --argjson limit "$MAX_CANDIDATES" \
    'if (.data.children | type) == "array" then
      [.data.children[].data | select(.created_utc > $ws and .created_utc <= $we) | {url: ("https://reddit.com" + .permalink), snippet: ((.title // "")[0:280]), published_at: (.created_utc | todate)}] | .[0:$limit]
    else error("missing Reddit posts") end' 2>/dev/null); then
    _warn "$sid" "Reddit feed parser failed"
    return 1
  fi
  _write_tip "$sid" "$name" "reddit" "$candidates"
}

_identify_telegram() {
  local sid="$1" name="$2" channel="$3"
  local body candidates
  if ! body=$(curl -sf --max-time 15 "https://t.me/s/$channel" 2>/dev/null); then
    _warn "$sid" "Telegram channel fetch failed"
    return 1
  fi
  if ! candidates=$(TG_CHANNEL="$channel" TG_WS="$TIME_WINDOW_START" TG_WE="$TIME_WINDOW_END" TG_MAX="$MAX_CANDIDATES" \
    python3 -c '
import os, re, json
from datetime import datetime
body = open(0).read()
channel = os.environ["TG_CHANNEL"]
ws = datetime.fromisoformat(os.environ["TG_WS"].replace("Z", "+00:00"))
we = datetime.fromisoformat(os.environ["TG_WE"].replace("Z", "+00:00"))
limit = int(os.environ["TG_MAX"])
posts = re.findall(r"data-post=\"" + re.escape(channel) + r"/(\d+)\"", body)
times = re.findall(r"<time[^>]*datetime=\"([^\"]+)\"", body)
if not posts or not times:
    raise ValueError("Telegram posts or timestamps missing")
out = []
for pid, iso in zip(posts, times):
    try:
        t = datetime.fromisoformat(iso.replace("Z", "+00:00"))
    except ValueError:
        continue
    if ws < t <= we:
        out.append({"url": f"https://t.me/{channel}/{pid}", "snippet": "", "published_at": iso})
print(json.dumps(out[:limit]))
' <<< "$body" 2>/dev/null); then
    _warn "$sid" "Telegram channel parser failed"
    return 1
  fi
  _write_tip "$sid" "$name" "telegram" "$candidates"
}

_identify_webpage() {
  local sid="$1" name="$2" url="$3"
  local body recent_ts="" snippet candidates saw_timestamp=0
  if ! body=$(curl -sf --max-time 15 -L "$url" 2>/dev/null); then
    _warn "$sid" "webpage/API fetch failed"
    return 1
  fi
  while IFS= read -r ds; do
    local ts
    ts=$(date -u -d "$ds" +%s 2>/dev/null) || continue
    saw_timestamp=1
    if [ "$ts" -gt "$WINDOW_START_TS" ] && [ "$ts" -le "$WINDOW_END_TS" ]; then recent_ts="$ds"; break; fi
  done < <(printf '%s' "$body" | grep -oP '\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?' | sed -n '1,20p')
  if [ "$saw_timestamp" -eq 0 ]; then
    _warn "$sid" "webpage/API response lacked a parseable ISO timestamp"
    return 1
  fi
  [ -n "$recent_ts" ] || return 0
  snippet=$(printf '%s' "$body" | tr -s ' \t\n\r' ' ' | cut -c1-280)
  if ! candidates=$(jq -nc --arg url "$url" --arg snippet "$snippet" --arg ts "$recent_ts" \
    '[{url:$url, snippet:$snippet, published_at:$ts}]'); then
    _warn "$sid" "webpage/API candidate parser failed"
    return 1
  fi
  _write_tip "$sid" "$name" "webpage" "$candidates"
}

PIDS=()
PID_SOURCE_IDS=()
ATTEMPTED=0
SUCCEEDED=0
FAILED=0
SKIPPED=0
TWITTER_SKIPPED=0
TIPS=0
for sid in "$@"; do
  if ! source_record=$(jq -er --arg id "$sid" '.sources[] | select(.id==$id) | [.file, .name, .type] | @tsv' source/manifest.json); then
    _warn "$sid" "source missing from manifest or manifest unreadable"
    ATTEMPTED=$((ATTEMPTED + 1))
    FAILED=$((FAILED + 1))
    continue
  fi
  IFS=$'\t' read -r src_rel src_name src_type <<< "$source_record"
  src_file="source/$src_rel"
  if [ ! -f "$src_file" ]; then
    _warn "$sid" "source file missing: $src_file"
    ATTEMPTED=$((ATTEMPTED + 1))
    FAILED=$((FAILED + 1))
    continue
  fi

  if [ "$src_type" = "twitter" ]; then
    if [ -z "${TWITTER_BEARER_TOKEN:-}" ]; then
      SKIPPED=$((SKIPPED + 1))
      TWITTER_SKIPPED=$((TWITTER_SKIPPED + 1))
      continue
    fi
    handle=$(grep -m1 -oP '(?<=\(@)\w+(?=\))' "$src_file" 2>/dev/null)
    if [ -z "$handle" ]; then
      _warn "$sid" "Twitter handle missing from source file"
      FAILED=$((FAILED + 1))
    else
      _identify_twitter "$sid" "$src_name" "$handle" &
      PIDS+=("$!")
      PID_SOURCE_IDS+=("$sid")
    fi
    ATTEMPTED=$((ATTEMPTED + 1))
  elif [[ "$sid" == reddit-* ]]; then
    subreddit=$(grep -m1 -oP '(?<=r/)\w+(?= \()' "$src_file" 2>/dev/null)
    if [ -z "$subreddit" ]; then
      _warn "$sid" "Reddit subreddit missing from source file"
      FAILED=$((FAILED + 1))
    else
      _identify_reddit "$sid" "$src_name" "$subreddit" &
      PIDS+=("$!")
      PID_SOURCE_IDS+=("$sid")
    fi
    ATTEMPTED=$((ATTEMPTED + 1))
  elif [ "$src_type" = "telegram" ]; then
    channel=$(grep -m1 '^channel:' "$src_file" | sed 's/^channel:[[:space:]]*//' | tr -d '\r')
    if [ -z "$channel" ]; then
      _warn "$sid" "Telegram channel missing from source file"
      FAILED=$((FAILED + 1))
    else
      _identify_telegram "$sid" "$src_name" "$channel" &
      PIDS+=("$!")
      PID_SOURCE_IDS+=("$sid")
    fi
    ATTEMPTED=$((ATTEMPTED + 1))
  elif [ "$src_type" = "webpage" ] || [ "$src_type" = "api" ]; then
    url=$(grep -m1 '^url:' "$src_file" | sed 's/^url:[[:space:]]*//' | tr -d '\r')
    if [ -z "$url" ]; then
      _warn "$sid" "webpage/API URL missing from source file"
      FAILED=$((FAILED + 1))
    else
      _identify_webpage "$sid" "$src_name" "$url" &
      PIDS+=("$!")
      PID_SOURCE_IDS+=("$sid")
    fi
    ATTEMPTED=$((ATTEMPTED + 1))
  else
    SKIPPED=$((SKIPPED + 1))
  fi
done

for i in "${!PIDS[@]}"; do
  if wait "${PIDS[$i]}"; then
    SUCCEEDED=$((SUCCEEDED + 1))
  else
    worker_status=$?
    if [ "$worker_status" -eq "$TIP_WRITTEN_STATUS" ]; then
      SUCCEEDED=$((SUCCEEDED + 1))
      TIPS=$((TIPS + 1))
    else
      FAILED=$((FAILED + 1))
      [ "$worker_status" -eq 1 ] || _warn "${PID_SOURCE_IDS[$i]}" "scan stopped with exit status $worker_status"
    fi
  fi
done

NO_HIT=$((SUCCEEDED - TIPS))
echo "identify: coverage attempted=$ATTEMPTED succeeded=$SUCCEEDED no-hit=$NO_HIT failed=$FAILED skipped=$SKIPPED tips=$TIPS"
if [ "$TWITTER_SKIPPED" -gt 0 ]; then
  echo "identify: skipped $TWITTER_SKIPPED Twitter source(s) because TWITTER_BEARER_TOKEN is unavailable." >&2
fi
if [ "$ATTEMPTED" -gt 0 ] && [ "$FAILED" -eq "$ATTEMPTED" ]; then
  echo "identify: all attempted sources failed; refusing a green scan." >&2
  exit 1
fi
