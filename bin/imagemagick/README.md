# ImageMagick Binaries

ImageMagick binary management for image processing in the OSINT project.

## Installation

ImageMagick is typically system-installed. Install via your package manager:

### macOS

```bash
brew install imagemagick
```

### Linux (Debian/Ubuntu)

```bash
sudo apt-get install imagemagick
```

### Linux (RedHat/CentOS)

```bash
sudo yum install ImageMagick
```

### Windows

```bash
choco install imagemagick
```

Or download from: https://imagemagick.org/script/download.php

## Setup

Run setup script:

```bash
cd bin/imagemagick
node setup.js
```

This checks for an existing ImageMagick installation and provides platform-specific instructions if needed.

## Verify Installation

```bash
magick -version          # ImageMagick v7+
# or
convert -version         # Legacy command
```

## Commands

ImageMagick provides multiple CLI tools:

- **magick** - Modern unified command (v7+, recommended)
- **convert** - Legacy conversion command (still works)
- **mogrify** - In-place batch processing
- **identify** - Image metadata inspection
- **montage** - Create image grids/contact sheets
- **composite** - Overlay images

## Quick Usage

From project root:

```bash
# Format conversion
magick input.png output.jpg

# Resize
magick input.jpg -resize 800x600 output.jpg

# Create thumbnail
magick input.jpg -resize 200x200^ -gravity center -extent 200x200 thumb.jpg

# Batch resize all JPGs
mogrify -resize 800x600 *.jpg

# Get image info
identify -verbose image.jpg

# Create contact sheet
montage *.jpg -geometry 200x200+2+2 contact.jpg
```

## Common Operations

### Format Conversion
```bash
magick input.png output.jpg              # PNG to JPEG
magick input.jpg -quality 85 output.jpg  # Adjust quality
magick input.jpg output.webp             # Convert to WebP
```

### Resizing
```bash
magick input.jpg -resize 800x600 output.jpg       # Fit in box
magick input.jpg -resize 800x output.jpg          # Fixed width
magick input.jpg -resize x600 output.jpg          # Fixed height
magick input.jpg -resize 50% output.jpg           # Scale by percent
```

### Thumbnails
```bash
magick input.jpg -resize 200x200^ -gravity center -extent 200x200 thumb.jpg
```

### Effects
```bash
magick input.jpg -blur 0x8 output.jpg             # Blur
magick input.jpg -sharpen 0x1 output.jpg          # Sharpen
magick input.jpg -colorspace Gray output.jpg      # Grayscale
magick input.jpg -sepia-tone 80% output.jpg       # Sepia
magick input.jpg -negate output.jpg               # Invert
```

### Cropping
```bash
magick input.jpg -crop 400x400+100+100 output.jpg  # Crop region
magick input.jpg -gravity center -crop 400x400 output.jpg  # Crop from center
```

## Environment Variables

```bash
# Specify limits for large images
export MAGICK_MEMORY=2GB
export MAGICK_MAP=4GB

# Use custom policy file
export MAGICK_CONFIGURE_PATH=/path/to/config
```

## Batch Processing

Use mogrify for in-place operations:

```bash
# Resize all images
mogrify -resize 800x600 *.jpg

# Save to output directory
mogrify -path ./output -resize 800x600 *.jpg

# Format conversion
mogrify -format png *.jpg

# Strip metadata (reduces size)
mogrify -strip *.jpg
```

## Troubleshooting

### Policy Restrictions

Some systems restrict ImageMagick for security:

```bash
# Check policy
identify -list policy

# Edit policy (if needed)
# /etc/ImageMagick-6/policy.xml or /etc/ImageMagick-7/policy.xml
```

### Commands Not Found

ImageMagick v7+ uses `magick` command. Legacy `convert` may need:

```bash
# Install legacy tools
brew install imagemagick@6  # macOS
apt-get install imagemagick # Linux (includes both)
```

## Documentation

- Official: https://imagemagick.org
- Commands: https://imagemagick.org/script/command-line-options.php
- Examples: https://imagemagick.org/Usage/
- Formats: https://imagemagick.org/script/formats.php

## Related

- ImageMagick skill: `../../skills/imagemagick/SKILL.md`
