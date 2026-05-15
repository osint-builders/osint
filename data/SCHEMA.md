# World Event Entity Schema

**Schema Version**: 2020-12 (JSON Schema) | **Entity Type**: world-event | **Last Updated**: 2026-05-01

## Required Fields

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | string | minLength: 8 | Unique event identifier — format `evt_YYYYMMDD_NNN` |
| `source` | object | required: `name` | Origin of event; optional: `provider`, `email` |
| `title` | string | minLength: 3 | Event headline |
| `summary` | string | minLength: 10 | 2–4 sentence narrative summary |
| `contents` | string | ≥100 words, **E-PRIME** | Comprehensive Markdown event description; no forms of "to be" |
| `date_published` | ISO 8601 | `YYYY-MM-DDTHH:mm:ssZ` | When the source published the event |
| `links` | array | `[{url, label?}]` | Source URLs |
| `image_urls` | array | `string[]` | Image paths or remote URLs |
| `geo` | object | `lat` (number), `lon` (number) required | Geographic context; also `country`, `region`, `city` |

> **Validator**: `data/scripts/validate-events.js --strict`. Prompt invokes at Step 4. Keep in lockstep.

## Optional Fields

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `date_event` | ISO 8601 or null | `YYYY-MM-DDTHH:mm:ssZ` | When the event occurred (precedes or equals `date_published`) |
| `topics` | array | `string[]` | Lowercase, hyphenated, singular keywords |
| `confidence` | number | 0.0–1.0 | Data quality score (0.8–1.0 = high, 0.0–0.2 = unverified) |
| `ingested_at` | ISO 8601 | `YYYY-MM-DDTHH:mm:ssZ` | Ingestion timestamp; auto-generated |
| `link_preview` | object or null | `{title, description, image, url}` | Cached link preview from `links[0]` via LinkPreview API; `image` is an OG image URL |

Temporal order: `date_event ≤ date_published ≤ ingested_at`

## Complete Example

```json
{
  "id": "evt_20260429_001",
  "source": {"name": "Reuters", "provider": "news-outlet"},
  "title": "7.8 Magnitude Earthquake Strikes Turkey and Syria",
  "summary": "A major earthquake causes widespread damage and thousands of casualties across Turkey and Syria. Emergency response efforts are underway.",
  "contents": "## Earthquake Event\n\n### Overview\nA powerful 7.8 magnitude earthquake struck the border region at 04:17 UTC.\n\n### Impacts\n- Thousands of casualties\n- Widespread infrastructure damage\n- International aid response initiated\n\n### Response\nEmergency declarations from both governments.",
  "date_published": "2026-04-29T10:30:00Z",
  "date_event": "2026-04-29T10:15:00Z",
  "geo": {"lat": 37.27, "lon": 37.02, "country": "Turkey", "region": "Gaziantep", "city": "Gaziantep"},
  "links": [{"url": "https://www.reuters.com/...", "label": "Reuters Coverage"}],
  "image_urls": ["./media/2026-04/images/2026-04-29/evt_20260429_001_img1.jpg"],
  "topics": ["earthquake", "disaster", "turkey", "syria"],
  "confidence": 0.95,
  "ingested_at": "2026-04-29T10:35:00Z"
}
```

## Validation Rules

- `id`: present, ≥8 chars, format `evt_YYYYMMDD_NNN`
- `source`: object with `name`
- `title`: ≥3 chars
- `summary`: ≥10 chars
- `contents`: ≥100 words, valid Markdown, fully E-PRIME (no `is/are/was/were/be/been/being` or contractions)
- `date_published`: valid ISO 8601 UTC
- `links`: array; items have required `url`
- `image_urls`: array; items are URIs or relative paths
- `geo.lat`: −90 to 90 or null; `geo.lon`: −180 to 180 or null
- `confidence`: 0.0–1.0 if present
- No HTML in text fields (Markdown code blocks excepted)

## Storage Format

**JSONL** — one JSON obj/line in `data/events/YYYY-MM/YYYY-MM-DD.jsonl`. Append-only; grep/awk friendly.
