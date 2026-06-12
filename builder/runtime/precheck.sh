#!/usr/bin/env bash
# precheck.sh — verify each source looks reachable and recently active before
# the agent spends collection effort on it. One JSON result per source lands
# in $WORK_DIR/pre-checks/<id>.json, merged into
# $WORK_DIR/pre-check-results.json: {"<id>": {"status":"pass|fail","reason":"..."}}.
#
# Non-blocking philosophy: a check that errors (timeout, API 5xx) defaults to
# PASS — false negatives cost more than false positives. Twitter checks pass
# automatically when TWITTER_BEARER_TOKEN remains unset.
#
# Usage (from repo root): WORK_DIR=... bash builder/runtime/precheck.sh <id> [<id> ...]
set -uo pipefail

: "${WORK_DIR:?WORK_DIR must point at the bucket work directory}"
[ "$#" -ge 1 ] || { echo "usage: precheck.sh <id> [<id> ...]" >&2; exit 2; }

PRE_CHECK_DIR="$WORK_DIR/pre-checks"
mkdir -p "$PRE_CHECK_DIR"
PRE_CHECK_LOG="$WORK_DIR/pre-check.log"

# 6-hours-ago timestamp (GNU date; macOS fallback)
_SIX_H_AGO=$(date -u -d '6 hours ago' +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || \
             date -u -v-6H +%Y-%m-%dT%H:%M:%SZ 2>/dev/null)
_SIX_H_TS=$(date -u -d '6 hours ago' +%s 2>/dev/null || date -u -v-6H +%s 2>/dev/null)

_write_precheck() {
  local sid="$1" status="$2" reason="$3"
  jq -nc --arg s "$status" --arg r "$reason" '{status:$s, reason:$r}' \
    > "$PRE_CHECK_DIR/$sid.json"
  printf '%s [%s] %s: %s\n' "$(date -u +%H:%M:%SZ)" "$status" "$sid" "$reason" \
    >> "$PRE_CHECK_LOG"
}

_check_twitter() {
  local sid="$1" handle="$2"
  if [ -z "${TWITTER_BEARER_TOKEN:-}" ]; then
    _write_precheck "$sid" "pass" "TWITTER_BEARER_TOKEN not set — skipping"; return
  fi
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
  local uid tweets count
  uid=$(echo "$resp" | jq -r '.data.id')
  tweets=$(curl -sf --max-time 10 \
    "https://api.twitter.com/2/users/$uid/tweets?max_results=5&start_time=$_SIX_H_AGO&tweet.fields=created_at" \
    -H "Authorization: Bearer $TWITTER_BEARER_TOKEN" 2>/dev/null)
  if [ $? -ne 0 ]; then
    _write_precheck "$sid" "pass" "tweet lookup error — defaulting to pass"; return
  fi
  count=$(echo "$tweets" | jq -r '.meta.result_count // 0')
  if [ "$count" -eq 0 ]; then
    _write_precheck "$sid" "fail" "@$handle: no tweets in the past 6 hours"; return
  fi
  _write_precheck "$sid" "pass" "@$handle: $count tweet(s) in past 6h"
}

_check_reddit() {
  local sid="$1" subreddit="$2"
  local resp
  resp=$(curl -sf --max-time 10 \
    "https://www.reddit.com/r/$subreddit/new.json?limit=5&raw_json=1" \
    -A "osint-bot/1.0" 2>/dev/null)
  if [ $? -ne 0 ]; then
    _write_precheck "$sid" "pass" "Reddit API unreachable — defaulting to pass"; return
  fi
  if echo "$resp" | jq -e '.error' >/dev/null 2>&1; then
    local reason
    reason=$(echo "$resp" | jq -r '.message // .reason // "access denied"')
    _write_precheck "$sid" "fail" "r/$subreddit: $reason"; return
  fi
  local post_count recent_count
  post_count=$(echo "$resp" | jq '.data.children | length' 2>/dev/null || echo 0)
  if [ "$post_count" -eq 0 ]; then
    _write_precheck "$sid" "fail" "r/$subreddit: no posts found"; return
  fi
  recent_count=$(echo "$resp" | jq --argjson cutoff "$_SIX_H_TS" \
    '[.data.children[].data | select(.created_utc > $cutoff)] | length' 2>/dev/null || echo 0)
  if [ "$recent_count" -eq 0 ]; then
    _write_precheck "$sid" "fail" "r/$subreddit: no posts in the past 6 hours"; return
  fi
  _write_precheck "$sid" "pass" "r/$subreddit: $recent_count post(s) in past 6h"
}

_check_webpage() {
  local sid="$1" url="$2" keywords="$3"
  local http_code
  http_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 -L "$url" 2>/dev/null)
  if [[ ! "$http_code" =~ ^[23] ]]; then
    _write_precheck "$sid" "fail" "$url unreachable: HTTP ${http_code:-000}"; return
  fi
  local body
  body=$(curl -sf --max-time 15 -L -r 0-20480 "$url" 2>/dev/null)
  if [ -z "$body" ]; then
    _write_precheck "$sid" "pass" "$url resolves (HTTP $http_code) — body empty, continuing"; return
  fi
  local recent=false ts
  while IFS= read -r ds; do
    ts=$(date -u -d "$ds" +%s 2>/dev/null) && [ -n "$ts" ] && [ "$ts" -gt "$_SIX_H_TS" ] && { recent=true; break; }
  done < <(echo "$body" | grep -oP '\d{4}-\d{2}-\d{2}T\d{2}:\d{2}' | head -20)
  local kw_found=false kw
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
for sid in "$@"; do
  src_file="$(jq -r --arg id "$sid" '.sources[] | select(.id==$id) | .file' source/manifest.json)"
  src_file="source/$src_file"
  src_type=$(jq -r --arg id "$sid" '.sources[] | select(.id==$id) | .type' source/manifest.json)
  if [ "$src_type" = "twitter" ]; then
    handle=$(grep -oP '(?<=\(@)\w+(?=\))' "$src_file" | head -1)
    if [ -n "$handle" ]; then _check_twitter "$sid" "$handle" & PCHECK_PIDS+=($!)
    else _write_precheck "$sid" "pass" "handle not parseable — skipping"; fi
  elif [[ "$sid" == reddit-* ]]; then
    subreddit=$(grep -oP '(?<=r/)\w+(?= \()' "$src_file" | head -1)
    if [ -n "$subreddit" ]; then _check_reddit "$sid" "$subreddit" & PCHECK_PIDS+=($!)
    else _write_precheck "$sid" "pass" "subreddit name not parseable — skipping"; fi
  elif [ "$src_type" = "webpage" ] || [ "$src_type" = "telegram" ]; then
    url=$(grep -oP 'https?://\S+' "$src_file" | head -1 | tr -d ')')
    keywords=$(grep -m1 '^Keywords:' "$src_file" | sed 's/^Keywords:[[:space:]]*//')
    if [ -n "$url" ]; then _check_webpage "$sid" "$url" "$keywords" & PCHECK_PIDS+=($!)
    else _write_precheck "$sid" "pass" "url not parseable — skipping"; fi
  else
    _write_precheck "$sid" "pass" "type '$src_type' has no pre-check"
  fi
done

for pid in "${PCHECK_PIDS[@]:-}"; do wait "$pid" 2>/dev/null || true; done

# Merge per-source files into one results JSON
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
