#!/bin/bash
# Extract audio and resize video separately

if [ $# -lt 2 ]; then
    echo "Usage: $0 <input> <width> [height]"
    echo ""
    echo "Examples:"
    echo "  $0 video.mp4 1920              # Resize to 1920px wide, auto height"
    echo "  $0 video.mp4 1080 1920         # Resize to 1080x1920 with letterbox"
    exit 1
fi

INPUT="$1"
WIDTH="$2"
HEIGHT="${3:-$WIDTH}"  # Default height to width for square
BASENAME="${INPUT%.*}"

if [ ! -f "$INPUT" ]; then
    echo "Error: Input file not found: $INPUT"
    exit 1
fi

# Extract audio
echo "Extracting audio..."
ffmpeg -i "$INPUT" -vn -acodec libmp3lame -ab 192k "${BASENAME}-audio.mp3"

# Resize video with letterbox
echo "Resizing video to ${WIDTH}x${HEIGHT}..."
ffmpeg -i "$INPUT" \
  -vf "scale=w=${WIDTH}:h=${HEIGHT}:force_original_aspect_ratio=decrease,pad=${WIDTH}:${HEIGHT}:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1:1" \
  -c:v libx264 \
  -crf 23 \
  -c:a aac \
  "${BASENAME}-resized.mp4"

if [ $? -eq 0 ]; then
    echo "Done!"
    echo "  Audio: ${BASENAME}-audio.mp3"
    echo "  Video: ${BASENAME}-resized.mp4"
fi
