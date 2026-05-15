---
name: ffmpeg-cli
description: FFmpeg CLI for media processing and transformation. Convert video formats, resize and pad, extract audio, trim by time, generate thumbnails, create slideshows, overlay graphics, burn subtitles, and more. Use for video manipulation, media encoding, content creation, and OSINT media analysis.
license: GPL-2.0
compatibility: linux (warp-cloud-agent-env-image)
metadata:
  author: osint-builders
  version: "1.0.0"
  provider: ffmpeg
  upstream: "https://ffmpeg.org"
---

# FFmpeg CLI

FFmpeg media processing. OSINT: frame extraction + container remux.

## When to use

Video frame extraction, format conversion, audio extraction, thumbnail generation, media inspection.

## Entry-point Commands

```bash
# Inspect streams
ffprobe -show_streams -i input.mp4

# Extract frame at 5s (safe default — skips intros/black frames)
ffmpeg -i input.mp4 -ss 00:00:05 -vframes 1 frame.jpg

# Remux without re-encoding (fast)
ffmpeg -i input.mp4 -c copy output.mkv

# Extract audio as MP3
ffmpeg -i video.mp4 -vn -acodec libmp3lame -ab 192k audio.mp3

# Trim (10s to 25s)
ffmpeg -i input.mp4 -ss 00:00:10 -to 00:00:25 output.mp4

# Scale with aspect ratio + black padding (720x720)
ffmpeg -i input.mp4 \
  -vf "scale=w=720:h=720:force_original_aspect_ratio=decrease,pad=720:720:(ow-iw)/2:(oh-ih)/2:color=black" \
  output.mp4

# Multiple frames (1 per second)
ffmpeg -i video.mp4 -vf fps=1 frame_%03d.png
```

Common flags: `-y` (overwrite), `-hide_banner` (suppress banner), `-c copy` (remux, no re-encode).

## Pitfalls

- `-ss` before `-i` → fast seek (less accurate); `-ss` after `-i` → frame-accurate (slower).
- Short clips: use `0s` frame offset; long clips: use middle (`ffprobe` duration ÷ 2). Avoid transitions.
- `-c copy` cannot change codec — containers must support the source codec.
- "Unknown encoder" → codec not compiled in; check `ffmpeg -codecs`.

## See also

- `references/REFERENCE.md` — full command reference, audio processing, advanced editing, asset generation
- `skills/image-extraction/SKILL.md` — full video→720×720 PNG pipeline
- `skills/imagemagick/SKILL.md` — post-process extracted frames
- FFmpeg docs: https://ffmpeg.org/documentation.html
