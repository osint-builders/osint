# Word Event Entity - Complete Field Reference

Comprehensive specification of all fields in the Word Event Entity model.

## Required Fields

### id
**Type**: String (UUID v4)
**Format**: 36 characters with hyphens: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
**Purpose**: Unique identifier for the event
**Rules**: 
- Must be UUID v4 (random)
- Globally unique across all systems
- Immutable after creation
- Used for references and relationships

**Example**: `550e8400-e29b-41d4-a716-446655440000`

---

### source
**Type**: String
**Format**: Alphanumeric with hyphens, lowercase
**Purpose**: Identifies the origin/publisher of event information
**Rules**:
- Non-empty
- Machine-readable format (no spaces)
- Represents publisher/reporter (news outlet, social platform, official source)
- Used for source attribution and filtering

**Examples**:
- `reuters`
- `bbc-news`
- `ap-news`
- `twitter`
- `official-gov`
- `twitter-@username`
- `facebook-page`

---

### title
**Type**: String
**Length**: 1-500 characters
**Purpose**: Event headline/summary title
**Rules**:
- Non-empty
- Plain text (no HTML/markup)
- Should be descriptive but concise
- Typically a news headline
- Used for event identification and display

**Examples**:
- `Earthquake Hits Turkey, Magnitude 7.8`
- `Protest Erupts in Downtown District`
- `New Climate Policy Announced by EU`

---

### summary
**Type**: String
**Length**: 1-2000 characters
**Purpose**: Brief narrative summary of the event
**Rules**:
- Non-empty
- Plain text or markdown
- Should answer: Who, What, When, Where, Why
- Condensed version of full details
- Used for preview/overview displays

**Examples**:
```
A major 7.8 magnitude earthquake struck Turkey and Syria on February 6, 2023, 
causing widespread damage and thousands of casualties. The epicenter was located 
in Gaziantep Province. Emergency response efforts are underway.
```

---

### details
**Type**: String
**Length**: 1-10000 characters
**Purpose**: Comprehensive event description
**Rules**:
- Non-empty
- Plain text or markdown with newlines
- Full narrative with context and background
- May include: impact assessment, response actions, quotes, analysis
- Primary content for analysis and archival
- Used for detailed reporting and AI analysis

**Examples**:
```
A major 7.8 magnitude earthquake struck Turkey and Syria at 04:17 UTC on Monday, 
February 6, 2023. The epicenter was located in Gaziantep Province, Turkey at 
coordinates 37.27°N, 37.02°E. 

Seismic activity: Strong aftershocks (5.0+) continued throughout the day.

Impact: 
- Estimated 5,000+ casualties
- 20,000+ buildings destroyed or severely damaged
- Thousands displaced

Response:
- Turkish Red Crescent deployed rescue teams
- International aid coordination initiated
- Airports reopened for relief supplies
```

---

### date_published
**Type**: ISO 8601 timestamp
**Format**: `YYYY-MM-DDTHH:mm:ssZ` (UTC timezone required)
**Purpose**: When the event information was published/reported
**Rules**:
- Must be valid ISO 8601 timestamp
- Timezone must be specified (typically Z for UTC)
- Used for timeline ordering and recency filtering
- May differ from when event actually occurred

**Examples**:
- `2023-02-06T04:45:00Z`
- `2023-02-07T12:30:00Z`
- `2023-02-08T16:22:30Z`

---

### links
**Type**: Array of strings (URLs)
**Minimum**: At least 1 URL required
**Purpose**: References to source articles/reports
**Rules**:
- Must contain valid HTTP/HTTPS URLs
- Should link to original/authoritative sources
- Used for citation, verification, and further reading
- Multiple sources from different outlets recommended

**Examples**:
```json
[
  "https://www.reuters.com/world/middle-east/earthquake-deaths-2023-02-06/",
  "https://www.bbc.com/news/world-middle-east-64553314",
  "https://www.aljazeera.com/news/middleeast/2023/2/6/live-turkey-earthquake"
]
```

---

### image_urls
**Type**: Array of strings (URLs)
**Minimum**: 0 (may be empty)
**Purpose**: URLs to images of the event
**Rules**:
- Must be valid HTTP/HTTPS URLs
- Should point to images (jpg, png, gif, webp)
- May be empty if no images available
- Used for visual documentation and reporting

**Examples**:
```json
[
  "https://example.com/earthquake-damage-01.jpg",
  "https://example.com/rescue-operations.jpg",
  "https://example.com/satellite-image.png"
]
```

---

## Optional Fields

### date_occurred
**Type**: ISO 8601 timestamp
**Format**: `YYYY-MM-DDTHH:mm:ssZ`
**Purpose**: When the event actually occurred
**Rules**:
- If present, must be valid ISO 8601
- Typically occurs before or at `date_published`
- May differ significantly for delayed reporting
- Useful for distinguishing event timing from news cycle

**Example**: `2023-02-06T04:17:00Z` (event time) vs `2023-02-06T04:45:00Z` (publication time)

---

### event_type
**Type**: String (enumerated)
**Purpose**: Categorize the type of event
**Valid Values**:
- `natural-disaster` (earthquake, hurricane, flood, volcano, drought)
- `conflict` (armed conflict, war, military action)
- `protest` (demonstration, march, civil unrest)
- `accident` (traffic, industrial, aviation)
- `crime` (murder, robbery, terrorism)
- `health` (epidemic, pandemic, health crisis)
- `infrastructure` (power outage, bridge collapse, pipeline failure)
- `environmental` (pollution, spill, air quality)
- `policy` (law, regulation, announcement)
- `economic` (market crash, bankruptcy, layoffs)
- `other`

**Example**: `natural-disaster`, `conflict`, `protest`

---

### severity
**Type**: Integer
**Range**: 1-10
**Purpose**: Impact severity level of the event
**Rules**:
- Integer only (no decimals)
- 1 = minimal impact
- 10 = catastrophic impact
- Used for prioritization and filtering

**Scale**:
- 1-2: Minor incident, limited impact
- 3-4: Noticeable incident, local impact
- 5-6: Significant incident, regional impact
- 7-8: Major incident, widespread impact
- 9-10: Catastrophic incident, national/global impact

**Examples**:
- Earthquake magnitude 7.8 = severity 9
- Local power outage = severity 3
- Global pandemic = severity 10

---

### status
**Type**: String (enumerated)
**Valid Values**:
- `active` - Event is currently ongoing
- `developing` - Situation still evolving, information changing
- `ongoing` - Event continues but stabilized
- `resolved` - Event has ended
- `closed` - Event archived/no longer tracked

**Purpose**: Current state of the event

**Example**: `developing` → `ongoing` → `resolved`

---

### keywords
**Type**: Array of strings
**Purpose**: Relevant tags/keywords for indexing and searching
**Rules**:
- Free-form text tags
- Lowercase recommended for consistency
- May include: location names, people names, organizations, concepts

**Examples**:
```json
["earthquake", "turkey", "disaster", "rescue", "february-2023"]
```

---

### entities
**Type**: Array of objects
**Object Structure**:
```json
{
  "type": "person|location|organization|product|event",
  "name": "entity name"
}
```
**Purpose**: Named entities referenced in the event

**Examples**:
```json
[
  {"type": "location", "name": "Turkey"},
  {"type": "location", "name": "Syria"},
  {"type": "organization", "name": "Turkish Red Crescent"},
  {"type": "person", "name": "President Recep Tayyip Erdogan"}
]
```

---

### related_event_ids
**Type**: Array of strings (UUIDs)
**Purpose**: References to related events
**Rules**:
- Contains UUIDs of other events
- Indicates causal, sequential, or thematic relationships
- Used to construct event chains or clusters

**Example**:
```json
["550e8400-e29b-41d4-a716-446655440001", "550e8400-e29b-41d4-a716-446655440002"]
```

---

## Geographic Fields (geo object)

### geo.latitude
**Type**: Decimal
**Range**: -90 to 90
**Purpose**: Event latitude coordinate
**Nullable**: Yes
**Example**: `37.27`

---

### geo.longitude
**Type**: Decimal
**Range**: -180 to 180
**Purpose**: Event longitude coordinate
**Nullable**: Yes
**Example**: `37.02`

---

### geo.country
**Type**: String
**Format**: ISO 3166-1 alpha-3 code or full name
**Purpose**: Country where event occurred
**Nullable**: Yes
**Examples**: `TUR`, `SYR`, `USA`, `Turkey`, `Syria`

---

### geo.region
**Type**: String
**Purpose**: State/province/region name
**Nullable**: Yes
**Examples**: `Gaziantep`, `California`, `Île-de-France`

---

### geo.city
**Type**: String
**Purpose**: City/municipality name
**Nullable**: Yes
**Examples**: `Gaziantep`, `Los Angeles`, `Paris`

---

### geo.location_name
**Type**: String
**Purpose**: Human-readable location description
**Nullable**: Yes
**Examples**: `Gaziantep Province, Turkey`, `San Francisco Bay Area`, `English Channel`

---

## Metadata Fields (metadata object)

### metadata.confidence
**Type**: Decimal
**Range**: 0.0 to 1.0
**Purpose**: Confidence/quality score for the event data
**Rules**:
- 0.0 = no confidence
- 1.0 = complete confidence
- Higher values indicate better corroboration and source quality

**Interpretation**:
- 0.8-1.0: Multiple sources, official confirmation
- 0.5-0.8: Mixed sources, some uncertainty
- 0.0-0.5: Single source, unverified

**Example**: `0.95`

---

### metadata.updated_at
**Type**: ISO 8601 timestamp
**Format**: `YYYY-MM-DDTHH:mm:ssZ`
**Purpose**: When the event record was last updated
**Rules**:
- Must be >= `date_published`
- Updated when any field changes
- Tracks data freshness

**Example**: `2023-02-07T12:30:00Z`

---

### metadata.contributor
**Type**: String
**Purpose**: Who added/updated the event
**Examples**: `analyst-123`, `system-crawler-001`, `user-name`

---

## Complete Field Validation Checklist

### Required Fields
- [ ] `id`: Valid UUID v4 format
- [ ] `source`: Non-empty alphanumeric string
- [ ] `title`: 1-500 characters, non-empty
- [ ] `summary`: 1-2000 characters, non-empty
- [ ] `details`: 1-10000 characters, non-empty
- [ ] `date_published`: Valid ISO 8601, UTC timezone
- [ ] `links`: Array with minimum 1 valid URL
- [ ] `image_urls`: Array (may be empty)

### Geographic Fields (if present)
- [ ] `geo.latitude`: -90 to 90 or null
- [ ] `geo.longitude`: -180 to 180 or null
- [ ] If latitude/longitude present, both must be present
- [ ] If any geo field present, `geo.country` recommended

### Temporal Fields (if present)
- [ ] `date_occurred`: Valid ISO 8601 or not present
- [ ] `date_occurred` <= `date_published` (if both present)
- [ ] `metadata.updated_at` >= `date_published`

### Enumerated Fields (if present)
- [ ] `event_type`: Valid from enumeration list
- [ ] `status`: One of: active, developing, ongoing, resolved, closed
- [ ] `severity`: Integer 1-10

### Numeric Fields (if present)
- [ ] `metadata.confidence`: 0.0 to 1.0

## Usage in AI Systems

### For AI Analysis
- Use `details` + `summary` for context
- Use `entities` to understand participants
- Use `geo` for spatial context
- Use `keywords` for topic clustering
- Use `metadata.confidence` for reliability assessment

### For Timeline Construction
- Sort by `date_occurred` or `date_published`
- Use `related_event_ids` to link events
- Track status changes over time

### For Source Attribution
- Follow `links` to primary sources
- Check `source` for publisher credibility
- Verify `date_published` for currency

### For Verification
- Compare `summary` and `details` for consistency
- Cross-reference `links` and `image_urls`
- Check `metadata.confidence` and source count
