#!/usr/bin/env bash
# Exercise every active Identify adapter with fixed responses and no network.
set -euo pipefail

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd -P)
identify_script=${IDENTIFY_SCRIPT:-$repo_root/builder/runtime/identify.sh}
temp_root=$(cd "${TMPDIR:-/tmp}" && pwd -P)
tmp=$(mktemp -d "$temp_root/osint-identify-XXXXXX")
case "$tmp" in
  "$temp_root"/osint-identify-*) ;;
  *) echo "Unexpected test directory: $tmp" >&2; exit 1 ;;
esac
trap 'rm -rf -- "$tmp"' EXIT

mkdir -p "$tmp/bin" "$tmp/source/sources"
cat > "$tmp/source/manifest.json" <<'JSON'
{"sources":[
  {"id":"twitter-test","name":"Test Intel","type":"twitter","file":"sources/twitter-test.md"},
  {"id":"reddit-test","name":"Test Defense","type":"api","file":"sources/reddit-test.md"},
  {"id":"telegram-test","name":"Test Channel","type":"telegram","file":"sources/telegram-test.md"},
  {"id":"webpage-test","name":"Test News","type":"webpage","file":"sources/webpage-test.md"},
  {"id":"api-test","name":"Test API","type":"api","file":"sources/api-test.md"},
  {"id":"webpage-stale","name":"Stale News","type":"webpage","file":"sources/webpage-stale.md"},
  {"id":"email-unsupported","name":"Unsupported Mail","type":"email","file":"sources/email-unsupported.md"}
]}
JSON
cat > "$tmp/source/sources/twitter-test.md" <<'MD'
# Test Intel (@TestIntel)
MD
cat > "$tmp/source/sources/reddit-test.md" <<'MD'
# r/TestDefense (reddit.com/r/TestDefense)
MD
cat > "$tmp/source/sources/telegram-test.md" <<'MD'
# Test Channel
channel: TestChannel
MD
cat > "$tmp/source/sources/webpage-test.md" <<'MD'
# Test News
url: https://example.org/news
MD
cat > "$tmp/source/sources/api-test.md" <<'MD'
# Test API
url: https://api.example.org/feed
MD
cat > "$tmp/source/sources/webpage-stale.md" <<'MD'
# Stale News
url: https://example.org/stale
MD
cat > "$tmp/source/sources/email-unsupported.md" <<'MD'
# Unsupported Mail
url: https://example.org/unsupported
MD

cat > "$tmp/bin/curl" <<'MOCK'
#!/usr/bin/env bash
set -euo pipefail
url=''
for arg in "$@"; do
  case "$arg" in https://*|http://*) url="$arg" ;; esac
done
case "$url" in
  https://api.twitter.com/2/users/by/username/TestIntel)
    printf '%s\n' '{"data":{"id":"42"}}' ;;
  https://api.twitter.com/2/users/42/tweets*)
    [[ "$url" == *'start_time=2026-10-30T12:00:00Z'* && "$url" == *'end_time=2026-10-30T13:00:00Z'* ]] || {
      echo "Twitter request omitted the fixed scan window: $url" >&2
      exit 1
    }
    printf '%s\n' '{"data":[{"id":"111","created_at":"2026-10-30T12:30:00Z","text":"Recent defense report"}]}' ;;
  https://www.reddit.com/r/TestDefense/new.json*)
    printf '%s\n' '{"data":{"children":[{"data":{"created_utc":1793363400,"permalink":"/r/TestDefense/comments/recent","title":"Recent vessel report"}},{"data":{"created_utc":1793359800,"permalink":"/r/TestDefense/comments/old","title":"Old report"}},{"data":{"created_utc":1793365800,"permalink":"/r/TestDefense/comments/future","title":"Future report"}}]}}' ;;
  https://t.me/s/TestChannel)
    cat <<'HTML'
<article data-post="TestChannel/501"><time datetime="2026-10-30T12:40:00Z"></time></article>
<article data-post="TestChannel/500"><time datetime="2026-10-30T11:30:00Z"></time></article>
<article data-post="TestChannel/502"><time datetime="2026-10-30T13:10:00Z"></time></article>
HTML
    ;;
  https://example.org/news)
    if [ "${MOCK_FAIL_NEWS:-0}" = 1 ]; then exit 22; fi
    if [ "${MOCK_LARGE_NEWS:-0}" = 1 ]; then
      printf '%s' '<article><time datetime="2026-10-30T12:20:00Z"></time>'
      python3 -c 'print("x" * 1000000)'
      exit 0
    fi
    printf '%s\n' '<article><time datetime="2026-10-30T12:20:00Z"></time>Recent conflict report</article>' ;;
  https://api.example.org/feed)
    printf '%s\n' '{"published_at":"2026-10-30T12:25:00Z","title":"Recent maritime report"}' ;;
  https://example.org/stale)
    printf '%s\n' '<article><time datetime="2026-10-30T11:30:00Z"></time>Old report</article>' ;;
  *) echo "Unexpected network request: $url" >&2; exit 1 ;;
esac
MOCK
chmod +x "$tmp/bin/curl"

window_start='2026-10-30T12:00:00Z'
window_end='2026-10-30T13:00:00Z'
(
  cd "$tmp"
  PATH="$tmp/bin:$PATH" \
    TIME_WINDOW_START="$window_start" TIME_WINDOW_END="$window_end" \
    TWITTER_BEARER_TOKEN=fixture \
    bash "$identify_script" \
      twitter-test reddit-test telegram-test webpage-test api-test \
      webpage-stale email-unsupported
)

pending="$tmp/data/queue/pending"
test "$(find "$pending" -maxdepth 1 -name '*.json' | wc -l)" -eq 5

assert_tip() {
  local id="$1" expected_url="$2" file
  file=$(find "$pending" -maxdepth 1 -name "$id-*.json" -print -quit)
  test -n "$file"
  (
    cd "$tmp"
    jq -e --arg id "$id" --arg url "$expected_url" \
      --arg start "$window_start" --arg end "$window_end" \
    '.source_id == $id and .window_start == $start and .window_end == $end
     and (.identified_at | test("\\.[0-9]{3}Z$"))
       and (.candidates | length) == 1 and .candidates[0].url == $url' \
      "data/queue/pending/$(basename "$file")" >/dev/null
  )
}

assert_tip twitter-test 'https://x.com/TestIntel/status/111'
assert_tip reddit-test 'https://reddit.com/r/TestDefense/comments/recent'
assert_tip telegram-test 'https://t.me/TestChannel/501'
assert_tip webpage-test 'https://example.org/news'
assert_tip api-test 'https://api.example.org/feed'
test -z "$(find "$pending" -maxdepth 1 -name 'webpage-stale-*.json' -print -quit)"
test -z "$(find "$pending" -maxdepth 1 -name 'email-unsupported-*.json' -print -quit)"

clean_output=$(
  cd "$tmp"
  PATH="$tmp/bin:$PATH" TIME_WINDOW_START="$window_start" TIME_WINDOW_END="$window_end" \
    bash "$identify_script" webpage-stale 2>&1
)
[[ "$clean_output" != *WARN* ]]

large_output=$(
  cd "$tmp"
  PATH="$tmp/bin:$PATH" TIME_WINDOW_START="$window_start" TIME_WINDOW_END="$window_end" \
    MOCK_LARGE_NEWS=1 bash "$identify_script" webpage-test 2>&1
)
[[ "$large_output" != *'Broken pipe'* ]]

if failed_output=$(
  cd "$tmp"
  PATH="$tmp/bin:$PATH" TIME_WINDOW_START="$window_start" TIME_WINDOW_END="$window_end" \
    MOCK_FAIL_NEWS=1 bash "$identify_script" webpage-test 2>&1
); then
  echo 'A scan whose only source failed must exit nonzero.' >&2
  exit 1
fi
if [[ "$failed_output" != *WARN* || "$failed_output" != *webpage-test* ]]; then
  echo 'A failed fetch must warn with its source ID, unlike a clean no-hit scan.' >&2
  printf '%s\n' "$failed_output" >&2
  exit 1
fi

echo 'Identify adapter and time-window checks passed.'
