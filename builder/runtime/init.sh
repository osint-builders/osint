#!/usr/bin/env bash
# init.sh — prerequisite checks + work directory for one collection bucket.
# Usage (from repo root): WORK_DIR=$(bash builder/runtime/init.sh <bucket-num>)
# Prints the work directory path on stdout; all diagnostics go to stderr.
set -euo pipefail

BUCKET="${1:?usage: init.sh <bucket-num>}"

for cmd in node git jq curl; do
  command -v "$cmd" >/dev/null 2>&1 || { echo "ERROR: missing CLI: $cmd" >&2; exit 1; }
done
for p in source/sources source/manifest.json data/events data/SCHEMA.md skills builder/runtime; do
  [ -e "$p" ] || { echo "ERROR: missing repo path: $p (run from repo root)" >&2; exit 1; }
done

# Fail fast (seconds) on a missing/invalid/expired push token instead of
# discovering it only after a full bucket's worth of collection work reaches
# submit.sh at Step 8. A bad token causes GitHub to reject with 401/403;
# `git ls-remote` surfaces that almost instantly without touching the working
# tree or spending any collection effort.
PUSH_TOKEN="${OSINT_GH_TOKEN:-${GH_TOKEN:-}}"
[ -n "$PUSH_TOKEN" ] || { echo "ERROR: No push token (OSINT_GH_TOKEN/GH_TOKEN). This run cannot save its output." >&2; exit 1; }
REPO_PATH=$(git remote get-url origin | sed -E 's|^git@github\.com:|https://github.com/|; s|^https?://github\.com/||; s|\.git$||')
PUSH_URL="https://x-access-token:$PUSH_TOKEN@github.com/$REPO_PATH.git"
if ! git ls-remote --exit-code "$PUSH_URL" main >/dev/null 2>&1; then
  echo "ERROR: push token check failed — OSINT_GH_TOKEN/GH_TOKEN looks invalid, expired, or lacks write access to $REPO_PATH. Rotate the token; exiting now instead of doing collection work that can't be saved." >&2
  exit 1
fi

WORK_DIR="/tmp/osint-collection-$(date +%Y%m%d-%H%M%S)-bucket${BUCKET}"
mkdir -p "$WORK_DIR"
echo "init: bucket ${BUCKET} work dir ${WORK_DIR}" >&2
printf '%s\n' "$WORK_DIR"
