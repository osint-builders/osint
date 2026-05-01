# Geocoding Providers

## Primary: OpenStreetMap Nominatim (Free)

**Advantages:**
- No API key required
- Free for all use cases
- Global coverage
- Good accuracy for cities/regions/countries

**Rate Limits:**
- Maximum 1 request per second
- Must include User-Agent header (automatic with curl)
- Cache results to minimize requests

**Endpoints:**
```bash
https://nominatim.openstreetmap.org/search
https://nominatim.openstreetmap.org/reverse
```

**Usage Policy:** https://operations.osmfoundation.org/policies/nominatim/

## Backup: Google Maps Geocoding API (Paid)

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

### Google Maps Forward Geocoding

```bash
geocode_google() {
  local location="$1"
  local encoded=$(printf '%s' "$location" | jq -sRr @uri)

  result=$(curl -s "https://maps.googleapis.com/maps/api/geocode/json?address=$encoded&key=*** \
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

## When to Escalate to Google Maps

- Nominatim returns null for a location confirmed to exist
- Ambiguous results (e.g., landmarks, complex addresses)
- Need detailed address components
- Volume exceeds 1 req/sec sustained for prolonged time

## Reverse Geocoding (Coordinates → Place)

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

## References

- **Nominatim API Documentation**: https://nominatim.org/release-docs/latest/api/Overview/
- **Nominatim Usage Policy**: https://operations.osmfoundation.org/policies/nominatim/
- **Google Maps Geocoding API**: https://developers.google.com/maps/documentation/geocoding
- **ISO 3166 Country Codes**: https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2
