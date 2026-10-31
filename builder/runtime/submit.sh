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

# init.sh records the dispatch date once. An agent may otherwise infer a
# different date from a tip and silently put a valid event in the wrong file.
[ -f "$WORK_DIR/.extraction-date" ] || {
  echo "ERROR: missing extraction date from init.sh." >&2
  exit 1
}
EXPECTED_DATE=$(cat "$WORK_DIR/.extraction-date")
if [ "$DATE" != "$EXPECTED_DATE" ] || [ "$YEAR_MONTH" != "${EXPECTED_DATE:0:7}" ]; then
  echo "ERROR: submit date $YEAR_MONTH/$DATE disagrees with init.sh date $EXPECTED_DATE." >&2
  exit 1
fi

ADDED=$(cat "$WORK_DIR/.added-count" 2>/dev/null || echo 0)

bash builder/runtime/git-identity.sh
git add "data/events/$YEAR_MONTH/$DATE.jsonl" "LEARNINGS.md"

if [ "$LABEL" = "batch" ]; then
  # A batch consumes pending tips by deleting their tracked files. Additions
  # and modifications would leave work in the queue under a misleading name.
  INVALID_PENDING=$(git diff --cached --no-renames --name-status -- data/queue/pending \
    | awk '$1 != "D" { print }')
  if [ -n "$INVALID_PENDING" ]; then
    echo "ERROR: qualify batch staged a pending tip addition/modification:" >&2
    echo "$INVALID_PENDING" >&2
    exit 1
  fi
fi

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

# Parallel batches can append to the same day file and prepend learnings from
# the same base commit. Rebase cannot resolve those overlapping edits by retry.
# Reapply this batch's already-validated raw events and consumed tips on the
# newest main, then make a new linear commit.
reconcile_after_conflict() {
  local original_head base_learnings local_learnings latest_tip
  local -a consumed=() still_pending=()
  original_head=$(git rev-parse HEAD)
  base_learnings="$WORK_DIR/.submit-base-learnings"
  local_learnings="$WORK_DIR/.submit-local-learnings"
  git show "$original_head^:LEARNINGS.md" > "$base_learnings"
  git show "$original_head:LEARNINGS.md" > "$local_learnings"
  mapfile -t consumed < <(git diff-tree --no-commit-id --name-only --diff-filter=D -r "$original_head" -- data/queue/pending/)

  git reset --hard FETCH_HEAD
  bash builder/runtime/merge-events.sh "$YEAR_MONTH" "$DATE"
  if ! cmp -s "$base_learnings" "$local_learnings"; then
    git merge-file --union LEARNINGS.md "$base_learnings" "$local_learnings"
  fi
  for latest_tip in "${consumed[@]}"; do
    [ -f "$latest_tip" ] && still_pending+=("$latest_tip")
  done
  if [ "${#still_pending[@]}" -gt 0 ]; then
    bash builder/runtime/consume-tips.sh "${still_pending[@]}"
  fi
  git add "data/events/$YEAR_MONTH/$DATE.jsonl" LEARNINGS.md
  if git diff --cached --quiet; then
    echo "submit: batch output already present on main."
    return 0
  fi
  local reconciled_added
  reconciled_added=$(cat "$WORK_DIR/.added-count")
  git commit -m "Collect $reconciled_added world events on $DATE ($LABEL $BUCKET/$TOTAL)

$(date -u +%Y-%m-%dT%H:%M:%SZ) | [skip ci]"
}

PUSHED=0
for ATTEMPT in 1 2 3 4 5; do
  if ! git pull --rebase "$PUSH_URL" main 2>&1 | sed -E "$REDACT"; then
    REBASE_MERGE=$(git rev-parse --git-path rebase-merge)
    REBASE_APPLY=$(git rev-parse --git-path rebase-apply)
    if [ -d "$REBASE_MERGE" ] || [ -d "$REBASE_APPLY" ]; then
      git rebase --abort
      echo "Pull attempt $ATTEMPT/5 conflicted; reapplying batch on latest main."
      reconcile_after_conflict
    else
      echo "Pull attempt $ATTEMPT/5 failed."
      if [ "$ATTEMPT" -eq 5 ]; then break; fi
      JITTER=$(( RANDOM % 9 + 2 ))
      sleep "$JITTER"
      continue
    fi
  fi
  # The push pipeline belongs in an `if`: with errexit + pipefail, a plain
  # failed pipeline exits before the retry loop can inspect its status.
  if git push "$PUSH_URL" main 2>&1 | sed -E "$REDACT"; then
    PUSHED=1
    break
  fi
  JITTER=$(( RANDOM % 9 + 2 ))
  echo "Push attempt $ATTEMPT/5 failed; retrying in $JITTER seconds..."
  if [ "$ATTEMPT" -lt 5 ]; then sleep "$JITTER"; fi
done

if [ "$PUSHED" -eq 0 ]; then
  echo "ERROR: Push to main failed after 5 attempts. Do NOT open a pull request — exit and let the next scheduled run collect fresh events." >&2
  exit 1
fi
ADDED=$(cat "$WORK_DIR/.added-count" 2>/dev/null || echo 0)
echo "submit: pushed $ADDED event(s) for $LABEL $BUCKET/$TOTAL."
