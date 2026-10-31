# Geocoding Troubleshooting

`builder/runtime/geocode.sh` is the only runtime geocoding entry point. It uses a cache, waits before Nominatim requests, and bounds each network request. A failed lookup or API/parse failure returns `{"lat":null,"lon":null,"display_name":null}`; it must not become a published event coordinate.

## Ambiguous or unresolved place

- Check the original source for the event's location and its surrounding geographic context.
- Try a supported spelling with a country, such as `Paris, France`, or a known alternate place name. Inspect `display_name` before accepting the point.
- If the source describes an event across a named region, country, or sea area, geocode that broader area and use the matching `geo.precision`. A country centroid represents countrywide or country-level evidence, not a substitute for an unverified city.
- If no supported query resolves, log and reject the candidate. Avoid repeated rapid retries and never use an arbitrary region center, `(0, 0)`, or a global default.

## Timeout or rate limiting

The helper already uses bounded curl timeouts and a one-second wait before a network lookup. A transient failure returns null coordinates so the batch can continue. Do not bypass the helper with a direct curl call or build an unbounded retry loop. A later run can retry the candidate if the queueing policy allows it.

## Validate before publication

The qualified-event validator checks coordinate ranges, numeric types, a nonempty `geo.location_name`, an allowed `geo.precision`, and known fake points. Run:

```bash
node data/scripts/validate-events.js "$WORK_DIR/$source_id/events.jsonl" --qualified
```

Reject a candidate that cannot pass; never make a whole batch fail for an ordinary unresolved location. Validation must still abort before commit if an invalid event reached the output file.
