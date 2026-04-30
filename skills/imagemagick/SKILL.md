---
name: imagemagick
description: ImageMagick CLI for comprehensive image processing and manipulation. Convert formats, resize and crop, apply effects and filters, adjust colors, create thumbnails, batch process, composite images, add text and watermarks. Use for image transformation, media preparation, batch operations, and visual content processing.
license: Apache-2.0
compatibility: Requires ImageMagick CLI installed globally. Works on macOS, Linux, Windows. Install via Homebrew, apt-get, or download from imagemagick.org.
metadata:
  author: osint-builders
  version: "1.0.0"
  upstream: "https://imagemagick.org"
---

# ImageMagick CLI Skill

Comprehensive image processing and manipulation using ImageMagick. Convert formats, resize with aspect ratio preservation, apply effects and filters, create thumbnails, perform batch operations, composite images, add text overlays, and generate contact sheets.

## Key Capabilities

### Format Conversion
- Convert between 250+ image formats (PNG, JPEG, WebP, GIF, TIFF, BMP, SVG, etc.)
- Quality and compression control
- Metadata stripping
- Progressive encoding

### Image Transformation
- Resize with aspect ratio preservation
- Crop and extract regions
- Rotate and flip
- Auto-orient based on EXIF data

### Effects & Filters
- Blur and sharpen
- Grayscale and sepia tone
- Edge detection and emboss
- Oil painting and charcoal effects
- Color negation and inversion

### Adjustments
- Brightness and contrast control
- Saturation and hue adjustments
- Auto-level and gamma correction
- Normalization

### Thumbnails & Resizing
- Generate thumbnails with forced aspect ratio
- Letterbox and pillarbox with padding
- Responsive image generation
- Avatar/profile picture creation

### Compositing
- Overlay images
- Watermark application
- Image tiling
- Side-by-side and vertical stacking

### Text & Watermarks
- Add text overlays
- Custom fonts and sizes
- Semi-transparent watermarks
- Positioned text with gravity

### Batch Processing
- Process multiple files with mogrify
- Format conversion at scale
- Resize batches
- Metadata stripping

### Advanced Features
- Animated GIF creation and optimization
- Contact sheet generation
- Frame and border effects
- Complex multi-step pipelines

## Installation

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

### Verify Installation
```bash
magick -version
# or (legacy)
convert -version
```

## Quick Start Examples

### Format Conversion
```bash
# PNG to JPEG
magick input.png output.jpg

# JPEG to WebP
magick input.jpg output.webp

# Set quality (0-100)
magick input.png -quality 85 output.jpg

# Convert with metadata stripping
magick input.png -strip -quality 90 output.jpg
```

### Resize Images
```bash
# Fit within 800x600 (maintains aspect ratio)
magick input.jpg -resize 800x600 output.jpg

# Specific width, auto height
magick input.jpg -resize 800x output.jpg

# Specific height, auto width
magick input.jpg -resize x600 output.jpg

# Scale by percentage
magick input.jpg -resize 50% output.jpg

# Exact dimensions (ignores aspect ratio)
magick input.jpg -resize 800x600! output.jpg

# Shrink only (don't enlarge)
magick input.jpg -resize 800x600\> output.jpg
```

### Generate Thumbnails
```bash
# Square thumbnail (200x200) with letterbox
magick input.jpg -resize 200x200^ -gravity center -extent 200x200 thumb.jpg

# Circular avatar (PNG with transparency)
magick input.jpg -resize 200x200^ -gravity center -extent 200x200 \
  \( +clone -threshold -1 -negate -fill white -draw "circle 100,100 100,0" \) \
  -alpha off -compose copy_opacity -composite avatar.png
```

### Crop Images
```bash
# Crop 400x400 region from position (100,100)
magick input.jpg -crop 400x400+100+100 output.jpg

# Crop from center
magick input.jpg -gravity center -crop 400x400+0+0 output.jpg

# Reset virtual canvas after crop
magick input.jpg -crop 400x400+100+100 +repage output.jpg
```

### Apply Effects
```bash
# Blur
magick input.jpg -blur 0x8 output.jpg

# Sharpen
magick input.jpg -sharpen 0x1 output.jpg

# Grayscale
magick input.jpg -colorspace Gray output.jpg

# Sepia tone
magick input.jpg -sepia-tone 80% output.jpg

# Edge detection
magick input.jpg -edge 3 output.jpg

# Emboss
magick input.jpg -emboss 2 output.jpg

# Oil painting
magick input.jpg -paint 4 output.jpg

# Charcoal drawing
magick input.jpg -charcoal 2 output.jpg

# Negate (invert colors)
magick input.jpg -negate output.jpg
```

### Adjust Colors
```bash
# Brightness (+/- adjustment)
magick input.jpg -brightness-contrast 10x0 output.jpg

# Contrast
magick input.jpg -brightness-contrast 0x20 output.jpg

# Saturation (0-200%)
magick input.jpg -modulate 100,150,100 output.jpg

# Hue shift
magick input.jpg -modulate 100,100,120 output.jpg

# Auto-level contrast
magick input.jpg -auto-level output.jpg

# Normalize
magick input.jpg -normalize output.jpg
```

### Add Text & Watermarks
```bash
# Simple text overlay
magick input.jpg -pointsize 30 -fill white -annotate +10+30 "Hello" output.jpg

# Text with positioning (south = bottom)
magick input.jpg -gravity south -pointsize 20 -fill white \
  -annotate +0+10 "Copyright 2025" output.jpg

# Watermark overlay
magick input.jpg watermark.png -gravity southeast -geometry +10+10 -composite output.jpg

# Centered watermark
magick input.jpg watermark.png -gravity center -composite output.jpg

# Semi-transparent watermark
magick input.jpg \( -background none -fill "rgba(255,255,255,0.5)" \
  -pointsize 50 label:"DRAFT" \) -gravity center -compose over -composite output.jpg
```

### Batch Processing
```bash
# Resize all JPGs in directory
mogrify -resize 800x600 *.jpg

# Convert all JPGs to PNG
mogrify -format png *.jpg

# Resize with output directory (preserves originals)
mogrify -path ./resized -resize 800x600 *.jpg

# Strip metadata from all JPGs
mogrify -strip *.jpg

# Batch thumbnail generation
mogrify -path ./thumbs -resize 200x200^ -gravity center \
  -extent 200x200 *.jpg
```

### Image Information
```bash
# Basic info
identify image.jpg

# Detailed information
identify -verbose image.jpg

# Format string
identify -format "%f: %wx%h %b\n" image.jpg

# Multiple images
identify *.jpg

# Get dimensions
identify -format "%wx%h" image.jpg
```

## Core Commands

### magick (Recommended v7+)
```bash
magick input.ext output.ext               # Convert/transform
magick -version                           # Check version
magick -list format                       # List supported formats
magick -list filter                       # List filters
```

### convert (Legacy, still works)
```bash
convert input.ext output.ext              # Legacy format
convert -version                          # Version
```

### mogrify (Batch, in-place)
```bash
mogrify -resize 800x600 *.jpg             # In-place
mogrify -path ./output -resize 800x600 *.jpg  # To directory
mogrify -format png *.jpg                 # Format conversion
```

### identify (Information)
```bash
identify image.jpg                        # Basic info
identify -verbose image.jpg               # Detailed
identify -format "%wx%h" image.jpg        # Specific format
```

### montage (Contact sheets)
```bash
montage *.jpg -geometry 200x200+2+2 contact.jpg      # Grid
montage *.jpg -tile 3x -geometry 200x200 contact.jpg # 3 columns
montage *.jpg -label '%f' -geometry 200x200 contact.jpg  # With labels
```

### composite (Overlay)
```bash
composite watermark.png input.jpg -gravity southeast output.jpg
composite overlay.png input.jpg -geometry +10+10 output.jpg
```

## Geometry Specifications

Dimension and position syntax:

| Spec | Meaning |
|------|---------|
| `100x100` | Fit within 100×100 (maintains aspect) |
| `100x100!` | Force exact size 100×100 (ignores aspect) |
| `100x100^` | Fill 100×100 (may crop, maintains aspect) |
| `100x` | Width 100, auto height |
| `x100` | Height 100, auto width |
| `50%` | Scale to 50% |
| `100x100+10+20` | 100×100 region at offset (10,20) |

## Quality & Performance

### Quality Settings
```bash
# High quality (larger file)
magick input.jpg -quality 95 output.jpg

# Balanced (recommended)
magick input.jpg -quality 85 -strip output.jpg

# Web-optimized
magick input.jpg -quality 75 -strip -interlace Plane output.jpg
```

### Memory Limits
```bash
# For large images
magick -limit memory 2GB -limit map 4GB input.jpg -resize 50% output.jpg

# Set thread count
magick -limit thread 4 input.jpg -resize 50% output.jpg
```

## Best Practices

1. **Always use `-strip`** to remove metadata (reduces size)
2. **Use appropriate quality** (85 is good balance for JPEG)
3. **Use `+repage`** after crop to reset virtual canvas
4. **Quote file paths** with spaces: `"my image.jpg"`
5. **Test on sample** before batch processing
6. **Backup originals** when using mogrify
7. **Use `-auto-orient`** to respect EXIF data
8. **Progressive JPEGs** for web: `-interlace Plane`
9. **Limit memory** for batch jobs to prevent crashes
10. **Use v7+ `magick`** command when possible

## Common Patterns

### Avatar Generation
```bash
magick input.jpg -resize 200x200^ -gravity center -extent 200x200 avatar.jpg
```

### Responsive Images
```bash
for size in 320 640 1024 1920; do
  magick input.jpg -resize ${size}x -quality 85 "output-${size}w.jpg"
done
```

### Contact Sheet
```bash
montage *.jpg -geometry 200x200+2+2 -label '%f' contact.jpg
```

### Watermarking
```bash
magick input.jpg watermark.png -gravity southeast -geometry +10+10 -composite output.jpg
```

## Error Handling

### Common Issues

| Error | Solution |
|-------|----------|
| "not authorized" | Check ImageMagick security policy |
| "no decode delegate" | Install missing libraries (libjpeg, libpng, etc.) |
| "memory allocation failed" | Use `-limit` flags or process in chunks |
| "file not found" | Check file path and permissions |

### Policy Restrictions
```bash
# Check policy
identify -list policy

# Edit if needed
sudo nano /etc/ImageMagick-7/policy.xml
```

## Related Tools & Skills

### Skills
- **ffmpeg-cli** - Extract video frames, generate thumbnails
- **agent-browser** - Capture web screenshots for annotation/processing
- **remember-as-you-go** - Capture policy restrictions, format delegate issues, permission problems

### System CLIs
- `exiftool` - EXIF and metadata manipulation
- `pngquant` - Superior PNG compression
- `jpegoptim` - JPEG optimization
- `optipng` - Lossless PNG optimization

### Integration Hints
```bash
# Screenshot → Resize → Optimize → Watermark
agent-browser screenshot page.png
magick page.png -resize 1920x1080 resized.jpg
jpegoptim --max=85 resized.jpg
magick resized.jpg watermark.png -gravity southeast -composite final.jpg

# Video frames → Batch process → Contact sheet
ffmpeg -i video.mp4 -vf fps=1 frame_%03d.png
mogrify -path ./processed -resize 800x600 -quality 90 frame_*.png
montage processed/frame_*.png -geometry 200x200+2+2 sheet.jpg
```

## References

- See [REFERENCE.md](references/REFERENCE.md) for complete command reference
- See [scripts/](scripts/) for workflow examples
- ImageMagick Documentation: https://imagemagick.org
- Command Reference: https://imagemagick.org/script/command-line-options.php
- Examples: https://imagemagick.org/Usage/
