# Selecting an Event Location

Read the original report before geocoding. Identify the place where the reported action happened, not the publisher's location, a commentator's location, or the first capitalized place in the text. A regex match can suggest a place to investigate, but it cannot establish event location by itself.

## Evidence order

1. Use coordinates or a specific site stated in the source when their meaning and reliability are clear.
2. Otherwise use a source-supported city, port, province, country, or named sea area. Preserve the reported scope. A story about a countrywide policy may legitimately use a country centroid; a story about an individual strike needs the reported strike location.
3. Cross-check ambiguous names against surrounding text. For example, include the country in a query for a city with several namesakes.
4. If the report gives no meaningful location, reject and log the candidate. A source's usual coverage area does not fill this gap.

## Runtime workflow

```bash
LOCATION="<place established by the report>"
GEO=$(bash builder/runtime/geocode.sh "$LOCATION")
if ! printf '%s' "$GEO" | jq -e '
  (.lat | type) == "number" and (.lon | type) == "number" and
  .lat >= -90 and .lat <= 90 and .lon >= -180 and .lon <= 180 and
  ((.lat == 0 and .lon == 0) | not)
' >/dev/null; then
  printf '[REJECT] unresolved location: %s\n' "$LOCATION" >> "$WORK_DIR/$source_id/notes.md"
  continue  # inside the candidate loop
fi
```

The example checks the helper result before assigning it to event JSON. When the evidence supports another query spelling or a broader named area, try that location and label its precision honestly. Do not broaden to a country merely because a city lookup failed if the resulting point would misrepresent the reported incident.

An accepted event must carry `geo.lat` and `geo.lon` as numbers, plus `geo.location_name` and `geo.precision` (`exact`, `city`, `region`, `country`, or `sea-area`). The geocoder's `display_name` helps verify the result; it does not override what the source actually reported. See `data/SCHEMA.md` for the schema.
