---
name: image-extraction
description: Extract, process, and normalize images from any data source for world event entities. Find images in social media, webpages, videos, and interactive content. Normalize to 720x720 PNG format with compression. Handle multiple images per event. Supports ImageMagick processing, FFmpeg video extraction, and agent-browser screenshots.
license: MIT
compatibility: Requires ImageMagick CLI and FFmpeg CLI installed globally. Works on macOS, Linux, Windows.
metadata:
  author: osint-builders
  version: "1.0.0"
  depends-on:
    - imagemagick
    - ffmpeg-cli
    - agent-browser
---

# Image Extraction Skill

Comprehensive workflow for extracting, processing, and normalizing images from any data source for world event entities. Standardizes all images to 720×720 PNG format with compression, handles multiple images per event, and supports extraction from social media, webpages, videos, and interactive content.

## Overview

### Purpose
Extract and normalize images for world event entities following a consistent, reproducible workflow. Every image undergoes standardized processing to ensure uniform dimensions, format, and quality across all data sources.

### Target Specifications
- **Format**: PNG only
- **Dimensions**: 720×720 pixels (1:1 aspect ratio)
- **Quality**: SD (Standard Definition), compressed/optimized
- **Compression**: PNG compression level 9 (maximum)
- **Metadata**: Stripped (no EXIF data)

### Handles
- Multiple images per event (up to 3-5 recommended)
- Various source types (social media, web, video, interactive)
- Video frame extraction
- Web screenshot capture
- Batch processing

## Core Workflow

### Step-by-Step Process

1. **Identify image sources** in data
   - Social media attached media
   - Webpage hero images or thumbnails
   - Video files requiring frame extraction
   - Interactive content requiring screenshots

2. **Extract/download images**
   - Direct URL download with curl
   - API media URLs
   - FFmpeg video frame extraction
   - agent-browser screenshots

3. **Process videos to extract frames**
   - Extract representative frame (5s, middle, or cover)
   - Convert to static image format

4. **Normalize dimensions**
   - Crop to 1:1 aspect ratio (center crop)
   - Resize to 720×720 pixels
   - Reset virtual canvas

5. **Convert to PNG with compression**
   - Strip metadata
   - Apply PNG compression level 9
   - Optimize file size

6. **Save with standardized naming**
   - Format: `{event_id}_img{N}.png`
   - Sequential numbering (img1, img2, img3...)

7. **Update event entity's image_urls array**
   - Add relative paths to JSON
   - Follow storage path convention

## Image Source Types

### Social Media Images

**Twitter/X**:
- Attached media (photos, videos)
- Profile images
- Quoted tweet images
- Card images

**Extraction Methods**:
- API response: Extract from `media_url` field
- Direct download: `curl -o image.jpg "$media_url"`
- Embedded images: Use agent-browser if not in API

**Example**:
```bash
# From Twitter API response
IMAGE_URL=$(echo "$TWEET_JSON" | jq -r '.entities.media[0].media_url')
curl -o /tmp/tweet_img.jpg "$IMAGE_URL"
```

### Webpage Images

**Types**:
- **Hero images**: Primary visual at top of article
- **Thumbnails**: Preview images in listings
- **Content images**: Inline images within article body
- **Open Graph images**: `<meta property="og:image">`

**Extraction Methods**:
- Direct URL: `curl` download if accessible
- CSS selectors: Target specific image elements
- agent-browser: Screenshot for embedded/protected images

**Example**:
```bash
# Extract og:image URL
OG_IMAGE=$(curl -s "$URL" | grep -oP '(?<=og:image" content=")[^"]+')
curl -o /tmp/hero.jpg "$OG_IMAGE"

# Or screenshot specific element
agent-browser open "$URL"
agent-browser snapshot -i  # Find image ref
agent-browser screenshot --element @e1 /tmp/hero.png
```

### Video Thumbnails

**Use Cases**:
- Video cover frames
- Representative stills
- Preview images

**Extraction Methods**:
- FFmpeg frame extraction: `-vframes 1`
- agent-browser video element screenshot
- Thumbnail extraction from video metadata

**Timing Strategy**:
- **5 seconds**: Safe default (past intros)
- **Beginning** (0s): For short videos
- **Middle**: Calculate 50% of duration
- **End**: Final frame for conclusions

**Example**:
```bash
# Extract frame at 5 seconds
ffmpeg -i video.mp4 -ss 00:00:05 -vframes 1 /tmp/frame.jpg

# Extract middle frame (calculate duration first)
DURATION=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 video.mp4)
MID=$(echo "$DURATION / 2" | bc)
ffmpeg -i video.mp4 -ss "$MID" -vframes 1 /tmp/frame.jpg
```

### Interactive/Embedded Media

**Types**:
- iframe content (maps, charts, embeds)
- Map screenshots
- Chart/visualization captures
- Dashboard screenshots

**Extraction Method**:
- agent-browser screenshot with element selector
- Wait for content to load before capturing

**Example**:
```bash
# Screenshot embedded map
agent-browser open "$URL"
agent-browser wait --selector ".map-container"
agent-browser wait --timeout 3000  # Additional load time
agent-browser screenshot --selector ".map-container" /tmp/map.png
```

## Image Processing Pipeline

### Complete Pipeline

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

### Pipeline Breakdown

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
# Center crop to square (fills frame, may crop edges)
magick source_image.jpg \
  -resize 720x720^ \
  -gravity center \
  -extent 720x720 \
  +repage \
  cropped.jpg
```

**Explanation**:
- `-resize 720x720^`: Fill entire 720×720 area (may exceed on one dimension)
- `-gravity center`: Use center point as anchor
- `-extent 720x720`: Crop to exact 720×720 dimensions
- `+repage`: Reset virtual canvas (prevents offset issues)

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
# Convert to PNG, strip metadata, optimize
magick normalized.jpg \
  -strip \
  -define png:compression-level=9 \
  final.png
```

**Explanation**:
- `-strip`: Remove all EXIF and metadata
- `-define png:compression-level=9`: Maximum PNG compression (0-9, 9 is smallest)

**Step 5: Standardized Naming**
```bash
# Format: {event_id}_img{N}.png
# Examples:
#   evt_20260429_001_img1.png  (primary image)
#   evt_20260429_001_img2.png  (additional context)
#   evt_20260429_001_img3.png  (additional context)
```

## Complete Examples

### Example 1: Single Image from Social Media Post

```bash
# 1. Extract image URL from Twitter API response
IMAGE_URL="https://pbs.twimg.com/media/abc123.jpg"

# 2. Download
curl -o /tmp/raw_img.jpg "$IMAGE_URL"

# 3. Process to 720x720 PNG (all-in-one)
magick /tmp/raw_img.jpg \
  -resize 720x720^ \
  -gravity center \
  -extent 720x720 \
  +repage \
  -strip \
  -define png:compression-level=9 \
  evt_20260429_001_img1.png

# 4. Update event entity
jq '.image_urls += ["./media/2026-04/images/2026-04-29/evt_20260429_001_img1.png"]' event.json > event.json.tmp && mv event.json.tmp event.json
```

### Example 2: Multiple Images from Webpage

```bash
# 1. Open webpage with agent-browser
agent-browser open https://example.com/article

# 2. Get snapshot to find image elements
agent-browser snapshot -i
# Output shows: image [ref=e1], image [ref=e2], image [ref=e3]

# 3. Screenshot each image
agent-browser screenshot --element @e1 /tmp/img1.png
agent-browser screenshot --element @e2 /tmp/img2.png
agent-browser screenshot --element @e3 /tmp/img3.png

# 4. Process batch
for i in 1 2 3; do
  magick /tmp/img${i}.png \
    -resize 720x720^ \
    -gravity center \
    -extent 720x720 \
    +repage \
    -strip \
    -define png:compression-level=9 \
    evt_20260429_001_img${i}.png
done

# 5. Update event entity
jq '.image_urls += [
  "./media/2026-04/images/2026-04-29/evt_20260429_001_img1.png",
  "./media/2026-04/images/2026-04-29/evt_20260429_001_img2.png",
  "./media/2026-04/images/2026-04-29/evt_20260429_001_img3.png"
]' event.json > event.json.tmp && mv event.json.tmp event.json
```

### Example 3: Video Cover Frame Extraction

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

### Example 4: Embedded Map Screenshot

```bash
# 1. Open page with embedded map
agent-browser open https://example.com/map-page

# 2. Wait for map to load
agent-browser wait --selector ".map-container"
agent-browser wait --timeout 3000  # Additional time for tiles to load

# 3. Screenshot map element
agent-browser screenshot --selector ".map-container" /tmp/map.png

# 4. Process to 720x720 PNG
magick /tmp/map.png \
  -resize 720x720^ \
  -gravity center \
  -extent 720x720 \
  +repage \
  -strip \
  -define png:compression-level=9 \
  evt_20260429_001_img1.png

# 5. Cleanup
rm /tmp/map.png
```

### Example 5: Batch Processing Multiple Events

```bash
# Process directory of raw images
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

## Decision Tree: Which Extraction Method?

```
What type of image source?
│
├─ Social Media API (Twitter/X, etc.)
│  └─ Use direct media_url from API response
│     └─ Method: curl download
│     └─ Example: curl -o img.jpg "$media_url"
│
├─ Webpage with <img> tags
│  ├─ Image URL accessible directly?
│  │  └─ Method: curl download
│  │  └─ Example: curl -o img.jpg "$image_src"
│  │
│  └─ Image embedded/protected?
│     └─ Method: agent-browser screenshot --element
│     └─ Example: agent-browser screenshot --element @e1 img.png
│
├─ Video file (.mp4, .mov, .webm)
│  ├─ Video accessible for download?
│  │  └─ Method: FFmpeg frame extraction
│  │  └─ Example: ffmpeg -i video.mp4 -ss 00:00:05 -vframes 1 frame.jpg
│  │
│  └─ Video embedded in page (can't download)?
│     └─ Method: agent-browser screenshot of video element
│     └─ Example: agent-browser screenshot --element @video img.png
│
├─ Interactive content (maps, charts, iframes)
│  └─ Method: agent-browser screenshot with selector
│  └─ Example: agent-browser screenshot --selector ".map" img.png
│
└─ Thumbnail/preview in listing
   ├─ meta[property="og:image"] URL available?
   │  └─ Method: curl download
   │  └─ Example: curl -o img.jpg "$og_image_url"
   │
   └─ CSS selector available?
      └─ Method: agent-browser screenshot --element
      └─ Example: agent-browser screenshot --element @e1 img.png
```

## Quality Guidelines

### Image Selection Priority

When multiple images available (e.g., article with many photos):

1. **Primary content image** (REQUIRED)
   - Most relevant to event
   - Hero image or main visual
   - Captures essence of event

2. **Additional context images** (OPTIONAL, up to 3 total recommended)
   - Supporting visuals
   - Different perspectives
   - Key details

3. **Avoid duplicates**
   - Don't include same image multiple times
   - Skip variations of same shot

4. **Avoid low-quality**
   - Skip heavily compressed images
   - Skip watermarked images (unless only option)
   - Skip pixelated or low-resolution (<300px)
   - Skip placeholder images and icons

### Processing Quality Standards

- **Compression level**: 9 (maximum PNG compression)
- **Strip metadata**: Always use `-strip` to remove EXIF
- **Aspect ratio**: Always crop to 1:1 (center crop preserves main subject)
- **Color space**: Maintain RGB (don't convert to grayscale)
- **File size target**: <500KB per image (typically 100-300KB with compression)

### Quality Checks

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

## Storage Path Convention

### Directory Structure

Follow the established media storage structure:

```
data/media/
└── YYYY-MM/              # Year-month folder
    └── images/           # Images subfolder
        └── YYYY-MM-DD/   # Date folder
            ├── evt_YYYYMMDD_001_img1.png
            ├── evt_YYYYMMDD_001_img2.png
            ├── evt_YYYYMMDD_002_img1.png
            ├── evt_YYYYMMDD_002_img2.png
            └── ...
```

**Example paths**:
```
data/media/2026-04/images/2026-04-29/evt_20260429_001_img1.png
data/media/2026-04/images/2026-04-29/evt_20260429_001_img2.png
data/media/2026-04/images/2026-04-30/evt_20260430_001_img1.png
```

### Relative Paths in Event Entity

Store as relative paths in the `image_urls` array:

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

**Rules**:
- Use event ID as prefix
- Sequential numbering: img1, img2, img3...
- First image (img1) is always primary/hero image
- PNG extension (lowercase)

**Examples**:
```
evt_20260429_001_img1.png  ✓ Primary image
evt_20260429_001_img2.png  ✓ Additional context
evt_20260429_001_img3.png  ✓ Additional context
evt_20260429_001_image1.png  ✗ Wrong (use "img" not "image")
evt_20260429_001_1.png  ✗ Wrong (missing "img" prefix)
```

## Error Handling

### Common Issues and Solutions

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

### Validation Workflow

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

### Graceful Degradation

**Primary image fails**:
```bash
# Try to extract at least one image
if ! process_primary_image; then
  echo "WARNING: Primary image extraction failed" >&2
  # Try alternative sources
  if process_alternative_image; then
    echo "INFO: Using alternative as primary image"
  else
    echo "WARNING: No images available for event" >&2
    # Continue processing event without images
    # Don't fail entire event
  fi
fi
```

**Multiple images, some fail**:
```bash
# Process each image independently
SUCCESS_COUNT=0
for img_url in "${IMAGE_URLS[@]}"; do
  if process_image "$img_url"; then
    ((SUCCESS_COUNT++))
  else
    echo "WARNING: Failed to process $img_url" >&2
    # Continue to next image
  fi
done

echo "Processed $SUCCESS_COUNT of ${#IMAGE_URLS[@]} images"
```

## Integration with Collection Workflow

### In builder/index.ts Prompt

**Location**: Step 3: Process Each Source Sequentially

**Add sub-step** (after item 5, before item 7):

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

1. **Always center crop**
   - Preserves main subject when converting to 1:1 ratio
   - Use `-gravity center` to anchor crop

2. **Test extraction before batch**
   - Verify one image processes correctly
   - Check dimensions, format, file size
   - Then process remaining images

3. **Limit images per event**
   - 3-5 images maximum
   - First image is primary (most important)
   - Additional images provide context only

4. **Use temporary directory**
   - Process in /tmp for performance
   - Move to final location only after validation
   - Clean up /tmp files after processing

5. **Validate before saving**
   - Use `identify` to confirm dimensions (720x720)
   - Check format is PNG
   - Verify file size is reasonable (<500KB)

6. **Clean up temporary files**
   - Remove /tmp files after processing
   - Don't accumulate large temp files
   - Use `trap` for cleanup on error

7. **Handle missing images gracefully**
   - Don't fail entire event if one image unavailable
   - Log warnings, continue processing
   - Empty `image_urls` array is acceptable if no images available

8. **Preserve aspect ratio context**
   - Center crop maintains main subject
   - For non-square originals, crop from center
   - Avoid stretching/distorting images

9. **Test video extraction timing**
   - 5 seconds is safe default (past intros)
   - Try beginning, middle, end for best frame
   - Avoid black frames or transitions

10. **Batch with care**
    - Limit parallel processing (4 concurrent max)
    - Watch memory usage for large images
    - Use ImageMagick memory limits if needed

## Performance Optimization

### Batch Processing

```bash
# Process multiple images in parallel (limit to 4 concurrent)
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

### Memory Limits (for large source images)

```bash
# Limit ImageMagick memory usage
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

### Parallel FFmpeg Extraction

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

### Cleanup with Trap

```bash
#!/bin/bash

# Ensure cleanup on exit
trap 'rm -rf /tmp/image_work_$$' EXIT

# Create work directory
WORK_DIR="/tmp/image_work_$$"
mkdir -p "$WORK_DIR"

# Process images
# ... (processing code)

# Cleanup happens automatically via trap on exit
```

## Related Skills

See also:
- **imagemagick** (`skills/imagemagick/SKILL.md`) - Core image processing reference, effects, transformations
- **ffmpeg-cli** (`skills/ffmpeg-cli/SKILL.md`) - Video frame extraction, thumbnail generation, video processing
- **agent-browser** (`skills/agent-browser/SKILL.md`) - Web screenshot capture, element selection, page automation
- **world-event-entities** (`skills/world-event-entities/SKILL.md`) - Entity schema specification, `image_urls` field definition

## References

- ImageMagick Documentation: https://imagemagick.org
- ImageMagick Resize: https://imagemagick.org/Usage/resize/
- FFmpeg Documentation: https://ffmpeg.org/documentation.html
- agent-browser: https://github.com/vercel-labs/agent-browser
- PNG Specification: http://www.libpng.org/pub/png/spec/
