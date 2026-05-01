---
name: geocoding
description: Extract location mentions from text and convert to lat/lon coordinates using OpenStreetMap Nominatim (free) or Google Maps API (backup). Required for all world events to ensure geo.lat and geo.lon fields are populated.
license: MIT
compatibility: Linux (Ubuntu base, runs inside the Warp Cloud Agent env image; see README.md → "Warp Cloud Agent environment image")
metadata:
  author: osint-builders
  version: "2.0.0"
  provider-primary: openstreetmap-nominatim
  provider-backup: google-maps-api
---

# Geocoding Skill

Convert location mentions found in event text into latitude/longitude coordinates. Primary provider is OpenStreetMap Nominatim (free, no API key, 1 req/sec) with optional Google Maps fallback. Results are cached per bucket to avoid duplicate lookups.

## When to use

Every world event MUST populate `geo.lat` and `geo.lon`. Use this skill any time you produce a JSONL event record — extract a location string from the title/summary/contents, run it through `geocode_location()`, and attach the result to the event's `geo` object. If no location can be extracted or geocoded, fall through the fallback ladder below; never emit an event without coordinates.

## Entry-point: `geocode_location()`

This is the canonical bash function. It is identical to the inline copy in `builder/prompts/collection-prompt.md` — keep them in sync.

```bash
GEOCODING_CACHE="/tmp/geocoding-cache-${bucketNum}.json"
echo '{}' > "$GEOCODING_CACHE"

geocode_location() {
  local location="$1"
  cached=$(jq -r --arg loc "$location" '.[$loc] // empty' "$GEOCODING_CACHE" 2>/dev/null)
  if [ -n "$cached" ]; then
    echo "$cached"
    return 0
  fi
  local encoded=$(printf '%s' "$location" | jq -sRr @uri)
  sleep 1  # Nominatim rate limit: 1 req/sec
  result=$(curl -s "https://nominatim.openstreetmap.org/search?q=$encoded&format=json&limit=1" \
    | jq -r 'if length > 0 then {lat: .[0].lat, lon: .[0].lon, display_name: .[0].display_name} else {lat: null, lon: null, display_name: null} end')
  tmp_cache=$(jq --arg loc "$location" --argjson res "$result" '. + {($loc): $res}' "$GEOCODING_CACHE")
  echo "$tmp_cache" > "$GEOCODING_CACHE"
  echo "$result"
}
```

Usage: `GEO=$(geocode_location "Gaziantep, Turkey"); LAT=$(echo "$GEO" | jq -r '.lat'); LON=$(echo "$GEO" | jq -r '.lon')`.

## Required fields

Every event's `geo` object:

- `geo.lat` (required): decimal degrees, range `-90 .. 90`
- `geo.lon` (required): decimal degrees, range `-180 .. 180`
- `geo.country` (recommended): country name
- `geo.region` (optional): state/province/region
- `geo.city` (optional): city/town/village

Operational constraints:

- Nominatim rate limit: **1 request per second** (`sleep 1` before each call).
- Cache path: `/tmp/geocoding-cache-${bucketNum}.json` — one cache per bucket, fresh per collection run, deleted at Step 9 cleanup.
- Always URL-encode the query via `jq -sRr @uri` (handles non-ASCII).

## Fallback ladder

Try in order; stop on first success:

1. **Specific city** — e.g. `geocode_location "Gaziantep, Turkey"`. Most accurate.
2. **Country-level** — e.g. `geocode_location "Turkey"`. Use when the city lookup returns null.
3. **Region center** — hardcoded coords for "Middle East", "East Asia", "Europe", etc. Use when only a region is known. See `references/troubleshooting.md`.
4. **Global default** — `(37.7749, -122.4194)`. Last resort: keeps the event valid even when no location can be resolved, while clearly signaling "unknown location" via a recognizable San Francisco anchor.

## Pitfalls

- **User-Agent**: Nominatim *requires* a User-Agent header. `curl` sets one by default, but if you customize headers, keep a non-empty UA or you'll get blocked.
- **HTTP 429 (rate limit)**: You exceeded 1 req/sec. Increase to `sleep 2` (or higher), and verify the cache is actually being checked first.
- **Ambiguous city names**: "Paris" alone may resolve to Paris, Texas; "Berlin" may not be Germany. Always include the country: `"Paris, France"`, `"Berlin, Germany"`.
- **Non-ASCII encoding**: Use `jq -sRr @uri` for percent-encoding. Do not rely on `printf %q` or shell escaping for names like `"São Paulo"` or Cyrillic/CJK strings.

## See also

- `references/providers.md` — Nominatim vs Google Maps, reverse geocoding, when to escalate.
- `references/location-extraction.md` — regex patterns, country lists, complete workflow example, schema integration.
- `references/caching-and-performance.md` — cache structure, hit/miss patterns, common-locations pre-population.
- `references/troubleshooting.md` — 429 recovery, retries, validation, ambiguous results, timeouts, fallback details.
- `skills/world-event-entities/SKILL.md` — World Event Entity schema with `geo` field.
- `skills/agent-browser/SKILL.md` — extract location mentions from scraped content.
- `skills/perplexity-search/SKILL.md` — verify ambiguous locations via web research.
