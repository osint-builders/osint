# FFmpeg Complete Reference

Comprehensive command reference and filter documentation.

## Core Concepts

### Remux vs Transcode
- **Remux** (`-c copy`): Copy streams as-is between containers. Fast, no quality loss.
- **Transcode**: Re-encode streams with new codec/settings. Slower, allows quality adjustment.

### Input/Output
```bash
ffmpeg -i input.mp4 -c copy output.mkv       # Remux
ffmpeg -i input.mp4 -c:v libx264 output.mp4  # Transcode
ffmpeg -i input.mp4 -y output.mp4            # Overwrite without prompt
```

### Stream Selection
```bash
[0]           # All streams from input 0
[0:v]         # Video stream from input 0
[0:a]         # Audio stream from input 0
[0:v:0]       # First video stream from input 0
[0:a:1]       # Second audio stream from input 0
-map [name]   # Select named stream for output
```

## Codecs

### Video Codecs
| Codec | Command | Notes |
|-------|---------|-------|
| H264 | `-c:v libx264` | Most compatible, good compression |
| H265 | `-c:v libx265` | Better compression, less compatible |
| VP9 | `-c:v libvpx-vp9` | Open source, WebM/MKV |
| AV1 | `-c:v libaom-av1` | Best compression, slow encoding |
| ProRes | `-c:v prores` | Professional editing, large files |

### Audio Codecs
| Codec | Command | Notes |
|-------|---------|-------|
| AAC | `-c:a aac` | Good quality, widely compatible |
| MP3 | `-c:a libmp3lame` | Universal, slightly worse quality |
| Opus | `-c:a libopus` | Modern, efficient, WebM/MKV |
| FLAC | `-c:a flac` | Lossless compression |
| PCM | `-c:a pcm_s16le` | Uncompressed, large files |

## Common Flags

### Seeking
```bash
-ss <time>              # Seek to time (before -i = input seeking, faster but less accurate)
-ss <time> -i input.mp4 # Input seeking (slow but accurate)
ffmpeg -ss 00:00:10 -i input.mp4 -t 00:00:10 output.mp4  # Trim 10-20s
```

### Quality
```bash
-crf <n>      # Constant Rate Factor (H264/H265): 0-51, default 23, lower=better
-preset <p>   # Encoding speed: ultrafast, superfast, veryfast, faster, fast, medium, slow, slower, veryslow
-b:v <rate>   # Video bitrate (e.g., 5000k, 2M)
-b:a <rate>   # Audio bitrate (e.g., 192k, 320k)
-q:v <n>      # Quality scale (0-51 for H264, lower=better)
```

### Pixel Format
```bash
-pix_fmt yuv420p      # YUV 4:2:0 (most compatible for H264)
-pix_fmt yuv422p      # YUV 4:2:2 (ProRes, some codecs)
-pix_fmt yuv444p      # YUV 4:4:4 (full color, larger file)
-pix_fmt rgb24        # RGB (usually for images)
```

### Container Options
```bash
-movflags +faststart  # Add moov atom at start (enable fast web playback)
-movflags frag_keyframe  # Fragmented MP4 (streaming)
```

## Filter Reference

### Scale
```bash
-vf "scale=w=1920:h=1080"                   # Fixed size
-vf "scale=w=1920:h=-1"                     # Auto height by aspect ratio
-vf "scale=w=1920:h=-2"                     # Auto height divisible by 2
-vf "scale=w=1280:h=-1:force_original_aspect_ratio=decrease"  # Fit in box

# With padding
-vf "scale=w=1920:h=1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1:1"
```

### Pad
```bash
-vf "pad=w:h:x:y:color"         # w=width, h=height, x=left, y=top
-vf "pad=1920:1080:0:0:black"   # 1920x1080, no offset, black
-vf "pad=1920:1080:(ow-iw)/2:(oh-ih)/2:black"  # Centered
```

### Crop
```bash
-vf "crop=w:h:x:y"              # w=width, h=height, x=left, y=top
-vf "crop=1280:720:0:0"         # 1280x720 from top-left
-vf "crop=iw:ih-40:0:0"         # Remove 40px from bottom
```

### FPS
```bash
-vf "fps=30"              # Target 30 fps
-vf "fps=1/3"             # 1 frame per 3 seconds
-vf "fps=24"              # Convert to 24 fps
```

### Speed
```bash
-filter:v "setpts=0.667*PTS"    # 1.5x speed (1/0.667 = 1.5)
-filter:v "setpts=0.5*PTS"      # 2x speed
-filter:v "setpts=2*PTS"        # 0.5x speed (slow motion)
```

### Fade
```bash
-vf "fade=t=in:st=0:d=1"           # Fade in at 0s for 1s
-vf "fade=t=out:st=9:d=1"          # Fade out at 9s for 1s
-vf "fade=t=in:st=0:d=1,fade=t=out:st=2:d=1"  # Fade in/out
```

### Overlay
```bash
-filter_complex "[0:v][1]overlay=10:10"                # At position 10,10
-filter_complex "[0:v][1]overlay=(main_w-overlay_w)/2:(main_h-overlay_h)/2"  # Centered
-filter_complex "[0:v][1]overlay=W-w:0"                # Top right
```

### Split (Multiple Outputs)
```bash
-filter_complex "[0:v]split=2[s0][s1]; [s0]scale=1920:1080[out0]; [s1]scale=720:1280[out1]" \
  -map [out0] -map 0:a output1.mp4 \
  -map [out1] -map 0:a output2.mp4
```

### Subtitle Burn
```bash
-vf "subtitles=input.srt"           # Burn subtitles
-vf "subtitles=input.srt:force_style='FontSize=20'"  # With style
```

### Concat
```bash
# Create concat.txt:
# file 'input1.mp4'
# file 'input2.mp4'
# file 'input3.mp4'

ffmpeg -f concat -safe 0 -i concat.txt -c copy output.mp4
```

## Example Commands

### Convert MP4 to MKV (Fast Remux)
```bash
ffmpeg -i input.mp4 -c copy output.mkv
```

### Convert with Quality Settings
```bash
ffmpeg -i input.mp4 -c:v libx264 -crf 18 -preset slow -c:a aac output.mp4
```

### Extract Audio as MP3
```bash
ffmpeg -i input.mp4 -vn -acodec libmp3lame -ab 192k output.mp3
```

### Trim Video
```bash
ffmpeg -i input.mp4 -ss 00:00:10 -to 00:00:30 -c copy output.mp4
```

### Scale with Letterbox
```bash
ffmpeg -i input.mp4 -vf "scale=w=1080:h=1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1:1" output.mp4
```

### Generate Thumbnail
```bash
ffmpeg -i video.mp4 -ss 00:00:05 -vframes 1 thumbnail.png
```

### Create GIF from Video
```bash
ffmpeg -i input.mp4 -vf "fps=10,scale=1280:-1" output.gif
```

### Speed Up Video
```bash
ffmpeg -i input.mp4 -filter:v "setpts=0.667*PTS" output.mp4
```

### Create Video from Images
```bash
ffmpeg -framerate 30 -i frame_%03d.png -c:v libx264 -pix_fmt yuv420p output.mp4
```

### YouTube Upload Preset
```bash
ffmpeg -i input.mp4 \
  -c:v libx264 \
  -crf 18 \
  -preset slow \
  -scale=1920:1080 \
  -pix_fmt yuv420p \
  -movflags +faststart \
  -c:a aac \
  output.mp4
```

## Inspection Commands

### ffmpeg
```bash
ffmpeg -formats              # List supported formats
ffmpeg -codecs               # List supported codecs
ffmpeg -filters              # List available filters
ffmpeg -i input.mp4          # Show stream info
ffmpeg -i input.mp4 -f null - # Analyze without output
```

### ffprobe
```bash
ffprobe -show_streams -i input.mp4              # Detailed stream info
ffprobe -show_format -i input.mp4               # Format info
ffprobe -v trace -i input.mp4 | grep moov       # Find moov atom position
ffprobe -print_format json -show_streams input.mp4  # JSON output
```

## Troubleshooting

| Error | Solution |
|-------|----------|
| Unknown encoder | Check `ffmpeg -codecs` for available codecs |
| File not found | Verify file path and permissions |
| Invalid filter | Check filter syntax and `ffmpeg -filters` |
| Seek error | Use `-ss` before `-i` for input seeking |
| Pixel format error | Try `-pix_fmt yuv420p` for H264 |
| Moov atom error | Use `-movflags +faststart` |

## Performance Tips

1. Use `-c copy` when possible (no re-encoding)
2. Use `-ss` before `-i` for faster seeking (less accurate)
3. Use GPU acceleration: `-hwaccel cuda` (NVIDIA), `-hwaccel qsv` (Intel), `-hwaccel videotoolbox` (macOS)
4. Use `-preset ultrafast` for real-time encoding
5. Reduce resolution or bitrate for faster encoding
6. Use 2-pass encoding for target bitrate: `-b:v 5000k -pass 1` then `-pass 2`

## Related

- FFmpeg: https://ffmpeg.org
- FFmpeg Documentation: https://ffmpeg.org/documentation.html
- FFprobe: https://ffmpeg.org/ffprobe.html
