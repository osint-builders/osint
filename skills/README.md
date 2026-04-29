# Skills

Agent skills for OSINT intelligence gathering and analysis. Each skill is a self-contained module that agents can activate and use.

## Available Skills

### agent-browser
Native Rust CLI for browser automation by Vercel Labs. Fast, deterministic element selection with accessibility tree snapshots. Use for web scraping, form automation, data extraction, and testing workflows.

**Location:** `agent-browser/`

---

### data-to-markdown
Transform any data source into clean, semantic, concise Markdown following E-PRIME principles. Convert plain text, HTML, code, documents (Word, PowerPoint, PDF) into well-structured Markdown with precision and clarity.

**Location:** `data-to-markdown/`

**Key Features:**
- E-PRIME conversion (removes "to be" forms for precise language)
- Semantic structure detection (headings, lists, tables, code blocks)
- Multi-format support (HTML, plain text, documents)
- Validation and quality checking
- CLI tool for automated conversion

**Quick Start:**

```bash
# Convert HTML to Markdown
node bin/data-to-markdown/cli.js convert input.html output.md

# Apply E-PRIME principles
node bin/data-to-markdown/cli.js convert input.txt output.md --eprime

# Validate Markdown structure
node bin/data-to-markdown/cli.js validate document.md

# Check E-PRIME compliance
node bin/data-to-markdown/cli.js check-eprime document.md
```

**See also:**
- `data-to-markdown/SKILL.md` - Full conversion framework
- `data-to-markdown/references/` - Detailed conversion guides
- `bin/data-to-markdown/` - CLI tool and documentation

---

### ffmpeg-cli
FFmpeg CLI for media processing and transformation. Convert formats, resize and pad, extract audio, trim, generate thumbnails, create slideshows, overlay graphics, burn subtitles.

**Location:** `ffmpeg-cli/`

---

### sandcastle
Run AI coding agents in isolated sandbox environments. Execute TypeScript/JavaScript code, prototype solutions, parallelize development tasks, and orchestrate multi-agent workflows using Docker, Podman, or Vercel providers. Perfect for on-the-fly code execution when AI needs to test implementations.

**Location:** `sandcastle/`

**Key Features:**
- Isolated sandbox execution (Docker, Podman, Vercel)
- Parallel agent orchestration on separate branches
- Multi-iteration workflows with automatic merging
- Git-based version control integration
- Claude Code agent support (Opus, Sonnet, Haiku)

**Quick Start:**

```bash
# Initialize sandcastle
cd bin/sandcastle && npm install
sandcastle init

# Run agent with prompt
sandcastle run --prompt "Create a function to calculate Fibonacci numbers with tests"

# Parallel agents
sandcastle parallel \
  --task "auth:Implement authentication" \
  --task "api:Build REST API" \
  --task "tests:Write test suite"

# Interactive session
sandcastle interactive --prompt "Help me debug this issue"
```

**Common Use Cases:**
- Prototype and test algorithms
- Validate solutions before merging
- Run multiple feature branches in parallel
- Test code in isolation without affecting host
- Multi-stage development pipelines (plan → implement → test)

**See also:**
- `sandcastle/SKILL.md` - Complete framework documentation
- `sandcastle/scripts/` - Example workflows
- `bin/sandcastle/` - CLI tool and usage guide

---

### imagemagick
ImageMagick CLI for comprehensive image processing. Convert formats, resize and crop, apply effects and filters, adjust colors, create thumbnails, batch process, composite images, add text and watermarks.

**Location:** `imagemagick/`

---

### perplexity-search
Perplexity AI search for web search with AI-powered answers, deep research, and chain-of-thought reasoning. Multiple models from lightweight to expert-level analysis.

**Location:** `perplexity-search/`

---

### remember-as-you-go
Adaptive memory system that observes execution patterns and stores learnings in memory.md. Only creates memories when guesswork, errors, or exceptions occur. Helps AI refine execution by remembering non-obvious solutions, environment quirks, and tool interactions.

**Location:** `remember-as-you-go/`

**Key Features:**
- Reactive memory creation (only on errors or issues)
- Stores learnings in root `memory.md` file
- Captures non-obvious solutions and workarounds
- Prevents repeating mistakes across sessions
- Environment-specific quirk documentation

**When to Remember:**
- ✅ Errors, exceptions, workarounds
- ✅ Non-obvious flags or parameters
- ✅ Environment quirks, configuration issues
- ✅ Tool interaction problems
- ❌ Standard operations, documented behavior
- ❌ First-time successes without issues

**Quick Examples:**

```markdown
## FFmpeg MKV Requires Explicit Codecs

Converting to MKV without explicit codecs fails with "codec not supported".

Solution:
```bash
ffmpeg -i input.mp4 -c:v libx264 -c:a aac output.mkv
```

Context: MKV container requires explicit codec specification.

---
```

**See also:**
- `remember-as-you-go/SKILL.md` - Complete memory framework
- `remember-as-you-go/references/REFERENCE.md` - Memory patterns and templates
- `memory.md` - Root memory storage file

---

### create-source
Create, validate, and test new OSINT data sources for world event collection. Interactive wizard, validation scripts, and comprehensive testing framework guide authors through the complete source creation lifecycle. Automate source generation, ensure quality standards, and maintain source registry.

**Location:** `create-source/`

**Key Features:**
- Interactive source creation wizard
- Type-specific templates (Twitter, webpage, API, email, RSS)
- Front matter validation with quality scoring
- Connectivity and extraction testing
- AI helper prompts for guidance
- Automatic manifest management

**Quick Start:**

```bash
# Create new source interactively
node skills/create-source/scripts/create-source.js

# Validate source file
node skills/create-source/scripts/validate-source.js source/sources/my-source.md

# Test source connectivity and extraction
node skills/create-source/scripts/test-source.js source/sources/my-source.md

# Validate all sources
node skills/create-source/scripts/validate-source.js --all
```

**Source Types:**
- Twitter accounts (handles, timelines, searches)
- Webpages (scraping, crawling, selectors)
- APIs (REST, GraphQL, structured data)
- Email newsletters (IMAP, digests, alerts)
- RSS/Atom feeds (news feeds, blogs)
- Webhooks, websockets, files, databases

**See also:**
- `create-source/SKILL.md` - Complete framework
- `create-source/references/QUICK-REFERENCE.md` - Fast reference guide
- `create-source/references/AI-HELPERS.md` - AI assistance prompts
- `source/` - Source directory and examples

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
- `bin/data-to-markdown/` - Data-to-Markdown CLI utility
- `bin/ffmpeg/` - FFmpeg binary setup
- `bin/imagemagick/` - ImageMagick binary setup
- `bin/perplexity/` - Perplexity AI CLI wrapper
- `bin/sandcastle/` - Sandcastle CLI for isolated code execution

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
