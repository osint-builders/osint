#!/usr/bin/env bash
# submit.sh — commit this bucket's events + LEARNINGS.md and push directly to
# main. NEVER opens a pull request: if every push attempt fails, exit 1 and
# let the next scheduled run collect fresh events.
#
# The commit message reports THIS bucket's newly added events (written by
# merge-events.sh to $WORK_DIR/.added-count), not the day-file total.
#
# Usage (from repo root):
#   WORK_DIR=... bash builder/runtime/submit.sh <YYYY-MM> <YYYY-MM-DD> <unit> <total-units> [label]
#   [label] defaults to "bucket" (collect); qualify.yml passes "batch".
# Env: OSINT_GH_TOKEN or GH_TOKEN (push token, required)
set -euo pipefail

: "${WORK_DIR:?WORK_DIR must point at the bucket work directory}"
YEAR_MONTH="${1:?usage: submit.sh <YYYY-MM> <YYYY-MM-DD> <unit> <total-units> [label]}"
DATE="${2:?usage: submit.sh <YYYY-MM> <YYYY-MM-DD> <unit> <total-units> [label]}"
BUCKET="${3:?unit number required}"
TOTAL="${4:?total unit count required}"
LABEL="${5:-bucket}"

ADDED=$(cat "$WORK_DIR/.added-count" 2>/dev/null || echo 0)

git config user.name "OSINT Collector Bot"
git config user.email "osint-bot@github-actions"
git add "data/events/$YEAR_MONTH/$DATE.jsonl" "LEARNINGS.md" 2>/dev/null || true

if git diff --cached --quiet; then
  echo "submit: nothing to commit (0 new events)."
  exit 0
fi

git commit -m "Collect $ADDED world events on $DATE ($LABEL $BUCKET/$TOTAL)

$(date -u +%Y-%m-%dT%H:%M:%SZ) | [skip ci]"

# Token validity was already confirmed once in init.sh (Step 1); re-derive
# the push URL here since it isn't passed between steps.
PUSH_TOKEN="${OSINT_GH_TOKEN:-${GH_TOKEN:-}}"
[ -n "$PUSH_TOKEN" ] || { echo "ERROR: No push token (OSINT_GH_TOKEN/GH_TOKEN)." >&2; exit 1; }
REPO_PATH=$(git remote get-url origin | sed -E 's|^git@github\.com:|https://github.com/|; s|^https?://github\.com/||; s|\.git$||')
PUSH_URL="https://x-access-token:$PUSH_TOKEN@github.com/$REPO_PATH.git"
REDACT='s|https://[^@]+@|https://<redacted>@|g'

PUSHED=0
for ATTEMPT in 1 2 3 4 5; do
  git pull --rebase "$PUSH_URL" main 2>&1 | sed -E "$REDACT"
  git push "$PUSH_URL" main 2>&1 | sed -E "$REDACT"
  PUSH_RC=${PIPESTATUS[0]}
  if [ "$PUSH_RC" -eq 0 ]; then PUSHED=1; break; fi
  JITTER=$(( RANDOM % 9 + 2 ))
  echo "Push attempt $ATTEMPT/5 failed; retrying in $JITTER seconds..."
  sleep "$JITTER"
done

if [ "$PUSHED" -eq 0 ]; then
  echo "ERROR: Push to main failed after 5 attempts. Do NOT open a pull request — exit and let the next scheduled run collect fresh events." >&2
  exit 1
fi
echo "submit: pushed $ADDED event(s) for $LABEL $BUCKET/$TOTAL."
