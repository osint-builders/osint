#!/bin/bash
# Quick research workflow

if [ $# -lt 1 ]; then
    echo "Usage: $0 <topic> [mode]"
    echo ""
    echo "Modes: ask, search, research, reason, deep (default: research)"
    echo ""
    echo "Examples:"
    echo "  $0 'Python async/await'"
    echo "  $0 'GraphQL vs REST' reason"
    echo "  $0 'AI observability 2025' deep"
    exit 1
fi

TOPIC="$1"
MODE="${2:-research}"

echo "Researching: $TOPIC (mode: $MODE)"
echo "---"

node ../../bin/perplexity/cli.js --$MODE "$TOPIC"
