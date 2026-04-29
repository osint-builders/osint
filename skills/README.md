# Skills

Agent skills for OSINT intelligence gathering and analysis. Each skill is a self-contained module that agents can activate and use.

## Available Skills

### agent-browser
Native Rust CLI for browser automation by Vercel Labs. Fast, deterministic element selection with accessibility tree snapshots. Use for web scraping, form automation, data extraction, and testing workflows.

**Location:** `agent-browser/`

**Key Capabilities:**
- Page navigation and accessibility tree snapshots with element refs
- Element interaction (click, fill, type, select)
- Data extraction (text, HTML, JavaScript eval)
- Screenshot capture (with optional annotations)
- Session management and authentication

**Quick Start:**
```bash
agent-browser open https://example.com
agent-browser snapshot -i
agent-browser click @e1
agent-browser screenshot page.png
```

---

### ffmpeg-cli
FFmpeg CLI for media processing and transformation. Convert formats, resize and pad, extract audio, trim, generate thumbnails, create slideshows, overlay graphics, burn subtitles, and more.

**Location:** `ffmpeg-cli/`

**Key Capabilities:**
- Format conversion and remuxing
- Video scaling with aspect ratio preservation
- Audio extraction and processing
- Trim and cut by time
- Thumbnail generation
- Slideshow creation with fade
- Logo and image overlay
- Video concatenation

**Quick Start:**
```bash
ffmpeg -i input.mp4 -c copy output.mkv
ffmpeg -i input.jpg -resize 800x600 output.jpg
ffmpeg -i video.mp4 -ss 00:00:05 -vframes 1 thumbnail.png
```

---

### imagemagick
ImageMagick CLI for comprehensive image processing and manipulation. Convert formats, resize and crop, apply effects and filters, adjust colors, create thumbnails, batch process, composite images, add text and watermarks.

**Location:** `imagemagick/`

**Key Capabilities:**
- Format conversion (250+ formats)
- Image transformation (resize, crop, rotate, flip)
- Effects and filters (blur, sharpen, grayscale, sepia, edge detection, emboss)
- Color adjustments (brightness, contrast, saturation, hue)
- Thumbnail generation
- Batch processing with mogrify
- Text overlays and watermarks
- Image compositing and contact sheets

**Quick Start:**
```bash
magick input.png output.jpg
magick input.jpg -resize 800x600 output.jpg
magick input.jpg -resize 200x200^ -gravity center -extent 200x200 thumb.jpg
mogrify -resize 800x600 *.jpg
magick input.jpg -blur 0x8 output.jpg
```

---

## Skill Structure

Each skill follows the [Agent Skills Specification](https://agentskills.io/specification):

```
skill-name/
├── SKILL.md          # Skill metadata and instructions
├── scripts/          # Executable code examples
├── references/       # Additional documentation
└── assets/           # Static resources (optional)
```

## Related Binaries

Each skill has corresponding binaries and setup in the `bin/` folder:
- `bin/agent-browser/` - Agent browser CLI and wrapper
- `bin/ffmpeg/` - FFmpeg binary setup
- `bin/imagemagick/` - ImageMagick binary setup

## Adding New Skills

To add a new skill:

1. Create skill directory: `mkdir skills/my-skill`
2. Create `SKILL.md` with frontmatter:
   ```yaml
   ---
   name: my-skill
   description: Brief description of what the skill does.
   ---
   ```
3. Add executable scripts in `scripts/`
4. Add reference docs in `references/`
5. Create `bin/my-skill/` with setup and documentation
6. Update this README

Validate skills:
```bash
npx skills-ref validate ./skills/my-skill
```

## Resources

- [Agent Skills Specification](https://agentskills.io/specification)
- [Skills.sh](https://skills.sh)
- Agent Browser: https://github.com/vercel-labs/agent-browser
- FFmpeg: https://ffmpeg.org
- ImageMagick: https://imagemagick.org
