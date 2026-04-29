# Agent Browser Binaries

This directory contains the compiled Browserbase agent-browser binaries and dependencies.

## Contents

- `node_modules/` - Browserbase SDK and dependencies
- `package.json` - Dependency manifest
- `package-lock.json` - Locked dependency versions
- `index.js` - Entry point

## Usage

From the project root:

```javascript
const agentBrowser = require('./bin/index.js');
const { Browserbase } = agentBrowser;

const client = new Browserbase({
  apiKey: process.env.BROWSERBASE_API_KEY,
});
```

## Browserbase SDK

The Browserbase SDK provides:
- Session management
- Browser automation
- Page interaction
- Data extraction
- Screenshot capture

See [Browserbase Documentation](https://docs.browserbase.com) for complete API reference.

## Environment Variables

Required:
- `BROWSERBASE_API_KEY` - Your Browserbase API key

Obtain from: https://www.browserbase.com
