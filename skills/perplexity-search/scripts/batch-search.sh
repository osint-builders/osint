#!/bin/bash
# Batch search multiple queries

if [ $# -lt 1 ]; then
    echo "Usage: $0 <queries_file> [mode] [delay_seconds]"
    echo ""
    echo "queries_file: One query per line"
    echo "mode: ask, search, research, reason, deep (default: search)"
    echo "delay_seconds: Delay between requests (default: 1)"
    echo ""
    echo "Example queries_file:"
    echo "  What is Python?"
    echo "  How to use async/await?"
    echo "  Best practices for microservices?"
    echo ""
    echo "Usage:"
    echo "  $0 queries.txt"
    echo "  $0 queries.txt search 2"
    echo "  $0 queries.txt research 1"
    exit 1
fi

QUERIES_FILE="$1"
MODE="${2:-search}"
DELAY="${3:-1}"

if [ ! -f "$QUERIES_FILE" ]; then
    echo "Error: Queries file not found: $QUERIES_FILE"
    exit 1
fi

echo "Batch searching with mode: $MODE, delay: ${DELAY}s"
echo ""

COUNT=0
while read -r query; do
    [ -z "$query" ] && continue
    
    COUNT=$((COUNT + 1))
    echo "[$COUNT] $query"
    
    node ../../bin/perplexity/cli.js --$MODE "$query"
    echo ""
    
    sleep "$DELAY"
done < "$QUERIES_FILE"

echo "Done! Processed $COUNT queries"
