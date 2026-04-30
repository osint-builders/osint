---
name: agent-browser
description: Native Rust CLI for browser automation by Vercel Labs. Automate web navigation, interact with page elements, extract data, capture screenshots, and execute JavaScript. Use for web scraping, form automation, testing, and data extraction workflows. Optimal for AI agents with ref-based element selection and accessibility tree output.
license: Apache-2.0
compatibility: Requires native agent-browser CLI installed globally. Works on macOS, Linux, Windows. Node.js 18+ for wrapper scripts.
metadata:
  author: osint-builders
  version: "1.0.0"
  provider: vercel-labs
  upstream: "https://github.com/vercel-labs/agent-browser"
---

# Agent Browser Skill

High-performance browser automation CLI for AI agents. Built in Rust by Vercel Labs, agent-browser provides deterministic element selection, accessibility tree snapshots, and fast command execution.

## Key Features

### Deterministic Element Selection (Refs)
- **Snapshot + refs workflow** — `snapshot` generates accessibility tree with stable element references
- **Example**: `snapshot` outputs element `[ref=e1]` → interact with `click @e1`
- Ideal for AI agents — no brittle CSS selectors, deterministic references

### Page Navigation
- Navigate to URLs: `open <url>`
- History navigation: `back`, `forward`, `reload`
- Wait strategies: `wait <selector>`, `wait --load networkidle`

### Element Interaction
- **Click**: `click @e1` (or CSS selector, semantic locators)
- **Type/Fill**: `fill @e1 "text"`, `type @e1 "text"`
- **Select**: `select @e1 "option"`
- **Hover/Focus**: `hover @e1`, `focus @e1`
- **Check/Uncheck**: `check @e1`, `uncheck @e1`
- **Drag/Drop**: `drag @e1 @e2`
- **Upload**: `upload @e1 file1.txt file2.txt`

### Data Extraction
- **Snapshot**: `snapshot` (full tree), `snapshot -i` (interactive only), `snapshot -c` (compact)
- **Text/HTML**: `get text @e1`, `get html @e1`
- **Attributes**: `get attr @e1 href`
- **Screenshots**: `screenshot page.png`, `screenshot --full`, `screenshot --annotate`
- **JavaScript**: `eval "return document.title"`
- **Metadata**: `get title`, `get url`, `get count <selector>`

### Advanced Features
- **Sessions**: Isolate multiple browser instances with `--session <name>`
- **Authentication**: Chrome profile reuse `--profile`, persistent state `--session-name`
- **HTTP Headers**: Custom headers with `--headers '{"Authorization": "Bearer token"}'`
- **Proxy**: Route through proxy with `--proxy <url>`
- **Cloud Providers**: Browserbase, Browserless, Browser Use, Kernel, AgentCore
- **Mobile**: iOS device emulation with `-p ios --device "iPhone 16 Pro"`

## Usage Examples

### Basic Workflow

```bash
# 1. Launch browser and navigate
agent-browser open https://example.com

# 2. Get accessibility tree with element refs
agent-browser snapshot -i
# Output:
# - button "Submit" [ref=e1]
# - input "Email" [ref=e2]
# - link "Login" [ref=e3]

# 3. Interact using refs
agent-browser fill @e2 "user@example.com"
agent-browser click @e1

# 4. Capture result
agent-browser screenshot result.png
agent-browser close
```

### Form Filling

```bash
agent-browser open https://example.com/contact
agent-browser snapshot -i                        # Get form elements
agent-browser fill @e1 "John Doe"                # Name
agent-browser fill @e2 "john@example.com"        # Email
agent-browser select @e3 "General Inquiry"       # Category dropdown
agent-browser click @e4                          # Submit button
agent-browser wait --text "Thank you"            # Wait for confirmation
agent-browser screenshot confirmation.png
```

### Data Extraction

```bash
agent-browser open https://news-site.com
agent-browser snapshot --compact              # Tree view
agent-browser get text ".articles"            # Extract text from articles section
agent-browser eval "return document.querySelectorAll('a.article').map(a => a.href)"  # Get all article URLs
agent-browser screenshot page.png
```

### Multi-Step Navigation

```bash
agent-browser open https://shop.example.com
agent-browser snapshot -i                        # Get products
agent-browser click @e2                          # Click product
agent-browser wait 2000                          # Wait for details to load
agent-browser screenshot product.png
agent-browser back                               # Go back to list
```

### Screenshot Annotation

```bash
# Annotated screenshot with numbered element labels
agent-browser screenshot --annotate page.png

# Output:
# Screenshot saved to page.png
# [1] @e1 button "Submit"
# [2] @e2 input "Email"
# [3] @e3 link "Home"

# Use refs immediately after
agent-browser click @e2
agent-browser fill @e2 "test@example.com"
```

## Installation

### Global Install (Recommended)

```bash
npm install -g agent-browser
agent-browser install  # Download Chrome from Chrome for Testing
```

### Homebrew (macOS)

```bash
brew install agent-browser
agent-browser install
```

## Key Commands

### Navigation
- `open <url>` — Launch browser + navigate
- `back` — Navigate backward
- `forward` — Navigate forward
- `reload` — Reload page
- `pushstate <url>` — SPA client-side navigation

### Inspection
- `snapshot` — Full accessibility tree with refs
- `snapshot -i` — Interactive elements only
- `snapshot -c` — Compact mode (remove empty elements)
- `snapshot -d <n>` — Limit tree depth
- `screenshot` — Take screenshot
- `screenshot --annotate` — Annotated screenshot with element labels

### Interaction
- `click @e1` — Click element
- `fill @e1 "text"` — Clear and fill input
- `type @e1 "text"` — Type without clearing
- `select @e1 "value"` — Select dropdown option
- `hover @e1` — Hover element
- `focus @e1` — Focus element
- `check @e1` / `uncheck @e1` — Toggle checkbox

### Data
- `get text @e1` — Get text content
- `get html @e1` — Get HTML
- `get value @e1` — Get input value
- `get attr @e1 <attr>` — Get attribute
- `eval <js>` — Execute JavaScript
- `get title` — Page title
- `get url` — Current URL

### State Checks
- `is visible @e1` — Check visibility
- `is enabled @e1` — Check if enabled
- `is checked @e1` — Check if checked

### Wait
- `wait @e1` — Wait for element visible
- `wait 2000` — Wait N milliseconds
- `wait --text "text"` — Wait for text
- `wait --load networkidle` — Wait for page load

### Cleanup
- `close` — Close browser
- `close --all` — Close all sessions

## Advanced Options

```bash
# Sessions (isolated instances)
agent-browser --session agent1 open https://site-a.com
agent-browser --session agent2 open https://site-b.com

# Authentication (Chrome profile)
agent-browser --profile Default open https://gmail.com

# Persistent state
agent-browser --session-name myapp open https://app.com

# Custom headers (e.g., Bearer token)
agent-browser --headers '{"Authorization": "Bearer <token>"}' open https://api.example.com

# Headless (default) vs headed (show window)
agent-browser --headed open https://example.com

# Proxy
agent-browser --proxy http://localhost:8080 open https://example.com

# Cloud provider (e.g., Browserbase)
export BROWSERBASE_API_KEY=<key>
agent-browser -p browserbase open https://example.com
```

## JSON Output (For Agents)

All commands support `--json` for structured output:

```bash
agent-browser snapshot -i --json
# Returns: {"success":true,"data":{"snapshot":"...","refs":{"e1":{"role":"button","name":"Submit"}}}}

agent-browser get text @e1 --json
agent-browser is visible @e2 --json
```

## Error Handling

- **Timeout**: Default 25 seconds per operation. Override with `AGENT_BROWSER_DEFAULT_TIMEOUT=45000`
- **Network issues**: SDK auto-retries. Set `--session-name` to persist cookies across failures
- **Missing element**: Snapshot again if page changed. Use `wait` before interaction on dynamic content
- **Auth**: Use `--profile` for browser session reuse, `--session-name` for automatic state persistence

## Best Practices

1. **Always snapshot after navigation** — Elements may have changed
2. **Use refs from snapshot** — More reliable than CSS selectors
3. **Wait for load states** — Use `wait --load networkidle` after navigation
4. **Close sessions** — Always call `close` to clean up
5. **Prefer interactive-only snapshots** — `snapshot -i` for cleaner AI input
6. **Session isolation** — Use `--session` for independent browser instances
7. **Annotated screenshots** — Use `screenshot --annotate` for multimodal AI models

## Environment Variables

```
AGENT_BROWSER_SESSION              Session name
AGENT_BROWSER_SESSION_NAME         Persistent session name (auto-save/restore)
AGENT_BROWSER_PROFILE              Chrome profile name or path
AGENT_BROWSER_HEADED               Show browser window (true/false)
AGENT_BROWSER_DEFAULT_TIMEOUT      Operation timeout in ms (default: 25000)
AGENT_BROWSER_PROXY                Proxy URL
AGENT_BROWSER_PROVIDER             Cloud provider (browserbase, browserless, etc.)
BROWSERBASE_API_KEY                Browserbase API key (when using -p browserbase)
```

## References

- See [REFERENCE.md](references/REFERENCE.md) for complete command reference
- See [scripts/](scripts/) for workflow examples
- Official repository: https://github.com/vercel-labs/agent-browser
- Official docs: https://agent-browser.dev

## Related Tools & Skills

### Skills
- **image-extraction** - Standardized workflow for webpage screenshot capture and processing
- **data-to-markdown** - Convert scraped content to structured Markdown
- **imagemagick** - Post-process screenshots and visual assets
- **ffmpeg-cli** - Create video recordings of browser automation sessions
- **remember-as-you-go** - Capture Chrome installation issues, auth quirks, session persistence patterns

### System CLIs
- `curl` / `wget` - Simple HTTP requests without browser overhead
- `jq` - Parse JSON output from `--json` flag

### Integration Hints
```bash
# Scrape → Convert → Format pipeline
agent-browser get html @e1 > page.html
pandoc page.html -t markdown -o output.md

# Screenshot → Annotate workflow
agent-browser screenshot page.png
magick page.png -pointsize 20 -annotate +10+10 "Note" annotated.png
```

## License

Apache-2.0 (upstream: Vercel Labs)
