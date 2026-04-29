# Agent Browser CLI

Native Rust CLI for browser automation by Vercel Labs.

## Installation

Install the agent-browser CLI globally:

```bash
npm install -g agent-browser
agent-browser install  # Download Chrome from Chrome for Testing
```

Or from Homebrew (macOS):

```bash
brew install agent-browser
agent-browser install
```

## Quick Start

From project root:

```bash
# Navigate and snapshot
node bin/agent-browser/cli.js open example.com
node bin/agent-browser/cli.js snapshot -i

# Interact with elements
node bin/agent-browser/cli.js click @e1
node bin/agent-browser/cli.js fill @e2 "input text"

# Take screenshot
node bin/agent-browser/cli.js screenshot page.png

# Close browser
node bin/agent-browser/cli.js close
```

Or use directly if agent-browser is in PATH:

```bash
agent-browser open example.com
agent-browser snapshot -i
agent-browser screenshot
agent-browser close
```

## Core Commands

```
agent-browser open <url>         # Launch browser and navigate
agent-browser snapshot           # Get accessibility tree with refs
agent-browser click @e1          # Click by ref
agent-browser fill @e1 "text"    # Fill input
agent-browser type @e1 "text"    # Type text
agent-browser screenshot         # Take screenshot
agent-browser screenshot --annotate  # Screenshot with element labels
agent-browser eval <js>          # Execute JavaScript
agent-browser get text @e1       # Get text from element
agent-browser is visible @e1     # Check if visible
agent-browser wait "@e1"         # Wait for element
agent-browser close              # Close browser
```

## Element References

Use refs for deterministic element selection:

```bash
# Get snapshot with element refs
agent-browser snapshot -i

# Output example:
# - button "Submit" [ref=e1]
# - input "Email" [ref=e2]

# Interact using refs
agent-browser click @e1
agent-browser fill @e2 "test@example.com"
```

## Advanced Features

- **Sessions**: `--session <name>` - Multiple isolated browser instances
- **Authentication**: `--profile <name|path>` - Chrome profile reuse or persistent state
- **Headers**: `--headers '{"Authorization": "Bearer token"}'` - Custom HTTP headers
- **Proxy**: `--proxy <url>` - Route through proxy
- **Headless**: Default. Use `--headed` for visible window
- **Cloud Providers**: `-p browserbase`, `-p browserless`, etc.

## Environment Variables

```
AGENT_BROWSER_SESSION          # Session name
AGENT_BROWSER_PROFILE          # Chrome profile
AGENT_BROWSER_HEADED           # Show browser window
AGENT_BROWSER_TIMEOUT          # Operation timeout
```

## Agent Workflow

**Optimal AI workflow:**

```bash
# 1. Navigate and get snapshot
agent-browser open https://example.com
agent-browser snapshot -i

# 2. AI identifies target elements and refs
# 3. Execute actions using refs
agent-browser click @e2
agent-browser fill @e3 "user@example.com"

# 4. Take screenshot or get new snapshot
agent-browser screenshot
```

## Documentation

- **Official Docs**: https://github.com/vercel-labs/agent-browser
- **Commands**: `agent-browser --help`
- **Skills**: `agent-browser skills get agent-browser`

## Related

- GitHub: https://github.com/vercel-labs/agent-browser
- Agent Skills: https://agentskills.io
