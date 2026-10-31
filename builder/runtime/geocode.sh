#!/usr/bin/env bash
# geocode.sh — resolve a location string to {lat, lon, display_name} JSON via
# OpenStreetMap Nominatim, with an on-disk cache and pre-seeded fallbacks for
# locations Nominatim resolves poorly (learned in May 2026 runs).
#
# Usage: bash builder/runtime/geocode.sh "Gaziantep, Turkey"
# Env:   GEOCODING_CACHE (default /tmp/geocoding-cache.json)
# Rate limit: sleeps 1s before every network lookup (Nominatim policy).
set -euo pipefail

LOCATION="${1:?usage: geocode.sh \"<location string>\"}"
GEOCODING_CACHE="${GEOCODING_CACHE:-/tmp/geocoding-cache.json}"

if [ ! -f "$GEOCODING_CACHE" ]; then
  cat > "$GEOCODING_CACHE" <<'SEED'
{
  "Goma, Democratic Republic of Congo": {"lat": -1.6777, "lon": 29.2285, "display_name": "Goma, DRC (seeded)"},
  "Uvira, Democratic Republic of Congo": {"lat": -3.4, "lon": 29.14, "display_name": "Uvira, DRC (seeded)"},
  "Bunia, Democratic Republic of Congo": {"lat": 1.5667, "lon": 30.25, "display_name": "Bunia, DRC (seeded)"},
  "Spratly Islands, South China Sea": {"lat": 10.68, "lon": 117.83, "display_name": "Spratly Islands (seeded)"}
}
SEED
fi

# Nominatim's free-text search ranks the Dnipro River ahead of the city.
# Override old caches as well as fresh lookups with the city point.
if [ "$LOCATION" = "Dnipro, Ukraine" ]; then
  printf '%s\n' '{"lat":48.4680221,"lon":35.0417711,"display_name":"Dnipro, Ukraine (seeded city)"}'
  exit 0
fi

cached=$(jq -c --arg loc "$LOCATION" '
  .[$loc] // empty |
  .lat |= (try tonumber catch null) |
  .lon |= (try tonumber catch null) |
  select(.lat != null and .lon != null and
         .lat >= -90 and .lat <= 90 and .lon >= -180 and .lon <= 180)
' "$GEOCODING_CACHE" 2>/dev/null || true)
if [ -n "$cached" ]; then
  printf '%s\n' "$cached"
  exit 0
fi

fetch_nominatim() {
  sleep 1
  curl -fsS --connect-timeout 5 --max-time 12 \
    -A "osint-collector/1.0 (github.com/osint-builders/osint)" "$1" 2>/dev/null
}

parse_result() {
  local mode="$1"
  jq -c --arg mode "$mode" --arg loc "$LOCATION" '
    def city_like:
      (.addresstype // .type // "") as $kind |
      (["city", "town", "village", "hamlet", "suburb", "neighbourhood", "quarter", "locality"] | index($kind)) != null;
    def waterway: .class == "waterway" or .type == "river" or .type == "stream" or .type == "canal";
    if type == "array" then
      [ .[] |
        select(if $mode == "city" then city_like
               else (waterway | not) or ($loc | test("\\b(river|stream|canal)\\b"; "i"))
               end) |
        {lat: (try (.lat | tonumber) catch null),
         lon: (try (.lon | tonumber) catch null),
         display_name: .display_name} |
        select(.lat != null and .lon != null and
               .lat >= -90 and .lat <= 90 and .lon >= -180 and .lon <= 180)
      ] | .[0] // empty
    else empty end
  ' 2>/dev/null
}

result=''
if [[ "$LOCATION" == *,* && "$LOCATION" != *,*,* ]]; then
  city="${LOCATION%%,*}"
  country="${LOCATION#*,}"
  city="${city#"${city%%[![:space:]]*}"}"
  city="${city%"${city##*[![:space:]]}"}"
  country="${country#"${country%%[![:space:]]*}"}"
  country="${country%"${country##*[![:space:]]}"}"
  if [ -n "$city" ] && [ -n "$country" ]; then
    city_encoded=$(printf '%s' "$city" | jq -sRr @uri)
    country_encoded=$(printf '%s' "$country" | jq -sRr @uri)
    if response=$(fetch_nominatim "https://nominatim.openstreetmap.org/search?city=$city_encoded&country=$country_encoded&format=json&limit=1"); then
      result=$(printf '%s' "$response" | parse_result city) || result=''
    fi
  fi
fi

if [ -z "$result" ]; then
  encoded=$(printf '%s' "$LOCATION" | jq -sRr @uri)
  if response=$(fetch_nominatim "https://nominatim.openstreetmap.org/search?q=$encoded&format=json&limit=1"); then
    result=$(printf '%s' "$response" | parse_result any) || result=''
  fi
fi
if [ -z "$result" ]; then
  printf '%s\n' '{"lat":null,"lon":null,"display_name":null}'
  exit 0
fi

if tmp_cache=$(jq --arg loc "$LOCATION" --argjson res "$result" \
  '. + {($loc): $res}' "$GEOCODING_CACHE" 2>/dev/null); then
  printf '%s\n' "$tmp_cache" > "$GEOCODING_CACHE"
fi
printf '%s\n' "$result"
