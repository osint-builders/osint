# World Event Entity Schema

**Schema Version**: 2020-12 (JSON Schema)  
**Entity Type**: world-event  
**Last Updated**: 2026-05-01

## Overview

The World Event Entity is a structured data model for representing real-world events captured from OSINT sources. Each event includes complete provenance tracking, geographic context, confidence scoring, and rich markdown-formatted content.

## Required Fields

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | string | minLength: 8 | Unique event identifier (UUID, event-code, or sequential ID) |
| `source` | object | required: `name` | Event source/provider information |
| `title` | string | minLength: 3 | Event headline/summary title |
| `summary` | string | minLength: 10 | Brief narrative summary of the event |
| `contents` | string | minLength: 20, **E-PRIME** (no forms of "to be") | Comprehensive markdown-formatted event description |
| `date_published` | ISO 8601 | format: date-time | When the event information was published/reported |
| `links` | array | type: object[] | Source URLs with optional labels |
| `image_urls` | array | type: string[] | Image/video URLs or relative paths |
| `geo` | object | required: `lat` (number), `lon` (number); also `country`, `region`, `city` | Geographic information about the event |

> **Validator**: every constraint above is enforced by `data/scripts/validate-events.js --strict`. The runtime collection prompt invokes that script at Step 4 — keep both sides in lockstep by editing the validator and treating SCHEMA.md as documentation of what the validator does.

## Optional Fields

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `date_event` | ISO 8601 or null | format: date-time | When the event actually occurred |
| `topics` | array | type: string[] | Event topics/keywords for categorization |
| `confidence` | number | min: 0, max: 1 | Data confidence/quality score (0.0-1.0) |
| `ingested_at` | ISO 8601 | format: date-time | When the event was ingested into the system |

## Field Specifications

### id
**Type**: String  
**Constraints**: Minimum 8 characters  
**Purpose**: Globally unique event identifier

**Examples**:
```json
"550e8400-e29b-41d4-a716-446655440000"  // UUID
"evt_20260429_001"                       // Event code
"event-2024-turkey-earthquake"           // Descriptive slug
```

### source
**Type**: Object  
**Required Properties**: `name` (string)  
**Optional Properties**: `email` (string), `provider` (string)

**Purpose**: Identify the origin of event information

**Examples**:
```json
{"name": "Reuters", "provider": "news-outlet"}
{"name": "Twitter @example", "provider": "social-media"}
{"name": "GDELT API", "provider": "data-api"}
```

### title
**Type**: String  
**Constraints**: Minimum 3 characters  
**Purpose**: Concise event headline

**Examples**:
```json
"7.8 Magnitude Earthquake Strikes Turkey and Syria"
"Government Announces New Climate Policy"
"Protests Erupt in Downtown District"
```

### summary
**Type**: String  
**Constraints**: Minimum 10 characters  
**Purpose**: Brief narrative summary (2-4 sentences)

**Example**:
```json
"A major 7.8 magnitude earthquake struck Turkey and Syria early Monday morning, causing extensive damage and thousands of reported casualties. Emergency response efforts are underway across affected regions. International aid has been mobilized."
```

### contents
**Type**: String (Markdown formatted)  
**Constraints**: Minimum 20 characters  
**Purpose**: Comprehensive event description with full context

**Format**: Well-formed Markdown with headings, lists, tables, etc.

**Example**:
```markdown
## Earthquake Event

### Overview
A powerful 7.8 magnitude earthquake struck the border region of Turkey and Syria at 04:17 UTC on Monday, February 6, 2024.

### Seismic Activity
- **Main quake**: 7.8 magnitude
- **Epicenter**: Gaziantep Province (37.27°N, 37.02°E)
- **Depth**: ~18km
- **Aftershocks**: Multiple 5.0+ magnitude tremors

### Impacts
| Category | Details |
|----------|---------|
| Casualties | Preliminary estimates exceed 50,000 deaths |
| Infrastructure | Thousands of buildings destroyed |
| Displacement | 10+ million people affected |

### International Response
1. Emergency declarations by Turkish and Syrian governments
2. International aid coordination activated
3. Search and rescue teams deployed from multiple countries
```

### date_published
**Type**: ISO 8601 DateTime (UTC)  
**Format**: `YYYY-MM-DDTHH:mm:ssZ`  
**Purpose**: When the event information was published/reported

**Examples**:
```json
"2026-04-29T10:30:00Z"
"2024-02-06T04:45:00Z"
```

### date_event
**Type**: ISO 8601 DateTime (UTC) or null  
**Format**: `YYYY-MM-DDTHH:mm:ssZ` or `null`  
**Purpose**: When the event actually occurred

**Rules**:
- Typically precedes or equals `date_published`
- `null` when event timing unknown

**Examples**:
```json
"2026-04-29T10:15:00Z"  // Event occurred 15 minutes before publication
null                     // Timing unknown
```

### links
**Type**: Array of Objects  
**Object Schema**: `{url: string (required, format: uri), label: string (optional)}`  
**Default**: `[]` (empty array)

**Purpose**: Source URLs with optional descriptive labels

**Examples**:
```json
[
  {"url": "https://www.reuters.com/world/earthquakes/2024-02-06/", "label": "Reuters Coverage"},
  {"url": "https://www.bbc.com/news/world-middle-east", "label": "BBC News"},
  {"url": "https://twitter.com/user/status/123456789"}
]
```

### image_urls
**Type**: Array of Strings (URIs or relative paths)  
**Default**: `[]` (empty array)

**Purpose**: Image/video references for visual documentation

**Path Formats**:
- **Remote URLs**: `https://example.com/image.jpg`
- **Relative paths**: `./media/2026-04/images/2026-04-29/evt_20260429_001_img1.jpg`

**Examples**:
```json
[
  "./media/2026-04/images/2026-04-29/evt_20260429_001_img1.jpg",
  "./media/2026-04/images/2026-04-29/evt_20260429_001_img2.png",
  "https://example.com/external-image.jpg"
]
```

### geo
**Type**: Object  
**Required Properties**: `lat` (number or null), `lon` (number or null)  
**Optional Properties**: `country` (string), `region` (string), `city` (string)

**Constraints**:
- `lat`: -90 to 90 (decimal degrees)
- `lon`: -180 to 180 (decimal degrees)

**Purpose**: Geographic information about the event location

**Examples**:
```json
{
  "lat": 37.27,
  "lon": 37.02,
  "country": "Turkey",
  "region": "Gaziantep",
  "city": "Gaziantep"
}
```

```json
{
  "lat": null,
  "lon": null,
  "country": "Global"
}
```

### topics
**Type**: Array of Strings  
**Default**: `[]` (empty array)

**Purpose**: Event topics/keywords for categorization and filtering

**Examples**:
```json
["earthquake", "natural-disaster", "turkey", "emergency-response"]
["politics", "policy", "climate-change", "announcement"]
["conflict", "military", "ukraine", "geopolitical"]
```

### confidence
**Type**: Number (decimal)  
**Range**: 0.0 to 1.0

**Purpose**: Confidence/quality score for event data

**Interpretation**:
- **0.8-1.0**: Multiple sources, official confirmation, high reliability
- **0.5-0.8**: Good corroboration, mostly verified, moderate confidence
- **0.2-0.5**: Limited sources, some uncertainty, lower confidence
- **0.0-0.2**: Unverified, single source, low confidence

**Examples**:
```json
0.95  // Highly confident - multiple verified sources
0.70  // Moderate confidence - single reliable source
0.40  // Low confidence - unverified social media
```

### ingested_at
**Type**: ISO 8601 DateTime (UTC)  
**Format**: `YYYY-MM-DDTHH:mm:ssZ`

**Purpose**: When the event was ingested into the data system

**Rules**: 
- Typically equals or follows `date_published`
- Auto-generated by ingestion system

**Examples**:
```json
"2026-04-29T10:35:00Z"
```

## Temporal Relationships

```
date_event ≤ date_published ≤ ingested_at
```

- Event occurs (or time unknown)
- Information published about event
- Event data ingested into system

## Complete Example

```json
{
  "id": "evt_20260429_001",
  "source": {
    "name": "Reuters",
    "provider": "news-outlet"
  },
  "title": "7.8 Magnitude Earthquake Strikes Turkey and Syria",
  "summary": "A major earthquake causes widespread damage and thousands of casualties across Turkey and Syria. Emergency response efforts are underway.",
  "contents": "## Earthquake Event\n\n### Overview\nA powerful 7.8 magnitude earthquake struck the border region at 04:17 UTC.\n\n### Impacts\n- Thousands of casualties\n- Widespread infrastructure damage\n- International aid response initiated\n\n### Response\nEmergency declarations issued by both governments.",
  "date_published": "2026-04-29T10:30:00Z",
  "date_event": "2026-04-29T10:15:00Z",
  "geo": {
    "lat": 37.27,
    "lon": 37.02,
    "country": "Turkey",
    "region": "Gaziantep",
    "city": "Gaziantep"
  },
  "links": [
    {
      "url": "https://www.reuters.com/...",
      "label": "Reuters Coverage"
    }
  ],
  "image_urls": [
    "./media/2026-04/images/2026-04-29/evt_20260429_001_img1.jpg"
  ],
  "topics": ["earthquake", "disaster", "turkey", "syria"],
  "confidence": 0.95,
  "ingested_at": "2026-04-29T10:35:00Z"
}
```

## Validation Rules

### Required Field Validation
- ✓ `id`: Present, 8+ characters
- ✓ `source`: Object with required `name` property
- ✓ `title`: Present, 3+ characters
- ✓ `summary`: Present, 10+ characters
- ✓ `contents`: Present, 20+ characters, valid Markdown
- ✓ `date_published`: Valid ISO 8601 datetime
- ✓ `links`: Array (may be empty), items have required `url`
- ✓ `image_urls`: Array (may be empty), items are URIs or paths

### Optional Field Validation (if present)
- ✓ `date_event`: Valid ISO 8601 or null
- ✓ `geo.lat`: -90 to 90 or null
- ✓ `geo.lon`: -180 to 180 or null
- ✓ `confidence`: 0.0 to 1.0
- ✓ `ingested_at`: Valid ISO 8601

### Content Validation
- No HTML in text fields (unless in Markdown code blocks)
- All URLs must be valid HTTP/HTTPS or relative paths
- Timestamps must be valid ISO 8601
- Geographic coordinates must be numeric and in valid ranges
- `contents` should be valid Markdown

## Storage Format

Events are stored as **JSON Lines (JSONL)** - one complete JSON object per line:

```jsonl
{"id":"evt_20260429_001","source":{"name":"Reuters","provider":"news"},"title":"Event 1"...}
{"id":"evt_20260429_002","source":{"name":"Twitter","provider":"social"},"title":"Event 2"...}
```

**Benefits**:
- Append-only: real-time event streaming
- Line-oriented: use grep, awk, sed
- Fault-tolerant: partial writes only corrupt one line
- Streaming-friendly: process without loading entire file

## Related Documentation

- **Data Folder**: See [README.md](README.md) for data organization
- **Sources**: See [../source/README.md](../source/README.md) for data collection sources
- **Skills**: See [../skills/word-event-entities/SKILL.md](../skills/word-event-entities/SKILL.md) for complete specification
