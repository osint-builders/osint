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
- Upstream: https://github.com/vercel-labs/agent-browser

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

## Skill Validation

Validate all skills:
```bash
npx skills-ref validate ./skills/agent-browser
```

Check that:
- `SKILL.md` has valid frontmatter
- Name matches directory name
- Description is descriptive
- All file references are valid
