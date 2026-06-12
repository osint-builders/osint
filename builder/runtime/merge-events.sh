#!/usr/bin/env bash
# merge-events.sh — merge every $WORK_DIR/*/events.jsonl into the day file
# with two-level dedup, then write the count of newly added events to
# $WORK_DIR/.added-count (submit.sh reads it for the commit message).
#
# Dedup keys (skip when EITHER matches an existing event):
#   1. links[0].url — exact string match
#   2. content fingerprint — sha256(title|source.name|date_published|links[0].url)
# A final keep-first pass re-deduplicates the whole day file by fingerprint,
# preserving original line order (no sorting).
#
# Usage (from repo root): WORK_DIR=... bash builder/runtime/merge-events.sh <YYYY-MM> <YYYY-MM-DD>
set -euo pipefail

: "${WORK_DIR:?WORK_DIR must point at the bucket work directory}"
YEAR_MONTH="${1:?usage: merge-events.sh <YYYY-MM> <YYYY-MM-DD>}"
DATE="${2:?usage: merge-events.sh <YYYY-MM> <YYYY-MM-DD>}"

TARGET="data/events/$YEAR_MONTH/$DATE.jsonl"
mkdir -p "data/events/$YEAR_MONTH"
touch "$TARGET"

fingerprint() {
  # stdin: one compact event JSON line → stdout: sha256 hex
  jq -r '[.title // "", .source.name // "", .date_published // "", (.links[0].url // "")] | join("|")' \
    | sha256sum | cut -d' ' -f1
}

SEEN_URLS="$WORK_DIR/.seen-urls"
SEEN_FPS="$WORK_DIR/.seen-fps"
: > "$SEEN_URLS"; : > "$SEEN_FPS"

while IFS= read -r line; do
  [ -n "$line" ] || continue
  printf '%s' "$line" | jq -r '.links[0].url // empty' >> "$SEEN_URLS"
  printf '%s' "$line" | fingerprint >> "$SEEN_FPS"
done < "$TARGET"

ADDED=0
while IFS= read -r f; do
  while IFS= read -r raw; do
    [ -n "$raw" ] || continue
    line=$(printf '%s' "$raw" | jq -c '.' 2>/dev/null) || {
      echo "WARN: skipping unparseable line in $f" >&2; continue; }
    url=$(printf '%s' "$line" | jq -r '.links[0].url // empty')
    fp=$(printf '%s' "$line" | fingerprint)
    if [ -n "$url" ] && grep -Fxq "$url" "$SEEN_URLS"; then continue; fi
    if grep -Fxq "$fp" "$SEEN_FPS"; then continue; fi
    printf '%s\n' "$line" >> "$TARGET"
    [ -n "$url" ] && printf '%s\n' "$url" >> "$SEEN_URLS"
    printf '%s\n' "$fp" >> "$SEEN_FPS"
    ADDED=$((ADDED + 1))
  done < "$f"
done < <(find "$WORK_DIR" -name "events.jsonl" -type f)

# Final keep-first dedupe of the whole day file by fingerprint (order kept).
TMP="$TARGET.tmp"
: > "$TMP"
: > "$SEEN_FPS"
while IFS= read -r raw; do
  [ -n "$raw" ] || continue
  line=$(printf '%s' "$raw" | jq -c '.' 2>/dev/null) || continue
  fp=$(printf '%s' "$line" | fingerprint)
  grep -Fxq "$fp" "$SEEN_FPS" && continue
  printf '%s\n' "$line" >> "$TMP"
  printf '%s\n' "$fp" >> "$SEEN_FPS"
done < "$TARGET"
mv "$TMP" "$TARGET"

echo "$ADDED" > "$WORK_DIR/.added-count"
echo "merge-events: added $ADDED new event(s) to $TARGET ($(wc -l < "$TARGET") total)"
