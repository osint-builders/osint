#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
test_root="$(mktemp -d "${TMPDIR:-/tmp}/osint-geo-point.XXXXXX")"
resolved_root="$(realpath "$test_root")"
resolved_tmp="$(realpath "${TMPDIR:-/tmp}")"
if [[ "$resolved_root" != "$resolved_tmp"/osint-geo-point.* ]]; then
  echo "Unsafe temporary test directory: $resolved_root" >&2
  exit 1
fi
trap 'rm -rf -- "$resolved_root"' EXIT

mkdir -p "$resolved_root/bin"
cat > "$resolved_root/bin/curl" <<'CURL'
#!/usr/bin/env bash
set -euo pipefail
url="${!#}"
case "$url" in
  *'city=Hebron&country=West%20Bank'*)
    printf '%s\n' '[{"lat":"31.528902","lon":"35.0944873","display_name":"Hebron, West Bank","addresstype":"city","class":"place","type":"city"}]' ;;
  *'city=Um%20Safa&country=West%20Bank'*)
    printf '%s\n' '[{"lat":"32.0083765","lon":"35.1658896","display_name":"Um Safa, West Bank","addresstype":"village","class":"place","type":"village"}]' ;;
  *'city=Missingville&country=West%20Bank'*|*'q=Missingville%2C%20West%20Bank'*)
    printf '%s\n' '[]' ;;
  https://example.org/photo.jpg)
    printf 'IMAGE %s\n' "$url" >> "$GEO_POINT_REQUEST_LOG"
    printf '200\nimage/jpeg\n\n' ;;
  *)
    echo "Unexpected URL: $url" >&2
    exit 1 ;;
esac
CURL
cat > "$resolved_root/bin/sleep" <<'SLEEP'
#!/usr/bin/env bash
exit 0
SLEEP
chmod +x "$resolved_root/bin/curl" "$resolved_root/bin/sleep"
export PATH="$resolved_root/bin:$PATH"
export GEOCODING_CACHE="$resolved_root/cache.json"
export GEO_POINT_REQUEST_LOG="$resolved_root/requests.log"
printf '{}\n' > "$GEOCODING_CACHE"
touch "$GEO_POINT_REQUEST_LOG"

event='{"source":{"name":"UNITED24 Media (@United24media)"},"title":"UNITED24 Media (@United24media) reports a development","summary":"UNITED24 Media (@United24media) reports a development","contents":"## Event\n\nUNITED24 Media (@United24media) reports a development","links":[{"url":"https://example.org/report"}],"date_published":"2026-10-30T17:30:00Z","source_window":{"start":"2026-10-30T17:00:00Z","end":"2026-10-30T18:00:00Z"},"original_report":{"url":"https://example.org/report","published_at":"2026-10-30T17:30:00Z"},"image_urls":["https://example.org/photo.jpg"]}'
with_geo() {
  printf '%s' "$event" | jq -c --arg name "$1" --arg precision "$2" \
    --argjson lat "$3" --argjson lon "$4" \
    '.geo = {location_name:$name,precision:$precision,lat:$lat,lon:$lon}'
}
check_reject() {
  if printf '%s' "$1" | bash "$repo_root/builder/runtime/verify-geo-point.sh" > "$resolved_root/output" 2> "$resolved_root/error"; then
    echo "Expected geo rejection: $1" >&2
    exit 1
  fi
  grep -q "$2" "$resolved_root/error"
  [[ ! -s "$resolved_root/output" ]]
}

# These published points fall roughly 10.6 km and 7.8 km from the named places.
hebron_bad=$(with_geo 'Hebron, West Bank' city 31.5329 35.2059)
um_safa_bad=$(with_geo 'Um Safa, West Bank' city 31.9454 35.2013)
check_reject "$hebron_bad" 'from geocoded centre'
check_reject "$um_safa_bad" 'from geocoded centre'

# Sub-kilometre variation and other precision levels remain valid.
printf '%s' "$(with_geo 'Hebron, West Bank' city 31.529 35.095)" |
  bash "$repo_root/builder/runtime/verify-geo-point.sh"
printf '%s' "$(with_geo 'Um Safa, West Bank' city 32.0084 35.1659)" |
  bash "$repo_root/builder/runtime/verify-geo-point.sh"
printf '%s' "$(with_geo 'Hebron, West Bank' exact 31.5329 35.2059)" |
  bash "$repo_root/builder/runtime/verify-geo-point.sh"
check_reject "$(with_geo 'Missingville, West Bank' city 31.9 35.2)" 'no resolved point'

# The candidate gate must run before even the first image HEAD request.
if printf '%s' "$hebron_bad" | bash "$repo_root/builder/runtime/enrich-link-preview.sh" > "$resolved_root/output" 2> "$resolved_root/error"; then
  echo 'Enrichment accepted a displaced Hebron point' >&2
  exit 1
fi
[[ ! -s "$GEO_POINT_REQUEST_LOG" ]]
printf '%s' "$(with_geo 'Hebron, West Bank' city 31.529 35.095)" |
  bash "$repo_root/builder/runtime/enrich-link-preview.sh" > "$resolved_root/output"
jq -e '.image_urls == ["https://example.org/photo.jpg"]' "$resolved_root/output" >/dev/null
grep -qF 'IMAGE https://example.org/photo.jpg' "$GEO_POINT_REQUEST_LOG"

echo 'City point candidate gate passed.'
