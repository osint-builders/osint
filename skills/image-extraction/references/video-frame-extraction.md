# Video Frame Extraction

## Use Cases
- Video cover frames
- Representative stills
- Preview images

## Extraction Methods
- FFmpeg frame extraction: `-vframes 1`
- agent-browser video element screenshot
- Thumbnail extraction from video metadata

## Timing Strategy
- **5 seconds**: safe default (past intros)
- **Beginning** (0s): for short videos
- **Middle**: calculate 50% of duration
- **End**: final frame for conclusions

## Examples

```bash
# Extract frame at 5 seconds
ffmpeg -i video.mp4 -ss 00:00:05 -vframes 1 /tmp/frame.jpg

# Extract middle frame (calculate duration first)
DURATION=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 video.mp4)
MID=$(echo "$DURATION / 2" | bc)
ffmpeg -i video.mp4 -ss "$MID" -vframes 1 /tmp/frame.jpg
```

## Full Video → 720x720 PNG Pipeline

```bash
# 1. Download or reference video
VIDEO_URL="https://example.com/video.mp4"
curl -o /tmp/video.mp4 "$VIDEO_URL"

# 2. Extract frame at 5 seconds (safe default past intros)
ffmpeg -i /tmp/video.mp4 -ss 00:00:05 -vframes 1 /tmp/video_frame.jpg

# 3. Process to 720x720 PNG
magick /tmp/video_frame.jpg \
  -resize 720x720^ \
  -gravity center \
  -extent 720x720 \
  +repage \
  -strip \
  -define png:compression-level=9 \
  evt_20260429_001_img1.png

# 4. Update event entity
jq '.image_urls += ["./media/2026-04/images/2026-04-29/evt_20260429_001_img1.png"]' event.json > event.json.tmp && mv event.json.tmp event.json

# 5. Cleanup
rm /tmp/video.mp4 /tmp/video_frame.jpg
```

## Parallel FFmpeg Extraction

```bash
# Extract frames from multiple videos in parallel
for video in /tmp/videos/*.mp4; do
  BASENAME=$(basename "$video" .mp4)
  ffmpeg -i "$video" -ss 00:00:05 -vframes 1 "/tmp/frames/${BASENAME}.jpg" &
done
wait  # Wait for all FFmpeg jobs to complete

# Then process frames to PNG
for frame in /tmp/frames/*.jpg; do
  BASENAME=$(basename "$frame" .jpg)
  magick "$frame" \
    -resize 720x720^ \
    -gravity center \
    -extent 720x720 \
    +repage \
    -strip \
    -define png:compression-level=9 \
    "/tmp/processed/${BASENAME}.png"
done
```

## Tips
- Test extraction timing — 5 seconds is safe default; try beginning, middle, end for best frame.
- Avoid black frames or transitions.
