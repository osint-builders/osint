# ImageMagick Complete Reference

Comprehensive command and option reference for ImageMagick.

## Core Commands

### magick (v7+ recommended)
```bash
magick input.ext output.ext           # Convert/transform
magick -version                       # Show version
magick -list format                   # List supported formats
magick -list filter                   # List available filters
magick -list property                 # List properties
```

### convert (Legacy)
```bash
convert input.ext output.ext          # Legacy syntax
convert -version                      # Version
```

### mogrify (Batch processing)
```bash
mogrify -resize 800x600 *.jpg         # In-place modification
mogrify -path ./out -resize 800x600 *.jpg  # To output directory
mogrify -format png *.jpg             # Format conversion
```

### identify (Image information)
```bash
identify image.jpg                    # Basic info
identify -verbose image.jpg           # Detailed info
identify -format "%wx%h %b" image.jpg # Custom format
identify *.jpg                        # Multiple images
```

### montage (Contact sheets)
```bash
montage *.jpg -geometry 200x200+2+2 contact.jpg
montage *.jpg -tile 3x -geometry 200x200 contact.jpg
montage *.jpg -label '%f' contact.jpg
```

### composite (Image overlay)
```bash
composite watermark.png input.jpg -gravity southeast output.jpg
composite overlay.png input.jpg -geometry +10+10 output.jpg
```

## Geometry Specifications

| Specification | Meaning |
|---------------|---------|
| `100x100` | Fit within 100×100 (maintains aspect ratio) |
| `100x100!` | Force exact 100×100 (ignores aspect ratio) |
| `100x100^` | Fill 100×100 area (may crop) |
| `100x` | Width 100, auto height |
| `x100` | Height 100, auto width |
| `50%` | Scale to 50% of original |
| `100x100+10+20` | Extract 100×100 region at offset (10,20) |

## Resize Operations

```bash
# Fit within bounds (maintains aspect)
-resize 800x600

# Specific width
-resize 800x

# Specific height
-resize x600

# Percentage
-resize 50%

# Force exact (ignore aspect)
-resize 800x600!

# Shrink only (don't enlarge)
-resize 800x600\>

# Enlarge only (don't shrink)
-resize 800x600\<

# Fill area (may crop)
-resize 100x100^
```

## Crop & Transform

```bash
# Crop region: WIDTHxHEIGHT+X+Y
-crop 400x400+100+100

# Crop from gravity point
-gravity center -crop 400x400+0+0

# Reset virtual canvas
+repage

# Rotate
-rotate 90              # Clockwise
-rotate -90             # Counter-clockwise

# Flip/Flop
-flip                   # Vertical flip
-flop                   # Horizontal flip (mirror)

# Auto-orient by EXIF
-auto-orient
```

## Format Conversion

```bash
# Basic conversion
magick input.png output.jpg

# With quality
magick input.png -quality 85 output.jpg

# Format list
magick -list format

# Specific format option
-quality 85             # JPEG quality (0-100)
-define webp:lossless=true  # WebP lossless
-colors 256             # GIF colors (max 256)
-interlace Plane        # Progressive JPEG
```

## Color & Effects

### Filters
```bash
# Blur
-blur 0x8               # Gaussian blur (radius x sigma)
-blur 0x1               # Slight blur

# Sharpen
-sharpen 0x1

# Gaussian blur
-gaussian-blur 5x3      # Radius x sigma

# Edge detection
-edge 3

# Emboss
-emboss 2

# Oil painting
-paint 4

# Charcoal
-charcoal 2
```

### Color Adjustments
```bash
# Grayscale
-colorspace Gray

# Sepia tone
-sepia-tone 80%

# Negate (invert)
-negate

# Brightness/Contrast
-brightness-contrast 10x20    # brightness x contrast

# Modulate (saturation/hue)
-modulate 100,150,100         # brightness,saturation,hue

# Auto-level
-auto-level

# Normalize
-normalize

# Auto-gamma
-auto-gamma
```

## Text & Annotation

```bash
# Simple text
-pointsize 30 -fill white -annotate +10+30 "Text"

# With gravity positioning
-gravity south -pointsize 20 -fill white -annotate +0+10 "Text"

# With background
-undercolor black -annotate +0+0 "Text"

# Font specification
-font Arial -pointsize 30 -fill white -annotate +0+0 "Text"

# Formatting
-pointsize 30            # Font size
-fill white              # Text color
-font Arial              # Font name
-undercolor black        # Background color
```

## Opacity & Compositing

```bash
# Transparency/Opacity
-alpha off               # Remove alpha channel
-alpha on                # Add alpha channel
-evaluate multiply 0.5   # 50% transparency

# Compositing
-compose over            # Standard overlay
-composite               # Apply composite operation

# Gravity for positioning
-gravity southeast       # Bottom-right
-gravity center          # Center
-gravity northwest       # Top-left
-geometry +10+10         # Offset from gravity
```

## Batch Operations

```bash
# Resize all in place
mogrify -resize 800x600 *.jpg

# Save to output directory
mogrify -path ./output -resize 800x600 *.jpg

# Format conversion
mogrify -format jpg *.png

# Multiple operations
mogrify -resize 800x600 -quality 85 -strip *.jpg

# Thumbnail batch
mogrify -path ./thumbs -resize 200x200^ -gravity center \
  -extent 200x200 *.jpg
```

## Metadata

```bash
# Strip metadata (reduces file size)
-strip

# Preserve orientation
-auto-orient

# Set density (DPI)
-density 300

# Depth (bits per channel)
-depth 8

# Define custom properties
-define key=value
```

## Quality & Performance

```bash
# JPEG quality (0-100)
-quality 85

# Progressive JPEG
-interlace Plane

# Reduce colors (GIF)
-colors 256

# Memory limit
-limit memory 2GB
-limit map 4GB

# Thread limit
-limit thread 4

# Sampling factor (JPEG)
-sampling-factor 4:2:0
```

## Advanced Filters

### Complex Pipelines

```bash
# Resize + crop + effects
magick input.jpg \
  -resize 1000x1000^ \
  -gravity center \
  -crop 1000x1000+0+0 \
  -blur 0x2 \
  -quality 90 \
  output.jpg

# Thumbnail with border
magick input.jpg \
  -resize 400x400^ \
  -extent 400x400 \
  -bordercolor black -border 5x5 \
  output.jpg
```

### Multi-Image Operations

```bash
# Append horizontally
magick input1.jpg input2.jpg +append output.jpg

# Append vertically
magick input1.jpg input2.jpg -append output.jpg

# Create sprite sheet
montage *.jpg -tile 3x4 -geometry 100x100+2+2 sprites.jpg
```

## Format-Specific Options

### JPEG
```bash
-quality 85             # Quality (0-100)
-interlace Plane        # Progressive encoding
-sampling-factor 4:2:0  # Chroma subsampling
-define jpeg:dct=float  # DCT method
```

### PNG
```bash
-quality 95             # PNG compression (0-100)
-define png:compression-level=9  # Compression (0-9)
-alpha on               # Support transparency
```

### WebP
```bash
-quality 80             # Quality (0-100)
-define webp:lossless=true   # Lossless mode
-define webp:method=6        # Encoding method (0-6)
```

### GIF
```bash
-colors 256             # Max colors
-fuzz 5%                # Color tolerance
-delay 100              # Frame delay (centiseconds)
-loop 0                 # Infinite loop
```

## Identify Format Strings

```bash
%f      # Filename
%w      # Width
%h      # Height
%b      # File size
%x      # Horizontal resolution
%y      # Vertical resolution
%m      # Image format/mime type
%[colorspace]   # Colorspace (RGB, Gray, etc.)
%[type]         # Image type (Bilevel, Grayscale, Palette, True Color)
%[channels]     # Number of channels
%[depth]        # Bit depth
```

## Common Workflows

### Avatar/Profile Picture
```bash
magick input.jpg -resize 200x200^ -gravity center -extent 200x200 avatar.jpg
```

### Thumbnail Generation
```bash
magick input.jpg -resize 400x400^ -gravity center -crop 400x400+0+0 +repage -quality 90 thumb.jpg
```

### Watermarking
```bash
magick input.jpg watermark.png -gravity southeast -geometry +10+10 -composite output.jpg
```

### Contact Sheet
```bash
montage *.jpg -geometry 200x200+2+2 -label '%f' contact.jpg
```

### Responsive Images
```bash
for size in 320 640 1024 1920; do
  magick input.jpg -resize ${size}x -quality 85 "output-${size}w.jpg"
done
```

### Batch Resize
```bash
mogrify -resize 800x600 -quality 85 -strip *.jpg
```

## Error Handling

```bash
# Check version
magick -version

# Test format support
magick -list format | grep JPEG

# List policies
identify -list policy

# Test image
magick -define debug=all input.jpg output.jpg 2>&1 | head -20
```

## Resources

- Official: https://imagemagick.org
- Commands: https://imagemagick.org/script/command-line-options.php
- Usage Guide: https://imagemagick.org/Usage/
- Formats: https://imagemagick.org/script/formats.php
- Examples: https://imagemagick.org/script/escape.php
