#!/usr/bin/env bash
# Reject city-level points far from the named place before image enrichment.
# Reads one event JSON object on stdin; diagnostics only go to stderr.
set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
MAX_CITY_OFFSET_KM=6

if ! event_json=$(jq -ce 'objects' 2>/dev/null); then
  echo 'REJECT: geo check requires one event JSON object' >&2
  exit 1
fi

# Other precisions need source-specific evidence, not a city-centroid test.
[ "$(printf '%s' "$event_json" | jq -r '.geo.precision // ""')" = city ] || exit 0

if ! printf '%s' "$event_json" | jq -e '
  (.geo.location_name | type == "string" and length > 0) and
  (.geo.lat | type == "number") and (.geo.lon | type == "number")
' >/dev/null; then
  echo 'REJECT: city-precision geo needs a name and numeric coordinates' >&2
  exit 1
fi

location_name=$(printf '%s' "$event_json" | jq -r '.geo.location_name')
if ! resolved=$(bash "$SCRIPT_DIR/geocode.sh" "$location_name"); then
  echo "REJECT: could not geocode city location: $location_name" >&2
  exit 1
fi
if ! printf '%s' "$resolved" | jq -e '
  (.lat | type == "number") and (.lon | type == "number")
' >/dev/null 2>&1; then
  echo "REJECT: city location has no resolved point: $location_name" >&2
  exit 1
fi

# Haversine distance remains valid across the antimeridian. Six kilometres
# allows ordinary geocoder/centre variation while catching displaced cities.
point=$(printf '%s' "$event_json" | jq -r '[.geo.lat, .geo.lon] | @tsv')
centre=$(printf '%s' "$resolved" | jq -r '[.lat, .lon] | @tsv')
read -r lat lon <<< "$point"
read -r centre_lat centre_lon <<< "$centre"
distance_km=$(awk -v lat="$lat" -v lon="$lon" \
  -v clat="$centre_lat" -v clon="$centre_lon" 'BEGIN {
    pi = atan2(0, -1); r = pi / 180;
    dlat = (clat - lat) * r; dlon = (clon - lon) * r;
    a = sin(dlat / 2)^2 + cos(lat * r) * cos(clat * r) * sin(dlon / 2)^2;
    if (a > 1) a = 1;
    printf "%.3f", 12742 * atan2(sqrt(a), sqrt(1 - a));
  }')
if ! awk -v distance="$distance_km" -v max="$MAX_CITY_OFFSET_KM" \
  'BEGIN { exit !(distance <= max) }'; then
  echo "REJECT: city point for $location_name lies ${distance_km} km from geocoded centre (limit ${MAX_CITY_OFFSET_KM} km)" >&2
  exit 1
fi
