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

Use for any `contents` field write — HTML, JSON, PDF, freeform notes. Output: precise, active Markdown, not source prose. Schema: `skills/world-event-entities/`, `data/SCHEMA.md`.

**Non-English content**: translate `title`, `summary`, and body text to English before applying Markdown conventions or E-PRIME. Agent translates directly. Preserve proper nouns verbatim.

## Entry-point: the rule

New qualified `contents` MUST satisfy these constraints:

1. **Markdown** — the fixed H2 sections in `builder/prompts/qualified-event-contract.md`, in order, with no raw HTML, entities, or scraper artifacts.
2. **≥100 evidence-grounded prose words** — reject a candidate whose available facts cannot support that length; never pad or invent.
3. **E-PRIME** — zero forms of *to be*: `is`, `are`, `was`, `were`, `be`, `been`, `being`, plus contractions (`it's`, `they're`, `aren't`, etc.).

E-PRIME = active verbs. Rewrite passive → action.

**Violation:** > The earthquake was devastating and many buildings were destroyed.
**Rewrite:** > The earthquake devastated the region and destroyed thousands of buildings.

Full rules: `references/eprime-guide.md`.

## Markdown conventions

Use the contract's five H2 headings exactly, with short evidence-grounded paragraphs under each. Put source URLs in `links[]` rather than bare links in the body. Keep markup simple and remove nav chrome, cookie banners, and tracking text.

## Pitfalls

- **Hidden violations**: contractions (`it's`, `there's`), participials (`being held`). The validator checks quoted text too; paraphrase source quotations when needed.
- **Excessive emphasis**: limit bold to true keywords.
- **Extra headings**: new qualified events use only the contract's five H2 sections.
- **HTML leakage**: `<div>`, `&nbsp;`, `<br/>` from scrapers — strip before formatting.
- **Word-count gaming**: add real context (location, timing, scale) not filler.

## See also

- `references/eprime-guide.md` — E-PRIME rules, replacement table, detection regex.
- `references/html-conversion.md` — strip HTML/scraper artifacts.
- `references/document-conversion.md` — Word, PDF, PowerPoint extraction.
- `references/text-conversion.md` — plain-text normalization.
- `../world-event-entities/SKILL.md`, `../../data/SCHEMA.md` — entity consuming this Markdown.
