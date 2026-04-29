#!/bin/bash
# Apply visual effects to images

if [ $# -lt 2 ]; then
    echo "Usage: $0 <input> <effect> [strength]"
    echo ""
    echo "Effects:"
    echo "  blur [radius]           Gaussian blur (default: 0x8)"
    echo "  sharpen [strength]      Sharpen (default: 0x1)"
    echo "  grayscale               Grayscale conversion"
    echo "  sepia [strength]        Sepia tone (default: 80%)"
    echo "  edge [radius]           Edge detection (default: 3)"
    echo "  emboss [radius]         Emboss effect (default: 2)"
    echo "  oil-paint [radius]      Oil painting effect (default: 4)"
    echo "  charcoal [radius]       Charcoal drawing (default: 2)"
    echo "  negate                  Invert colors"
    echo ""
    echo "Examples:"
    echo "  $0 photo.jpg blur"
    echo "  $0 photo.jpg blur 0x4"
    echo "  $0 photo.jpg sepia 60%"
    echo "  $0 photo.jpg edge 5"
    exit 1
fi

INPUT="$1"
EFFECT="$2"
PARAM="${3:-default}"

if [ ! -f "$INPUT" ]; then
    echo "Error: Input file not found: $INPUT"
    exit 1
fi

BASENAME="${INPUT%.*}"
EXT="${INPUT##*.}"

case "$EFFECT" in
    blur)
        STRENGTH="${PARAM:-0x8}"
        OUTPUT="${BASENAME}-blur.${EXT}"
        echo "Applying blur effect (radius: $STRENGTH)..."
        magick "$INPUT" -blur "$STRENGTH" "$OUTPUT"
        ;;
    sharpen)
        STRENGTH="${PARAM:-0x1}"
        OUTPUT="${BASENAME}-sharp.${EXT}"
        echo "Applying sharpen effect (strength: $STRENGTH)..."
        magick "$INPUT" -sharpen "$STRENGTH" "$OUTPUT"
        ;;
    grayscale)
        OUTPUT="${BASENAME}-gray.${EXT}"
        echo "Converting to grayscale..."
        magick "$INPUT" -colorspace Gray "$OUTPUT"
        ;;
    sepia)
        STRENGTH="${PARAM:-80%}"
        OUTPUT="${BASENAME}-sepia.${EXT}"
        echo "Applying sepia tone (strength: $STRENGTH)..."
        magick "$INPUT" -sepia-tone "$STRENGTH" "$OUTPUT"
        ;;
    edge)
        RADIUS="${PARAM:-3}"
        OUTPUT="${BASENAME}-edge.${EXT}"
        echo "Applying edge detection (radius: $RADIUS)..."
        magick "$INPUT" -edge "$RADIUS" "$OUTPUT"
        ;;
    emboss)
        RADIUS="${PARAM:-2}"
        OUTPUT="${BASENAME}-emboss.${EXT}"
        echo "Applying emboss effect (radius: $RADIUS)..."
        magick "$INPUT" -emboss "$RADIUS" "$OUTPUT"
        ;;
    oil-paint)
        RADIUS="${PARAM:-4}"
        OUTPUT="${BASENAME}-oil.${EXT}"
        echo "Applying oil painting effect (radius: $RADIUS)..."
        magick "$INPUT" -paint "$RADIUS" "$OUTPUT"
        ;;
    charcoal)
        RADIUS="${PARAM:-2}"
        OUTPUT="${BASENAME}-charcoal.${EXT}"
        echo "Applying charcoal drawing effect (radius: $RADIUS)..."
        magick "$INPUT" -charcoal "$RADIUS" "$OUTPUT"
        ;;
    negate)
        OUTPUT="${BASENAME}-negate.${EXT}"
        echo "Inverting colors..."
        magick "$INPUT" -negate "$OUTPUT"
        ;;
    *)
        echo "Unknown effect: $EFFECT"
        exit 1
        ;;
esac

if [ $? -eq 0 ]; then
    echo "Done! Output: $OUTPUT"
    ls -lh "$OUTPUT"
fi
