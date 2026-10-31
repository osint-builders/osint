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

encoded=$(printf '%s' "$LOCATION" | jq -sRr @uri)
sleep 1
if ! response=$(curl -fsS --connect-timeout 5 --max-time 12 \
  -A "osint-collector/1.0 (github.com/osint-builders/osint)" \
  "https://nominatim.openstreetmap.org/search?q=$encoded&format=json&limit=1" 2>/dev/null); then
  printf '%s\n' '{"lat":null,"lon":null,"display_name":null}'
  exit 0
fi
result=$(printf '%s' "$response" | jq -c '
  if type == "array" and length > 0 then
    {lat: (.[0].lat | tonumber), lon: (.[0].lon | tonumber), display_name: .[0].display_name}
  else {lat: null, lon: null, display_name: null} end
' 2>/dev/null) || result=''
if [ -z "$result" ]; then
  printf '%s\n' '{"lat":null,"lon":null,"display_name":null}'
  exit 0
fi

if tmp_cache=$(jq --arg loc "$LOCATION" --argjson res "$result" \
  '. + {($loc): $res}' "$GEOCODING_CACHE" 2>/dev/null); then
  printf '%s\n' "$tmp_cache" > "$GEOCODING_CACHE"
fi
printf '%s\n' "$result"
