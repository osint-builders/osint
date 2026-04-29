# Skills

Agent skills for OSINT intelligence gathering and analysis. Each skill is a self-contained module that agents can activate and use.

## Available Skills

### agent-browser
Native Rust CLI for browser automation by Vercel Labs. Fast, deterministic element selection with accessibility tree snapshots. Use for web scraping, form automation, data extraction, and testing workflows.

**Location:** `agent-browser/`

**Key Capabilities:**
- Page navigation and history
- Accessibility tree snapshots with deterministic element refs (@e1, @e2, etc.)
- Element interaction (click, fill, type, select, etc.)
- Data extraction (text, HTML, JavaScript eval)
- Screenshot capture (with optional element annotations)
- Session management and authentication
- Cloud provider support (Browserbase, Browserless, etc.)

**Setup:**
```bash
npm install -g agent-browser
agent-browser install
```

**Quick Start:**
```bash
agent-browser open https://example.com
agent-browser snapshot -i                    # Get interactive elements
agent-browser click @e1                      # Click element
agent-browser fill @e2 "input text"          # Fill input
agent-browser screenshot page.png
agent-browser close
```

**See also:**
- `agent-browser/SKILL.md` - Full skill documentation
- `agent-browser/references/REFERENCE.md` - Complete command reference
- `agent-browser/scripts/` - Workflow examples (bash)
- `bin/agent-browser/README.md` - CLI setup and usage

---

### ffmpeg-cli
FFmpeg CLI for media processing and transformation. Convert formats, resize and pad, extract audio, trim, generate thumbnails, create slideshows, overlay graphics, burn subtitles, and more. Use for video manipulation, media encoding, content creation, and OSINT media analysis.

**Location:** `ffmpeg-cli/`

**Key Capabilities:**
- Format conversion and remuxing (MP4 ↔ MKV, MOV, AVI)
- Video scaling with aspect ratio preservation and letterboxing
- Audio extraction and processing
- Trim and cut by time range
- Thumbnail generation (single/multiple/scene-based)
- Slideshow creation with fade transitions
- Logo and image overlay
- Video concatenation
- Subtitle burning
- Ken Burns effect (zoompan)
- GIF generation
- Metadata inspection with ffprobe

**Setup:**
```bash
# macOS
brew install ffmpeg

# Linux (Debian/Ubuntu)
sudo apt-get install ffmpeg

# Or use setup script
cd bin/ffmpeg
node setup.js
```

**Quick Start:**
```bash
# Convert format (remux, no re-encoding)
ffmpeg -i input.mp4 -c copy output.mkv

# Resize with letterbox
ffmpeg -i input.mp4 -vf "scale=w=1920:h=1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1:1" output.mp4

# Extract audio
ffmpeg -i video.mp4 -vn -acodec libmp3lame -ab 192k audio.mp3

# Generate thumbnail
ffmpeg -i video.mp4 -ss 00:00:05 -vframes 1 thumbnail.png
```

**See also:**
- `ffmpeg-cli/SKILL.md` - Full skill documentation
- `ffmpeg-cli/references/REFERENCE.md` - Complete command reference
- `ffmpeg-cli/scripts/` - Workflow examples (bash scripts)
- `bin/ffmpeg/README.md` - FFmpeg setup and installation

---

## Skill Structure

Each skill follows the [Agent Skills Specification](https://agentskills.io/specification):

```
skill-name/
├── SKILL.md          # Skill metadata and instructions
├── scripts/          # Executable code examples
├── references/       # Additional documentation
└── assets/           # Static resources (templates, etc.)
```

## Adding New Skills

To add a new skill:

1. Create skill directory: `mkdir skills/my-skill`
2. Create `SKILL.md` with required frontmatter:
   ```yaml
   ---
   name: my-skill
   description: What this skill does and when to use it.
   ---
   ```
3. Add executable scripts in `scripts/`
4. Add reference docs in `references/`
5. Update this README with skill description

Validate skills:
```bash
npx skills-ref validate ./skills/my-skill
```

Check that:
- `SKILL.md` has valid frontmatter
- Name matches directory name
- Description is descriptive
- All file references are valid
