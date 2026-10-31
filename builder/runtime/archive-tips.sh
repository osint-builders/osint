#!/usr/bin/env bash
# Move exactly this qualify batch's pending tip files into processed/.
# Usage: bash builder/runtime/archive-tips.sh data/queue/pending/<tip>.json ...
set -euo pipefail

[ "$#" -gt 0 ] || { echo "ERROR: no tip files supplied for archiving." >&2; exit 1; }
mkdir -p data/queue/processed

for tip in "$@"; do
  case "$tip" in
    data/queue/pending/*.json) ;;
    *) echo "ERROR: invalid pending tip path: $tip" >&2; exit 1 ;;
  esac
  [ -f "$tip" ] || { echo "ERROR: pending tip missing: $tip" >&2; exit 1; }
  jq -e '.candidates | type == "array"' "$tip" >/dev/null || {
    echo "ERROR: invalid pending tip schema: $tip" >&2; exit 1;
  }
  destination="data/queue/processed/${tip##*/}"
  [ ! -e "$destination" ] || { echo "ERROR: tip already processed: $tip" >&2; exit 1; }
  git mv -- "$tip" "$destination"
done

echo "archive-tips: moved $# tip(s) to processed/."
