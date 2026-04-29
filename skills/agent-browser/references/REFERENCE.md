# Agent Browser API Reference

## Session Management

### createSession(projectId: string): Promise<BrowserSession>
Creates a new browser session.

**Parameters:**
- `projectId`: Your Browserbase project ID

**Returns:**
```
{
  id: string,
  projectId: string,
  status: 'active' | 'closed',
  createdAt: string
}
```

**Example:**
```
const session = await createSession('my-project-id');
```

### closeSession(session: BrowserSession): Promise<void>
Closes an active browser session.

**Parameters:**
- `session`: The session object to close

**Example:**
```
await closeSession(session);
```

### getStatus(session: BrowserSession): Promise<BrowserSession>
Gets the current status of a session.

**Parameters:**
- `session`: The session object

**Returns:** Updated session object with current status

---

## Navigation

### navigate(session: BrowserSession, options: NavigateOptions): Promise<void>
Navigates to a URL.

**Parameters:**
- `session`: Browser session
- `options`:
  - `url`: string (required) - URL to navigate to
  - `timeout`: number (optional) - Navigation timeout in milliseconds

**Example:**
```
await navigate(session, { url: 'https://example.com' });
```

### goBack(session: BrowserSession): Promise<void>
Navigates backward in browser history.

### goForward(session: BrowserSession): Promise<void>
Navigates forward in browser history.

### reload(session: BrowserSession): Promise<void>
Reloads the current page.

---

## Page Interaction

### click(session: BrowserSession, selector: string): Promise<void>
Clicks on an element matching the selector.

**Parameters:**
- `session`: Browser session
- `selector`: CSS selector string

**Example:**
```
await click(session, 'button.submit');
```

### type(session: BrowserSession, selector: string, text: string): Promise<void>
Types text into an input element.

**Parameters:**
- `session`: Browser session
- `selector`: CSS selector for input element
- `text`: Text to type

**Example:**
```
await type(session, 'input[name="email"]', 'user@example.com');
```

### fill(session: BrowserSession, selector: string, value: string): Promise<void>
Fills an input field (clears existing content first).

**Parameters:**
- `session`: Browser session
- `selector`: CSS selector for input element
- `value`: Value to fill

### selectOption(session: BrowserSession, selector: string, value: string): Promise<void>
Selects an option from a dropdown.

**Parameters:**
- `session`: Browser session
- `selector`: CSS selector for select element
- `value`: Option value to select

---

## Data Extraction

### screenshot(session: BrowserSession, options?: ScreenshotOptions): Promise<Buffer>
Captures a screenshot of the page.

**Parameters:**
- `session`: Browser session
- `options` (optional):
  - `fullPage`: boolean - Capture entire page (default: true)
  - `format`: 'png' | 'jpeg' (default: 'png')

**Returns:** Screenshot as buffer

**Example:**
```
const screenshot = await screenshot(session, { fullPage: true });
```

### extractText(session: BrowserSession, options?: ExtractOptions): Promise<string>
Extracts text content from the page or element.

**Parameters:**
- `session`: Browser session
- `options` (optional):
  - `selector`: CSS selector to extract from (default: entire page)

**Returns:** Extracted text as string

**Example:**
```
const text = await extractText(session, { selector: 'main' });
```

### extractHTML(session: BrowserSession, options?: ExtractOptions): Promise<string>
Extracts HTML content.

**Parameters:**
- `session`: Browser session
- `options` (optional):
  - `selector`: CSS selector (default: entire page)
  - `attribute`: Attribute to extract (optional)

**Returns:** HTML as string

### extractMetadata(session: BrowserSession): Promise<Record<string, string>>
Extracts page metadata (title, description, og:image, etc.).

**Parameters:**
- `session`: Browser session

**Returns:** Object with metadata key-value pairs

### extractLinks(session: BrowserSession): Promise<string[]>
Extracts all links from the page.

**Parameters:**
- `session`: Browser session

**Returns:** Array of URLs

**Example:**
```
const links = await extractLinks(session);
```

### executeScript(session: BrowserSession, script: string): Promise<unknown>
Executes JavaScript in the page context.

**Parameters:**
- `session`: Browser session
- `script`: JavaScript code to execute

**Returns:** Result of script execution

**Example:**
```
const result = await executeScript(session, 'return document.title;');
```

---

## Debugging

### getConsoleLogs(session: BrowserSession): Promise<string[]>
Gets all console logs from page execution.

**Parameters:**
- `session`: Browser session

**Returns:** Array of console log messages

### getErrors(session: BrowserSession): Promise<string[]>
Gets all JavaScript errors from page execution.

**Parameters:**
- `session`: Browser session

**Returns:** Array of error messages
