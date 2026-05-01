# Location Extraction from Text

Before geocoding, extract location mentions from event text (title, summary, contents).

## Regex-Based Extraction

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

## Fallback Heuristics

1. Concatenate `title + summary` and run `extract_location`.
2. If "Unknown", try `title + summary + contents`.
3. If still no match, fall back to source-known region (e.g. source country).
4. If all else fails, use global default `(37.7749, -122.4194)`.

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

## Integration with World Event Schema

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
