---
name: geocoding
description: Extract location mentions from text and convert to lat/lon coordinates using OpenStreetMap Nominatim (free) or Google Maps API (backup). Required for all world events to ensure geo.lat and geo.lon fields are populated.
license: MIT
compatibility: linux (warp-cloud-agent-env-image)
metadata:
  author: osint-builders
  version: "2.0.0"
  provider-primary: openstreetmap-nominatim
  provider-backup: google-maps-api
---

# Geocoding

lat/lon from location text. Nominatim (free, no key, 1 req/sec). Per-bucket cache.

## When to use

Every event needs `geo.lat`/`geo.lon`. Extract location from title/summary/contents → `geocode_location()` → attach to `geo`. Nothing resolves → fallback ladder. Never omit coordinates.

## Entry-point: `geocode_location()`

Keep in sync with `builder/prompts/collection-prompt.md`.

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

## `geo` fields

- `geo.lat` (req): −90..90
- `geo.lon` (req): −180..180
- `geo.country` (rec)
- `geo.region` (opt)
- `geo.city` (opt)

Constraints: 1 req/sec; cache at `/tmp/geocoding-cache-${bucketNum}.json`; URL-encode via `jq -sRr @uri`.

## Fallback ladder

Stop at first success:

1. **Specific city** — `geocode_location "Gaziantep, Turkey"` (most accurate).
2. **Country** — when city returns null.
3. **Region center** — hardcoded coords (see `references/troubleshooting.md`).
4. **Global default** — `(37.7749, -122.4194)` (San Francisco anchor, signals unknown).

## Pitfalls

- **UA required** — `curl` sets UA by default; custom headers must keep non-empty UA.
- **429** — exceeded 1 req/sec → `sleep 2`+. Check cache runs first.
- **Ambiguous names** — always add country: `"Paris, France"`, `"Berlin, Germany"`.
- **Non-ASCII** — `jq -sRr @uri` only. No `printf %q` for `"São Paulo"`, Cyrillic, CJK.

## See also

- `references/providers.md` — Nominatim vs Google Maps, reverse geocoding.
- `references/location-extraction.md` — regex patterns, workflow, schema integration.
- `references/caching-and-performance.md` — cache structure, pre-population.
- `references/troubleshooting.md` — 429 recovery, fallback details.
- `skills/agent-browser/SKILL.md` — extract location mentions from scraped content.
- `skills/perplexity-search/SKILL.md` — verify ambiguous locations.
