#!/bin/bash
# Basic workflow: navigate, snapshot, interact, screenshot

# Configuration
URL="https://example.com"
OUTPUT_DIR="./output"

mkdir -p "$OUTPUT_DIR"

echo "1. Navigate to URL..."
agent-browser open "$URL"

echo "2. Get page snapshot..."
agent-browser snapshot -i > "$OUTPUT_DIR/snapshot.txt"

echo "3. Take screenshot..."
agent-browser screenshot "$OUTPUT_DIR/page.png"

echo "4. Get page title..."
TITLE=$(agent-browser get title)
echo "Page title: $TITLE"

echo "5. Extract all links..."
agent-browser eval "return document.querySelectorAll('a').map(a => a.href).filter(href => href.startsWith('http'))" > "$OUTPUT_DIR/links.txt"

echo "6. Close browser..."
agent-browser close

echo "Done! Output saved to $OUTPUT_DIR/"
