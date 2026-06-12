#!/usr/bin/env bash
# validate-confidence.sh — corroborate a high-priority event via Perplexity
# and adjust its confidence score. Reads one event JSON object on stdin,
# writes the (possibly enriched) compact event JSON on stdout.
#
# Gating (cost control):
#   - Only events with priority == "high" trigger a research call.
#   - At most MAX_RESEARCH_CALLS (default 25) calls per bucket, tracked in
#     $WORK_DIR/.research-count.
#   - Model: PPLX_MODEL (default "sonar" — cheaper than sonar-pro).
#   - Missing PERPLEXITY_API_KEY degrades gracefully to passthrough.
#
# Usage: event_json=$(printf '%s' "$event_json" | bash builder/runtime/validate-confidence.sh)
set -euo pipefail

: "${WORK_DIR:?WORK_DIR must point at the bucket work directory}"
MAX_RESEARCH_CALLS="${MAX_RESEARCH_CALLS:-25}"
PPLX_MODEL="${PPLX_MODEL:-sonar}"
COUNT_FILE="$WORK_DIR/.research-count"

event_json=$(jq -c '.')   # read stdin, normalize to compact

passthrough() { printf '%s\n' "$event_json"; exit 0; }

[ -n "${PERPLEXITY_API_KEY:-}" ] || passthrough

priority=$(printf '%s' "$event_json" | jq -r '.priority // "medium"')
[ "$priority" = "high" ] || passthrough

count=$(cat "$COUNT_FILE" 2>/dev/null || echo 0)
[ "$count" -lt "$MAX_RESEARCH_CALLS" ] || passthrough
echo $((count + 1)) > "$COUNT_FILE"

title=$(printf '%s' "$event_json" | jq -r '.title')
summary=$(printf '%s' "$event_json" | jq -r '.summary')
initial_confidence=$(printf '%s' "$event_json" | jq -r '.confidence // 0.7')

RESEARCH_QUERY="Verify this OSINT event from the last hour. Event: $title. Details: $summary. Search only sources from the last few hours."

research_result=$(curl -s --max-time 30 https://api.perplexity.ai/chat/completions \
  -H "Authorization: Bearer $PERPLEXITY_API_KEY" \
  -H "Content-Type: application/json" \
  -d "$(jq -n \
    --arg model "$PPLX_MODEL" \
    --arg content "$RESEARCH_QUERY" \
    --arg recency "hour" \
    '{model: $model, search_recency_filter: $recency, messages: [{role: "user", content: $content}]}')" \
  | jq -r '.choices[0].message.content // "Research unavailable"')

adj=0
echo "$research_result" | grep -qi "confirmed\|verified\|corroborated" && adj=$(echo "$adj + 0.1" | bc)
echo "$research_result" | grep -qi "contradicts\|disputed\|false" && adj=$(echo "$adj - 0.3" | bc)
echo "$research_result" | grep -qi "no information\|unconfirmed\|unable to verify" && adj=$(echo "$adj - 0.1" | bc)
source_count=$(echo "$research_result" | grep -oiE "(reuters|bbc|ap|cnn|nyt)" | sort -u | wc -l)
[ "$source_count" -ge 3 ] && adj=$(echo "$adj + 0.2" | bc)

final=$(echo "$initial_confidence + $adj" | bc)
(( $(echo "$final > 1.0" | bc -l) )) && final="1.0"
(( $(echo "$final < 0.0" | bc -l) )) && final="0.0"

confidence_section="\n\n## Confidence Assessment\n\nInitial: $initial_confidence | Adjustment: $adj | Final: $final\n\nResearch (500 chars): $(echo "$research_result" | head -c 500)..."
printf '%s' "$event_json" | jq -c --arg conf "$final" --arg section "$confidence_section" \
  '.confidence = ($conf | tonumber) | .contents += $section'
