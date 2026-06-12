#!/usr/bin/env bash
# verify-ids.sh — abort when any expected source ID no longer counts as
# processable in source/manifest.json (catches mid-run manifest edits).
# Usage (from repo root): bash builder/runtime/verify-ids.sh <id> [<id> ...]
set -euo pipefail

[ "$#" -ge 1 ] || { echo "usage: verify-ids.sh <id> [<id> ...]" >&2; exit 2; }

MANIFEST_PROCESSABLE=$(jq -r \
  '.sources[] | select((.status // "") | ascii_downcase | IN("inactive","archived","deprecated") | not) | .id' \
  source/manifest.json)

MISSING=()
for id in "$@"; do
  printf '%s\n' "$MANIFEST_PROCESSABLE" | grep -Fxq "$id" || MISSING+=("$id")
done

if [ "${#MISSING[@]}" -gt 0 ]; then
  printf 'ERROR: IDs no longer processable: %s\n' "${MISSING[*]}" >&2
  exit 1
fi
echo "verify-ids: $# IDs verified against manifest."
