#!/usr/bin/env bash
# Remove and stage exactly this qualify batch's consumed pending tips.
# Usage: bash builder/runtime/consume-tips.sh data/queue/pending/<tip>.json ...
set -euo pipefail

[ "$#" -gt 0 ] || { echo "ERROR: no tip files supplied." >&2; exit 1; }

# Validate the entire batch before deleting any record.
declare -A seen=()
for tip in "$@"; do
  if [[ ! "$tip" =~ ^data/queue/pending/[A-Za-z0-9._-]+\.json$ ]]; then
    echo "ERROR: invalid pending tip path: $tip" >&2
    exit 1
  fi
  if [ -n "${seen[$tip]:-}" ]; then
    echo "ERROR: duplicate tip argument: $tip" >&2
    exit 1
  fi
  seen[$tip]=1
  [ -f "$tip" ] || { echo "ERROR: pending tip missing: $tip" >&2; exit 1; }
  git ls-files --error-unmatch -- "$tip" >/dev/null 2>&1 || {
    echo "ERROR: pending tip not tracked by git: $tip" >&2
    exit 1
  }
  git diff --quiet HEAD -- "$tip" || {
    echo "ERROR: pending tip has uncommitted edits: $tip" >&2
    exit 1
  }
  jq -e '.candidates | type == "array"' "$tip" >/dev/null || {
    echo "ERROR: invalid pending tip schema: $tip" >&2
    exit 1
  }
done

for tip in "$@"; do
  git rm -- "$tip" >/dev/null
done

echo "consume-tips: removed $# processed tip(s) from the queue."
