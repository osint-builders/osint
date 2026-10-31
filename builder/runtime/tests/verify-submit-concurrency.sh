#!/usr/bin/env bash
# Two agents publish different events and consume different tips from one base.
# The second submission must preserve the first after its day-file rebase conflict.
set -euo pipefail

repo_root=$(cd "$(dirname "$0")/../../.." && pwd)
test_root=$(mktemp -d "${TMPDIR:-/tmp}/osint-submit-concurrency.XXXXXX")
cleanup() {
  case "$test_root" in
    "${TMPDIR:-/tmp}"/osint-submit-concurrency.*) rm -rf -- "$test_root" ;;
    *) echo "Refusing unexpected cleanup path: $test_root" >&2; exit 1 ;;
  esac
}
trap cleanup EXIT

real_git=$(command -v git)
remote="$test_root/remote.git"
seed="$test_root/seed"
mkdir -p "$seed/builder/runtime" "$seed/data/events/2026-10" "$seed/data/queue/pending" \
  "$seed/data/scripts/lib" "$test_root/bin"
git init --bare -b main "$remote" >/dev/null
git -C "$seed" init -b main >/dev/null
git -C "$seed" config user.name "Fixture"
git -C "$seed" config user.email "fixture@example.org"
cp "$repo_root/builder/runtime/"{submit.sh,git-identity.sh,merge-events.sh,consume-tips.sh} "$seed/builder/runtime/"
cp "$repo_root/data/scripts/validate-events.js" "$seed/data/scripts/"
cp "$repo_root/data/scripts/lib/qualified-event.js" "$seed/data/scripts/lib/"
sed -i 's/\r$//' "$seed/builder/runtime/"*.sh
printf '# LEARNINGS\n\n<!-- entries below this line; newest first -->\n' > "$seed/LEARNINGS.md"
printf '%s\n' '{"id":"evt_20261030_001","title":"Base","summary":"Historical fixture event","contents":"Historical fixture content with sufficient length.","source":{"name":"Fixture"},"date_published":"2026-10-30T10:00:00Z","links":[{"url":"https://example.org/base"}],"image_urls":[]}' > "$seed/data/events/2026-10/2026-10-30.jsonl"
for label in a b zero; do
  printf '{"candidates":[{"url":"https://example.org/%s","snippet":"","published_at":"2026-10-30T10:30:00Z"}]}\n' "$label" > "$seed/data/queue/pending/tip-$label.json"
done

# Use the canonical schema example for new rows. The existing base row above
# intentionally predates the qualified contract and must not block a batch.
node - "$repo_root/data/SCHEMA.md" "$test_root/valid-event.json" <<'NODE'
const fs = require('fs');
const schema = fs.readFileSync(process.argv[2], 'utf8');
const sample = schema.match(/## Complete Example[\s\S]*?```json\s*([\s\S]*?)```/);
if (!sample) throw new Error('Missing schema example');
fs.writeFileSync(process.argv[3], `${JSON.stringify(JSON.parse(sample[1]))}\n`);
NODE

mkdir -p "$test_root/work-invalid-raw/source"
printf '{not JSON\n' > "$test_root/work-invalid-raw/source/events.jsonl"
if invalid_raw_output=$(
  cd "$seed"
  WORK_DIR="$test_root/work-invalid-raw" bash builder/runtime/merge-events.sh 2026-10 2026-10-30 2>&1
); then
  echo 'An unparseable raw event must fail before its tip can be consumed.' >&2
  exit 1
fi
[[ "$invalid_raw_output" == *'unparseable event line'* ]]

git -C "$seed" add -A
git -C "$seed" commit -qm "Fixture base"
git -C "$seed" remote add origin "$remote"
git -C "$seed" push -q -u origin main

git clone -q -b main "$remote" "$test_root/agent-a"
git clone -q -b main "$remote" "$test_root/agent-b"
cat > "$test_root/bin/git" <<'GIT'
#!/usr/bin/env bash
if [ "${1:-}" = remote ] && [ "${2:-}" = get-url ] && [ "${3:-}" = origin ]; then
  printf 'https://github.com/osint-builders/osint.git\n'
elif [ "${1:-}" = pull ] && [ "${2:-}" = --rebase ]; then
  exec "$REAL_GIT" pull --rebase "$TEST_REMOTE" main
elif [ "${1:-}" = fetch ]; then
  exec "$REAL_GIT" fetch "$TEST_REMOTE" main
elif [ "${1:-}" = push ]; then
  exec "$REAL_GIT" push "$TEST_REMOTE" main
else
  exec "$REAL_GIT" "$@"
fi
GIT
chmod +x "$test_root/bin/git"

for label in a b; do
  agent="$test_root/agent-$label"
  work="$test_root/work-$label"
  mkdir -p "$work/source"
  printf '2026-10-30\n' > "$work/.extraction-date"
  if [ "$label" = a ]; then event_id=evt_52117619469189121; else event_id=evt_52117619469189122; fi
  jq -c --arg label "$label" --arg id "$event_id" '
    .id = $id |
    .date_published = "2026-10-30T10:30:00Z" |
    .date_event = "2026-10-30T10:15:00Z" |
    .ingested_at = "2026-10-30T10:35:00Z" |
    .source_window = {start: "2026-10-30T10:00:00Z", end: "2026-10-30T11:00:00Z"} |
    .original_report = {url: ("https://example.org/" + $label), published_at: "2026-10-30T10:30:00Z"} |
    .links[0].url = ("https://example.org/" + $label) |
    .contents |= gsub("April 29"; "October 30")
  ' "$test_root/valid-event.json" > "$work/source/events.jsonl"
  (
    cd "$agent"
    export WORK_DIR="$work"
    bash builder/runtime/merge-events.sh 2026-10 2026-10-30
    bash builder/runtime/consume-tips.sh "data/queue/pending/tip-$label.json"
    printf '\n## Learning %s\n' "$label" >> LEARNINGS.md
  )
done

# A skipped prompt-validation step must not let a directly edited, invalid
# day-file row reach commit or push.
git clone -q -b main "$remote" "$test_root/agent-invalid"
mkdir -p "$test_root/work-invalid"
printf '2026-10-30\n' > "$test_root/work-invalid/.extraction-date"
printf '1\n' > "$test_root/work-invalid/.added-count"
jq -c 'del(.geo)' "$test_root/work-a/source/events.jsonl" \
  >> "$test_root/agent-invalid/data/events/2026-10/2026-10-30.jsonl"
initial_head=$(git --git-dir="$remote" rev-parse refs/heads/main)
if output=$(
  cd "$test_root/agent-invalid"
  export WORK_DIR="$test_root/work-invalid"
  export REAL_GIT="$real_git" TEST_REMOTE="$remote" OSINT_GH_TOKEN="fixture-token"
  export PATH="$test_root/bin:$PATH"
  bash builder/runtime/submit.sh 2026-10 2026-10-30 1 1 batch 2>&1
); then
  echo 'Invalid qualified event unexpectedly reached commit' >&2
  exit 1
fi
[[ "$output" == *'staged qualified events failed validation'* ]]
[ "$(git --git-dir="$remote" rev-parse refs/heads/main)" = "$initial_head" ]
[ "$(git -C "$test_root/agent-invalid" rev-parse HEAD)" = "$initial_head" ]

# Even if an agent ignores a failed merge, raw output must be valid before a
# queue-only or learning-only batch commit can succeed.
git -C "$test_root/agent-invalid" reset --hard HEAD >/dev/null
mkdir -p "$test_root/work-invalid/source"
printf '{not JSON\n' > "$test_root/work-invalid/source/events.jsonl"
printf '\n## Ignored raw output\n' >> "$test_root/agent-invalid/LEARNINGS.md"
if raw_output=$(
  cd "$test_root/agent-invalid"
  export WORK_DIR="$test_root/work-invalid"
  export REAL_GIT="$real_git" TEST_REMOTE="$remote" OSINT_GH_TOKEN="fixture-token"
  export PATH="$test_root/bin:$PATH"
  bash builder/runtime/submit.sh 2026-10 2026-10-30 1 1 batch 2>&1
); then
  echo 'Invalid raw event unexpectedly reached commit' >&2
  exit 1
fi
[[ "$raw_output" == *'raw qualified events failed validation'* ]]
[ "$(git --git-dir="$remote" rev-parse refs/heads/main)" = "$initial_head" ]

for label in a b; do
  (
    cd "$test_root/agent-$label"
    export WORK_DIR="$test_root/work-$label"
    export REAL_GIT="$real_git" TEST_REMOTE="$remote" OSINT_GH_TOKEN="fixture-token"
    export PATH="$test_root/bin:$PATH"
    bash builder/runtime/submit.sh 2026-10 2026-10-30 1 2 batch
  )
done

git clone -q -b main "$remote" "$test_root/result"
result="$test_root/result"
[ "$(wc -l < "$result/data/events/2026-10/2026-10-30.jsonl")" -eq 3 ]
for label in a b; do
  jq -e --arg url "https://example.org/$label" 'select(.links[0].url == $url)' "$result/data/events/2026-10/2026-10-30.jsonl" >/dev/null
  [ ! -e "$result/data/queue/pending/tip-$label.json" ]
  grep -Fq "## Learning $label" "$result/LEARNINGS.md"
done
! grep -Eq '^(<<<<<<<|=======|>>>>>>>)' "$result/LEARNINGS.md" "$result/data/events/2026-10/2026-10-30.jsonl"

# Consuming a tip without publishing an event must still commit and push.
git clone -q -b main "$remote" "$test_root/agent-zero"
mkdir -p "$test_root/work-zero"
printf '2026-10-30\n' > "$test_root/work-zero/.extraction-date"
printf '0\n' > "$test_root/work-zero/.added-count"
(
  cd "$test_root/agent-zero"
  export WORK_DIR="$test_root/work-zero"
  export REAL_GIT="$real_git" TEST_REMOTE="$remote" OSINT_GH_TOKEN="fixture-token"
  export PATH="$test_root/bin:$PATH"
  bash builder/runtime/consume-tips.sh data/queue/pending/tip-zero.json
  bash builder/runtime/submit.sh 2026-10 2026-10-30 1 1 batch
)
git clone -q -b main "$remote" "$test_root/result-zero"
[ ! -e "$test_root/result-zero/data/queue/pending/tip-zero.json" ]
[ "$(wc -l < "$test_root/result-zero/data/events/2026-10/2026-10-30.jsonl")" -eq 3 ]
printf 'concurrent submit checks passed\n'
