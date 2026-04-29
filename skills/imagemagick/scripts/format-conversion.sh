#!/bin/bash
# Convert images between formats

if [ $# -lt 2 ]; then
    echo "Usage: $0 <input> <output-format> [quality]"
    echo ""
    echo "Examples:"
    echo "  $0 input.png jpg"
    echo "  $0 input.jpg webp 85"
    echo "  $0 image.png jpg 90"
    exit 1
fi

INPUT="$1"
FORMAT="$2"
QUALITY="${3:-85}"

if [ ! -f "$INPUT" ]; then
    echo "Error: Input file not found: $INPUT"
    exit 1
fi

BASENAME="${INPUT%.*}"
OUTPUT="${BASENAME}.${FORMAT}"

echo "Converting $INPUT to $FORMAT (quality: $QUALITY)..."
magick "$INPUT" -quality "$QUALITY" -strip "$OUTPUT"

if [ $? -eq 0 ]; then
    echo "Done! Output: $OUTPUT"
    ls -lh "$OUTPUT"
else
    echo "Conversion failed!"
    exit 1
fi
