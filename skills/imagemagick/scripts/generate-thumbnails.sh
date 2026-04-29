#!/bin/bash
# Generate thumbnails from images

if [ $# -lt 2 ]; then
    echo "Usage: $0 <input> <size> [type]"
    echo ""
    echo "Types:"
    echo "  square    - Square thumbnail (default)"
    echo "  circular  - Circular avatar with transparency"
    echo ""
    echo "Examples:"
    echo "  $0 photo.jpg 200"
    echo "  $0 photo.jpg 200 square"
    echo "  $0 photo.jpg 200 circular"
    exit 1
fi

INPUT="$1"
SIZE="$2"
TYPE="${3:-square}"

if [ ! -f "$INPUT" ]; then
    echo "Error: Input file not found: $INPUT"
    exit 1
fi

BASENAME="${INPUT%.*}"
EXT="${INPUT##*.}"

case "$TYPE" in
    square)
        OUTPUT="${BASENAME}-thumb-${SIZE}.${EXT}"
        echo "Creating ${SIZE}x${SIZE} square thumbnail..."
        magick "$INPUT" -resize ${SIZE}x${SIZE}^ -gravity center -extent ${SIZE}x${SIZE} \
            -quality 90 "$OUTPUT"
        ;;
    circular)
        OUTPUT="${BASENAME}-avatar-${SIZE}.png"
        echo "Creating ${SIZE}x${SIZE} circular avatar..."
        magick "$INPUT" -resize ${SIZE}x${SIZE}^ -gravity center -extent ${SIZE}x${SIZE} \
            \( +clone -threshold -1 -negate -fill white \
            -draw "circle ${SIZE_HALF},${SIZE_HALF} ${SIZE_HALF},0" \) \
            -alpha off -compose copy_opacity -composite "$OUTPUT"
        ;;
    *)
        echo "Unknown type: $TYPE"
        exit 1
        ;;
esac

if [ $? -eq 0 ]; then
    echo "Done! Output: $OUTPUT"
    ls -lh "$OUTPUT"
fi
