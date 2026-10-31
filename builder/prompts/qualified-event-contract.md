# Published Event Contract

Read `data/SCHEMA.md` for the base World Event Entity. Each accepted candidate produces one JSON object with these additional typed fields:

```ts
type QualifiedFields = {
  source_window: { start: string; end: string }; // This tip's UTC scan window
  language: "en";
  category: "armed-conflict" | "geopolitics" | "defense" |
    "electronic-warfare" | "major-disaster" | "civil-unrest" | "maritime-security";
  audience: "united-states" | "allied-forces";
  allied_relevance: string; // Concrete situational-awareness value, >=30 characters
  image_origin: "article" | "source" | "default"; // Describes image_urls[0]
  image_urls: string[]; // At least one remote HTTP(S) image URL
  geo: {
    lat: number; lon: number; location_name: string;
    precision: "exact" | "city" | "region" | "country" | "sea-area";
    country?: string; region?: string; city?: string;
  };
};
```

Accept only conflict, defense, electronic warfare, consequential geopolitics, major disasters, civil unrest, or maritime security with a concrete United States or allied situational-awareness use. Require a specific new real-world action or development supported by source facts. Analysis, opinion, commentary, and recurring background about a situation without a new reported event do not qualify. Ordinary politics, crime, and unrelated posts also do not qualify. Translate every accepted event's title, summary, and body fully into English; preserve proper nouns. Use source evidence, attribute uncertain claims, and never invent details or pad the body to reach a length target. If available evidence cannot support 100 prose words or a meaningful location, reject and log the candidate.

Copy the candidate's original scan window into `source_window` and reject a published timestamp outside that window. Each accepted event needs one compact JSON object assigned to `event_json`; parse the geocoder's `GEO` output as a JSON object, keeping `lat` and `lon` numeric. Do not insert shell output as a quoted JSON string.

`contents` uses exactly these H2 sections in this order, with nonempty evidence-grounded prose under each:

```text
## Event
## Location and Time
## Evidence
## Allied Relevance
## Confidence and Gaps
```

Write at least 100 prose words across those sections, Markdown only, in E-PRIME without contractions or HTML entities. Keep confidence assessment in the numeric `confidence` field, never as an extra section. Titles and summaries must contain one plain English line each.

Choose the reported action's real location: a verified point, city, region, country centroid, or named sea area. Include its name and precision. Never infer the event location from the publisher, author's location, organization's headquarters, or source coverage area unless the report actually places the event there. Reject an unlocatable candidate. Never use `(0, 0)` or the former San Francisco global default. A broad story may use a defensible region/country centroid, labeled honestly.

Prefer an image depicting the event or linked article and mark `image_origin: "article"`. Mark a source banner or logo as `"source"`; never claim that it depicts the event. `enrich-link-preview.sh` checks that an image URL resolves to image content, promotes a working preview when the supplied image fails, and supplies `https://osint.builders/favicon.svg` as a verified last resort with `image_origin: "default"`. Do not invent an image URL or relabel a source/default image as event imagery. Source URLs and image URLs must use remote HTTP(S) URLs.
