#!/usr/bin/env bash
# Exercise the real submit control flow without a network push or git changes.
set -euo pipefail
cd "$(dirname "$0")/../../.."

test_dir=$(mktemp -d)
trap 'rm -rf "$test_dir"' EXIT
mkdir -p "$test_dir/bin" "$test_dir/work"
printf '1\n' > "$test_dir/work/.added-count"
printf '2026-10-30\n' > "$test_dir/work/.extraction-date"

cat > "$test_dir/bin/git" <<'GIT'
#!/usr/bin/env bash
case "$1" in
  config|add|commit|rebase) exit 0 ;;
  diff) exit 1 ;;
  remote) printf 'https://github.com/osint-builders/osint.git\n'; exit 0 ;;
  rev-parse)
    if [ "${FAKE_CHANGE_EVENT_TREE:-0}" = 1 ] && [ "$(cat "$FAKE_PULL_COUNT_FILE")" -gt 0 ]; then
      printf 'changed-tree\n'
    else
      printf 'original-tree\n'
    fi
    exit 0 ;;
  pull)
    count=$(cat "$FAKE_PULL_COUNT_FILE")
    count=$((count + 1))
    printf '%s\n' "$count" > "$FAKE_PULL_COUNT_FILE"
    if [ "$count" -le "$FAKE_PULL_FAILURES" ]; then
      printf 'simulated transient pull failure\n' >&2
      exit 1
    fi
    exit 0 ;;
  push)
    count=$(cat "$FAKE_PUSH_COUNT_FILE")
    count=$((count + 1))
    printf '%s\n' "$count" > "$FAKE_PUSH_COUNT_FILE"
    if [ "$count" -le "$FAKE_PUSH_FAILURES" ]; then
      printf 'simulated transient push failure\n' >&2
      exit 1
    fi
    exit 0 ;;
esac
printf 'Unexpected git command: %s\n' "$1" >&2
exit 2
GIT
cat > "$test_dir/bin/sleep" <<'SLEEP'
#!/usr/bin/env bash
exit 0
SLEEP
chmod +x "$test_dir/bin/git" "$test_dir/bin/sleep"

run_submit() {
  PATH="$test_dir/bin:$PATH" \
    WORK_DIR="$test_dir/work" \
    OSINT_GH_TOKEN='test-token' \
    FAKE_PULL_COUNT_FILE="$test_dir/pull-count" \
    FAKE_PULL_FAILURES="${2:-0}" \
    FAKE_PUSH_COUNT_FILE="$test_dir/push-count" \
    FAKE_PUSH_FAILURES="$1" \
    bash builder/runtime/submit.sh 2026-10 2026-10-30 1 1 bucket
}

run_workflow_push() {
  local args=()
  if [ "${3:-}" = stable ]; then args=(--require-events-stable); fi
  PATH="$test_dir/bin:$PATH" \
    FAKE_PULL_COUNT_FILE="$test_dir/pull-count" \
    FAKE_PULL_FAILURES="$1" \
    FAKE_PUSH_COUNT_FILE="$test_dir/push-count" \
    FAKE_PUSH_FAILURES="$2" \
    FAKE_CHANGE_EVENT_TREE="${4:-0}" \
    bash builder/runtime/push-with-retry.sh "${args[@]}"
}

printf '0\n' > "$test_dir/push-count"
printf '0\n' > "$test_dir/pull-count"
output=$(run_submit 1 2>&1) || { printf '%s\n' "$output"; exit 1; }
[ "$(cat "$test_dir/push-count")" -eq 2 ]
[[ "$output" == *'submit: pushed 1 event(s)'* ]]
[[ "$output" != *'test-token'* ]]

printf '2026-10-31\n' > "$test_dir/work/.extraction-date"
if output=$(run_submit 0 2>&1); then
  printf 'submit unexpectedly accepted a different bucket date\n' >&2
  exit 1
fi
[[ "$output" == *'disagrees with init.sh date'* ]]
printf '2026-10-30\n' > "$test_dir/work/.extraction-date"

printf '0\n' > "$test_dir/push-count"
printf '0\n' > "$test_dir/pull-count"
if output=$(run_submit 5 2>&1); then
  printf 'submit unexpectedly succeeded after five failed pushes\n' >&2
  exit 1
fi
[ "$(cat "$test_dir/push-count")" -eq 5 ]
[[ "$output" == *'failed after 5 attempts'* ]]
[[ "$output" != *'test-token'* ]]

printf '0\n' > "$test_dir/push-count"
printf '0\n' > "$test_dir/pull-count"
output=$(run_submit 0 1 2>&1) || { printf '%s\n' "$output"; exit 1; }
[ "$(cat "$test_dir/pull-count")" -eq 2 ]
[ "$(cat "$test_dir/push-count")" -eq 1 ]

printf '0\n' > "$test_dir/push-count"
printf '0\n' > "$test_dir/pull-count"
if output=$(run_submit 0 5 2>&1); then
  printf 'submit unexpectedly succeeded after five failed pulls\n' >&2
  exit 1
fi
[ "$(cat "$test_dir/pull-count")" -eq 5 ]
[ "$(cat "$test_dir/push-count")" -eq 0 ]

printf '0\n' > "$test_dir/push-count"
printf '0\n' > "$test_dir/pull-count"
output=$(run_workflow_push 1 1 2>&1) || { printf '%s\n' "$output"; exit 1; }
[ "$(cat "$test_dir/pull-count")" -eq 3 ]
[ "$(cat "$test_dir/push-count")" -eq 2 ]

printf '0\n' > "$test_dir/push-count"
printf '0\n' > "$test_dir/pull-count"
if output=$(run_workflow_push 5 0 2>&1); then
  printf 'workflow push unexpectedly succeeded after five failed pulls\n' >&2
  exit 1
fi
[ "$(cat "$test_dir/pull-count")" -eq 5 ]
[ "$(cat "$test_dir/push-count")" -eq 0 ]
[[ "$output" == *'Could not push to main after 5 attempts'* ]]

printf '0\n' > "$test_dir/push-count"
printf '0\n' > "$test_dir/pull-count"
if output=$(run_workflow_push 0 0 stable 1 2>&1); then
  printf 'workflow push unexpectedly accepted changed event data\n' >&2
  exit 1
fi
[ "$(cat "$test_dir/push-count")" -eq 0 ]
[[ "$output" == *'Event corpus changed during index build'* ]]

printf 'submit retry checks passed\n'
