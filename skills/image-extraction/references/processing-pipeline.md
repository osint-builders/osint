# Image Processing Pipeline (Deep Reference)

## Target Specifications
- **Format**: PNG only
- **Dimensions**: 720×720 pixels (1:1 aspect ratio)
- **Quality**: SD, compressed/optimized
- **Compression**: PNG compression level 9 (maximum)
- **Metadata**: Stripped (no EXIF data)
- **File size target**: <500KB per image (typically 100-300KB)

## Complete Pipeline

```bash
# 1. Download/Extract Image
curl -o /tmp/source.jpg "https://example.com/image.jpg"
# OR: ffmpeg -i video.mp4 -ss 00:00:05 -vframes 1 /tmp/source.jpg
# OR: agent-browser screenshot --element @e1 /tmp/source.png

# 2. Process to 720x720 PNG (all-in-one command)
magick /tmp/source.jpg \
  -resize 720x720^ \
  -gravity center \
  -extent 720x720 \
  +repage \
  -strip \
  -define png:compression-level=9 \
  /tmp/output.png

# 3. Verify output
identify -format "%w x %h | %m | %b\n" /tmp/output.png
# Expected: 720 x 720 | PNG | <500KB

# 4. Move to final location
mv /tmp/output.png data/media/2026-04/images/2026-04-29/evt_20260429_001_img1.png
```

## Pipeline Breakdown

**Step 1: Download/Extract Image**
```bash
# Direct download
curl -o source_image.jpg "https://example.com/image.jpg"

# OR extract from video
ffmpeg -i video.mp4 -ss 00:00:05 -vframes 1 source_image.jpg

# OR screenshot with agent-browser
agent-browser screenshot --selector "@e1" source_image.png
```

**Step 2: Crop to 1:1 Aspect Ratio**
```bash
magick source_image.jpg \
  -resize 720x720^ \
  -gravity center \
  -extent 720x720 \
  +repage \
  cropped.jpg
```

Explanation:
- `-resize 720x720^`: fill entire 720×720 area (may exceed on one dimension)
- `-gravity center`: use center point as anchor
- `-extent 720x720`: crop to exact 720×720 dimensions
- `+repage`: reset virtual canvas (prevents offset issues)

**Step 3: Resize to 720×720**
```bash
# If already square, just resize
magick source_image.jpg -resize 720x720! resized.jpg

# OR combined crop + resize (most common - use this)
magick source_image.jpg \
  -resize 720x720^ \
  -gravity center \
  -extent 720x720 \
  +repage \
  normalized.jpg
```

**Step 4: Convert to PNG with Compression**
```bash
magick normalized.jpg \
  -strip \
  -define png:compression-level=9 \
  final.png
```
- `-strip`: remove all EXIF and metadata
- `-define png:compression-level=9`: maximum PNG compression (0-9)

**Step 5: Standardized Naming**
```
evt_20260429_001_img1.png  (primary image)
evt_20260429_001_img2.png  (additional context)
evt_20260429_001_img3.png  (additional context)
```

## Storage Path Convention

```
data/media/
└── YYYY-MM/              # Year-month folder
    └── images/           # Images subfolder
        └── YYYY-MM-DD/   # Date folder
            ├── evt_YYYYMMDD_001_img1.png
            ├── evt_YYYYMMDD_001_img2.png
            ├── evt_YYYYMMDD_002_img1.png
            └── ...
```

Example paths:
```
data/media/2026-04/images/2026-04-29/evt_20260429_001_img1.png
data/media/2026-04/images/2026-04-29/evt_20260429_001_img2.png
data/media/2026-04/images/2026-04-30/evt_20260430_001_img1.png
```

### Relative Paths in Event Entity

```json
{
  "id": "evt_20260429_001",
  "image_urls": [
    "./media/2026-04/images/2026-04-29/evt_20260429_001_img1.png",
    "./media/2026-04/images/2026-04-29/evt_20260429_001_img2.png"
  ]
}
```

### Naming Convention

**Format**: `{event_id}_img{N}.png`
- Use event ID as prefix
- Sequential numbering: img1, img2, img3...
- First image (img1) is always primary/hero image
- PNG extension (lowercase)

Examples:
```
evt_20260429_001_img1.png  ✓ Primary image
evt_20260429_001_img2.png  ✓ Additional context
evt_20260429_001_image1.png  ✗ Wrong (use "img" not "image")
evt_20260429_001_1.png  ✗ Wrong (missing "img" prefix)
```

## Complete Examples

### Example 1: Single Image from Social Media Post

```bash
IMAGE_URL="https://pbs.twimg.com/media/abc123.jpg"
curl -o /tmp/raw_img.jpg "$IMAGE_URL"

magick /tmp/raw_img.jpg \
  -resize 720x720^ \
  -gravity center \
  -extent 720x720 \
  +repage \
  -strip \
  -define png:compression-level=9 \
  evt_20260429_001_img1.png

jq '.image_urls += ["./media/2026-04/images/2026-04-29/evt_20260429_001_img1.png"]' event.json > event.json.tmp && mv event.json.tmp event.json
```

### Example 2: Batch Processing Multiple Events

```bash
mkdir -p /tmp/processed

for img in /tmp/raw_images/*.{jpg,jpeg,png}; do
  [ -e "$img" ] || continue
  BASENAME=$(basename "$img" | sed 's/\.[^.]*$//')

  magick "$img" \
    -resize 720x720^ \
    -gravity center \
    -extent 720x720 \
    +repage \
    -strip \
    -define png:compression-level=9 \
    "/tmp/processed/${BASENAME}.png"
done

echo "Processed $(ls /tmp/processed/*.png | wc -l) images"
```

### Example 3: Parallel Batch (4 concurrent)

```bash
find /tmp/raw_images -name "*.jpg" -print0 | \
  xargs -0 -P 4 -I {} sh -c '
    BASENAME=$(basename "{}" .jpg)
    magick "{}" \
      -resize 720x720^ \
      -gravity center \
      -extent 720x720 \
      +repage \
      -strip \
      -define png:compression-level=9 \
      "/tmp/processed/${BASENAME}.png"
  '
```

## Memory Limits (large source images)

```bash
magick -limit memory 512MB -limit map 1GB \
  large_image.jpg \
  -resize 720x720^ \
  -gravity center \
  -extent 720x720 \
  +repage \
  -strip \
  -define png:compression-level=9 \
  output.png
```

## Quality Checks

```bash
# Verify dimensions and format
identify -format "%w x %h | %m\n" image.png
# Expected output: 720 x 720 | PNG

# Check file size
du -h image.png
# Expected: <500KB

# Verify PNG compression
identify -verbose image.png | grep -i compression
# Should show: Compression: Zip (or similar)

# Check if metadata stripped
identify -verbose image.png | grep -i exif
# Should return nothing (no EXIF data)
```

## Error Handling

| Issue | Solution |
|-------|----------|
| Image download fails (404, 403) | Log error, skip image, continue processing other images. Don't fail entire event. |
| Video extraction fails | Try alternative timestamp (0s, middle, end). If all fail, skip video frame. |
| ImageMagick "not authorized" | Check ImageMagick policy.xml. May need to enable PDF/SVG. Try different format. |
| Image too small (<100px) | Skip and log as insufficient quality. Mark in event notes if primary image affected. |
| Image is placeholder/icon | Detect by size (<50px) or URL pattern (/placeholder/, /icon/). Skip. |
| Agent-browser screenshot fails | Retry once with increased wait time. If still fails, try alternative method or skip. |
| Out of memory (large image) | Use ImageMagick memory limits: `-limit memory 512MB -limit map 1GB` |
| Corrupt image file | Catch with `identify` test. Skip if corrupt. Log error. |

## Validation Workflow

```bash
# Pre-processing validation
if [ ! -f "/tmp/source.jpg" ]; then
  echo "ERROR: Source image not found" >&2
  exit 1
fi

# Test if image is valid before processing
if ! identify /tmp/source.jpg >/dev/null 2>&1; then
  echo "ERROR: Corrupt or invalid image file" >&2
  exit 1
fi

# Process image
magick /tmp/source.jpg \
  -resize 720x720^ \
  -gravity center \
  -extent 720x720 \
  +repage \
  -strip \
  -define png:compression-level=9 \
  /tmp/output.png

# Post-processing validation
if ! identify /tmp/output.png >/dev/null 2>&1; then
  echo "ERROR: Image processing failed" >&2
  exit 1
fi

DIMENSIONS=$(identify -format "%w x %h" /tmp/output.png)
if [ "$DIMENSIONS" != "720 x 720" ]; then
  echo "ERROR: Incorrect dimensions: $DIMENSIONS" >&2
  exit 1
fi

echo "✓ Image validated: 720x720 PNG"
```

## Graceful Degradation

**Primary image fails**:
```bash
if ! process_primary_image; then
  echo "WARNING: Primary image extraction failed" >&2
  if process_alternative_image; then
    echo "INFO: Using alternative as primary image"
  else
    echo "WARNING: No images available for event" >&2
    # Continue processing event without images
  fi
fi
```

**Multiple images, some fail**:
```bash
SUCCESS_COUNT=0
for img_url in "${IMAGE_URLS[@]}"; do
  if process_image "$img_url"; then
    ((SUCCESS_COUNT++))
  else
    echo "WARNING: Failed to process $img_url" >&2
  fi
done

echo "Processed $SUCCESS_COUNT of ${#IMAGE_URLS[@]} images"
```

## Cleanup with Trap

```bash
#!/bin/bash
trap 'rm -rf /tmp/image_work_$$' EXIT

WORK_DIR="/tmp/image_work_$$"
mkdir -p "$WORK_DIR"

# Process images
# ... (processing code)

# Cleanup happens automatically via trap on exit
```

## Integration with Collection Workflow

### In builder/index.ts Prompt

Location: Step 3: Process Each Source Sequentially. Add sub-step (after item 5, before item 7):

```markdown
6. **Extract and process media** using `skills/image-extraction/SKILL.md`:
   - Identify all images in source data (social media attachments, webpage hero images, video thumbnails)
   - Download/screenshot using appropriate method:
     * Social media: Direct API media_url download
     * Webpages: curl for direct URLs, agent-browser for protected images
     * Videos: FFmpeg frame extraction at 5 seconds
     * Interactive: agent-browser screenshot with wait for load
   - Process each image to 720x720 PNG:
     * `magick image -resize 720x720^ -gravity center -extent 720x720 +repage -strip -define png:compression-level=9 output.png`
   - Save to `$WORK_DIR/{source_id}/media/images/{event_id}_img{N}.png`
   - Update `image_urls` array with relative paths: `./media/YYYY-MM/images/YYYY-MM-DD/{event_id}_img{N}.png`
   - Limit to 3-5 images per event (first is primary)
   - Handle failures gracefully (skip image, continue event processing)
```

### Usage in Collection Scripts

```bash
# In collection workflow after extracting event data

# 1. Extract images from source data
IMAGE_URLS=($(echo "$EVENT_DATA" | jq -r '.media[]'))

# 2. Process each image
mkdir -p "$WORK_DIR/$SOURCE_ID/media/images"
IMG_COUNT=0

for img_url in "${IMAGE_URLS[@]}"; do
  ((IMG_COUNT++))
  [ $IMG_COUNT -gt 5 ] && break  # Limit to 5 images max

  # Download
  curl -o "/tmp/raw_${IMG_COUNT}.jpg" "$img_url" 2>/dev/null || continue

  # Process
  magick "/tmp/raw_${IMG_COUNT}.jpg" \
    -resize 720x720^ \
    -gravity center \
    -extent 720x720 \
    +repage \
    -strip \
    -define png:compression-level=9 \
    "$WORK_DIR/$SOURCE_ID/media/images/${EVENT_ID}_img${IMG_COUNT}.png"

  # Update event JSON
  jq --arg path "./media/$YEAR_MONTH/images/$DATE/${EVENT_ID}_img${IMG_COUNT}.png" \
    '.image_urls += [$path]' event.json > event.json.tmp && mv event.json.tmp event.json
done
```

## Best Practices

1. **Always center crop** — preserves main subject when converting to 1:1 ratio. Use `-gravity center` to anchor.
2. **Test extraction before batch** — verify one image processes correctly first.
3. **Limit images per event** — 3-5 max, first is primary.
4. **Use temporary directory** — process in /tmp; move to final location after validation; clean up.
5. **Validate before saving** — `identify` confirms 720x720 PNG.
6. **Clean up temporary files** — use `trap` for cleanup on error.
7. **Handle missing images gracefully** — empty `image_urls` array is acceptable.
8. **Preserve aspect ratio context** — center crop maintains main subject; avoid stretching.
9. **Test video extraction timing** — 5s default; try beginning/middle/end.
10. **Batch with care** — limit parallel (4 concurrent max); watch memory.

## References

- ImageMagick Documentation: https://imagemagick.org
- ImageMagick Resize: https://imagemagick.org/Usage/resize/
- FFmpeg Documentation: https://ffmpeg.org/documentation.html
- agent-browser: https://github.com/vercel-labs/agent-browser
- PNG Specification: http://www.libpng.org/pub/png/spec/
