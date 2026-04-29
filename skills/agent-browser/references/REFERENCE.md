# Agent Browser Command Reference

Complete reference for agent-browser CLI commands.

## Quick Reference

```bash
# Navigation
agent-browser open <url>          # Navigate to URL
agent-browser back                # Go back
agent-browser forward             # Go forward
agent-browser reload              # Reload page

# Inspection
agent-browser snapshot            # Get accessibility tree with refs
agent-browser snapshot -i         # Interactive elements only
agent-browser get text @e1        # Get text from element
agent-browser get url             # Get current URL
agent-browser get title           # Get page title

# Interaction
agent-browser click @e1           # Click element
agent-browser fill @e1 "text"     # Fill input
agent-browser type @e1 "text"     # Type text
agent-browser select @e1 "val"    # Select option
agent-browser check @e1           # Check checkbox

# Data
agent-browser screenshot          # Take screenshot
agent-browser eval <js>           # Execute JavaScript
agent-browser get html @e1        # Get HTML

# Wait
agent-browser wait @e1            # Wait for element
agent-browser wait 2000           # Wait milliseconds

# Cleanup
agent-browser close               # Close browser
```

## Complete Command List

### Navigation

#### open
Navigate to a URL.

```bash
agent-browser open https://example.com
agent-browser open https://example.com --headed     # Show window
agent-browser open https://example.com --profile Default  # Use Chrome profile
```

Aliases: `navigate`, `goto`

#### back
Navigate backward in history.

```bash
agent-browser back
```

#### forward
Navigate forward in history.

```bash
agent-browser forward
```

#### reload
Reload the current page.

```bash
agent-browser reload
```

### Snapshots & Inspection

#### snapshot
Get accessibility tree with element references.

```bash
agent-browser snapshot              # Full tree
agent-browser snapshot -i           # Interactive only
agent-browser snapshot -c           # Compact (remove empty)
agent-browser snapshot -d 3         # Limit depth
agent-browser snapshot -s "#main"   # Scope to selector
agent-browser snapshot --json       # JSON output
```

Options:
- `-i, --interactive` - Only interactive elements
- `-c, --compact` - Remove empty structural elements
- `-d, --depth <n>` - Limit tree depth
- `-s, --selector <sel>` - Scope to element
- `-u, --urls` - Include URLs for links
- `--json` - Structured output

#### screenshot
Capture page screenshot.

```bash
agent-browser screenshot                    # Temp file
agent-browser screenshot page.png           # Custom path
agent-browser screenshot --full             # Full page
agent-browser screenshot --annotate         # With labels
agent-browser screenshot --annotate page.png  # Labeled, custom path
```

Options:
- `--full` - Full page screenshot
- `--annotate` - Add numbered element labels
- `--screenshot-format jpeg` - JPEG format
- `--screenshot-quality 80` - JPEG quality 0-100
- `--screenshot-dir ./shots` - Custom output directory

### Element Interaction

#### click
Click an element.

```bash
agent-browser click @e1                    # By ref
agent-browser click "#button"              # By CSS selector
agent-browser click "text=Submit"          # By text
agent-browser find role button click --name "Submit"  # By ARIA role
agent-browser click @e1 --new-tab          # Open in new tab
```

#### fill
Fill an input (clears existing content).

```bash
agent-browser fill @e1 "value"
agent-browser fill "#email" "test@example.com"
```

#### type
Type text into focused element (no selector).

```bash
agent-browser type "hello world"
```

#### select
Select option from dropdown.

```bash
agent-browser select @e1 "option-value"
agent-browser select "select[name=category]" "science"
```

#### check / uncheck
Toggle checkbox state.

```bash
agent-browser check @e1              # Check
agent-browser uncheck @e1            # Uncheck
```

#### hover
Hover over element.

```bash
agent-browser hover @e1
```

#### focus
Focus element.

```bash
agent-browser focus @e1
```

#### press
Press a keyboard key.

```bash
agent-browser press Enter
agent-browser press Tab
agent-browser press Control+a
```

Aliases: `key`

#### dblclick
Double-click element.

```bash
agent-browser dblclick @e1
```

#### drag
Drag and drop.

```bash
agent-browser drag @e1 @e2
```

#### upload
Upload files to input.

```bash
agent-browser upload @e1 file1.txt file2.txt
```

### Data Extraction

#### get text
Get text content.

```bash
agent-browser get text @e1              # From element
agent-browser get text                  # Full page text
```

#### get html
Get HTML content.

```bash
agent-browser get html @e1             # Element HTML
```

#### get value
Get input value.

```bash
agent-browser get value @e1
```

#### get attr
Get attribute value.

```bash
agent-browser get attr @e1 href
agent-browser get attr @e1 class
```

#### get title
Get page title.

```bash
agent-browser get title
```

#### get url
Get current URL.

```bash
agent-browser get url
```

#### eval
Execute JavaScript.

```bash
agent-browser eval "return document.title"
agent-browser eval "return document.querySelectorAll('a').length"
agent-browser eval "$(cat script.js)"     # From file
```

With base64 input:

```bash
agent-browser eval -b "cmV0dXJuIHdpbmRvdy5sb2NhdGlvbi5ocmVm"
```

### State Checks

#### is visible
Check if element is visible.

```bash
agent-browser is visible @e1
agent-browser is visible "#button"
```

#### is enabled
Check if element is enabled.

```bash
agent-browser is enabled @e1
```

#### is checked
Check if checkbox is checked.

```bash
agent-browser is checked @e1
```

### Wait

#### wait
Wait for element or condition.

```bash
agent-browser wait @e1                   # Wait for visibility
agent-browser wait 2000                  # Wait milliseconds
agent-browser wait --text "Welcome"      # Wait for text
agent-browser wait --url "**/dashboard"  # Wait for URL pattern
agent-browser wait --load networkidle    # Wait for network idle
agent-browser wait --fn "window.ready"   # Wait for JS condition
```

Options:
- `--text <text>` - Wait for text to appear
- `--url <pattern>` - Wait for URL pattern
- `--load <state>` - Load state: `load`, `domcontentloaded`, `networkidle`
- `--fn <js>` - Wait for JavaScript condition
- `--state <state>` - Element state: `visible`, `hidden`, `enabled`, `disabled`

### Batch Execution

#### batch
Execute multiple commands in one invocation.

```bash
agent-browser batch "open https://example.com" "snapshot -i" "screenshot"
agent-browser batch --bail "open https://example.com" "click @e1" "screenshot"
```

With JSON input:

```bash
echo '[["open", "https://example.com"], ["snapshot"], ["screenshot"]]' | agent-browser batch --json
```

### Cleanup

#### close
Close browser.

```bash
agent-browser close
agent-browser close --all      # Close all sessions
```

Aliases: `quit`, `exit`

### Sessions

#### session
Manage sessions.

```bash
agent-browser session              # Show current session
agent-browser session list         # List active sessions
agent-browser --session name1 open https://example.com  # Named session
```

### Authentication

#### cookies
Manage cookies.

```bash
agent-browser cookies              # Get all cookies
agent-browser cookies set name value
agent-browser cookies clear
```

#### state
Save/load browser state.

```bash
agent-browser state save ./auth.json     # Save
agent-browser state load ./auth.json     # Load
agent-browser state list                 # List saved states
agent-browser state show mystate         # Show state info
```

### Network

#### network
Network interception and monitoring.

```bash
agent-browser network requests            # View requests
agent-browser network route <url> --abort  # Block URL
agent-browser network har start            # Record HAR
agent-browser network har stop output.har  # Save HAR
```

### Debugging

#### console
View console messages.

```bash
agent-browser console              # Show logs
agent-browser console --clear      # Clear
agent-browser console --json       # JSON format
```

#### errors
View page errors.

```bash
agent-browser errors               # Show errors
agent-browser errors --clear       # Clear
```

#### trace
Record performance trace.

```bash
agent-browser trace start          # Start
agent-browser trace stop trace.json  # Stop and save
```

### Global Options

```
--session <name>              Use isolated session
--session-name <name>         Persistent session with auto-save
--profile <name|path>         Chrome profile
--state <path>                Load state from file
--headers <json>              Custom HTTP headers
--executable-path <path>      Custom browser executable
--proxy <url>                 Proxy server
--headed                      Show browser window
--json                        JSON output
--timeout <ms>                Operation timeout
--verbose                     Verbose output
--help                        Show help
--version                     Show version
```

## Selector Types

### Refs (Recommended)
Stable element references from snapshot.

```bash
agent-browser click @e1
agent-browser fill @e2 "text"
```

### CSS Selectors
Standard CSS selectors.

```bash
agent-browser click "#id"
agent-browser click ".class"
agent-browser click "button:first-child"
```

### Text
Match by text content.

```bash
agent-browser click "text=Submit"
```

### XPath
XPath expressions.

```bash
agent-browser click "xpath=//button[@id='submit']"
```

### Semantic Locators
ARIA role and accessible name.

```bash
agent-browser find role button click --name "Submit"
agent-browser find label "Email" fill "test@example.com"
```

## Examples

### Login Workflow
```bash
agent-browser open https://app.example.com/login
agent-browser snapshot -i
agent-browser fill @e1 "user@example.com"  # Email
agent-browser fill @e2 "password123"       # Password
agent-browser click @e3                    # Login button
agent-browser wait --load networkidle
agent-browser screenshot dashboard.png
```

### Data Scraping
```bash
agent-browser open https://example.com/products
agent-browser snapshot -i
agent-browser eval "return Array.from(document.querySelectorAll('.product')).map(p => p.textContent)"
```

### Screenshot with Annotations
```bash
agent-browser open https://example.com
agent-browser screenshot --annotate page.png
# Now refs @e1, @e2, @e3... correspond to labeled elements
agent-browser click @e2
```

## Environment Variables

```
AGENT_BROWSER_SESSION              Session name
AGENT_BROWSER_SESSION_NAME         Persistent session name
AGENT_BROWSER_PROFILE              Chrome profile
AGENT_BROWSER_HEADED               Show window (true/false)
AGENT_BROWSER_TIMEOUT              Timeout in ms
AGENT_BROWSER_PROXY                Proxy URL
AGENT_BROWSER_PROVIDER             Cloud provider
```

## Related

- Repository: https://github.com/vercel-labs/agent-browser
- Skills: https://agentskills.io/specification
