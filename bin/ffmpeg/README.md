# FFmpeg Binaries

FFmpeg binary management for media processing in the OSINT project.

## Contents

- `setup.js` - Setup script for ffmpeg installation
- `package.json` - Package metadata

## Installation

FFmpeg is typically not bundled (large binary ~80-100MB). Install via your system package manager:

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
choco install ffmpeg
```

Or download from: https://ffmpeg.org/download.html

## Setup

Run setup script:

```bash
cd bin/ffmpeg
node setup.js
```

This checks for an existing ffmpeg installation and provides platform-specific instructions if needed.

## Usage

From project root:

```bash
# Convert video
ffmpeg -i input.mp4 output.webm

# Extract audio
ffmpeg -i video.mp4 -q:a 0 -map a audio.mp3

# Capture frames
ffmpeg -i video.mp4 -vf fps=1 frames/frame-%03d.png

# Create video from images
ffmpeg -framerate 30 -i frame-%03d.png -c:v libx264 output.mp4

# Resize video
ffmpeg -i input.mp4 -vf scale=1280:720 output.mp4

# Convert format
ffmpeg -i input.mov -c:v libx264 -c:a aac output.mp4
```

## Environment Variables

```bash
# Specify ffmpeg binary path
export FFMPEG_PATH=/path/to/ffmpeg

# Use with scripts
$FFMPEG_PATH -i input.mp4 output.webm
```

## Common Commands

### Media Info
```bash
ffmpeg -i input.mp4
ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=s=x:p=0 input.mp4
```

### Audio Processing
```bash
# Extract audio
ffmpeg -i video.mp4 -vn -acodec libmp3lame -ab 192k audio.mp3

# Add audio to video
ffmpeg -i video.mp4 -i audio.mp3 -c:v copy -c:a aac output.mp4

# Adjust volume
ffmpeg -i input.mp3 -filter:a "volume=0.5" output.mp3
```

### Video Processing
```bash
# Trim video
ffmpeg -i input.mp4 -ss 00:00:10 -to 00:00:30 output.mp4

# Speed up video
ffmpeg -i input.mp4 -filter:v "setpts=0.5*PTS" output.mp4

# Add watermark
ffmpeg -i video.mp4 -i watermark.png -filter_complex "overlay=10:10" output.mp4
```

### Screenshots
```bash
# Single screenshot at time
ffmpeg -i video.mp4 -ss 00:00:05 -vframes 1 screenshot.png

# Multiple frames
ffmpeg -i video.mp4 -vf fps=1 frame_%03d.png
```

## Related

- FFmpeg Documentation: https://ffmpeg.org/documentation.html
- FFprobe: https://ffmpeg.org/ffprobe.html
