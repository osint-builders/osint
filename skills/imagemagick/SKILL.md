---
name: imagemagick
description: ImageMagick CLI for comprehensive image processing and manipulation. Convert formats, resize and crop, apply effects and filters, adjust colors, create thumbnails, batch process, composite images, add text and watermarks. Use for image transformation, media preparation, batch operations, and visual content processing.
license: Apache-2.0
compatibility: linux (warp-cloud-agent-env-image)
metadata:
  author: osint-builders
  version: "1.0.0"
  upstream: "https://imagemagick.org"
---

# ImageMagick CLI

Image processing. OSINT: normalize to 720×720 PNG.

## When to use

Format conversion, resize/crop, thumbnail generation, batch processing, metadata stripping, compositing.

## Entry-point Commands

Normalization pipeline (every image):

```bash
magick INPUT \
  -resize 720x720^ \
  -gravity center \
  -extent 720x720 \
  +repage \
  -strip \
  -define png:compression-level=9 \
  OUTPUT.png
```

Common operations:

```bash
# Format conversion
magick input.png output.jpg

# Resize (fit within, preserve aspect ratio)
magick input.jpg -resize 800x600 output.jpg

# Inspect dimensions + size
identify -format "%w x %h | %m | %b\n" image.png

# Strip metadata
magick input.jpg -strip output.jpg

# Batch in-place
mogrify -resize 800x600 *.jpg

# Batch to output dir (preserves originals)
mogrify -path ./resized -resize 720x720^ -gravity center -extent 720x720 +repage -strip *.jpg
```

Geometry: `100x100` fit, `100x100!` force (distorts), `100x100^` fill (crops), `50%` scale.

## Pitfalls

- `+repage` required after `-extent` — without it ImageMagick retains virtual canvas offset that breaks downstream tools.
- Always `-strip` — EXIF leaks source/location data and inflates file size.
- `mogrify` overwrites input in-place — use `-path ./out` to preserve originals.
- Never `-resize 720x720!` on non-square sources — it distorts. Use `^` + `-gravity center` + `-extent` instead.
- "not authorized" → `policy.xml` blocks format; check `identify -list policy`.

## See also

- `references/REFERENCE.md` — full command reference, effects, compositing, text overlays
- `skills/image-extraction/SKILL.md` — full extraction + normalization pipeline
- `skills/ffmpeg-cli/SKILL.md` — extract frames from video before processing
- ImageMagick docs: https://imagemagick.org/Usage/
