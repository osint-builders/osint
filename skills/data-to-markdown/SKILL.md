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

# Data-to-Markdown Skill

Convert raw inputs (scraped HTML, API JSON, plain text, document extractions) into the Markdown that populates the `contents` field of a World Event Entity. The skill defines the writing style (E-PRIME), a minimal Markdown convention set, and pointers to per-format reference guides.

## When to use

Reach for this skill whenever you produce or rewrite the `contents` field of an event JSONL record — whether the source arrives as scraped HTML, a news API payload, a PDF extraction, or freeform notes. The skill ensures the output reads as precise, action-oriented Markdown rather than copy-pasted source prose.

Out of scope: schema definitions for the event itself (see `skills/word-event-entities/` and `data/SCHEMA.md`).

## Entry-point: the rule

The `contents` field MUST satisfy three constraints:

1. **Markdown** — well-formed, semantic, no raw HTML or scraper artifacts.
2. **≥100 words** — comprehensive enough to stand alone as event context.
3. **E-PRIME** — contains zero forms of *to be*: `is`, `are`, `was`, `were`, `be`, `been`, `being`, plus contractions (`it's`, `they're`, `aren't`, etc.).

E-PRIME forces concrete, agentive prose. Rewrite passive/copular sentences into action verbs.

**Violation:**
> The earthquake was devastating and many buildings were destroyed.

**Rewrite:**
> The earthquake devastated the region and destroyed thousands of buildings.

For the full E-PRIME rules, replacement patterns, and detection regex, see `references/eprime-guide.md` (canonical).

## Markdown conventions

Use ATX headings starting at `##` (the entity title supplies `#`); maintain hierarchy (no skipping levels). Separate paragraphs with a single blank line. Use fenced code blocks with language tags for code or data samples. Use `[label](url)` link syntax — never bare URLs or HTML anchors. Prefer bullet lists for parallel facts and tables for comparative data. Keep emphasis (`**bold**`, `*italic*`) sparing and meaningful; never decorative. Strip scraper residue: nav chrome, cookie banners, social-share widgets, tracking parameters in URLs.

## Pitfalls

- **Hidden E-PRIME violations**: contractions (`it's`, `there's`), participial forms (`being held`, `having been seen`), and quoted source text. Quoted speech remains exempt only when wrapped in blockquote/quote marks.
- **Excessive emphasis**: bolding every other phrase erodes signal. Limit to true keywords.
- **Vague headings**: `## Overview`, `## Information` add no structure. Use specific headings (`## Seismic Activity`, `## International Response`).
- **HTML leakage**: `<div>`, `&nbsp;`, `<br/>`, inline `style=` attributes from scrapers. Strip before formatting.
- **Word-count gaming**: padding with filler to reach 100 words. Add real context (location, timing, scale, sources) instead.

## See also

- `references/eprime-guide.md` — canonical E-PRIME rules, replacement table, and detection patterns.
- `references/html-conversion.md` — stripping HTML/scraper artifacts into clean Markdown.
- `references/document-conversion.md` — Word, PowerPoint, PDF extraction workflows.
- `references/text-conversion.md` — plain-text and freeform-notes normalization.
- `../word-event-entities/SKILL.md` and `../../data/SCHEMA.md` — the entity that consumes this Markdown.
