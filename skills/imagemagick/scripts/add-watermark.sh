#!/bin/bash
# Add watermark to image

if [ $# -lt 2 ]; then
    echo "Usage: $0 <input> <watermark> [position]"
    echo ""
    echo "Positions:"
    echo "  northwest, north, northeast"
    echo "  west, center, east"
    echo "  southwest, south, southeast (default)"
    echo ""
    echo "Examples:"
    echo "  $0 photo.jpg logo.png"
    echo "  $0 photo.jpg logo.png southeast"
    echo "  $0 photo.jpg logo.png center"
    exit 1
fi

INPUT="$1"
WATERMARK="$2"
POSITION="${3:-southeast}"

if [ ! -f "$INPUT" ]; then
    echo "Error: Input file not found: $INPUT"
    exit 1
fi

if [ ! -f "$WATERMARK" ]; then
    echo "Error: Watermark file not found: $WATERMARK"
    exit 1
fi

BASENAME="${INPUT%.*}"
EXT="${INPUT##*.}"
OUTPUT="${BASENAME}-watermarked.${EXT}"

echo "Adding watermark to $INPUT..."
magick "$INPUT" "$WATERMARK" -gravity "$POSITION" -geometry +10+10 -composite "$OUTPUT"

if [ $? -eq 0 ]; then
    echo "Done! Output: $OUTPUT"
    ls -lh "$OUTPUT"
fi
