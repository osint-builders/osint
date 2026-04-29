# Agent Skills

Agent-driven capabilities for OSINT intelligence gathering and analysis.

## Available Skills

### Agent Browser
Browserbase-powered browser automation and web scraping for automated intelligence gathering.

**File**: `agent-browser.ts`
**Manifest**: `manifest.json`

#### Navigation Skills
- `navigate(session, options)` - Navigate to URLs
- `goBack(session)` - Navigate backward in history
- `goForward(session)` - Navigate forward in history
- `reload(session)` - Reload current page

#### Interaction Skills
- `click(session, selector)` - Click on elements
- `type(session, selector, text)` - Type text into fields
- `fill(session, selector, value)` - Fill form fields
- `selectOption(session, selector, value)` - Select dropdown options

#### Data Extraction Skills
- `screenshot(session, options)` - Capture page screenshots
- `extractText(session, options)` - Extract text content
- `extractHTML(session, options)` - Extract HTML content
- `extractMetadata(session)` - Extract page metadata
- `extractLinks(session)` - Extract links from page

#### Session Management Skills
- `createSession(projectId)` - Create new browser session
- `closeSession(session)` - Close browser session
- `getStatus(session)` - Get session status

#### Debug Skills
- `getConsoleLogs(session)` - Get page console logs
- `getErrors(session)` - Get page errors
- `executeScript(session, script)` - Execute JavaScript in page

## Setup

1. Install Browserbase SDK:
   ```bash
   npm install @browserbasehq/sdk
   ```

2. Set up environment variables:
   ```
   BROWSERBASE_API_KEY=your_api_key_here
   ```

3. Import skills in your agent code:
   ```typescript
   import { AgentBrowserSkills } from './skills/agent-browser';
   ```

## Implementation Status

All skills are currently templated with placeholder implementations. Update the skill functions with actual Browserbase SDK calls.
