# Skills

Agent skills for OSINT intelligence gathering and analysis. Each skill is a self-contained module that agents can activate and use.

## Available Skills

### agent-browser
Automate browser navigation, interact with web pages, and extract data using Browserbase. Use for web scraping, automated form filling, screenshot capture, and intelligent web data extraction.

**Location:** `agent-browser/`

**Key Capabilities:**
- Browser session management
- Page navigation and history
- Element interaction (click, type, select)
- Data extraction (text, HTML, links, metadata)
- Screenshot capture
- JavaScript execution
- Error and console log inspection

**Setup:**
```bash
export BROWSERBASE_API_KEY=your_api_key
```

**See also:**
- `agent-browser/SKILL.md` - Full skill documentation
- `agent-browser/references/REFERENCE.md` - API reference
- `agent-browser/scripts/` - Implementation examples

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

1. Create a new directory: `mkdir skills/my-skill`
2. Create `SKILL.md` with required frontmatter and instructions
3. Add scripts/ and references/ directories as needed
4. Update this README with the new skill description

Validate skills using:
```bash
skills-ref validate ./skills/my-skill
```
