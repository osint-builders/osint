# Geocoding Provider

The runtime implements forward geocoding through OpenStreetMap Nominatim in `builder/runtime/geocode.sh`. That script sets the User-Agent, URL-encodes queries, waits between network requests, uses bounded curl timeouts, and caches valid coordinates. Agents should call the helper instead of making provider requests directly.

There is no Google Maps backup provider in the runtime. If Nominatim cannot resolve a source-supported place, try a justified alternate spelling or a genuinely broader reported area. If the location remains unresolved, reject and log the candidate.

The provider result supplies a coordinate candidate and `display_name`; the report must still establish the event location. Inspect ambiguous results before using them and label the event's actual precision in `geo.precision`.

Provider documentation: [Nominatim API](https://nominatim.org/release-docs/latest/api/Overview/) and [usage policy](https://operations.osmfoundation.org/policies/nominatim/).
