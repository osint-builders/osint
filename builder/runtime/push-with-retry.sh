#!/usr/bin/env bash
# Push the current workflow commit to main using the runner's checkout auth.
# Call after committing; no credentials are passed on the command line.
set -euo pipefail

if [ "$#" -gt 1 ] || { [ "$#" -eq 1 ] && [ "$1" != "--require-events-stable" ]; }; then
  echo "usage: push-with-retry.sh [--require-events-stable]" >&2
  exit 2
fi
expected_events_tree=""
if [ "${1:-}" = "--require-events-stable" ]; then
  expected_events_tree=$(git rev-parse HEAD:data/events 2>/dev/null || echo absent)
fi

for attempt in 1 2 3 4 5; do
  if ! git pull --rebase origin main; then
    git rebase --abort >/dev/null 2>&1 || true
    echo "Pull attempt $attempt/5 failed." >&2
  elif [ -n "$expected_events_tree" ] &&
       [ "$(git rev-parse HEAD:data/events 2>/dev/null || echo absent)" != "$expected_events_tree" ]; then
    echo "Event corpus changed during index build; rerun before publishing indexes." >&2
    exit 1
  elif git push origin HEAD:main; then
    exit 0
  else
    echo "Push attempt $attempt/5 failed." >&2
  fi
  if [ "$attempt" -lt 5 ]; then sleep "$((attempt * 2))"; fi
done

echo "Could not push to main after 5 attempts." >&2
exit 1
