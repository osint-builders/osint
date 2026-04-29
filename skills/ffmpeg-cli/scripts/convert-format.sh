#!/bin/bash
# Convert between formats with optional re-encoding

if [ $# -lt 3 ]; then
    echo "Usage: $0 <input> <output-format> <quality>"
    echo "  quality: fast, medium, slow (for re-encoding)"
    echo ""
    echo "Examples:"
    echo "  $0 input.mp4 mkv copy        # MP4 to MKV (no re-encoding)"
    echo "  $0 input.mp4 mkv medium      # MP4 to MKV (re-encode, medium quality)"
    echo "  $0 video.mov mp4 slow        # MOV to MP4 (slow, high quality)"
    exit 1
fi

INPUT="$1"
FORMAT="$2"
QUALITY="${3:-copy}"

# Validate input file
if [ ! -f "$INPUT" ]; then
    echo "Error: Input file not found: $INPUT"
    exit 1
fi

# Generate output filename
BASENAME="${INPUT%.*}"
OUTPUT="${BASENAME}.${FORMAT}"

# Map quality to preset
case "$QUALITY" in
    copy)
        echo "Remuxing to $FORMAT (no re-encoding)..."
        ffmpeg -i "$INPUT" -c copy "$OUTPUT"
        ;;
    fast)
        echo "Converting to $FORMAT (fast, lower quality)..."
        ffmpeg -i "$INPUT" -c:v libx264 -preset ultrafast -crf 28 -c:a aac "$OUTPUT"
        ;;
    medium)
        echo "Converting to $FORMAT (medium quality)..."
        ffmpeg -i "$INPUT" -c:v libx264 -preset medium -crf 23 -c:a aac "$OUTPUT"
        ;;
    slow)
        echo "Converting to $FORMAT (slow, high quality)..."
        ffmpeg -i "$INPUT" -c:v libx264 -preset slow -crf 18 -c:a aac "$OUTPUT"
        ;;
    *)
        echo "Unknown quality: $QUALITY (use: copy, fast, medium, slow)"
        exit 1
        ;;
esac

if [ $? -eq 0 ]; then
    echo "Done! Output: $OUTPUT"
else
    echo "Conversion failed!"
    exit 1
fi
