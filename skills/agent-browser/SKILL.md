---
name: agent-browser
description: Native Rust CLI for browser automation by Vercel Labs. Automate web navigation, interact with page elements, extract data, capture screenshots, and execute JavaScript. Use for web scraping, form automation, testing, and data extraction workflows. Optimal for AI agents with ref-based element selection and accessibility tree output.
license: Apache-2.0
compatibility: linux (warp-cloud-agent-env-image)
metadata:
  author: osint-builders
  version: "1.0.0"
  provider: vercel-labs
  upstream: "https://github.com/vercel-labs/agent-browser"
---

# Agent Browser

`snapshot` generates stable refs (`[ref=e1]`) — no brittle CSS selectors.

## When to use

Web/tweet scraping, form interaction, screenshot capture, JS execution, any source requiring a real browser.

## Entry-point Commands

The active Qualify environment does not preinstall this optional tool. When
`curl` cannot retrieve the needed evidence, use the project's on-demand path:

```bash
npx --yes agent-browser@0.27.0 install
npx --yes agent-browser@0.27.0 open https://example.com
```

Keep this version pinned for the Node 20 environment.
If npm or the browser install fails, record the failure in the tip notes and
reject that candidate; do not block the batch or attempt interactive repair.

Core workflow:

```bash
npx --yes agent-browser@0.27.0 open https://example.com
npx --yes agent-browser@0.27.0 snapshot -i   # interactive elements + refs
npx --yes agent-browser@0.27.0 fill @e2 "value"
npx --yes agent-browser@0.27.0 click @e1
npx --yes agent-browser@0.27.0 screenshot result.png
npx --yes agent-browser@0.27.0 close
```

Key commands:

| Group | Commands |
|-------|---------|
| Navigation | `open <url>`, `back`, `forward`, `reload` |
| Snapshot | `snapshot` (full), `snapshot -i` (interactive), `snapshot -c` (compact) |
| Interact | `click @e1`, `fill @e1 "text"`, `type @e1 "text"`, `select @e1 "val"`, `hover @e1`, `check @e1` |
| Data | `get text @e1`, `get html @e1`, `get attr @e1 href`, `eval "return document.title"` |
| Wait | `wait @e1`, `wait 2000`, `wait --text "str"`, `wait --load networkidle` |
| State | `is visible @e1`, `is enabled @e1`, `is checked @e1` |
| Session | `--session <name>` (isolate instances), `close`, `close --all` |

`--json` → structured output.

## Pitfalls

- Always snapshot after navigation — page may have changed.
- Use `wait --load networkidle` before interacting with dynamic content.
- Always `close` sessions to free resources.
- Timeout default: 25s. Override: `AGENT_BROWSER_DEFAULT_TIMEOUT=45000`.
- Element missing → snapshot again, then retry.

## See also

- `references/REFERENCE.md` — complete command reference
- `skills/data-to-markdown/SKILL.md` — scraped content to Markdown
- Upstream docs: https://agent-browser.dev
