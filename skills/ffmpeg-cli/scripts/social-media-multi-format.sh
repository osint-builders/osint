#!/bin/bash
# Create multiple formats from one video (YouTube + TikTok)

if [ $# -lt 1 ]; then
    echo "Usage: $0 <input> [logo]"
    echo ""
    echo "Creates:"
    echo "  - YouTube format (1920x1080)"
    echo "  - TikTok format (720x1280 with optional logo)"
    echo ""
    echo "Examples:"
    echo "  $0 video.mp4"
    echo "  $0 video.mp4 logo.png"
    exit 1
fi

INPUT="$1"
LOGO="${2:-}"
BASENAME="${INPUT%.*}"

if [ ! -f "$INPUT" ]; then
    echo "Error: Input file not found: $INPUT"
    exit 1
fi

if [ -n "$LOGO" ] && [ ! -f "$LOGO" ]; then
    echo "Error: Logo file not found: $LOGO"
    exit 1
fi

echo "Processing video: $INPUT"

if [ -z "$LOGO" ]; then
    # Without logo
    echo "Creating YouTube (1920x1080) and TikTok (720x1280) versions..."
    ffmpeg -i "$INPUT" \
      -filter_complex "[0:v]split=2[s0][s1]; \
        [s0]scale=w=1920:h=1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1:1[out1]; \
        [s1]scale=w=720:h=1280:force_original_aspect_ratio=decrease,pad=720:1280:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1:1[out2]" \
      -map [out1] -map 0:a -c:v libx264 -crf 23 -c:a aac "${BASENAME}-youtube.mp4" \
      -map [out2] -map 0:a -c:v libx264 -crf 23 -c:a aac "${BASENAME}-tiktok.mp4"
else
    # With logo overlay
    echo "Creating formats with logo overlay..."
    ffmpeg -i "$INPUT" -i "$LOGO" \
      -filter_complex "[0:v]split=2[s0][s1]; \
        [s0]scale=w=1920:h=1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1:1[out1]; \
        [s1]scale=w=720:h=1280:force_original_aspect_ratio=decrease,pad=720:1280:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1:1[s2]; \
        [s2][1]overlay=(main_w-overlay_w)/2:(main_h-overlay_h)/5[out2]" \
      -map [out1] -map 0:a -c:v libx264 -crf 23 -c:a aac "${BASENAME}-youtube.mp4" \
      -map [out2] -map 0:a -c:v libx264 -crf 23 -c:a aac "${BASENAME}-tiktok.mp4"
fi

if [ $? -eq 0 ]; then
    echo "Done!"
    echo "  YouTube: ${BASENAME}-youtube.mp4 (1920x1080)"
    echo "  TikTok:  ${BASENAME}-tiktok.mp4 (720x1280)"
    echo ""
    ls -lh "${BASENAME}"*.mp4
fi
