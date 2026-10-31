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
mkdir -p "$seed/builder/runtime" "$seed/data/events/2026-10" "$seed/data/queue/pending" "$test_root/bin"
git init --bare -b main "$remote" >/dev/null
git -C "$seed" init -b main >/dev/null
git -C "$seed" config user.name "Fixture"
git -C "$seed" config user.email "fixture@example.org"
cp "$repo_root/builder/runtime/"{submit.sh,git-identity.sh,merge-events.sh,consume-tips.sh} "$seed/builder/runtime/"
sed -i 's/\r$//' "$seed/builder/runtime/"*.sh
printf '# LEARNINGS\n\n<!-- entries below this line; newest first -->\n' > "$seed/LEARNINGS.md"
printf '%s\n' '{"title":"Base","source":{"name":"Fixture"},"date_published":"2026-10-30T10:00:00Z","links":[{"url":"https://example.org/base"}]}' > "$seed/data/events/2026-10/2026-10-30.jsonl"
for label in a b; do
  printf '{"candidates":[{"url":"https://example.org/%s","snippet":"","published_at":"2026-10-30T10:30:00Z"}]}\n' "$label" > "$seed/data/queue/pending/tip-$label.json"
done
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
  printf '{"title":"Event %s","source":{"name":"Fixture"},"date_published":"2026-10-30T10:30:00Z","links":[{"url":"https://example.org/%s"}]}\n' "$label" "$label" > "$work/source/events.jsonl"
  (
    cd "$agent"
    export WORK_DIR="$work"
    bash builder/runtime/merge-events.sh 2026-10 2026-10-30
    bash builder/runtime/consume-tips.sh "data/queue/pending/tip-$label.json"
    printf '\n## Learning %s\n' "$label" >> LEARNINGS.md
  )
done

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
printf 'concurrent submit checks passed\n'
