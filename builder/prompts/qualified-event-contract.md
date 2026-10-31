# Published Event Contract

Read `data/SCHEMA.md` for the base World Event Entity. Each accepted candidate produces one JSON object with these additional typed fields:

```ts
type QualifiedFields = {
  source_window: { start: string; end: string }; // This tip's UTC scan window
  original_report: { url: string; published_at: string }; // First report of this new development
  language: "en";
  category: "armed-conflict" | "geopolitics" | "defense" |
    "electronic-warfare" | "major-disaster" | "civil-unrest" | "maritime-security";
  audience: "united-states" | "allied-forces";
  allied_relevance: string; // Concrete situational-awareness value, >=30 characters
  links: Array<{ url: string; label?: string }>; // Origin and every independent corroborating URL
  image_origin: "article" | "source" | "default"; // Describes image_urls[0]
  image_urls: string[]; // At least one remote HTTP(S) image URL
  geo: {
    lat: number; lon: number; location_name: string;
    precision: "exact" | "city" | "region" | "country" | "sea-area";
    country?: string; region?: string; city?: string;
  };
};
```

Accept only conflict, defense, electronic warfare, consequential geopolitics, major disasters, civil unrest, or maritime security with a concrete United States or allied situational-awareness use. Require a specific new real-world action or development supported by source facts. For every recap or repost, find the first checked source for the *new development*, not merely the broader older event. Put its URL and exact UTC publication time in `original_report`; copy that timestamp into `date_published`. Both must fall inside `source_window`. An original firsthand post may serve as its own `original_report`; a later aggregator repost cannot. Search the first publisher or official notice, including the original media post when a social account reuses footage. When a post cites an older strike or fire as context for a new statement, report the statement if it qualifies; never relabel the older incident as new. If the original timing remains unclear, reject rather than substitute the repost time. An analysis published before an action cannot support that action. Analysis, opinion, commentary, and recurring background about a situation without a new reported event do not qualify. Ordinary politics, crime, and unrelated posts also do not qualify. An isolated symbolic act such as flag burning needs reported violence, disruption, or a concrete threat to qualify as allied-relevant unrest. Translate every accepted event's title, summary, and body fully into English; preserve proper nouns. Never invent details or pad the body to reach a length target. If available evidence cannot support 100 prose words or a meaningful location, reject and log the candidate.

Use the exact manifest `source.name`, including any handle suffix; the candidate helper checks it. Attribute an uncorroborated claim in the title, summary, and `contents`; do not state a claimed actor, casualty count, or cause as established fact. With only one distinct URL in `links`, start the title, summary, and first `## Event` paragraph with the exact `source.name` followed by `reports`, `says`, `claims`, or `describes` (case insensitive). The candidate helper and `--qualified` enforce this prefix; attribution must also remain clear in the rest of the text. For a statement attributed to an institution or official, inspect and link its original notice or a reporter quoting it directly. An aggregator's paraphrase alone cannot establish the institution's exact words, decisions, or actions; reject if the underlying statement cannot be checked. Describe the evidence directly, even when multiple independent sources support a claim. Do not use the categorical certainty words `confirmed`, `confirms`, `verified`, `verifies`, `corroborated`, or `corroborates` in the title, summary, or `contents`; `--qualified` rejects them. Cite each independent source in `links` and name it in `## Evidence`. A conflict party, its ministry, and its affiliated media do not count as independent sources; outlets repeating the same original claim do not either. Report only observed or sourced effects: smoke, fire, or a claimed strike alone does not establish shutdown, operational damage, intent, or casualties. Do not invent a source's audience size, reliability record, or operational consequences to strengthen a claim. Reject claims too weak to report even with attribution.

Copy the candidate's original scan window into `source_window`. Include both the queued candidate URL and `original_report.url` in `links`, even when another publisher supplied the first report; the queued URL records provenance and does not itself count as independent corroboration. The original report's `published_at` must equal `date_published` and fall inside that window. The enrichment helper rejects an individual candidate with missing or stale original-report evidence, an explicit Telegram recap, or a city point more than 6 km from the named place before image requests. A passing recap check does not prove an earlier report does not exist. Each accepted event needs one compact JSON object assigned to `event_json`; parse the geocoder's `GEO` output as a JSON object, keeping `lat` and `lon` numeric. Do not insert shell output as a quoted JSON string.

`date_event` is optional. Include it only when the source supplies an exact occurrence time; otherwise omit the field. Never turn a date-only report into a midnight UTC timestamp. The qualified validator rejects midnight UTC placeholders.

`contents` uses exactly these H2 sections in this order, with nonempty evidence-grounded prose under each:

```text
## Event
## Location and Time
## Evidence
## Allied Relevance
## Confidence and Gaps
```

Write at least 100 prose words across those sections, Markdown only, in E-PRIME without contractions or HTML entities. Keep confidence assessment in the numeric `confidence` field, never as an extra section. Titles and summaries must contain one plain English line each.

Choose the reported action's real location: a verified point, city, region, country centroid, or named sea area. Include its name and precision. Never infer the event location from the publisher, author's location, organization's headquarters, or source coverage area unless the report actually places the event there. A country or region centroid must represent a reported action in that bounded area, not an arbitrary example of a multi-location story. For a multi-city, multi-country, or worldwide report with no source-supported focal location or bounded area, reject; do not pick the largest or an illustrative city. Reject any unlocatable candidate. Never use `(0, 0)` or the former San Francisco global default.

Prefer an image depicting the event or linked article and mark `image_origin: "article"`. Mark a source banner or logo as `"source"`; never claim that it depicts the event. `enrich-link-preview.sh` checks that an image URL resolves to image content, promotes a working preview when the supplied image fails, and supplies `https://osint.builders/favicon.svg` as a verified last resort with `image_origin: "default"`. A portrait of a quoted official can illustrate that statement, not an older attack discussed in it. Do not invent an image URL or relabel a source/default image as event imagery. Source URLs and image URLs must use remote HTTP(S) URLs.
