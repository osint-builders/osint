# Troubleshooting

## Rate Limit Exceeded (429)

```bash
# Error: HTTP 429 Too Many Requests
# Solution: Increase sleep between requests
sleep 2  # instead of sleep 1
```

If you hit 429 repeatedly, back off to `sleep 5` and verify your User-Agent header is set (curl sets one by default; if you customize headers, ensure a non-empty User-Agent).

## No Results for Valid Location

```bash
# Try variations:
geocode_location "New York City, USA"
geocode_location "New York, United States"
geocode_location "NYC, US"
```

## Ambiguous Locations

```bash
# Be specific:
geocode_location "Paris, France"  # Not just "Paris" (could be Paris, Texas)
geocode_location "Berlin, Germany"  # Not just "Berlin"
```

## API Timeout

```bash
# Add timeout to curl
curl --max-time 10 -s "https://nominatim.openstreetmap.org/search?q=$encoded&format=json&limit=1"
```

## Retry with Fallback

```bash
geocode_with_retry() {
  local location="$1"
  local max_attempts=3
  local attempt=1

  while [ $attempt -le $max_attempts ]; do
    result=$(geocode_location "$location")
    lat=$(echo "$result" | jq -r '.lat')

    if [ "$lat" != "null" ] && [ -n "$lat" ]; then
      echo "$result"
      return 0
    fi

    echo "Geocoding attempt $attempt failed for: $location" >&2
    attempt=$((attempt + 1))
    sleep 2
  done

  echo "Geocoding failed after $max_attempts attempts, using fallback" >&2
  # Return country-level or global fallback
  country=$(echo "$location" | awk -F',' '{print $NF}' | xargs)
  if [ -n "$country" ]; then
    geocode_location "$country"
  else
    echo '{"lat": "0.0", "lon": "0.0", "display_name": "Global"}'
  fi
}
```

## Validation

Validate coordinates before saving to event:

```bash
validate_coordinates() {
  local lat="$1"
  local lon="$2"

  # Check not null
  if [ "$lat" == "null" ] || [ "$lon" == "null" ]; then
    return 1
  fi

  # Check ranges
  if (( $(echo "$lat < -90 || $lat > 90" | bc -l) )); then
    echo "Invalid latitude: $lat" >&2
    return 1
  fi

  if (( $(echo "$lon < -180 || $lon > 180" | bc -l) )); then
    echo "Invalid longitude: $lon" >&2
    return 1
  fi

  return 0
}

# Usage
if validate_coordinates "$LAT" "$LON"; then
  echo "Valid coordinates: $LAT, $LON"
else
  echo "Invalid coordinates, using fallback"
  LAT="0.0"
  LON="0.0"
fi
```

## Encoding Non-ASCII Locations

When passing names with accents, CJK, or Cyrillic characters, always URL-encode via `jq -sRr @uri`:

```bash
encoded=$(printf '%s' "São Paulo, Brazil" | jq -sRr @uri)
```

Avoid `printf %q` or shell escaping — Nominatim expects RFC 3986 percent-encoding.

## Country-Level Fallback

If city/region geocoding fails, use country-level:

```bash
# Primary: Gaziantep, Turkey
GEO=$(geocode_location "Gaziantep, Turkey")
if [ "$(echo "$GEO" | jq -r '.lat')" == "null" ]; then
  # Fallback: Turkey
  GEO=$(geocode_location "Turkey")
fi
```

## Region Center Fallback

For regional events without specific location:

```bash
# "Middle East conflict" → use region center
case "$REGION" in
  "Middle East")
    LAT="29.0"
    LON="47.0"
    ;;
  "East Asia")
    LAT="35.0"
    LON="105.0"
    ;;
  "Europe")
    LAT="50.0"
    LON="10.0"
    ;;
esac
```

## Global Default

If all else fails:

```bash
LAT="37.7749"
LON="-122.4194"
COUNTRY="Global"
```
