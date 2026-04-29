#!/bin/bash
# Generate thumbnails from video

if [ $# -lt 2 ]; then
    echo "Usage: $0 <input> <type> [count]"
    echo ""
    echo "Types:"
    echo "  single         - Single thumbnail at 5 seconds"
    echo "  fps <rate>     - Frame per second (e.g., fps 1)"
    echo "  interval <sec> - One frame every N seconds"
    echo "  scenes         - Detect scene cuts"
    echo ""
    echo "Examples:"
    echo "  $0 video.mp4 single"
    echo "  $0 video.mp4 fps 2"
    echo "  $0 video.mp4 interval 10"
    echo "  $0 video.mp4 scenes"
    exit 1
fi

INPUT="$1"
TYPE="$2"
PARAM="${3:-1}"
BASENAME="${INPUT%.*}"
OUTPUT_DIR="thumbnails"

if [ ! -f "$INPUT" ]; then
    echo "Error: Input file not found: $INPUT"
    exit 1
fi

mkdir -p "$OUTPUT_DIR"

case "$TYPE" in
    single)
        echo "Extracting single thumbnail at 5 seconds..."
        ffmpeg -i "$INPUT" -ss 00:00:05 -vframes 1 "$OUTPUT_DIR/thumbnail.png"
        ;;
    fps)
        echo "Extracting frames at $PARAM fps..."
        ffmpeg -i "$INPUT" -vf "fps=$PARAM" "$OUTPUT_DIR/frame_%03d.png"
        ;;
    interval)
        echo "Extracting frames every $PARAM seconds..."
        ffmpeg -i "$INPUT" -vf "fps=1/$PARAM" "$OUTPUT_DIR/frame_%03d.png"
        ;;
    scenes)
        echo "Extracting scene cuts..."
        ffmpeg -i "$INPUT" -vf "select='gt(scene\,0.4)',scale=320:-1" -vsync 0 "$OUTPUT_DIR/scene_%03d.png"
        ;;
    *)
        echo "Unknown type: $TYPE"
        exit 1
        ;;
esac

if [ $? -eq 0 ]; then
    echo "Done! Thumbnails saved to: $OUTPUT_DIR/"
    ls -lh "$OUTPUT_DIR/"
fi
