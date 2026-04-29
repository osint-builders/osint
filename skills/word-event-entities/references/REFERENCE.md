# World Event Entity - Complete Reference

Authoritative field reference based on JSON Schema 2020-12 specification.

## Required Fields (Must Present)

### id (String)
- **minLength**: 8 characters
- **Purpose**: Unique event identifier
- **Examples**: `event-2024-001`, `550e8400-e29b-41d4-a716-446655440000`

### source (Object)
- **Required Property**: `name` (string)
- **Optional Properties**: `email` (string), `provider` (string)
- **Purpose**: Event source/publisher information
- **Examples**:
  - `{"name": "Reuters"}`
  - `{"name": "Official Statement", "provider": "official"}`

### title (String)
- **minLength**: 3 characters
- **Purpose**: Event headline
- **Examples**: `Major Earthquake Strikes Turkey`, `Earthquake`

### summary (String)
- **minLength**: 10 characters
- **Purpose**: Brief event summary
- **Examples**: `A major 7.8 magnitude earthquake struck Turkey and Syria`

### contents (String - Markdown)
- **minLength**: 20 characters
- **Format**: Markdown formatted text
- **Purpose**: Comprehensive event description with full context
- **Structure**: Can include headings, lists, tables, code blocks, emphasis
- **Examples**: 
  ```markdown
  ## Event Overview
  A powerful earthquake struck the region...
  
  ### Key Points
  - Point 1
  - Point 2
  ```

### date_published (ISO 8601)
- **Format**: `date-time` (RFC 3339)
- **Purpose**: Publication timestamp
- **Examples**: `2024-02-06T04:45:00Z`

### links (Array of Objects)
- **Type**: Array
- **Item Schema**:
  - `url` (required, string, format: uri)
  - `label` (optional, string)
  - `additionalProperties`: false
- **Default**: `[]`
- **Purpose**: Source URLs with labels
- **Examples**:
  ```json
  [
    {"url": "https://reuters.com/...", "label": "Reuters"}
  ]
  ```

### image_urls (Array of Strings)
- **Type**: Array of strings (URIs)
- **Default**: `[]`
- **Purpose**: Image references
- **Examples**: `["https://example.com/image.jpg"]`

## Optional Fields

### date_event (ISO 8601 or null)
- **Type**: string (format: date-time) or null
- **Purpose**: Event occurrence timestamp
- **Examples**: `2024-02-06T04:17:00Z` or `null`

### geo (Object)
- **Required Properties**: `lat`, `lon`
- **Other Properties**: `country`, `region`, `city`
- **additionalProperties**: false
- **lat**: number or null, range: -90 to 90
- **lon**: number or null, range: -180 to 180
- **Purpose**: Geographic information
- **Examples**:
  ```json
  {
    "lat": 37.27,
    "lon": 37.02,
    "country": "Turkey",
    "region": "Gaziantep",
    "city": "Gaziantep"
  }
  ```

### topics (Array of Strings)
- **Type**: Array of strings
- **Default**: `[]`
- **Purpose**: Event keywords/topics
- **Examples**: `["earthquake", "disaster", "turkey"]`

### confidence (Number)
- **Type**: number
- **Range**: 0 to 1 (decimal)
- **Purpose**: Data confidence score
- **Examples**: `0.95`, `0.65`, `0.35`

### ingested_at (ISO 8601)
- **Type**: string (format: date-time)
- **Purpose**: System ingestion timestamp
- **Examples**: `2024-02-06T04:50:00Z`

## Validation Checklist

### Required Field Presence
- [ ] `id` present with minLength 8
- [ ] `source` object with required `name` property
- [ ] `title` present with minLength 3
- [ ] `summary` present with minLength 10
- [ ] `contents` present with minLength 20 and valid Markdown
- [ ] `date_published` valid ISO 8601 datetime
- [ ] `links` array with valid URL objects
- [ ] `image_urls` array with URI strings

### Optional Field Validation (if present)
- [ ] `date_event` is ISO 8601 or null
- [ ] `geo.lat` is number (-90 to 90) or null
- [ ] `geo.lon` is number (-180 to 180) or null
- [ ] `geo.lat` and `geo.lon` paired (both or neither)
- [ ] `confidence` is 0.0 to 1.0
- [ ] `ingested_at` is valid ISO 8601

### Type Validation
- [ ] All string fields are strings
- [ ] All arrays are arrays
- [ ] All objects are objects
- [ ] All numbers are numeric

### Content Validation
- [ ] No HTML in text fields
- [ ] URLs are valid HTTP/HTTPS format
- [ ] Timestamps are valid ISO 8601
- [ ] Coordinates in valid ranges
- [ ] `contents` is valid Markdown format

### No Extra Properties
- [ ] No properties outside defined schema (additionalProperties: false)

## ISO 8601 Date-Time Format

**Format**: `YYYY-MM-DDTHH:mm:ssZ`

**Components**:
- `YYYY`: 4-digit year (2024)
- `MM`: 2-digit month (01-12)
- `DD`: 2-digit day (01-31)
- `T`: Literal separator
- `HH`: 2-digit hour (00-23)
- `mm`: 2-digit minute (00-59)
- `ss`: 2-digit second (00-59)
- `Z`: UTC timezone indicator

**Examples**:
- `2024-02-06T04:45:00Z` - February 6, 2024 at 4:45 AM UTC
- `2024-02-06T04:17:00Z` - February 6, 2024 at 4:17 AM UTC

## Confidence Score Interpretation

| Range | Interpretation | Use Case |
|-------|-----------------|----------|
| 0.8-1.0 | Highly confident | Multiple authoritative sources |
| 0.6-0.8 | Good confidence | Most details verified |
| 0.4-0.6 | Moderate confidence | Some sources, developing |
| 0.2-0.4 | Low confidence | Limited sources, unverified |
| 0.0-0.2 | Very low confidence | Single source, preliminary |

## Source Provider Types

Common `source.provider` values:
- `news-outlet` (Reuters, BBC, AP, etc.)
- `social-media` (Twitter, Facebook, etc.)
- `official` (Government, institutional sources)
- `eyewitness` (First-hand reports)
- `wire-service` (News wires)
- `intelligence` (Intelligence reports)
- `other` (Other sources)

## Complete Event Entity Example

```json
{
  "id": "event-2024-001",
  "source": {"name": "Reuters", "provider": "news-outlet"},
  "title": "7.8 Magnitude Earthquake Strikes Turkey",
  "summary": "A major earthquake causes widespread damage and thousands of casualties across Turkey and Syria",
  "contents": "## Earthquake Overview\n\n### Event Details\n- **Magnitude**: 7.8\n- **Location**: Gaziantep Province, Turkey\n- **Coordinates**: 37.27°N, 37.02°E\n- **Depth**: ~18km\n- **Time**: 04:17 UTC, February 6, 2024\n\n### Seismic Activity\n- Main quake: 7.8 magnitude\n- Multiple 5.0+ magnitude aftershocks\n- Shaking lasted 20+ seconds\n\n### Impacts\n| Category | Details |\n|----------|----------|\n| Casualties | Preliminary estimates exceed 50,000 deaths |\n| Infrastructure | Thousands of buildings destroyed or severely damaged |\n| Displacement | Estimated 10+ million people affected |\n\n### Response\n1. Turkish and Syrian governments declare emergency\n2. International aid coordination activated\n3. Search and rescue teams deployed\n4. Medical assistance requested",
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
    {"url": "https://www.reuters.com/world/earthquakes/2024-02-06/", "label": "Reuters Coverage"},
    {"url": "https://www.bbc.com/news/world-middle-east", "label": "BBC News"}
  ],
  "image_urls": [
    "https://example.com/earthquake-damage-01.jpg",
    "https://example.com/rescue-operations.jpg"
  ],
  "topics": ["earthquake", "disaster", "turkey", "emergency-response"],
  "confidence": 0.95,
  "ingested_at": "2024-02-06T04:50:00Z"
}
```

## Schema Compliance

**JSON Schema**: 2020-12
**Type**: object
**additionalProperties**: false (strict schema, no extra fields)

## Error Handling

### Common Validation Errors

| Error | Cause | Fix |
|-------|-------|-----|
| Missing required field | Field not present | Add required field |
| Value too short | String below minLength | Increase string length |
| Invalid URL format | Malformed URL | Fix URL format to http/https |
| Invalid date format | Wrong datetime format | Use ISO 8601 format |
| Out of range | Number outside valid range | Keep within range |
| Extra properties | Field not in schema | Remove extra fields |
| Wrong type | Value is wrong type | Convert to correct type |
| Invalid Markdown | Malformed Markdown in contents | Fix Markdown syntax |

## Testing & Validation

For strict JSON Schema validation against the specification:

1. Ensure all required fields are present
2. Verify data types match specification
3. Validate string lengths meet minimums
4. Check numeric ranges
5. Verify timestamp formats are ISO 8601
6. Confirm no additional properties exist
7. Validate Markdown in contents field
