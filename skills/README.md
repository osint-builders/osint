# Skills

Agent skills for OSINT intelligence gathering and analysis. Each skill is a self-contained module that agents can activate and use.

## Available Skills

### agent-browser
Native Rust CLI for browser automation by Vercel Labs. Fast, deterministic element selection with accessibility tree snapshots. Use for web scraping, form automation, data extraction, and testing workflows.

**Location:** `agent-browser/`

---

### ffmpeg-cli
FFmpeg CLI for media processing and transformation. Convert formats, resize and pad, extract audio, trim, generate thumbnails, create slideshows, overlay graphics, burn subtitles.

**Location:** `ffmpeg-cli/`

---

### imagemagick
ImageMagick CLI for comprehensive image processing. Convert formats, resize and crop, apply effects and filters, adjust colors, create thumbnails, batch process, composite images, add text and watermarks.

**Location:** `imagemagick/`

---

### perplexity-search
Perplexity AI search for web search with AI-powered answers, deep research, and chain-of-thought reasoning. Multiple models from lightweight to expert-level analysis.

**Location:** `perplexity-search/`

---

### word-event-entities
Characterize and analyze Word Event Entities - a comprehensive model for representing real-world events with structured data. Understand entity fields, properties, data types, and relationships. Use to inform AI systems about event model architecture.

**Location:** `word-event-entities/`

**Key Components:**
- Complete field specification (required, optional, geographic, metadata)
- Data type reference and validation rules
- Field relationships and dependencies
- Event type classification patterns
- Confidence scoring guidelines
- Example entities (natural disasters, policy, protests)
- Analysis and characterization scripts

**Quick Reference:**

Required fields:
- `id` (UUID)
- `source` (publisher)
- `title` (headline)
- `summary` (brief narrative)
- `details` (full narrative)
- `date_published` (ISO 8601)
- `links` (source URLs)
- `image_urls` (media)

Optional fields:
- `date_occurred`, `event_type`, `severity`, `status`
- `keywords`, `entities`, `related_event_ids`
- `geo` (latitude, longitude, country, region, city)
- `metadata` (confidence, updated_at, contributor)

**See also:**
- `word-event-entities/SKILL.md` - Full specification
- `word-event-entities/references/REFERENCE.md` - Complete field reference
- `word-event-entities/scripts/` - Analysis examples

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
2. Create `SKILL.md` with frontmatter
3. Add executable scripts in `scripts/`
4. Add reference docs in `references/`
5. Create `bin/my-skill/` (if CLI tool)
6. Update this README

Validate skills:
```bash
npx skills-ref validate ./skills/my-skill
```

## Resources

- [Agent Skills Specification](https://agentskills.io/specification)
- [Skills.sh](https://skills.sh)
