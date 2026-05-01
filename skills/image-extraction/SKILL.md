---
name: image-extraction
description: Extract, process, and normalize images from any data source for world event entities. Find images in social media, webpages, videos, and interactive content. Normalize to 720x720 PNG format with compression. Handle multiple images per event. Supports ImageMagick processing, FFmpeg video extraction, and agent-browser screenshots.
license: MIT
compatibility: linux (warp-cloud-agent-env-image)
metadata:
  author: osint-builders
  version: "2.0.0"
  depends-on:
    - imagemagick
    - ffmpeg-cli
    - agent-browser
---

# Image Extraction Skill

Extract, process, and normalize images for world event entities into a uniform 720×720 PNG format. Supports social-media attachments, webpage hero images, video frames, and interactive/embedded content. Every image flows through the same ImageMagick normalization pipeline so output is reproducible across sources.

## When to use
- An event entity needs `image_urls` populated.
- A source provides raw images (social-media media URLs, og:image, article hero, thumbnail listings).
- A source provides a video and a representative still frame is needed.
- Visual content is embedded/protected and must be screenshotted (maps, charts, iframes).
- Multiple images must be batch-processed for a single event (≤ 3-5 per event).

## Entry-point commands

Canonical normalization pipeline (apply to every extracted image):

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

Plug in the source-appropriate extractor before the pipeline:

```bash
# curl (direct URL: API media_url, og:image, article <img src>)
curl -o /tmp/source.jpg "$IMAGE_URL"

# ffmpeg (video frame, 5s default past intros)
ffmpeg -i /tmp/video.mp4 -ss 00:00:05 -vframes 1 /tmp/source.jpg

# agent-browser (embedded/protected/interactive content)
agent-browser open "$URL"
agent-browser wait --selector ".target"
agent-browser screenshot --selector ".target" /tmp/source.png
```

Verify after processing:
```bash
identify -format "%w x %h | %m | %b\n" OUTPUT.png   # expect: 720 x 720 | PNG | <500KB
```

For the full extractor variations, batch loops, parallel/memory-limit forms, validation wrappers, and graceful-degradation patterns, see `references/processing-pipeline.md`.

## Required output

- **Format**: PNG, 720×720, stripped of metadata, PNG compression level 9.
- **Naming**: `{event_id}_img{N}.png` — sequential, `img1` is primary/hero. Lowercase `.png`.
- **Count**: 3-5 images per event maximum (first is primary; rest provide context).
- **On-disk path**: `data/media/YYYY-MM/images/YYYY-MM-DD/{event_id}_imgN.png`.
- **Entity field**: append relative paths to `image_urls`:
  ```json
  "image_urls": [
    "./media/2026-04/images/2026-04-29/evt_20260429_001_img1.png",
    "./media/2026-04/images/2026-04-29/evt_20260429_001_img2.png"
  ]
  ```
- File size target: <500KB per image (typically 100-300KB).

## Pitfalls

- **`+repage` is required after `-extent`**. Without it, ImageMagick keeps a virtual canvas offset that breaks downstream operations and viewers.
- **Always `-strip` metadata.** EXIF can leak source/location data and inflates file size.
- **`mogrify` overwrites the input by default** — prefer `magick INPUT … OUTPUT.png` so the source is preserved while iterating.
- **Video frame timing matters.** 5s is the safe default to skip intros/black frames; for short clips fall back to 0s; for long clips use middle (`ffprobe` duration / 2). Avoid transitions.
- **Don't fail the whole event on one bad image.** Skip the image, log a warning, continue. Empty `image_urls` is valid.
- **agent-browser screenshots need a wait.** Combine `--selector` wait with an extra `--timeout` for tile/chart rendering, then retry once before falling back.
- **ImageMagick "not authorized"** errors mean `policy.xml` is blocking a format (often PDF/SVG); convert to a permitted format first.
- **Center-crop preserves the subject**; never use `-resize 720x720!` (force) on non-square sources — it stretches.

## See also

- `references/social-media-sources.md` — Twitter/X media URLs, og:image extraction, decision tree for picking an extraction method, image-selection priority.
- `references/video-frame-extraction.md` — ffmpeg/ffprobe timing strategies, parallel frame extraction, full video→PNG pipeline.
- `references/processing-pipeline.md` — every variation of the magick pipeline, batch/parallel processing, memory limits, validation, error-handling tables, graceful degradation, builder/index.ts integration snippet.
- `references/agent-browser-screenshots.md` — interactive/embedded media (maps, charts, iframes), multi-image batch screenshots.
- Sibling skills: `skills/imagemagick/SKILL.md`, `skills/ffmpeg-cli/SKILL.md`, `skills/agent-browser/SKILL.md`, `skills/world-event-entities/SKILL.md`.
