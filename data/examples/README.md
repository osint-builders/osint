# Example Data

This folder contains **sample data only** - not actual collected events. Use these examples for testing, validation, and understanding the data structure.

## Purpose

Example data serves multiple purposes:
1. **Testing** - Validate data processing scripts
2. **Documentation** - Demonstrate schema compliance
3. **Onboarding** - Help developers understand the data model
4. **Development** - Test queries and transformations without live data

## Structure

```
examples/
├── README.md                 # This file
└── 2026-04/
    ├── 2026-04-29.jsonl     # Sample events (10 examples)
    ├── images/
    │   └── 2026-04-29/
    │       ├── evt_example_001_img1.jpg
    │       └── evt_example_002_img1.png
    └── videos/
        └── 2026-04-29/
            └── evt_example_003_vid1.mp4
```

## Sample Events

The `2026-04-29.jsonl` file contains 10 diverse sample events demonstrating:

1. **Minimal event** - Only required fields
2. **Complete event** - All fields populated
3. **Multiple images** - Event with several image references
4. **Geographic event** - Full geo data (coordinates, country, region, city)
5. **Twitter source** - Social media sourced event
6. **API source** - Structured API data event
7. **RSS source** - RSS feed sourced event
8. **High confidence** - Well-verified event (0.95 confidence)
9. **Low confidence** - Unverified event (0.30 confidence)
10. **Rich markdown** - Complex contents with tables, lists, headings

## Differences from Real Data

**Sanitized**:
- No actual PII (personally identifiable information)
- Generic placeholder data
- Fictional event details

**Simplified**:
- Shorter markdown content
- Fewer images per event
- Simplified geographic data

**Representative**:
- Valid schema compliance
- Realistic field values
- Appropriate data types

## Using Examples

### Validation Testing

```bash
# Validate example file against schema
node data/scripts/validate-events.js data/examples/2026-04/2026-04-29.jsonl

# Should report 0 errors
```

### Query Testing

```bash
# Count events
wc -l data/examples/2026-04/2026-04-29.jsonl

# Pretty-print with jq
cat data/examples/2026-04/2026-04-29.jsonl | jq .

# Filter by source
cat data/examples/2026-04/2026-04-29.jsonl | jq 'select(.source.name == "Reuters")'

# Extract titles
cat data/examples/2026-04/2026-04-29.jsonl | jq -r '.title'
```

### Script Testing

```bash
# Test statistics generation
node data/scripts/stats-report.js --month examples/2026-04

# Test index rebuilding
node data/scripts/rebuild-indexes.js --source examples

# Test export
./data/scripts/export-date-range.sh examples/2026-04-29
```

## Schema Compliance

All example events are valid against the World Event Entity schema:

- ✓ All required fields present
- ✓ Correct data types
- ✓ Valid ISO 8601 timestamps
- ✓ Valid geographic coordinates
- ✓ Confidence scores in range (0.0-1.0)
- ✓ Well-formed Markdown in contents
- ✓ Valid URLs in links and image_urls

## Generating More Examples

To generate additional example data:

```javascript
// Example event template
{
  "id": "evt_example_XXX",
  "source": {"name": "Example Source", "provider": "example"},
  "title": "Example Event Title",
  "summary": "Brief summary of the example event...",
  "contents": "## Example Event\n\nDetailed markdown content...",
  "date_published": "2026-04-29T12:00:00Z",
  "date_event": "2026-04-29T11:30:00Z",
  "geo": {"lat": 40.7128, "lon": -74.0060, "country": "USA", "city": "New York"},
  "links": [{"url": "https://example.com/article", "label": "Example Source"}],
  "image_urls": ["./examples/2026-04/images/2026-04-29/evt_example_XXX_img1.jpg"],
  "topics": ["example", "test", "sample"],
  "confidence": 0.85,
  "ingested_at": "2026-04-29T12:05:00Z"
}
```

Save as single-line JSON (JSONL format) and append to `.jsonl` file.

## Media Files

Example media files are placeholders:
- `images/` - Small test images (100-500KB)
- `videos/` - Short test clips (1-5MB)

Real data will have:
- Larger images (1-10MB)
- Longer videos (10-100MB+)
- More files per event

## Notes

- **Do not use examples for analysis** - This is synthetic data
- **Examples are version-controlled** - Unlike real data
- **Keep examples small** - Only 10-20 sample events needed
- **Update examples** - When schema changes, update examples

## Related

- **Schema**: See [../SCHEMA.md](../SCHEMA.md) for field specifications
- **Real Data**: See [../README.md](../README.md) for actual data structure
- **Validation**: Use scripts in [../scripts/](../scripts/) to validate examples
