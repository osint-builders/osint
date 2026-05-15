---
name: create-source
description: Authoring tool for creating new OSINT data sources. Provides templates, validation, and tests for source files. Not used during runtime collection.
license: MIT
compatibility: developer tool — not invoked by the cloud agent during collection
metadata:
  author: osint-builders
  version: "2.0.0"
  audience: authoring
  source-directory: "../../source"
  examples-directory: "../../source/examples"
---

# Create Source

Authoring toolkit for OSINT source files. **Dev/author only** — never loaded at runtime. CLI scripts, schema validation, connectivity tests, manifest updates.

## When to use

**Only for adding/updating/validating/deprecating** sources under `source/sources/`. Never load during collection.

## Entry-point commands

```bash
# Create (interactive, template, or quick)
node skills/create-source/scripts/create-source.js
node skills/create-source/scripts/create-source.js --type twitter --template
node skills/create-source/scripts/create-source.js --quick --type api --name "My API"

# Validate (one or all)
node skills/create-source/scripts/validate-source.js source/sources/<file>.md
node skills/create-source/scripts/validate-source.js --all

# Test (connectivity, extraction, quality)
node skills/create-source/scripts/test-source.js <file>.md --full

# Refresh manifest.json
python3 skills/create-source/scripts/update-manifest.py
```

Full flags + per-type examples: `references/workflow.md`.

## Source file format (slim — keep files ≤10 lines)

Files embed verbatim in prompts. **Every line costs tokens.** Minimal format:

```markdown
---
id: twitter-example
type: twitter
status: active
---
# Example Account (@Handle)
Monitors breaking news on military movements, sanctions, and maritime incidents.
Collect events matching keywords within the 1-hour time window.
Keywords: breaking, urgent, sanctions, military, attack, explosion, conflict
```

Optional (only when needed):
```
Auth: required — set via environment secret
Notes: priority:high
```

**No** sections/lists/docs in source files — those belong in `references/` or tooling.

## Workflow

1. **Create** — Copy `source/examples/twitter-example.md`, fill 4 required fields.
2. **Update manifest** — `python3 skills/create-source/scripts/update-manifest.py`.
3. **Deploy** — Set `status: active`, commit source + manifest.

## Pitfalls

- **Verbose files** — every extra line costs tokens on every run. ≤10 lines.
- **Vague criteria** — agent reads body verbatim. Specify: handles, platforms, keywords, event types.
- **No hardcoded creds** — env vars only.

Expanded pitfalls: `references/workflow.md`.

## See also

- `references/workflow.md` — full lifecycle + type-specific guides.
- `references/QUICK-REFERENCE.md` — fields + commands cheat sheet.
- `references/EXAMPLES.md` — per-type examples.
- `references/AI-HELPERS.md` — LLM prompts for planning + review.
- `scripts/` — `create-source.js`, `validate-source.js`, `test-source.js`, `update-manifest.py`.
