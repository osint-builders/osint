#!/bin/bash
# Batch resize all images in a directory

if [ $# -lt 2 ]; then
    echo "Usage: $0 <pattern> <geometry> [quality]"
    echo ""
    echo "Examples:"
    echo "  $0 '*.jpg' '800x600'"
    echo "  $0 '*.png' 'x480' 90"
    echo "  $0 '*.jpg' '50%' 85"
    exit 1
fi

PATTERN="$1"
GEOMETRY="$2"
QUALITY="${3:-85}"
OUTPUT_DIR="resized"

# Check if any files match
if ! ls $PATTERN 1>/dev/null 2>&1; then
    echo "Error: No files matching pattern: $PATTERN"
    exit 1
fi

mkdir -p "$OUTPUT_DIR"

echo "Resizing files matching '$PATTERN' to $GEOMETRY..."
echo "Output directory: $OUTPUT_DIR"

COUNT=0
for img in $PATTERN; do
    [ -f "$img" ] || continue
    echo "  Processing: $img"
    magick "$img" -resize "$GEOMETRY" -quality "$QUALITY" -strip "$OUTPUT_DIR/$img"
    COUNT=$((COUNT + 1))
done

if [ $COUNT -gt 0 ]; then
    echo "Done! Processed $COUNT images"
    ls -lh "$OUTPUT_DIR"
else
    echo "No files processed"
    exit 1
fi
