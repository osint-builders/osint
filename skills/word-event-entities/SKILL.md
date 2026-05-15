---
name: word-event-entities
description: Build and validate World Event Entity records (JSONL) representing real-world events with structured metadata, source attribution, and geographic context. Defers to data/SCHEMA.md as the canonical schema.
license: MIT
compatibility: linux (warp-cloud-agent-env-image)
metadata:
  author: osint-builders
  version: "2.0.0"
  entity-type: world-event
---

# World Event Entities

Schema pointer. **Canonical schema: `data/SCHEMA.md`** — consult first. This file: operational summary only.

## When to use

Building/validating event JSONL for OSINT event store. Pair `data-to-markdown` for `contents`.

## Required fields

`id`, `source`, `title`, `summary`, `contents`, `date_published`, `links`, `image_urls`, `geo`.

(`geo` listed optional in schema but validator requires `geo.lat`/`geo.lon`.)

## Optional fields

`date_event`, `topics`, `confidence`, `ingested_at`.

## ID format

`evt_YYYYMMDD_NNN` (e.g. `evt_20260429_001`). Date = pub date; `NNN` = zero-padded day sequence.

## Validation rule

Run `data/scripts/validate-events.js`. Enforces:

- Schema conformance per `data/SCHEMA.md`.
- `geo.lat` and `geo.lon` present and numeric.
- `contents`: Markdown, ≥100 words, fully E-PRIME (no `is`/`are`/`was`/`were`/`be`/`been`/`being` or contractions).
- `date_published` as ISO 8601 UTC (`YYYY-MM-DDTHH:mm:ssZ`).

```bash
node data/scripts/validate-events.js path/to/events.jsonl
```

## See also

- **`data/SCHEMA.md`** — canonical schema. Consult first.
- `../data-to-markdown/SKILL.md` — `contents` field authoring.
