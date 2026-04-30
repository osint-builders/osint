---
name: ffmpeg-cli
description: FFmpeg CLI for media processing and transformation. Convert video formats, resize and pad, extract audio, trim by time, generate thumbnails, create slideshows, overlay graphics, burn subtitles, and more. Use for video manipulation, media encoding, content creation, and OSINT media analysis.
license: GPL-2.0
compatibility: Requires ffmpeg CLI installed globally. Works on macOS, Linux, Windows. Install via Homebrew, apt-get, or download from ffmpeg.org.
metadata:
  author: osint-builders
  version: "1.0.0"
  provider: ffmpeg
  upstream: "https://ffmpeg.org"
---

# FFmpeg CLI Skill

Comprehensive media processing and transformation using FFmpeg. Convert formats, encode videos, extract audio, manipulate dimensions, generate thumbnails, overlay graphics, and perform complex media workflows.

## Key Capabilities

### Format Conversion
- Remux between containers (MP4 ↔ MKV, MOV, AVI)
- Re-encode with different codecs
- Audio extraction and processing
- Format verification

### Resizing & Scaling
- Scale to target dimensions with aspect ratio preservation
- Add padding (letterbox, pillarbox)
- Force dimension divisibility
- Aspect ratio correction

### Trimming & Cutting
- Trim by time range
- Frame-accurate cutting
- Fast seeking vs accurate seeking

### Data Extraction
- Stream inspection with ffprobe
- Format and codec detection
- Metadata extraction
- Verification (faststart, moov atom position)

### Advanced Editing
- Playback speed adjustment
- FPS changes
- Video cropping for social media
- Multiple video scaling (YouTube + TikTok from single source)
- Logo and image overlays
- Concatenation (intro/main/outro)

### Content Generation
- Image sequences to video
- Slideshows with fade transitions
- Ken Burns effect (zoompan)
- GIF generation
- Thumbnail extraction (single/multiple/scene-based)
- Storyboards and keyframe grids

### Audio Processing
- Audio extraction and replacement
- Mix multiple audio tracks
- Crossfading and normalization
- Format conversion

## Installation

### macOS
```bash
brew install ffmpeg
```

### Linux (Debian/Ubuntu)
```bash
sudo apt-get install ffmpeg
```

### Linux (RedHat/CentOS)
```bash
sudo yum install ffmpeg
```

### Windows
```bash
scoop install ffmpeg
# or
choco install ffmpeg
```

### Verify Installation
```bash
ffmpeg -version
ffprobe -version
```

## Quick Start Examples

### Convert Format (Remux)
```bash
# MP4 to MKV (no re-encoding, fast)
ffmpeg -i input.mp4 -c copy output.mkv

# MP4 to MOV
ffmpeg -i input.mp4 -c copy output.mov
```

### Resize with Letterbox
```bash
# Scale to 1080x1920 with black padding
ffmpeg -i input.mp4 -vf "scale=w=1080:h=1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1:1" output.mp4
```

### Extract Audio
```bash
# Extract as MP3
ffmpeg -i video.mp4 -vn -acodec libmp3lame -ab 192k audio.mp3

# Extract as AAC
ffmpeg -i video.mp4 -vn -acodec aac audio.aac
```

### Trim Video
```bash
# Trim from 10s to 25s
ffmpeg -i input.mp4 -ss 00:00:10 -to 00:00:25 output.mp4
```

### Generate Thumbnail
```bash
# Single thumbnail at 5 seconds
ffmpeg -i video.mp4 -ss 00:00:05 -vframes 1 thumbnail.png

# Multiple frames (1 per second)
ffmpeg -i video.mp4 -vf fps=1 frame_%03d.png
```

### Adjust Playback Speed
```bash
# 1.5x speed
ffmpeg -i input.mp4 -filter:v "setpts=0.667*PTS" output.mp4

# 0.5x speed (slow motion)
ffmpeg -i input.mp4 -filter:v "setpts=2*PTS" output.mp4
```

### Add Logo Overlay
```bash
# Overlay logo at top-left
ffmpeg -i video.mp4 -i logo.png -filter_complex "overlay=10:10" output.mp4

# Centered overlay
ffmpeg -i video.mp4 -i logo.png -filter_complex "overlay=(main_w-overlay_w)/2:(main_h-overlay_h)/2" output.mp4
```

### Create Video from Images
```bash
# Create 30fps video from PNG sequence
ffmpeg -framerate 30 -i frame_%03d.png -c:v libx264 -pix_fmt yuv420p output.mp4
```

### Concatenate Multiple Videos
```bash
# Create concat list file (concat.txt)
# file 'intro.mp4'
# file 'main.mp4'
# file 'outro.mp4'

ffmpeg -f concat -safe 0 -i concat.txt -c copy output.mp4
```

## Core Commands

### Basic Usage
```bash
ffmpeg -i input.mp4 output.mp4           # Convert/re-encode
ffmpeg -i input.mp4 -c copy output.mkv   # Remux (no re-encoding)
ffmpeg -i input.mp4 -y output.mp4        # Overwrite without prompting
```

### Video Filters
```bash
-vf <filter>              # Video filter (alias: -filter:v)
-af <filter>              # Audio filter (alias: -filter:a)
-filter_complex <graph>   # Complex multi-stream filter
```

### Stream Selection
```bash
[0]          # All streams from first input
[0:v]        # Video stream from first input
[0:a]        # Audio stream from first input
[0:v:0]      # First video stream of first input
[0:a:1]      # Second audio stream of first input
-map [name]  # Select named stream for output
```

### Codecs
```bash
-c <codec>              # Codec for all streams
-c:v <codec>            # Video codec
-c:a <codec>            # Audio codec
-c copy                 # Copy streams without re-encoding (remux)
```

### Quality & Bitrate
```bash
-crf <value>            # H264/H265 constant rate factor (0-51, lower=better)
-b:v <bitrate>          # Video bitrate (e.g., 5000k)
-b:a <bitrate>          # Audio bitrate (e.g., 192k)
```

### Inspection
```bash
ffmpeg -formats         # List supported formats
ffmpeg -codecs          # List supported codecs
ffprobe -show_streams -i input.mp4  # Detailed stream info
```

## Common Workflows

### YouTube Preparation
```bash
# Encode for YouTube (1080p, H264)
ffmpeg -i input.mp4 \
  -c:v libx264 \
  -crf 18 \
  -preset slow \
  -scale=1920:1080 \
  -pix_fmt yuv420p \
  -movflags +faststart \
  output.mp4
```

### Social Media (Multi-Format)
```bash
# Create both landscape (YouTube) and portrait (TikTok) from one source
ffmpeg -i input.mp4 -i logo.png \
  -filter_complex "[0:v]split=2[s0][s1]; \
    [s0]scale=w=1920:h=1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1:1[out1]; \
    [s1]scale=w=720:h=1280:force_original_aspect_ratio=decrease,pad=720:1280:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1:1[s2]; \
    [s2][1]overlay=(main_w-overlay_w)/2:(main_h-overlay_h)/5[out2]" \
  -map [out1] -map 0:a output_youtube.mp4 \
  -map [out2] -map 0:a output_tiktok.mp4
```

### GIF Generation
```bash
# Create GIF from video (10s to 20s, 10fps)
ffmpeg -i input.mp4 -ss 00:00:10 -to 00:00:20 -vf "fps=10,scale=1280:-1" output.gif
```

### Slideshow with Fade
```bash
# Create slideshow from images with 2s per image + 1s fade
ffmpeg -framerate 1/3 -i image_%03d.png \
  -vf "fade=t=in:st=0:d=1,fade=t=out:st=2:d=1" \
  -c:v libx264 -pix_fmt yuv420p output.mp4
```

### Subtitle Burning
```bash
# Burn subtitles into video
ffmpeg -i video.mp4 -vf "subtitles=subs.srt" output.mp4
```

## Environment Variables

```bash
# Specify FFmpeg binary path
export FFMPEG_PATH=/path/to/ffmpeg

# Optimize for specific hardware
export FFMPEG_HWACCEL=cuda    # NVIDIA GPU
export FFMPEG_HWACCEL=qsv     # Intel QuickSync
export FFMPEG_HWACCEL=videotoolbox  # macOS Metal
```

## Key Glossary

| Term | Meaning |
|------|---------|
| **Remux** | Copy streams between containers without re-encoding (fast) |
| **Transcode** | Re-encode streams with new codec (slower, can adjust quality) |
| **Codec** | Compression algorithm (H264, H265, VP9, AV1) |
| **Container** | File format (MP4, MKV, MOV, AVI, WebM) |
| **CRF** | Constant Rate Factor (0-51 for H264/H265, lower=better quality) |
| **Bitrate** | Data rate (kbps, Mbps) - higher=better quality but larger file |
| **Aspect Ratio** | Width:Height ratio (16:9, 4:3, 1:1) |
| **Letterbox** | Black bars on sides when scaling preserves aspect ratio |
| **Pillarbox** | Black bars on top/bottom when scaling preserves aspect ratio |

## Best Practices

1. **Verify Before Processing** — Use `ffprobe` to inspect streams
2. **Remux When Possible** — Use `-c copy` to avoid re-encoding
3. **Preserve Aspect Ratio** — Use `force_original_aspect_ratio` when scaling
4. **Test Quality Settings** — Start with CRF 18-23 for H264
5. **Add Faststart** — Use `-movflags +faststart` for web playback
6. **Name Output Clearly** — Include format/resolution in filename
7. **Log Output** — Redirect stderr for troubleshooting: `2>log.txt`

## Error Handling

- **"Unknown encoder"** — Codec not compiled in. Check with `ffmpeg -codecs`
- **"Input/output error"** — File permissions or format issues. Verify with `ffprobe`
- **Seek errors** — Use `-ss` before `-i` for faster seeking (less accurate)
- **Quality loss** — Check CRF value and codec settings

## Related Tools & Skills

### Skills
- **imagemagick** - Process extracted frames, generate thumbnails
- **agent-browser** - Record browser sessions, capture web media
- **remember-as-you-go** - Capture codec issues, container constraints, format-specific quirks

### System CLIs
- `ffprobe` - Inspect media metadata (included with FFmpeg)
- `yt-dlp` - Download videos from web sources
- `mediainfo` - Alternative media inspection
- `sox` - Audio processing and effects

### Integration Hints
```bash
# Extract frames → Process → Montage pipeline
ffmpeg -i video.mp4 -vf fps=1 frame_%03d.png
mogrify -path processed/ -resize 800x600 frame_*.png
montage processed/*.png -geometry 200x200+2+2 contact-sheet.jpg

# Download → Process → Thumbnail
yt-dlp -o video.mp4 "https://example.com/video"
ffmpeg -i video.mp4 -vf scale=1920:1080 processed.mp4
ffmpeg -i processed.mp4 -ss 00:00:05 -vframes 1 thumbnail.png
```

## References

- See [REFERENCE.md](references/REFERENCE.md) for complete command reference
- See [references/core-concepts.md](references/core-concepts.md) for `-c copy` details, encoding, GPU acceleration
- See [references/audio-processing.md](references/audio-processing.md) for audio workflows
- See [references/advanced-editing.md](references/advanced-editing.md) for complex edits
- See [references/asset-generation.md](references/asset-generation.md) for generation workflows
- See [scripts/](scripts/) for workflow examples
- FFmpeg Documentation: https://ffmpeg.org/documentation.html
- FFprobe: https://ffmpeg.org/ffprobe.html
