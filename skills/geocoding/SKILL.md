---
name: geocoding
description: Resolve evidence-grounded event locations to coordinates with the repository geocoding helper; reject candidates without a meaningful location.
license: MIT
compatibility: linux (warp-cloud-agent-env-image)
metadata:
  author: osint-builders
  version: "3.0.0"
  provider-primary: openstreetmap-nominatim
---

# Geocoding

Every published event needs a meaningful geographic point. First identify the location the source actually reports, then resolve it through `builder/runtime/geocode.sh`. This helper owns Nominatim access, caching, rate limiting, bounded requests, and seeded locations. Do not copy its implementation into a prompt or define a second geocoding function.

## Choose the location

- Prefer the event's verified coordinates or named site, city, port, vessel position, or sea area when the evidence supports that precision.
- A named region or country can represent a genuinely broad event or a report that only locates the event at that level. Use an honest `precision` value.
- A source's home country, a passing location mention, or a generic geopolitical region does not establish where the reported event happened.
- If no evidence-grounded named location remains after checking the source, reject and log the candidate. Never assign `(0, 0)`, San Francisco, or another global default.

## Resolve and attach

```bash
GEO=$(bash builder/runtime/geocode.sh "<evidence-grounded place name>")
```

The helper returns JSON with numeric `lat` and `lon` on success. On an unresolved query or API failure, it returns `{"lat":null,"lon":null,"display_name":null}`. Try a clearly supported, less ambiguous place name when available. Do not substitute a guessed point just to populate the fields.

For an accepted event, set `geo.lat` and `geo.lon` from a resolved or independently verified point; set `geo.location_name` to the named event location and `geo.precision` to one of `exact`, `city`, `region`, `country`, or `sea-area`. Optional `country`, `region`, and `city` fields may add context. Keep coordinates as JSON numbers, not strings.

The published-event validator (`node data/scripts/validate-events.js <file> --qualified`) rejects missing or invalid geo fields and known fake points. Follow `data/SCHEMA.md` and `builder/prompts/qualified-event-contract.md` for the full contract.

## References

- `references/location-extraction.md` — select the event location from evidence.
- `references/troubleshooting.md` — unresolved or ambiguous queries.
- `references/caching-and-performance.md` — helper cache behavior.
- `references/providers.md` — implemented provider and limits.
