---
name: geocoding
description: Extract location mentions from text and convert to lat/lon coordinates using OpenStreetMap Nominatim (free) or Google Maps API (backup). Required for all world events to ensure geo.lat and geo.lon fields are populated.
license: MIT
compatibility: Works on macOS, Linux, Windows with curl, jq, and bc. No API key required for Nominatim (primary provider). Google Maps API key optional for backup.
metadata:
  author: osint-builders
  version: "1.0.0"
  provider-primary: openstreetmap-nominatim
  provider-backup: google-maps-api
---

# Geocoding Skill

Extract location mentions from text and convert to lat/lon coordinates. **Required for all world events** - every event must have `geo.lat` and `geo.lon` populated.

## Key Capabilities

- **Forward Geocoding**: Place name → Coordinates
- **Reverse Geocoding**: Coordinates → Place name
- **Caching**: Avoid repeated API calls for same locations
- **Rate Limiting**: Automatic 1 req/sec for Nominatim compliance
- **Fallback**: Country-level coordinates if city unavailable
- **Multiple Providers**: Free Nominatim (primary), Google Maps (backup)

## Providers

### Primary: OpenStreetMap Nominatim (Free)

**Advantages:**
- No API key required
- Free for all use cases
- Global coverage
- Good accuracy for cities/regions/countries

**Rate Limits:**
- Maximum 1 request per second
- Must include User-Agent header (automatic with curl)
- Cache results to minimize requests

**Endpoint:**
```bash
https://nominatim.openstreetmap.org/search
https://nominatim.openstreetmap.org/reverse
```

**Usage Policy:** https://operations.osmfoundation.org/policies/nominatim/

### Backup: Google Maps Geocoding API (Paid)

**Advantages:**
- Higher rate limits
- Better accuracy for complex/ambiguous queries
- More detailed address components
- Better handling of landmarks

**Requirements:**
- `GOOGLE_MAPS_API_KEY` environment variable
- Billing enabled on Google Cloud account
- Costs ~$5 per 1000 requests

**Endpoint:**
```bash
https://maps.googleapis.com/maps/api/geocode/json
```

## Forward Geocoding (Place → Coordinates)

### Using Nominatim (Primary)

```bash
# Function to geocode location (already in builder/index.ts prompt)
geocode_location() {
  local location="$1"

  # Check cache first
  cached=$(jq -r --arg loc "$location" '.[$loc] // empty' "$GEOCODING_CACHE" 2>/dev/null)
  if [ -n "$cached" ]; then
    echo "$cached"
    return 0
  fi

  # URL encode location
  local encoded=$(printf '%s' "$location" | jq -sRr @uri)

  # Rate limit: 1 request/second
  sleep 1

  # Query Nominatim
  result=$(curl -s "https://nominatim.openstreetmap.org/search?q=$encoded&format=json&limit=1" \
    | jq -r 'if length > 0 then {lat: .[0].lat, lon: .[0].lon, display_name: .[0].display_name} else {lat: null, lon: null, display_name: null} end')

  # Cache result
  tmp_cache=$(jq --arg loc "$location" --argjson res "$result" '. + {($loc): $res}' "$GEOCODING_CACHE")
  echo "$tmp_cache" > "$GEOCODING_CACHE"

  echo "$result"
}

# Usage
GEOCODING_CACHE="/tmp/geocoding-cache.json"
echo '{}' > "$GEOCODING_CACHE"

GEO=$(geocode_location "Paris, France")
LAT=$(echo "$GEO" | jq -r '.lat')
LON=$(echo "$GEO" | jq -r '.lon')

echo "Coordinates: $LAT, $LON"
# Output: Coordinates: 48.8566, 2.3522
```

### Using Google Maps API (Backup)

```bash
geocode_google() {
  local location="$1"
  local encoded=$(printf '%s' "$location" | jq -sRr @uri)

  result=$(curl -s "https://maps.googleapis.com/maps/api/geocode/json?address=$encoded&key=$GOOGLE_MAPS_API_KEY" \
    | jq -r 'if .results | length > 0 then {lat: .results[0].geometry.location.lat, lon: .results[0].geometry.location.lng, formatted_address: .results[0].formatted_address} else {lat: null, lon: null, formatted_address: null} end')

  echo "$result"
}

# Usage (if GOOGLE_MAPS_API_KEY is set)
if [ -n "$GOOGLE_MAPS_API_KEY" ]; then
  GEO=$(geocode_google "1600 Pennsylvania Avenue, Washington DC")
  LAT=$(echo "$GEO" | jq -r '.lat')
  LON=$(echo "$GEO" | jq -r '.lon')
  echo "Coordinates: $LAT, $LON"
fi
```

## Reverse Geocoding (Coordinates → Place)

### Using Nominatim

```bash
reverse_geocode() {
  local lat="$1"
  local lon="$2"

  # Rate limit
  sleep 1

  result=$(curl -s "https://nominatim.openstreetmap.org/reverse?lat=$lat&lon=$lon&format=json" \
    | jq -r '{
      city: .address.city // .address.town // .address.village,
      region: .address.state // .address.province,
      country: .address.country,
      country_code: .address.country_code
    }')

  echo "$result"
}

# Usage
PLACE=$(reverse_geocode 48.8566 2.3522)
CITY=$(echo "$PLACE" | jq -r '.city')
COUNTRY=$(echo "$PLACE" | jq -r '.country')

echo "Location: $CITY, $COUNTRY"
# Output: Location: Paris, France
```

## Location Extraction from Text

Before geocoding, extract location mentions from event text:

```bash
# Extract location from title, summary, or contents
extract_location() {
  local text="$1"

  # Try to find city, country pattern
  city_country=$(echo "$text" | grep -oP '[A-Z][a-z]+(?:[ -][A-Z][a-z]+)?,\s*[A-Z][a-z]+(?:[ -][A-Z][a-z]+)*' | head -1)
  if [ -n "$city_country" ]; then
    echo "$city_country"
    return 0
  fi

  # Try to find just country name
  country=$(echo "$text" | grep -oP '\b(Turkey|Syria|Ukraine|Russia|China|Taiwan|Iran|Israel|Pakistan|India|Japan|Korea|France|Germany|Italy|Spain|UK|USA|America|Mexico|Brazil|Egypt|Nigeria|Kenya|Somalia|Yemen|Iraq|Afghanistan|Poland|Romania|Greece|Netherlands|Belgium|Sweden|Norway|Finland|Denmark|Australia|Philippines|Indonesia|Thailand|Vietnam|Malaysia|Singapore)\b' | head -1)
  if [ -n "$country" ]; then
    echo "$country"
    return 0
  fi

  # No location found
  echo "Unknown"
}

# Usage
TITLE="7.8 Earthquake strikes Gaziantep, Turkey"
LOCATION=$(extract_location "$TITLE")
echo "Extracted location: $LOCATION"
# Output: Extracted location: Gaziantep, Turkey
```

## Complete Workflow Example

```bash
#!/bin/bash
# Complete geocoding workflow for an event

# Initialize cache
GEOCODING_CACHE="/tmp/geocoding-cache.json"
echo '{}' > "$GEOCODING_CACHE"

# Event data
EVENT_TITLE="US Navy destroyer arrives at Subic Bay, Philippines"
EVENT_SUMMARY="USS John Finn docked for routine port call and crew rest"

# Extract location
LOCATION=$(extract_location "$EVENT_TITLE $EVENT_SUMMARY")
echo "Extracted location: $LOCATION"

# Geocode
if [ "$LOCATION" != "Unknown" ]; then
  GEO=$(geocode_location "$LOCATION")
  LAT=$(echo "$GEO" | jq -r '.lat')
  LON=$(echo "$GEO" | jq -r '.lon')

  if [ "$LAT" != "null" ] && [ "$LON" != "null" ]; then
    echo "Geocoded: $LAT, $LON"

    # Add to event JSON
    EVENT_JSON='{"id":"evt_20260430_001","title":"USS John Finn port call"}'
    UPDATED_EVENT=$(echo "$EVENT_JSON" | jq --argjson geo \
      "{lat: $LAT, lon: $LON, city: \"Subic Bay\", country: \"Philippines\"}" \
      '. + {geo: $geo}')

    echo "$UPDATED_EVENT"
  else
    echo "Geocoding failed, using country fallback"
    # Fallback to country-level coordinates
    COUNTRY_GEO=$(geocode_location "Philippines")
    LAT=$(echo "$COUNTRY_GEO" | jq -r '.lat')
    LON=$(echo "$COUNTRY_GEO" | jq -r '.lon')
  fi
else
  echo "No location extracted, using global coordinates"
  LAT="0"
  LON="0"
fi
```

## Caching Strategy

Geocoding cache reduces API calls significantly:

```bash
# Initialize cache (once per collection run)
GEOCODING_CACHE="/tmp/geocoding-cache.json"
echo '{}' > "$GEOCODING_CACHE"

# Cache structure:
# {
#   "Paris, France": {"lat": "48.8566", "lon": "2.3522", "display_name": "Paris, Île-de-France, France"},
#   "Tokyo, Japan": {"lat": "35.6762", "lon": "139.6503", "display_name": "Tokyo, Japan"},
#   ...
# }

# Cache hit: instant return
# Cache miss: 1 second delay + API call + cache update
```

**Cache Benefits:**
- Reduces API load for repeated locations (e.g., "Ukraine" appears in many events)
- Speeds up processing (no API delay for cached locations)
- Respects rate limits (fewer actual API calls)
- Persistence per collection bucket

**Cache Lifespan:**
- Created at start of Step 3
- Used throughout source processing
- Deleted at Step 9 cleanup
- Fresh cache per hourly collection run

## Fallback Strategies

### 1. Country-Level Coordinates

If city/region geocoding fails, use country-level:

```bash
# Primary: Gaziantep, Turkey
GEO=$(geocode_location "Gaziantep, Turkey")
if [ "$(echo "$GEO" | jq -r '.lat')" == "null" ]; then
  # Fallback: Turkey
  GEO=$(geocode_location "Turkey")
fi
```

### 2. Approximate Coordinates

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

### 3. Global Default

If all else fails:

```bash
LAT="0.0"
LON="0.0"
COUNTRY="Global"
```

## Error Handling

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

## Common Locations Cache

Pre-populate cache with frequently mentioned locations:

```bash
# Common hotspots (can be embedded in prompt)
cat > "$GEOCODING_CACHE" << 'EOF'
{
  "Ukraine": {"lat": "48.3794", "lon": "31.1656", "display_name": "Ukraine"},
  "Russia": {"lat": "61.5240", "lon": "105.3188", "display_name": "Russia"},
  "Taiwan": {"lat": "23.6978", "lon": "120.9605", "display_name": "Taiwan"},
  "China": {"lat": "35.8617", "lon": "104.1954", "display_name": "China"},
  "Israel": {"lat": "31.0461", "lon": "34.8516", "display_name": "Israel"},
  "Gaza": {"lat": "31.3547", "lon": "34.3088", "display_name": "Gaza Strip"},
  "Iran": {"lat": "32.4279", "lon": "53.6880", "display_name": "Iran"},
  "Turkey": {"lat": "38.9637", "lon": "35.2433", "display_name": "Turkey"},
  "Syria": {"lat": "34.8021", "lon": "38.9968", "display_name": "Syria"},
  "North Korea": {"lat": "40.3399", "lon": "127.5101", "display_name": "North Korea"},
  "South Korea": {"lat": "35.9078", "lon": "127.7669", "display_name": "South Korea"},
  "Japan": {"lat": "36.2048", "lon": "138.2529", "display_name": "Japan"},
  "Philippines": {"lat": "12.8797", "lon": "121.7740", "display_name": "Philippines"}
}
EOF
```

## Performance Considerations

- **Caching**: Reduces API calls by 70-90% for typical collection runs
- **Rate limiting**: 1 req/sec = max 3600 locations/hour (sufficient for hourly collection)
- **Batch processing**: Process all events first, then geocode unique locations
- **Parallel buckets**: Each bucket has its own cache (no conflicts)

## Integration with World Event Schema

Add geo field to event JSON:

```json
{
  "id": "evt_20260430_001",
  "title": "Earthquake strikes Turkey",
  "geo": {
    "lat": 37.27,
    "lon": 37.02,
    "city": "Gaziantep",
    "region": "Gaziantep Province",
    "country": "Turkey"
  }
}
```

All fields except `lat` and `lon` are optional, but recommended:
- `lat` (required): Latitude in decimal degrees (-90 to 90)
- `lon` (required): Longitude in decimal degrees (-180 to 180)
- `city` (optional): City name
- `region` (optional): State/province/region
- `country` (optional): Country name

## Troubleshooting

### Rate Limit Exceeded (429)

```bash
# Error: HTTP 429 Too Many Requests
# Solution: Increase sleep between requests
sleep 2  # instead of sleep 1
```

### No Results for Valid Location

```bash
# Try variations:
geocode_location "New York City, USA"
geocode_location "New York, United States"
geocode_location "NYC, US"
```

### Ambiguous Locations

```bash
# Be specific:
geocode_location "Paris, France"  # Not just "Paris" (could be Paris, Texas)
geocode_location "Berlin, Germany"  # Not just "Berlin"
```

### API Timeout

```bash
# Add timeout to curl
curl --max-time 10 -s "https://nominatim.openstreetmap.org/search?q=$encoded&format=json&limit=1"
```

## Related Skills

- `skills/world-event-entities/SKILL.md`: World Event Entity schema with geo field specification
- `skills/agent-browser/SKILL.md`: Extract location mentions from scraped content
- `skills/perplexity-search/SKILL.md`: Verify ambiguous locations via web research

## References

- **Nominatim API Documentation**: https://nominatim.org/release-docs/latest/api/Overview/
- **Nominatim Usage Policy**: https://operations.osmfoundation.org/policies/nominatim/
- **Google Maps Geocoding API**: https://developers.google.com/maps/documentation/geocoding
- **ISO 3166 Country Codes**: https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2
