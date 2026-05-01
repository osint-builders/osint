# Caching and Performance

## Caching Strategy

Geocoding cache reduces API calls significantly:

```bash
# Initialize cache (once per collection run)
GEOCODING_CACHE="/tmp/geocoding-cache-${bucketNum}.json"
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
