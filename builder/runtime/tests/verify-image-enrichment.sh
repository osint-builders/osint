#!/usr/bin/env bash
set -euo pipefail

helper="builder/runtime/enrich-link-preview.sh"
tmp=$(mktemp -d)
trap 'status=$?; if [ "$status" -ne 0 ]; then cat "$tmp/curl.log" >&2 2>/dev/null || true; fi; rm -f "$tmp/curl" "$tmp/banner-cache.json" "$tmp/curl.log"; rmdir "$tmp"' EXIT
export TWITTER_BANNER_CACHE="$tmp/banner-cache.json"
export MOCK_CURL_LOG="$tmp/curl.log"
export PATH="$tmp:$PATH"

cat > "$tmp/curl" <<'MOCK'
#!/usr/bin/env bash
set -euo pipefail
method=GET
url=''
range=0
max_filesize=0
for arg in "$@"; do
  case "$arg" in
    --head) method=HEAD ;;
    --range) range=1 ;;
    --max-filesize) max_filesize=1 ;;
    --location|-L) echo 'Probe followed redirects automatically' >&2; exit 1 ;;
    https://*|http://*) url="$arg" ;;
  esac
done
if [ "$method" = GET ] && [[ "$url" != https://api.linkpreview.net/* ]] &&
   [[ "$url" != https://api.twitter.com/* ]] &&
   { [ "$range" -ne 1 ] || [ "$max_filesize" -ne 1 ]; }; then
  echo 'Image GET must use a one-byte range and size limit' >&2
  exit 1
fi
printf '%s %s\n' "$method" "$url" >> "$MOCK_CURL_LOG"
reply() {
  if [ "${MOCK_CRLF:-0}" = 1 ]; then
    printf '%s\r\n%s\r\n%s\r\n' "$1" "$2" "${3:-}"
  else
    printf '%s\n%s\n%s\n' "$1" "$2" "${3:-}"
  fi
}
case "$url" in
  https://api.linkpreview.net/*)
    printf '%s\n' '{"title":"Preview","description":"Report","image":"https://example.org/preview.jpg","url":"https://example.org/report"}' ;;
  https://api.twitter.com/*)
    printf '%s\n' '{}' ;;
  https://osint.builders/favicon.svg)
    if [ "${MOCK_FAIL_DEFAULT:-0}" = 1 ]; then reply 404 text/html; else reply 200 image/svg+xml; fi ;;
  https://example.org/dead.jpg|https://example.org/not-image)
    if [ "$url" = https://example.org/dead.jpg ]; then reply 404 text/html; else reply 200 text/html; fi ;;
  https://example.org/head-denied.jpg)
    if [ "$method" = HEAD ]; then reply 405 text/plain; else reply 206 image/png; fi ;;
  https://example.org/redirect.jpg)
    reply 302 text/html https://cdn.example.org/photo.jpg ;;
  https://example.org/redirect-local.jpg)
    reply 302 text/html http://127.0.0.1/admin ;;
  https://example.org/redirect-loop.jpg)
    reply 302 text/html https://example.org/redirect-loop.jpg ;;
  https://pbs.twimg.com/profile_banners/123/1500x500|https://pbs.twimg.com/profile_banners/123)
    reply 200 image/jpeg ;;
  https://example.org/photo.jpg|https://example.org/preview.jpg|https://cdn.example.org/photo.jpg)
    reply 200 image/jpeg ;;
  *) reply 404 text/html ;;
esac
MOCK
chmod +x "$tmp/curl"

run_enrich() {
  printf '%s' "$1" | env -u LINKPREVIEW_API_KEY -u TWITTER_BEARER_TOKEN bash "$helper"
}
assert_image() {
  printf '%s' "$1" | jq -e --arg image "$2" --arg origin "$3" \
    '.image_urls == [$image] and .image_origin == $origin' >/dev/null
}

base='{"title":"Demo","summary":"Demo summary","links":[{"url":"https://example.org/report"}],"image_urls":[]}'
fallback=$(run_enrich "$base")
assert_image "$fallback" 'https://osint.builders/favicon.svg' default
crlf_fallback=$(printf '%s' "$base" | MOCK_CRLF=1 env -u LINKPREVIEW_API_KEY -u TWITTER_BEARER_TOKEN bash "$helper")
assert_image "$crlf_fallback" 'https://osint.builders/favicon.svg' default

# A dead scraped image must yield to the verified LinkPreview image.
preview=$(run_enrich '{"title":"Demo","summary":"Demo summary","links":[{"url":"https://example.org/report"}],"image_urls":["https://example.org/dead.jpg"],"link_preview":{"image":"https://example.org/preview.jpg"}}')
assert_image "$preview" 'https://example.org/preview.jpg' article
grep -qF 'HEAD https://example.org/dead.jpg' "$MOCK_CURL_LOG"

# The API preview path also needs verification before promotion.
api_preview=$(printf '%s' "$base" | LINKPREVIEW_API_KEY=dummy env -u TWITTER_BEARER_TOKEN bash "$helper")
assert_image "$api_preview" 'https://example.org/preview.jpg' article

head_denied=$(run_enrich '{"title":"Demo","links":[{"url":"https://example.org/report"}],"image_urls":["https://example.org/head-denied.jpg"]}')
assert_image "$head_denied" 'https://example.org/head-denied.jpg' article
grep -qF 'GET https://example.org/head-denied.jpg' "$MOCK_CURL_LOG"

not_image=$(run_enrich '{"title":"Demo","links":[{"url":"https://example.org/report"}],"image_urls":["https://example.org/not-image"]}')
assert_image "$not_image" 'https://osint.builders/favicon.svg' default

redirect=$(run_enrich '{"title":"Demo","links":[{"url":"https://example.org/report"}],"image_urls":["https://example.org/redirect.jpg"]}')
assert_image "$redirect" 'https://example.org/redirect.jpg' article
grep -qF 'HEAD https://cdn.example.org/photo.jpg' "$MOCK_CURL_LOG"
crlf_redirect=$(printf '%s' '{"title":"Demo","links":[{"url":"https://example.org/report"}],"image_urls":["https://example.org/redirect.jpg"]}' \
  | MOCK_CRLF=1 env -u LINKPREVIEW_API_KEY -u TWITTER_BEARER_TOKEN bash "$helper")
assert_image "$crlf_redirect" 'https://example.org/redirect.jpg' article

local_redirect=$(run_enrich '{"title":"Demo","links":[{"url":"https://example.org/report"}],"image_urls":["https://example.org/redirect-local.jpg"]}')
assert_image "$local_redirect" 'https://osint.builders/favicon.svg' default
if grep -qF '127.0.0.1' "$MOCK_CURL_LOG"; then echo 'Private redirect was probed' >&2; exit 1; fi

loop_redirect=$(run_enrich '{"title":"Demo","links":[{"url":"https://example.org/report"}],"image_urls":["https://example.org/redirect-loop.jpg"]}')
assert_image "$loop_redirect" 'https://osint.builders/favicon.svg' default

private=$(run_enrich '{"title":"Demo","links":[{"url":"https://example.org/report"}],"image_urls":["http://127.0.0.1/private.jpg","http://localhost/image.jpg","https://user:pass@example.org/photo.jpg"]}')
assert_image "$private" 'https://osint.builders/favicon.svg' default
if grep -qE 'HEAD (http://127\.|http://localhost/|https://user:pass@)' "$MOCK_CURL_LOG"; then
  echo 'Unsafe image URL was probed' >&2; exit 1
fi

printf '%s' '{"Warshipcam":"https://pbs.twimg.com/profile_banners/123"}' > "$TWITTER_BANNER_CACHE"
banner=$(printf '%s' '{"title":"Demo","summary":"Demo summary","source":{"name":"Warshipcam (@Warshipcam)"},"links":[{"url":"https://x.com/Warshipcam/status/123"}],"image_urls":[]}' \
  | TWITTER_BEARER_TOKEN=dummy env -u LINKPREVIEW_API_KEY bash "$helper")
assert_image "$banner" 'https://pbs.twimg.com/profile_banners/123/1500x500' source

if MOCK_FAIL_DEFAULT=1 run_enrich "$base" >/dev/null 2>&1; then
  echo 'Unavailable default image should fail enrichment' >&2; exit 1
fi

echo 'Image enrichment check passed.'
