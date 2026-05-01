---
name: word-event-entities
description: Build and validate World Event Entity records (JSONL) representing real-world events with structured metadata, source attribution, and geographic context. Defers to data/SCHEMA.md as the canonical schema.
license: MIT
compatibility: 'Linux (Ubuntu base)'
metadata:
  author: osint-builders
  version: "2.0.0"
  entity-type: world-event
---

# World Event Entities Skill

Thin pointer skill for the World Event Entity model. The **canonical schema lives at `data/SCHEMA.md`** — consult it first for field types, constraints, and examples. This file provides only the operational summary needed when building or validating event records.

## When to use

Use this skill when building, validating, or reviewing event JSONL records (one event per line) destined for the OSINT event store. Pair with the `data-to-markdown` skill for the `contents` field.

## Required fields

`id`, `source`, `title`, `summary`, `contents`, `date_published`, `links`, `image_urls`, `geo`.

(Note: `geo` appears under "Optional Fields" in the schema, but this repo's validator treats it as required with `geo.lat` and `geo.lon` mandatory — see Validation rule below.)

## Optional fields

`date_event`, `topics`, `confidence`, `ingested_at`.

## ID format

`evt_YYYYMMDD_NNN` — e.g. `evt_20260429_001`. Date reflects the event-publication date; `NNN` is a zero-padded sequence within that day.

## Validation rule

Every event MUST pass `data/scripts/validate-events.js`. The validator enforces:

- Schema conformance per `data/SCHEMA.md`.
- `geo.lat` and `geo.lon` present and numeric.
- `contents` written in Markdown, ≥100 words, fully E-PRIME compliant (no `is`/`are`/`was`/`were`/`be`/`been`/`being` or their contractions).
- `date_published` as ISO 8601 UTC (`YYYY-MM-DDTHH:mm:ssZ`).

Run from repo root:

```bash
node data/scripts/validate-events.js path/to/events.jsonl
```

## See also

- **`data/SCHEMA.md`** — canonical schema (field types, constraints, JSON examples, validation rules). Always consult first.
- `references/REFERENCE.md` — extended characterization notes, design rationale, and edge cases.
- `../data-to-markdown/SKILL.md` — how to author the `contents` field.
