#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
test_root="$(mktemp -d "${TMPDIR:-/tmp}/osint-geocode.XXXXXX")"
resolved_root="$(realpath "$test_root")"
resolved_tmp="$(realpath "${TMPDIR:-/tmp}")"
if [[ "$resolved_root" != "$resolved_tmp"/osint-geocode.* ]]; then
  echo "Unsafe temporary test directory: $resolved_root" >&2
  exit 1
fi
trap 'rm -rf -- "$resolved_root"' EXIT

mkdir -p "$resolved_root/bin"
cat > "$resolved_root/bin/curl" <<'CURL'
#!/usr/bin/env bash
url="${!#}"
printf '%s\n' "$url" >> "$GEOCODE_REQUEST_LOG"
case "$url" in
  *'city=Uman&country=Ukraine'*)
    if [ "${GEOCODE_EMPTY_CITY:-}" = 1 ]; then
      printf '%s\n' '[]'
    else
      printf '%s\n' '[{"lat":"48.75","lon":"30.22","display_name":"Uman, Ukraine","addresstype":"city","class":"place","type":"city"}]'
    fi
    ;;
  *'q=Uman%2C%20Ukraine'*)
    printf '%s\n' '[{"lat":"49.6243131","lon":"31.6666824","display_name":"Unrelated river, Ukraine","addresstype":"river","class":"waterway","type":"river"}]'
    ;;
  *'city=Luhansk%20Oblast&country=Ukraine'*)
    printf '%s\n' '[]'
    ;;
  *'q=Luhansk%20Oblast%2C%20Ukraine'*)
    printf '%s\n' '[{"lat":"48.57","lon":"39.30","display_name":"Luhansk Oblast, Ukraine","addresstype":"state","class":"boundary","type":"administrative"}]'
    ;;
  *)
    echo "Unexpected Nominatim request: $url" >&2
    exit 1
    ;;
esac
CURL
cat > "$resolved_root/bin/sleep" <<'SLEEP'
#!/usr/bin/env bash
printf '%s\n' "$1" >> "$GEOCODE_SLEEP_LOG"
SLEEP
chmod +x "$resolved_root/bin/curl" "$resolved_root/bin/sleep"
export PATH="$resolved_root/bin:$PATH"
export GEOCODING_CACHE="$resolved_root/cache.json"
export GEOCODE_REQUEST_LOG="$resolved_root/requests.log"
export GEOCODE_SLEEP_LOG="$resolved_root/sleeps.log"
printf '%s\n' '{"Dnipro, Ukraine":{"lat":49.6243131,"lon":31.6666824,"display_name":"Dnipro River, Ukraine"}}' > "$GEOCODING_CACHE"
touch "$GEOCODE_REQUEST_LOG" "$GEOCODE_SLEEP_LOG"

dnipro="$(bash "$repo_root/builder/runtime/geocode.sh" 'Dnipro, Ukraine')"
printf '%s\n' "$dnipro" | jq -e '.lat > 48 and .lat < 49 and .lon > 34 and .lon < 36' >/dev/null ||
  { echo "Dnipro resolved outside the city: $dnipro" >&2; exit 1; }
[[ "$(wc -l < "$GEOCODE_REQUEST_LOG")" -eq 0 ]]

cached="$(bash "$repo_root/builder/runtime/geocode.sh" 'Dnipro, Ukraine')"
[[ "$cached" == "$dnipro" ]]
[[ "$(wc -l < "$GEOCODE_REQUEST_LOG")" -eq 0 ]]

uman="$(bash "$repo_root/builder/runtime/geocode.sh" 'Uman, Ukraine')"
printf '%s\n' "$uman" | jq -e '.lat == 48.75 and .lon == 30.22' >/dev/null ||
  { echo "Structured city lookup failed: $uman" >&2; exit 1; }
grep -q 'city=Uman&country=Ukraine' "$GEOCODE_REQUEST_LOG"
[[ "$(wc -l < "$GEOCODE_REQUEST_LOG")" -eq 1 ]]

region="$(bash "$repo_root/builder/runtime/geocode.sh" 'Luhansk Oblast, Ukraine')"
printf '%s\n' "$region" | jq -e '.lat == 48.57 and .lon == 39.30' >/dev/null ||
  { echo "Region fallback failed: $region" >&2; exit 1; }
grep -q 'q=Luhansk%20Oblast%2C%20Ukraine' "$GEOCODE_REQUEST_LOG"
[[ "$(wc -l < "$GEOCODE_REQUEST_LOG")" -eq 3 ]]
[[ "$(wc -l < "$GEOCODE_SLEEP_LOG")" -eq 3 ]]

printf '{}\n' > "$GEOCODING_CACHE"
: > "$GEOCODE_REQUEST_LOG"
: > "$GEOCODE_SLEEP_LOG"
unresolved="$(GEOCODE_EMPTY_CITY=1 bash "$repo_root/builder/runtime/geocode.sh" 'Uman, Ukraine')"
printf '%s\n' "$unresolved" | jq -e '.lat == null and .lon == null' >/dev/null ||
  { echo "River fallback should not stand in for a city: $unresolved" >&2; exit 1; }
[[ "$(wc -l < "$GEOCODE_REQUEST_LOG")" -eq 2 ]]
[[ "$(wc -l < "$GEOCODE_SLEEP_LOG")" -eq 2 ]]

echo 'Geocode city selection and area fallback passed.'
