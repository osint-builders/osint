#!/usr/bin/env bash
# init.sh — prerequisite checks + work directory for one collection bucket.
# Usage (from repo root): WORK_DIR=$(bash builder/runtime/init.sh <bucket-num>)
# Secret-free environment check: bash builder/runtime/init.sh --check-runtime
# Prints the work directory path on stdout; all diagnostics go to stderr.
set -euo pipefail

BUCKET="${1:?usage: init.sh <bucket-num>}"

# These commands cover the active qualification prompt and its publication
# helpers. Check them before consuming Warp credits on an unusable agent.
for cmd in node git jq curl sha256sum grep sed awk cut find mv wc date sleep \
  head cat mkdir mktemp rm dirname touch; do
  command -v "$cmd" >/dev/null 2>&1 || { echo "ERROR: missing CLI: $cmd" >&2; exit 1; }
done
if ! node -e 'process.exit(Number(process.versions.node.split(".")[0]) >= 20 ? 0 : 1)' >/dev/null 2>&1; then
  echo "ERROR: Node.js 20 or newer is required by this repository." >&2
  exit 1
fi
if ! printf 'x\n' | grep -P '^x$' >/dev/null 2>&1; then
  echo "ERROR: GNU grep with -P support is required for source and image parsing." >&2
  exit 1
fi
if [ "$BUCKET" = "--check-runtime" ]; then
  echo "Warp runtime prerequisites available."
  exit 0
fi
for p in source/sources source/manifest.json data/events data/SCHEMA.md skills builder/runtime; do
  [ -e "$p" ] || { echo "ERROR: missing repo path: $p (run from repo root)" >&2; exit 1; }
done

# Fail fast on a missing/invalid/expired token instead of discovering it after
# collection. `git ls-remote` checks authentication and read access without
# touching the working tree; only an actual push can prove write access.
PUSH_TOKEN="${OSINT_GH_TOKEN:-${GH_TOKEN:-}}"
[ -n "$PUSH_TOKEN" ] || { echo "ERROR: No push token (OSINT_GH_TOKEN/GH_TOKEN). This run cannot save its output." >&2; exit 1; }
REPO_PATH=$(git remote get-url origin | sed -E 's|^git@github\.com:|https://github.com/|; s|^https?://github\.com/||; s|\.git$||')
PUSH_URL="https://x-access-token:$PUSH_TOKEN@github.com/$REPO_PATH.git"
if ! git ls-remote --exit-code "$PUSH_URL" main >/dev/null 2>&1; then
  echo "ERROR: token authentication check failed — OSINT_GH_TOKEN/GH_TOKEN looks invalid, expired, or lacks repository access to $REPO_PATH. Rotate the token; exiting now instead of doing collection work that can't be saved." >&2
  exit 1
fi

WORK_DIR="/tmp/osint-collection-$(date +%Y%m%d-%H%M%S)-bucket${BUCKET}"
mkdir -p "$WORK_DIR"
echo "init: bucket ${BUCKET} work dir ${WORK_DIR}" >&2
printf '%s\n' "$WORK_DIR"
