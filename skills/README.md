# Skills

Agent skills for OSINT intelligence gathering and analysis. Each skill is a self-contained module that agents can activate and use.

## Available Skills

### agent-browser
Native Rust CLI for browser automation by Vercel Labs. Fast, deterministic element selection with accessibility tree snapshots. Use for web scraping, form automation, data extraction, and testing workflows.

**Location:** `agent-browser/`

**Quick Start:**
```bash
agent-browser open https://example.com
agent-browser snapshot -i
agent-browser click @e1
agent-browser screenshot page.png
```

---

### ffmpeg-cli
FFmpeg CLI for media processing and transformation. Convert formats, resize and pad, extract audio, trim, generate thumbnails, create slideshows, overlay graphics, burn subtitles.

**Location:** `ffmpeg-cli/`

**Quick Start:**
```bash
ffmpeg -i input.mp4 -c copy output.mkv
ffmpeg -i input.jpg -resize 800x600 output.jpg
ffmpeg -i video.mp4 -ss 00:00:05 -vframes 1 thumbnail.png
```

---

### imagemagick
ImageMagick CLI for comprehensive image processing. Convert formats, resize and crop, apply effects and filters, adjust colors, create thumbnails, batch process, composite images, add text and watermarks.

**Location:** `imagemagick/`

**Quick Start:**
```bash
magick input.png output.jpg
magick input.jpg -resize 200x200^ -gravity center -extent 200x200 thumb.jpg
mogrify -resize 800x600 *.jpg
magick input.jpg -blur 0x8 output.jpg
```

---

### perplexity-search
Perplexity AI search for web search with AI-powered answers, deep research, and chain-of-thought reasoning. Perform direct web searches, get AI-synthesized research, conduct complex reasoning, and generate comprehensive reports.

**Location:** `perplexity-search/`

**Key Features:**
- Multiple search models (sonar, sonar-pro, reasoning-pro, deep-research)
- Web search with AI answers
- Chain-of-thought reasoning for decisions
- Deep comprehensive research
- Citation tracking and source attribution

**Quick Start:**
```bash
# Quick question
node bin/perplexity/cli.js --ask "What is Python?"

# Web search
node bin/perplexity/cli.js --search "AI agents" --max-results 5

# AI research
node bin/perplexity/cli.js --research "FastAPI vs Django"

# Decision reasoning
node bin/perplexity/cli.js --reason "SQL vs NoSQL for startup?"

# Deep research
node bin/perplexity/cli.js --deep "state of AI observability 2025"
```

**Setup:**
```bash
# 1. Get API key from https://www.perplexity.ai/api
# 2. Set environment variable
export PERPLEXITY_API_KEY="your_key_here"
# 3. Verify setup
node bin/perplexity/setup.js
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
- `bin/perplexity/` - Perplexity AI CLI wrapper

## Environment Configuration

Create `.env` file in project root with API keys:

```bash
# .env
PERPLEXITY_API_KEY="your_api_key_here"
```

See `.env.sample` for template.

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
- Perplexity: https://www.perplexity.ai/api
