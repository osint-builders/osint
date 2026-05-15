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

# Image Extraction

Extract + normalize images → 720×720 PNG for world event entities. Sources: social media, webpage hero, video frames, embedded content.

## When to use

- `image_urls` needs populating.
- Source has raw images (media URLs, og:image, article hero).
- Source has video needing a still frame.
- Embedded/protected content needs screenshot (maps, charts, iframes).
- Batch ≤5 images per event.

## Entry-point commands

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

Source extractor:

```bash
# curl (direct URL)
curl -o /tmp/source.jpg "$IMAGE_URL"

# ffmpeg (video frame, 5s default)
ffmpeg -i /tmp/video.mp4 -ss 00:00:05 -vframes 1 /tmp/source.jpg

# agent-browser (embedded/protected)
agent-browser open "$URL"
agent-browser wait --selector ".target"
agent-browser screenshot --selector ".target" /tmp/source.png
```

Verify:
```bash
identify -format "%w x %h | %m | %b\n" OUTPUT.png   # expect: 720 x 720 | PNG | <500KB
```

Full variations: `references/processing-pipeline.md`.

## Required output

- **Format**: 720×720 PNG, metadata stripped, compression 9.
- **Naming**: `{event_id}_img{N}.png`; `img1` = primary. Lowercase.
- **Count**: ≤5/event (first = primary).
- **Path**: `data/media/YYYY-MM/images/YYYY-MM-DD/{event_id}_imgN.png`.
- **`image_urls`**: `["./media/YYYY-MM/images/YYYY-MM-DD/{event_id}_imgN.png"]`.
- **Size**: <500KB (typ. 100–300KB).

## Pitfalls

- **`+repage` after `-extent`** — without it, virtual canvas offset breaks viewers.
- **`-strip` always** — EXIF leaks location data, inflates size.
- **`mogrify` overwrites** input — use `magick IN … OUT.png` to preserve source.
- **Frame timing**: 5s default (skips intros); short clips → 0s; long → middle (`ffprobe` dur/2). Avoid transitions.
- **Never fail event on bad image** — skip, log warning, continue. Empty `image_urls` valid.
- **Screenshots**: `--selector` wait + `--timeout` for charts/tiles; retry once before fallback.
- **"not authorized"** → `policy.xml` blocks format (PDF/SVG); convert first.
- **No `-resize 720x720!`** on non-square — stretches. Use `^` + center + `-extent`.

## See also

- `references/social-media-sources.md` — Twitter/X media, og:image, extraction decision tree.
- `references/video-frame-extraction.md` — ffmpeg timing, parallel extraction, video→PNG pipeline.
- `references/processing-pipeline.md` — magick variations, batch/memory limits, error tables.
- `references/agent-browser-screenshots.md` — interactive/embedded media, batch screenshots.
- Sibling skills: `imagemagick`, `ffmpeg-cli`, `agent-browser`, `world-event-entities`.
