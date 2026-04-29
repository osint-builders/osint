---
name: word-event-entities
description: Characterize and analyze World Event Entities - a comprehensive model for representing real-world events with structured data. Understand entity fields, properties, data types, relationships, and identifiers. Use to inform AI systems about event model architecture, data validation rules, and entity characterization patterns.
license: MIT
compatibility: Language-agnostic reference documentation. Applicable to any system processing event entities.
metadata:
  author: osint-builders
  version: "1.0.0"
  entity-type: world-event
  schema-version: "2020-12"
---

# World Event Entities Skill

Comprehensive reference and characterization of World Event Entity model - a standardized JSON schema for representing real-world events with rich metadata, source attribution, geographic information, and temporal context.

## Entity Overview

The World Event Entity is a structured data model for representing events captured from any source - news sources, intelligence reports, social media, official announcements, and other information channels. It provides a unified JSON schema for storing event information with complete provenance tracking, geographic context, confidence scoring, and content references.

**Primary Use Cases:**
- OSINT (Open Source Intelligence) event tracking and analysis
- News aggregation and event correlation
- Geospatial event mapping and analysis
- Event verification and confidence assessment
- Multi-source event deduplication and fusion
- Event timeline construction and relationship analysis

## Core Model Structure

### Required Fields (Must Always Be Present)

| Field | Type | Constraints | Description | Example |
|-------|------|-------------|-------------|---------|
| `id` | string | minLength: 8 | Unique event identifier | `event-2024-001` |
| `source` | object | required: `name` | Event source/provider information | `{name: "Reuters", provider: "news"}` |
| `title` | string | minLength: 3 | Event headline | `Earthquake Strikes Turkey` |
| `summary` | string | minLength: 10 | Brief narrative summary | `A major earthquake... causing widespread damage` |
| `contents` | string | minLength: 20 | Comprehensive markdown-formatted event description | `## Earthquake Details\n\n### Impact\n- Casualties...` |
| `date_published` | ISO 8601 | format: date-time | When event was published | `2024-02-06T04:45:00Z` |
| `links` | array | type: object[] | Source URLs with labels | `[{url: "...", label: "..."}]` |
| `image_urls` | array | type: string[] | Image URLs | `["https://example.com/image.jpg"]` |

### Optional Fields

| Field | Type | Constraints | Description | Example |
|-------|------|-------------|-------------|---------|
| `date_event` | ISO 8601 or null | format: date-time | When event occurred | `2024-02-06T04:17:00Z` |
| `geo` | object | properties: lat, lon, ... | Geographic information | `{lat: 37.27, lon: 37.02, country: "Turkey"}` |
| `topics` | array | type: string[] | Event topics/tags | `["earthquake", "disaster", "turkey"]` |
| `confidence` | number | min: 0, max: 1 | Data confidence score | `0.95` |
| `ingested_at` | ISO 8601 | format: date-time | System ingestion timestamp | `2024-02-06T04:50:00Z` |

## Detailed Field Specification

### id
**Type**: String
**Constraints**: minLength 8
**Purpose**: Unique event identifier
**Rules**:
- Must be at least 8 characters
- Should be globally unique
- Format examples: UUID, event-codes, sequential IDs

**Examples**:
- `550e8400-e29b-41d4-a716-446655440000` (UUID)
- `event-2024-001234`
- `evt_20240206_turkey_eq`

---

### source
**Type**: Object (required: `name`)
**Properties**:
- `name` (required, string): Source name
- `email` (optional, string): Email address
- `provider` (optional, string): Provider type

**Purpose**: Identify the origin of the event information

**Examples**:
```json
{
  "name": "Reuters",
  "provider": "news-outlet"
}
```

```json
{
  "name": "Intelligence Report",
  "provider": "official"
}
```

```json
{
  "name": "Twitter News",
  "provider": "social-media"
}
```

---

### title
**Type**: String
**Constraints**: minLength 3
**Purpose**: Event headline/summary title

**Examples**:
- `Magnitude 7.8 Earthquake Strikes Turkey and Syria`
- `Protests Erupt in Downtown District`
- `New Climate Policy Announced`

---

### summary
**Type**: String
**Constraints**: minLength 10
**Purpose**: Brief narrative summary of the event

**Examples**:
```
A major 7.8 magnitude earthquake struck Turkey and Syria early Monday morning, 
causing extensive damage and thousands of reported casualties. Emergency response 
efforts are underway across affected regions.
```

---

### contents
**Type**: String (Markdown formatted)
**Constraints**: minLength 20
**Purpose**: Comprehensive event description with full context, formatted as Markdown

**Rules**:
- Should be well-formed Markdown
- May include headings, lists, tables, code blocks
- Supports rich formatting for complex event narratives
- Can include structured information sections

**Examples**:
```markdown
## Earthquake Event

### Overview
A powerful 7.8 magnitude earthquake struck the border region of Turkey and Syria 
at 04:17 UTC on Monday, February 6, 2024.

### Seismic Activity
- **Main quake**: 7.8 magnitude
- **Epicenter**: Gaziantep Province, 37.27°N, 37.02°E
- **Depth**: ~18km
- **Aftershocks**: Multiple 5.0+ magnitude tremors recorded
- **Duration**: Shaking lasted 20+ seconds

### Impacts
| Category | Details |
|----------|---------|
| Casualties | Preliminary estimates exceed 50,000 deaths |
| Infrastructure | Thousands of buildings destroyed or severely damaged |
| Displacement | Estimated 10+ million people affected |

### International Response
1. Turkish and Syrian governments declare emergency
2. International aid coordination activated
3. Search and rescue teams deployed from multiple countries
4. Medical assistance requested from neighboring nations

### Timeline
- **04:17 UTC**: Main earthquake strikes
- **04:30 UTC**: Initial reports emerge
- **06:00 UTC**: International responses begin
- **12:00 UTC**: Major news coverage spreads globally
```

---

### date_published
**Type**: ISO 8601 DateTime
**Format**: `YYYY-MM-DDTHH:mm:ssZ` (UTC)
**Purpose**: When the event information was published/reported

**Examples**:
- `2024-02-06T04:45:00Z`
- `2024-02-06T12:30:15Z`
- `2024-02-07T08:22:30Z`

---

### date_event
**Type**: ISO 8601 DateTime or null
**Format**: `YYYY-MM-DDTHH:mm:ssZ` or null
**Purpose**: When the event actually occurred
**Rules**: 
- Optional field
- If present, typically precedes or equals `date_published`
- Null when event timing is unknown

**Examples**:
- `2024-02-06T04:17:00Z` (event occurred)
- `null` (timing unknown)

---

### links
**Type**: Array of Objects
**Object Schema**:
```json
{
  "url": "string (required, format: uri)",
  "label": "string (optional)"
}
```
**Default**: `[]`
**Purpose**: Source URLs with optional labels

**Examples**:
```json
[
  {
    "url": "https://www.reuters.com/world/earthquakes/2024-02-06/",
    "label": "Reuters Coverage"
  },
  {
    "url": "https://www.bbc.com/news/world-middle-east",
    "label": "BBC News"
  }
]
```

---

### image_urls
**Type**: Array of Strings (URIs)
**Default**: `[]`
**Purpose**: Image references for visual documentation

**Examples**:
```json
[
  "https://example.com/earthquake-damage-01.jpg",
  "https://example.com/rescue-operations.jpg",
  "https://example.com/satellite-map.png"
]
```

---

### geo
**Type**: Object
**Required Properties**: `lat`, `lon`
**Object Schema**:
```json
{
  "country": "string (optional)",
  "region": "string (optional)",
  "city": "string (optional)",
  "lat": "number or null (required, -90 to 90)",
  "lon": "number or null (required, -180 to 180)"
}
```

**Purpose**: Geographic information about the event

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
  "country": "European Union"
}
```

---

### topics
**Type**: Array of Strings
**Default**: `[]`
**Purpose**: Event topics/keywords for categorization

**Examples**:
```json
[
  "earthquake",
  "natural-disaster",
  "turkey",
  "emergency-response",
  "humanitarian-crisis"
]
```

---

### confidence
**Type**: Number
**Range**: 0 to 1 (decimal)
**Purpose**: Confidence/quality score for event data
**Interpretation**:
- 0.8-1.0: Multiple sources, official confirmation
- 0.5-0.8: Good corroboration, mostly verified
- 0.2-0.5: Limited sources, some uncertainty
- 0.0-0.2: Unverified, single source

**Examples**:
- `0.95` (highly confident)
- `0.65` (moderate confidence)
- `0.35` (low confidence)

---

### ingested_at
**Type**: ISO 8601 DateTime
**Format**: `YYYY-MM-DDTHH:mm:ssZ`
**Purpose**: When the event was ingested into the system

**Examples**:
- `2024-02-06T04:50:00Z`
- `2024-02-06T12:35:15Z`

---

## Data Type Reference

### String Types
- `id`: 8+ characters, identifier format
- `source.name`: Non-empty string (source name)
- `source.email`: Email address format
- `source.provider`: Provider type identifier
- `title`: 3+ characters
- `summary`: 10+ characters
- `contents`: 20+ characters, Markdown formatted

### Date/Time Types
- `date_published`: Required ISO 8601 UTC
- `date_event`: Optional ISO 8601 UTC or null
- `ingested_at`: ISO 8601 UTC
- Format: `YYYY-MM-DDTHH:mm:ssZ`

### Numeric Types
- `geo.lat`: Decimal -90 to 90, nullable
- `geo.lon`: Decimal -180 to 180, nullable
- `confidence`: Decimal 0.0 to 1.0

### Array Types
- `links`: Array of link objects
- `image_urls`: Array of URI strings
- `topics`: Array of string tags

### Object Types
- `source`: Object with name, email, provider
- `geo`: Object with location properties

## Validation Rules

### Required Field Validation
- [ ] `id`: Present, 8+ characters
- [ ] `source`: Object with required `name` property
- [ ] `title`: Present, 3+ characters
- [ ] `summary`: Present, 10+ characters
- [ ] `contents`: Present, 20+ characters, valid Markdown
- [ ] `date_published`: Valid ISO 8601 datetime
- [ ] `links`: Array (may be empty), items have required `url`
- [ ] `image_urls`: Array (may be empty), items are URIs

### Optional Field Validation (if present)
- [ ] `date_event`: Valid ISO 8601 or null
- [ ] `geo.lat`: -90 to 90 or null
- [ ] `geo.lon`: -180 to 180 or null
- [ ] `confidence`: 0.0 to 1.0
- [ ] `ingested_at`: Valid ISO 8601

### Content Validation
- No HTML in text fields (unless in Markdown code blocks)
- All URLs must be valid HTTP/HTTPS
- Timestamps must be valid ISO 8601
- Geographic coordinates must be numeric and in valid ranges
- `contents` should be valid Markdown

## Entity Relationship Patterns

### Temporal Relationships
- `date_event` ≤ `date_published` (event before publication)
- `date_published` ≤ `ingested_at` (published before ingested)

### Geographic Relationships
- If `geo.lat` and `geo.lon` are non-null, they must be paired
- If city/region present, country should typically be present

### Source Attribution Chain
```
source (who published)
    ↓
date_published (when reported)
    ↓
ingested_at (when added to system)
```

## Common Entity Pattern

### Complete Event Entity
```json
{
  "id": "event-2024-001",
  "source": {"name": "Reuters", "provider": "news-outlet"},
  "title": "7.8 Magnitude Earthquake Strikes Turkey",
  "summary": "A major earthquake causes widespread damage and thousands of casualties across Turkey and Syria",
  "contents": "## Earthquake Overview\n\n### Event Details\n- **Magnitude**: 7.8\n- **Location**: Gaziantep Province, Turkey\n- **Time**: 04:17 UTC, February 6, 2024\n\n### Impacts\n- Thousands of casualties\n- Widespread infrastructure damage\n- International aid response initiated",
  "date_published": "2024-02-06T04:45:00Z",
  "date_event": "2024-02-06T04:17:00Z",
  "geo": {
    "lat": 37.27,
    "lon": 37.02,
    "country": "Turkey",
    "region": "Gaziantep",
    "city": "Gaziantep"
  },
  "links": [
    {"url": "https://reuters.com/...", "label": "Reuters Coverage"}
  ],
  "image_urls": [
    "https://example.com/damage.jpg"
  ],
  "topics": ["earthquake", "disaster", "turkey"],
  "confidence": 0.95,
  "ingested_at": "2024-02-06T04:50:00Z"
}
```

## Schema Compliance

**JSON Schema Version**: 2020-12
**Type**: object
**additionalProperties**: false (no extra fields allowed)

Entities must validate against the JSON schema specification for strict compliance.

## References

- See [REFERENCE.md](references/REFERENCE.md) for detailed field validation
- See [scripts/](scripts/) for entity analysis and characterization examples
