---
name: word-event-entities
description: Characterize and analyze Word Event Entities - a comprehensive model for representing real-world events with structured data. Understand entity fields, properties, data types, relationships, and identifiers. Use to inform AI systems about event model architecture and provide context for event processing and analysis.
license: MIT
compatibility: Language-agnostic reference documentation. Applicable to any system processing event entities.
metadata:
  author: osint-builders
  version: "1.0.0"
  entity-type: world-event
  schema-source: "https://github.com/Zettersten/osint-/schemas/world_event.entity.schema.json"
---

# Word Event Entities Skill

Comprehensive reference and characterization of Word Event Entity model - a structured representation of real-world events with metadata, sources, geographic information, and temporal context.

## Entity Overview

The Word Event Entity is a standardized data model for representing events captured from news sources, social media, official reports, and other information channels. It provides a unified schema for storing event information with rich metadata, source attribution, geographic context, and content references.

**Primary Use Cases:**
- OSINT (Open Source Intelligence) event tracking
- News aggregation and event correlation
- Geospatial event mapping and analysis
- Timeline construction and event relationship analysis
- Event verification and source attribution
- Real-world incident documentation

## Core Model Structure

### Required Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `id` | string (UUID) | Unique identifier for the event | `550e8400-e29b-41d4-a716-446655440000` |
| `source` | string | Origin of event information | `bbc-news`, `reuters`, `twitter`, `official-gov` |
| `title` | string (1-500 chars) | Event headline/summary title | `Earthquake Hits Turkey, Magnitude 7.8` |
| `summary` | string (1-2000 chars) | Brief narrative summary | `A major 7.8 magnitude earthquake struck Turkey...` |
| `details` | string (1-10000 chars) | Comprehensive event description | `Full narrative with context, impact, response...` |
| `date_published` | ISO 8601 timestamp | Publication date/time | `2023-02-06T04:17:46Z` |
| `links` | array[string] | URLs to source articles/references | `["https://example.com/article", ...]` |
| `image_urls` | array[string] | URLs to event images | `["https://example.com/image.jpg", ...]` |

### Optional Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `date_occurred` | ISO 8601 timestamp | When event actually occurred (if different from published) | `2023-02-06T04:17:00Z` |
| `event_type` | string | Category of event | `natural-disaster`, `conflict`, `protest`, `accident` |
| `severity` | integer (1-10) | Impact severity level | `8` |
| `status` | string | Current state of event | `active`, `resolved`, `ongoing`, `developing` |
| `keywords` | array[string] | Relevant tags/keywords | `["earthquake", "turkey", "disaster"]` |
| `entities` | array[object] | Named entities (people, places, organizations) | `[{type: "person", name: "John Doe"}, ...]` |
| `related_event_ids` | array[string] | References to related events | `["uuid-1", "uuid-2"]` |
| `metadata.confidence` | decimal (0-1) | Data quality/confidence score | `0.95` |
| `metadata.updated_at` | ISO 8601 timestamp | Last update timestamp | `2023-02-07T12:30:00Z` |
| `metadata.contributor` | string | Who added/updated the event | `analyst-123`, `system-crawler` |

### Geographic Fields

| Field | Type | Description | Nullable |
|-------|------|-------------|----------|
| `geo.latitude` | decimal (-90 to 90) | Event latitude coordinate | Yes |
| `geo.longitude` | decimal (-180 to 180) | Event longitude coordinate | Yes |
| `geo.country` | string | Country ISO-3 code or name | Yes |
| `geo.region` | string | State/province/region | Yes |
| `geo.city` | string | City/municipality | Yes |
| `geo.location_name` | string | Human-readable location | Yes |

Geographic fields are nullable because many events may not have precise location data (e.g., policy announcements, global events).

## Field Characteristics

### Identifiers

**Primary Key**: `id`
- UUID v4 format
- Globally unique across systems
- Immutable after creation
- Used for event references and relationships

**Secondary Identifiers**:
- `source` + `date_published` (typically unique within a source)
- Can be used for deduplication

### Temporal Fields

**date_published** (Required)
- ISO 8601 format: `YYYY-MM-DDTHH:mm:ssZ`
- Represents when information was published/reported
- Used for timeline ordering

**date_occurred** (Optional)
- When event actually happened
- May differ from publication date (delayed reporting)
- Useful for distinguishing event timing from news cycle

### Content Fields

**title** - Concise headline
- 1-500 characters
- Should be descriptive but brief
- Used for event identification and display

**summary** - Executive summary
- 1-2000 characters
- Captures key event details
- Should answer: Who, What, When, Where, Why
- Contains essential information without full details

**details** - Comprehensive narrative
- 1-10000 characters
- Full event description with context
- May include impact assessment, response actions
- Primary content for analysis

### Reference Fields

**links** - Source URLs
- Array of URLs
- Points to original/authoritative sources
- Used for source verification
- Supports citation and attribution

**image_urls** - Visual content references
- Array of image URLs
- Provides visual documentation
- May include maps, photos, diagrams
- Supports visual analysis and reporting

## Data Type Reference

### String Types
- **id**: UUID v4 (36 chars with hyphens)
- **source**: Machine-readable source identifier (alphanumeric, hyphens)
- **title**: Plain text (no HTML)
- **summary**: Plain text or markdown
- **details**: Plain text or markdown with newlines
- **event_type**: Enumerated value from predefined list
- **status**: One of: active, resolved, ongoing, developing, closed
- **keywords**: Free-form text tags

### Numeric Types
- **severity**: Integer 1-10 (1=minimal, 10=catastrophic)
- **confidence**: Decimal 0-1 (0.0=no confidence, 1.0=complete confidence)
- **geo.latitude**: Decimal -90 to 90
- **geo.longitude**: Decimal -180 to 180

### Array Types
- **links**: Array of URLs (strings)
- **image_urls**: Array of URLs (strings)
- **keywords**: Array of strings
- **related_event_ids**: Array of UUIDs
- **entities**: Array of objects (structured named entities)

### Object Types
- **geo**: Nested object with location properties
- **metadata**: Nested object with administrative properties
- **entities[]**: Objects with type and name properties

## Relationships & Dependencies

### Field Dependencies

**Geographic Fields**:
- If any geo field is populated, `geo.country` should typically be present
- `geo.latitude` and `geo.longitude` should be paired (both or neither)
- More specific locations (city/region) imply presence of country

**Temporal Fields**:
- `date_published` is always present (required)
- If `date_occurred` is present, it typically precedes or equals `date_published`
- `metadata.updated_at` should be >= `date_published`

**Content Relationships**:
- `title` should be extractable from or summarize `summary`
- `summary` should summarize `details`
- Hierarchy: title → summary → details (increasing specificity)

**Event Relationships**:
- `related_event_ids` references other event IDs
- Relationships can be: predecessor, cause, consequence, related
- Used to construct event chains or clusters

### Source Attribution Chain

```
link (URL) 
  ↓
source (who published)
  ↓
date_published (when reported)
  ↓
contributor (who added to system)
  ↓
metadata.updated_at (last change)
```

## Entity Validation Rules

### Required Fields Validation
- `id`: Must be valid UUID v4
- `source`: Non-empty alphanumeric string
- `title`: 1-500 characters, non-empty
- `summary`: 1-2000 characters, non-empty
- `details`: 1-10000 characters, non-empty
- `date_published`: Valid ISO 8601 timestamp
- `links`: Array with at least 1 valid URL
- `image_urls`: Array (may be empty)

### Optional Fields Validation
- `date_occurred`: If present, valid ISO 8601 timestamp
- `event_type`: Must be from predefined enumeration
- `severity`: If present, integer 1-10
- `confidence`: If present, decimal 0-1
- `geo.latitude`: If present, -90 to 90
- `geo.longitude`: If present, -180 to 180

### Content Validation
- No HTML/script content in text fields (sanitized)
- URLs in links/images must be valid HTTP/HTTPS
- Timestamps must be timezone-aware or UTC

## Common Characterization Patterns

### Event Type Classification

**Natural Disaster**
- Fields emphasized: `geo` (location), `severity`, `date_occurred`
- Key data: impact area, casualties, damage
- Example event_type values: earthquake, hurricane, flood, drought

**Conflict/Violence**
- Fields emphasized: `entities` (parties involved), `severity`, `geo`
- Key data: parties, locations, casualties, timeline
- Example event_type values: armed-conflict, protest, riot, attack

**Policy/Announcement**
- Fields emphasized: `date_published`, `entities` (issuing body)
- Key data: policy details, issuing authority, effective date
- Geographic scope may be national/international
- geo may be null (policy is jurisdictional, not geographic incident)

**Infrastructure Incident**
- Fields emphasized: `severity`, `geo` (specific location), `status`
- Key data: facility type, outage duration, affected area
- Example event_type values: power-outage, bridge-collapse, pipeline-failure

### Confidence Scoring

**High Confidence (0.8-1.0)**
- Multiple authoritative sources corroborate
- Official statements or verified reporting

**Medium Confidence (0.5-0.8)**
- Some corroboration but some uncertainty
- Mixed source quality
- Developing story still gathering information

**Low Confidence (0-0.5)**
- Single source or unverified reports
- Conflicting information
- Preliminary/draft status

## Usage Examples

### Complete Event Entity

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "source": "reuters",
  "title": "Major Earthquake Strikes Turkey, Death Toll Rises",
  "summary": "A devastating 7.8 magnitude earthquake struck Turkey and Syria on February 6, 2023, causing widespread damage and thousands of casualties.",
  "details": "A major 7.8 magnitude earthquake struck Turkey and Syria at 04:17 UTC on Monday, February 6, 2023. The epicenter was located in Gaziantep Province, Turkey. Tremors were felt across the Middle East. Preliminary reports indicate over 5,000 casualties across both countries. Aftershocks continue. Emergency response underway.",
  "date_published": "2023-02-06T04:45:00Z",
  "date_occurred": "2023-02-06T04:17:00Z",
  "event_type": "natural-disaster",
  "severity": 9,
  "status": "ongoing",
  "geo": {
    "latitude": 37.27,
    "longitude": 37.02,
    "country": "TUR",
    "region": "Gaziantep",
    "city": "Gaziantep",
    "location_name": "Gaziantep Province, Turkey"
  },
  "links": [
    "https://reuters.com/earthquake-turkey",
    "https://bbc.com/news/earthquake"
  ],
  "image_urls": [
    "https://example.com/earthquake-damage.jpg",
    "https://example.com/rescue-operations.jpg"
  ],
  "keywords": ["earthquake", "turkey", "disaster", "casualties"],
  "entities": [
    {"type": "location", "name": "Turkey"},
    {"type": "location", "name": "Syria"},
    {"type": "organization", "name": "Turkish Red Crescent"}
  ],
  "metadata": {
    "confidence": 0.95,
    "updated_at": "2023-02-07T12:30:00Z",
    "contributor": "system-crawler-001"
  }
}
```

### Minimal Event Entity (Required fields only)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "source": "twitter",
  "title": "Breaking News Alert",
  "summary": "Unconfirmed reports of incident in downtown area",
  "details": "Early reports from social media indicate an incident in the downtown district. More information pending verification.",
  "date_published": "2023-02-06T15:30:00Z",
  "links": ["https://twitter.com/news/status/123456"],
  "image_urls": []
}
```

## References

- See [REFERENCE.md](references/REFERENCE.md) for detailed field specification
- See [DATA_DICTIONARY.md](references/DATA_DICTIONARY.md) for enumerated values
- See [scripts/](scripts/) for analysis and characterization examples
- Schema source: https://github.com/Zettersten/osint-/schemas/world_event.entity.schema.json
