---
name: data-to-markdown
description: Transform raw scraped or API data into clean, semantic Markdown for the `contents` field of a World Event Entity. Enforces E-PRIME (no forms of "to be") and a small set of structural conventions.
license: MIT
compatibility: linux (warp-cloud-agent-env-image)
metadata:
  author: osint-builders
  version: "2.0.0"
  conversion-framework: data-to-markdown
---

# Data-to-Markdown

Raw input → `contents` Markdown. E-PRIME style, minimal conventions, format pointers.

## When to use

Use for any `contents` field write — HTML, JSON, PDF, freeform notes. Output: precise, active Markdown, not source prose. Schema: `skills/word-event-entities/`, `data/SCHEMA.md`.

**Non-English content**: translate `title`, `summary`, and body text to English before applying Markdown conventions or E-PRIME. Agent translates directly. Preserve proper nouns verbatim.

## Entry-point: the rule

`contents` MUST satisfy three constraints:

1. **Markdown** — well-formed, no raw HTML or scraper artifacts.
2. **≥100 words** — standalone event context.
3. **E-PRIME** — zero forms of *to be*: `is`, `are`, `was`, `were`, `be`, `been`, `being`, plus contractions (`it's`, `they're`, `aren't`, etc.).

E-PRIME = active verbs. Rewrite passive → action.

**Violation:** > The earthquake was devastating and many buildings were destroyed.
**Rewrite:** > The earthquake devastated the region and destroyed thousands of buildings.

Full rules: `references/eprime-guide.md`.

## Markdown conventions

Headings `##`+ (entity title supplies `#`); no level-skipping. One blank line between paragraphs. Fenced code blocks with lang tags. `[label](url)` — no bare URLs. Bullet lists for facts, tables for comparisons. Sparing `**bold**`/`*italic*`. Strip: nav chrome, cookie banners, tracking params.

## Pitfalls

- **Hidden violations**: contractions (`it's`, `there's`), participials (`being held`). Quoted speech exempt if in blockquote/quote marks.
- **Excessive emphasis**: limit bold to true keywords.
- **Vague headings**: `## Overview` adds nothing. Use `## Seismic Activity`.
- **HTML leakage**: `<div>`, `&nbsp;`, `<br/>` from scrapers — strip before formatting.
- **Word-count gaming**: add real context (location, timing, scale) not filler.

## See also

- `references/eprime-guide.md` — E-PRIME rules, replacement table, detection regex.
- `references/html-conversion.md` — strip HTML/scraper artifacts.
- `references/document-conversion.md` — Word, PDF, PowerPoint extraction.
- `references/text-conversion.md` — plain-text normalization.
- `../word-event-entities/SKILL.md`, `../../data/SCHEMA.md` — entity consuming this Markdown.
