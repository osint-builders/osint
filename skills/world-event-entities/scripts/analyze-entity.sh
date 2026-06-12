#!/bin/bash
# Analyze and characterize a Word Event Entity

if [ $# -lt 1 ]; then
    echo "Usage: $0 <entity_json_file> [analysis_type]"
    echo ""
    echo "Analysis Types:"
    echo "  validate      - Validate required/optional fields"
    echo "  characterize  - Characterize entity type and properties"
    echo "  fields        - Show all fields and their values"
    echo "  summary       - Summary overview (default)"
    echo ""
    echo "Examples:"
    echo "  $0 event.json validate"
    echo "  $0 event.json characterize"
    echo "  $0 event.json fields"
    exit 1
fi

JSON_FILE="$1"
ANALYSIS_TYPE="${2:-summary}"

if [ ! -f "$JSON_FILE" ]; then
    echo "Error: JSON file not found: $JSON_FILE"
    exit 1
fi

echo "=== Word Event Entity Analysis ==="
echo "File: $JSON_FILE"
echo ""

case "$ANALYSIS_TYPE" in
    validate)
        echo "Validation Check:"
        echo ""
        echo "Required Fields:"
        echo "  id: $(jq -r '.id // "MISSING"' "$JSON_FILE")"
        echo "  source: $(jq -r '.source // "MISSING"' "$JSON_FILE")"
        echo "  title: $(jq -r '.title // "MISSING"' "$JSON_FILE" | cut -c1-50)..."
        echo "  summary: $(jq -r '.summary // "MISSING"' "$JSON_FILE" | cut -c1-50)..."
        echo "  details: $(jq -r '.details // "MISSING"' "$JSON_FILE" | cut -c1-50)..."
        echo "  date_published: $(jq -r '.date_published // "MISSING"' "$JSON_FILE")"
        echo "  links: $(jq -r '.links | length' "$JSON_FILE") URL(s)"
        echo "  image_urls: $(jq -r '.image_urls | length' "$JSON_FILE") image(s)"
        echo ""
        echo "Optional Fields Present:"
        jq -r 'keys[] | select(. != "id" and . != "source" and . != "title" and . != "summary" and . != "details" and . != "date_published" and . != "links" and . != "image_urls")' "$JSON_FILE" | sed 's/^/  /'
        ;;
    characterize)
        echo "Entity Characterization:"
        echo ""
        echo "Event Identity:"
        echo "  ID: $(jq -r '.id' "$JSON_FILE")"
        echo "  Source: $(jq -r '.source' "$JSON_FILE")"
        echo "  Type: $(jq -r '.event_type // "not-specified"' "$JSON_FILE")"
        echo "  Status: $(jq -r '.status // "unknown"' "$JSON_FILE")"
        echo ""
        echo "Temporal Information:"
        echo "  Published: $(jq -r '.date_published' "$JSON_FILE")"
        echo "  Occurred: $(jq -r '.date_occurred // "not-specified"' "$JSON_FILE")"
        echo ""
        echo "Geographic Information:"
        echo "  Location: $(jq -r '.geo.location_name // "not-specified"' "$JSON_FILE")"
        echo "  Country: $(jq -r '.geo.country // "not-specified"' "$JSON_FILE")"
        echo "  Coordinates: $(jq -r '.geo.latitude // "N/A"' "$JSON_FILE"), $(jq -r '.geo.longitude // "N/A"' "$JSON_FILE")"
        echo ""
        echo "Quality Metrics:"
        echo "  Confidence: $(jq -r '.metadata.confidence // "not-specified"' "$JSON_FILE")"
        echo "  Severity: $(jq -r '.severity // "not-specified"' "$JSON_FILE")/10"
        echo "  Sources: $(jq -r '.links | length' "$JSON_FILE")"
        echo "  Images: $(jq -r '.image_urls | length' "$JSON_FILE")"
        ;;
    fields)
        echo "All Fields:"
        echo ""
        jq -r 'to_entries[] | "\(.key): \(.value | if type == "string" then (.[0:100] + (if length > 100 then "..." else "" end)) else . end)"' "$JSON_FILE"
        ;;
    summary)
        echo "Entity Summary:"
        echo ""
        echo "Title: $(jq -r '.title' "$JSON_FILE")"
        echo "Summary: $(jq -r '.summary' "$JSON_FILE" | cut -c1-200)..."
        echo ""
        echo "Details:"
        echo "  Source: $(jq -r '.source' "$JSON_FILE")"
        echo "  Published: $(jq -r '.date_published' "$JSON_FILE")"
        echo "  Location: $(jq -r '.geo.location_name // "not-specified"' "$JSON_FILE")"
        echo "  Severity: $(jq -r '.severity // "not-specified"' "$JSON_FILE")/10"
        echo "  Status: $(jq -r '.status // "unknown"' "$JSON_FILE")"
        echo "  Confidence: $(jq -r '.metadata.confidence // "not-specified"' "$JSON_FILE")"
        echo ""
        echo "References:"
        echo "  Sources: $(jq -r '.links | length' "$JSON_FILE")"
        echo "  Images: $(jq -r '.image_urls | length' "$JSON_FILE")"
        echo "  Related Events: $(jq -r '.related_event_ids | length // 0' "$JSON_FILE")"
        ;;
    *)
        echo "Unknown analysis type: $ANALYSIS_TYPE"
        exit 1
        ;;
esac
