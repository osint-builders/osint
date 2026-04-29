---
name: agent-browser
description: Automate browser navigation, interact with web pages, and extract data using Browserbase. Use for web scraping, automated form filling, screenshot capture, and intelligent web data extraction. Integrates with Browserbase API for reliable browser automation.
license: MIT
compatibility: Requires BROWSERBASE_API_KEY environment variable. Works with Node.js 18+.
metadata:
  author: osint-builders
  version: "1.0.0"
  provider: browserbase
---

# Agent Browser Skill

Automate web browser interactions and data extraction using Browserbase. This skill provides agents with capabilities to navigate websites, interact with page elements, extract data, and perform complex web automation tasks.

## Capabilities

### Session Management
- Create and manage browser sessions
- Handle session lifecycle and cleanup
- Track session state and status

### Navigation
- Navigate to URLs
- Handle browser history (back/forward)
- Reload pages
- Wait for page load states

### Page Interaction
- Click elements by selector
- Type text into input fields
- Fill form fields
- Select dropdown options
- Submit forms
- Scroll page

### Data Extraction
- Capture full-page and element screenshots
- Extract text content from page or specific elements
- Extract HTML content
- Parse page metadata (title, description, etc.)
- Extract all links from a page
- Execute JavaScript in page context
- Extract structured data using selectors

### Page Debugging
- Access console logs
- Capture JavaScript errors
- Inspect page state
- Get page performance metrics

## Usage Examples

### Basic Navigation and Screenshot
```
1. Create a browser session with createSession()
2. Navigate to a URL using navigate()
3. Wait for page to load
4. Capture screenshot with screenshot()
5. Close session with closeSession()
```

### Form Filling and Submission
```
1. Create session and navigate to form page
2. Use fill() to populate form fields
3. Use selectOption() for dropdowns
4. Use click() to submit the form
5. Extract results from confirmation page
```

### Data Extraction
```
1. Navigate to target website
2. Use extractText(), extractHTML(), or extractLinks()
3. Execute custom extraction scripts with executeScript()
4. Parse and structure extracted data
5. Handle pagination by navigating to next pages
```

## Environment Setup

Set the following environment variable:
```
BROWSERBASE_API_KEY=your_api_key_here
```

Obtain an API key from [Browserbase](https://www.browserbase.com).

## Error Handling

Common error scenarios:
- **Session timeout**: Automatically handled by Browserbase SDK
- **Page not found (404)**: Returned in response, agent should handle
- **JavaScript execution errors**: Captured in error logs
- **Network issues**: SDK includes retry logic

## Best Practices

1. **Session cleanup**: Always close sessions when done to avoid resource leaks
2. **Waits**: Use appropriate wait strategies before extracting data
3. **Selectors**: Use stable CSS selectors that won't change across page updates
4. **Timeouts**: Set reasonable timeouts to prevent hanging on slow pages
5. **Error recovery**: Implement retry logic for flaky operations
6. **Rate limiting**: Respect target website rate limits and robots.txt

## References

- See [REFERENCE.md](references/REFERENCE.md) for detailed API documentation
- See [scripts/](scripts/) for implementation examples
