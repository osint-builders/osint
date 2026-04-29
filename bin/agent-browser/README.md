# Agent Browser CLI & Binaries

Browserbase agent-browser executable and SDK binaries.

## Contents

- `cli.js` - Command-line interface entry point
- `index.js` - Programmatic entry point
- `node_modules/` - Browserbase SDK and dependencies
- `package.json` - Dependency manifest

## CLI Usage

From project root:

```bash
node bin/agent-browser/cli.js navigate https://example.com
node bin/agent-browser/cli.js screenshot https://example.com
node bin/agent-browser/cli.js extract-links https://example.com
```

Help:
```bash
node bin/agent-browser/cli.js --help
```

## Programmatic Usage

From project root:

```javascript
const { Browserbase } = require('./bin/agent-browser/index.js');

const client = new Browserbase({
  apiKey: process.env.BROWSERBASE_API_KEY,
});
```

## Environment Variables

Required:
- `BROWSERBASE_API_KEY` - Your Browserbase API key

Get from: https://www.browserbase.com

## See Also

- `../../skills/agent-browser/SKILL.md` - Skill documentation
- Browserbase docs: https://docs.browserbase.com
