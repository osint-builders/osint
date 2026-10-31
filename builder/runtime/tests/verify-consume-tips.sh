#!/usr/bin/env bash
set -euo pipefail

helper="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/consume-tips.sh"
temp_root="$(cd "${TMPDIR:-/tmp}" && pwd -P)"
tmp=$(mktemp -d "$temp_root/osint-consume-XXXXXX")
case "$tmp" in
  "$temp_root"/osint-consume-*) ;;
  *) echo "Unexpected test directory: $tmp" >&2; exit 1 ;;
esac
trap 'rm -rf -- "$tmp"' EXIT

mkdir -p "$tmp/data/queue/pending"
for name in first second; do
  printf '{"candidates":[]}\n' > "$tmp/data/queue/pending/$name.json"
done
git -C "$tmp" init -q
git -C "$tmp" add data/queue/pending
git -C "$tmp" -c user.name=fixture -c user.email=fixture@example.com \
  commit -qm Fixture

# A bad argument must leave the entire batch untouched.
if (cd "$tmp" && bash "$helper" \
    data/queue/pending/first.json data/queue/pending/missing.json) >/dev/null 2>&1; then
  echo 'Missing tip unexpectedly accepted' >&2
  exit 1
fi
test -f "$tmp/data/queue/pending/first.json"
test -z "$(git -C "$tmp" diff --cached --name-only)"

(cd "$tmp" && bash "$helper" \
  data/queue/pending/first.json data/queue/pending/second.json) >/dev/null
test ! -e "$tmp/data/queue/pending/first.json"
test ! -e "$tmp/data/queue/pending/second.json"
test ! -e "$tmp/data/queue/processed"
test ! -e "$tmp/data/queue/expired"
statuses=$(git -C "$tmp" diff --cached --name-status -- data/queue/pending)
test "$(printf '%s\n' "$statuses" | grep -c '^D[[:space:]]')" -eq 2

echo 'Consumed-tip deletion check passed.'
