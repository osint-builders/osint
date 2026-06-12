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

WORK_DIR="/tmp/osint-collection-$(date +%Y%m%d-%H%M%S)-bucket${BUCKET}"
mkdir -p "$WORK_DIR"
echo "init: bucket ${BUCKET} work dir ${WORK_DIR}" >&2
printf '%s\n' "$WORK_DIR"
