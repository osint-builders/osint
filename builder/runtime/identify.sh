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
WINDOW_START_TS=$(date -u -d "$TIME_WINDOW_START" +%s)
WINDOW_END_TS=$(date -u -d "$TIME_WINDOW_END" +%s)

_write_tip() {
  # $1=sid $2=name $3=type $4=candidates(JSON array)
  local sid="$1" name="$2" type="$3" candidates="$4" n
  n=$(printf '%s' "$candidates" | jq 'length' 2>/dev/null || echo 0)
  [ "$n" -gt 0 ] || return 0
  local out
  out="$QUEUE_DIR/${sid}-$(date +%s%N).json"
  jq -nc --arg sid "$sid" --arg name "$name" --arg type "$type" \
    --arg ws "$TIME_WINDOW_START" --arg we "$TIME_WINDOW_END" \
    --arg ts "$(date -u +%Y-%m-%dT%H:%M:%SZ)" --argjson candidates "$candidates" \
    '{source_id:$sid, source_name:$name, type:$type, window_start:$ws, window_end:$we, identified_at:$ts, candidates:$candidates}' \
    > "$out"
  echo "  TIP  $sid: $n candidate(s) -> $out"
}

_identify_twitter() {
  local sid="$1" name="$2" handle="$3"
  [ -n "${TWITTER_BEARER_TOKEN:-}" ] || return 0
  local resp uid tweets candidates
  resp=$(curl -sf --max-time 10 "https://api.twitter.com/2/users/by/username/$handle" \
    -H "Authorization: Bearer $TWITTER_BEARER_TOKEN" 2>/dev/null) || return 0
  uid=$(printf '%s' "$resp" | jq -r '.data.id // empty')
  [ -n "$uid" ] || return 0
  tweets=$(curl -sf --max-time 10 \
    "https://api.twitter.com/2/users/$uid/tweets?max_results=10&start_time=$TIME_WINDOW_START&tweet.fields=created_at,text" \
    -H "Authorization: Bearer $TWITTER_BEARER_TOKEN" 2>/dev/null) || return 0
  candidates=$(printf '%s' "$tweets" | jq -c --arg handle "$handle" --argjson limit "$MAX_CANDIDATES" \
    '[.data[]? | {url: ("https://x.com/" + $handle + "/status/" + .id), snippet: ((.text // "")[0:280]), published_at: .created_at}] | .[0:$limit]')
  _write_tip "$sid" "$name" "twitter" "${candidates:-[]}"
}

_identify_reddit() {
  local sid="$1" name="$2" subreddit="$3"
  local resp candidates
  resp=$(curl -sf --max-time 10 "https://www.reddit.com/r/$subreddit/new.json?limit=25&raw_json=1" \
    -A "osint-bot/1.0" 2>/dev/null) || return 0
  candidates=$(printf '%s' "$resp" | jq -c --argjson ws "$WINDOW_START_TS" --argjson we "$WINDOW_END_TS" --argjson limit "$MAX_CANDIDATES" \
    '[.data.children[]?.data | select(.created_utc > $ws and .created_utc <= $we) | {url: ("https://reddit.com" + .permalink), snippet: ((.title // "")[0:280]), published_at: (.created_utc | todate)}] | .[0:$limit]')
  _write_tip "$sid" "$name" "reddit" "${candidates:-[]}"
}

_identify_telegram() {
  local sid="$1" name="$2" channel="$3"
  local body candidates
  body=$(curl -sf --max-time 15 "https://t.me/s/$channel" 2>/dev/null) || return 0
  candidates=$(TG_CHANNEL="$channel" TG_WS="$TIME_WINDOW_START" TG_WE="$TIME_WINDOW_END" TG_MAX="$MAX_CANDIDATES" \
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
out = []
for pid, iso in zip(posts, times):
    try:
        t = datetime.fromisoformat(iso.replace("Z", "+00:00"))
    except ValueError:
        continue
    if ws < t <= we:
        out.append({"url": f"https://t.me/{channel}/{pid}", "snippet": "", "published_at": iso})
print(json.dumps(out[:limit]))
' <<< "$body" 2>/dev/null)
  _write_tip "$sid" "$name" "telegram" "${candidates:-[]}"
}

_identify_webpage() {
  local sid="$1" name="$2" url="$3"
  local body recent_ts="" snippet candidates
  body=$(curl -sf --max-time 15 -L "$url" 2>/dev/null) || return 0
  while IFS= read -r ds; do
    local ts
    ts=$(date -u -d "$ds" +%s 2>/dev/null) || continue
    if [ "$ts" -gt "$WINDOW_START_TS" ] && [ "$ts" -le "$WINDOW_END_TS" ]; then recent_ts="$ds"; break; fi
  done < <(printf '%s' "$body" | grep -oP '\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?' | head -20)
  [ -n "$recent_ts" ] || return 0
  snippet=$(printf '%s' "$body" | tr -s ' \t\n\r' ' ' | head -c 280)
  candidates=$(jq -nc --arg url "$url" --arg snippet "$snippet" --arg ts "$recent_ts" \
    '[{url:$url, snippet:$snippet, published_at:$ts}]')
  _write_tip "$sid" "$name" "webpage" "${candidates:-[]}"
}

PIDS=()
for sid in "$@"; do
  src_file="$(jq -r --arg id "$sid" '.sources[] | select(.id==$id) | .file' source/manifest.json)"
  src_file="source/$src_file"
  src_name="$(jq -r --arg id "$sid" '.sources[] | select(.id==$id) | .name' source/manifest.json)"
  src_type=$(jq -r --arg id "$sid" '.sources[] | select(.id==$id) | .type' source/manifest.json)

  if [ "$src_type" = "twitter" ]; then
    handle=$(grep -oP '(?<=\(@)\w+(?=\))' "$src_file" | head -1)
    [ -n "$handle" ] && { _identify_twitter "$sid" "$src_name" "$handle" & PIDS+=($!); }
  elif [[ "$sid" == reddit-* ]]; then
    subreddit=$(grep -oP '(?<=r/)\w+(?= \()' "$src_file" | head -1)
    [ -n "$subreddit" ] && { _identify_reddit "$sid" "$src_name" "$subreddit" & PIDS+=($!); }
  elif [ "$src_type" = "telegram" ]; then
    channel=$(grep -m1 '^channel:' "$src_file" | sed 's/^channel:[[:space:]]*//' | tr -d '\r')
    [ -n "$channel" ] && { _identify_telegram "$sid" "$src_name" "$channel" & PIDS+=($!); }
  elif [ "$src_type" = "webpage" ] || [ "$src_type" = "api" ]; then
    url=$(grep -m1 '^url:' "$src_file" | sed 's/^url:[[:space:]]*//' | tr -d '\r')
    [ -n "$url" ] && { _identify_webpage "$sid" "$src_name" "$url" & PIDS+=($!); }
  fi
done

for pid in "${PIDS[@]:-}"; do wait "$pid" 2>/dev/null || true; done

echo "identify: scan complete across $# source(s)."
