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

# Create Source Skill

Authoring toolkit for adding new OSINT sources to the repository. This skill is for **developers/authors** defining new source files; it is **not** loaded by the runtime collection agent and runtime agents should skip it. It bundles CLI scripts, schema validation, connectivity tests, and manifest updates so a new source can go from idea to deployed configuration in one workflow.

## When to use

Use this skill **only when adding, updating, validating, or deprecating a source definition** under `source/sources/`. Do **not** load it during hourly collection runs — the runtime agent reads finished source files directly and does not need authoring scaffolding.

## Entry-point commands

```bash
# 1. Create a new source (interactive, template, or quick mode)
node skills/create-source/scripts/create-source.js
node skills/create-source/scripts/create-source.js --type twitter --template
node skills/create-source/scripts/create-source.js --quick --type api --name "My API"

# 2. Validate one or all source files (frontmatter, schema, links, secrets)
node skills/create-source/scripts/validate-source.js source/sources/<file>.md
node skills/create-source/scripts/validate-source.js --all

# 3. Test a source (connectivity, extraction, quality, transform)
node skills/create-source/scripts/test-source.js <file>.md --full

# 4. Batch validate + refresh manifest.json from all source files
python3 skills/create-source/scripts/update-manifest.py
```

See `references/workflow.md` for full flag reference, programmatic APIs, and per-type CLI examples (twitter/webpage/api/email/rss).

## Source file format (slim — keep files ≤10 lines)

Source files are embedded verbatim in agent prompts. **Every line costs tokens.** Use this minimal format:

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

Optional trailing lines (add only when genuinely needed):
```
Auth: required — set via environment secret
Notes: priority:high
```

Do **not** add sections, bullet lists, examples, or documentation. Those belong in `references/` or in the create-source tooling, not in the agent prompt.

## Workflow at a glance

1. **Create** — Copy `source/examples/twitter-example.md` and fill in the 4 required fields.
2. **Update manifest** — Run `python3 skills/create-source/scripts/update-manifest.py`.
3. **Deploy** — Set `status: active` and commit the source file + manifest.

## Pitfalls

- **Verbose files** — Any section beyond the minimal format adds tokens to every agent prompt. Keep files at ≤10 lines.
- **Vague collection criteria** — The body text is read by the agent verbatim. Be specific: handles, platforms, keywords, what event types qualify.
- **Hardcoded credentials** — Never embed API keys or tokens; reference environment variables only.

See `references/workflow.md` (Common Pitfalls + Quality Checklist) for the expanded list and remediations.

## See also

- `references/workflow.md` — Full lifecycle: planning, creation, validation, testing, deployment, type-specific guides, maintenance, scripts reference, resources.
- `references/QUICK-REFERENCE.md` — Condensed cheat sheet of fields and commands.
- `references/EXAMPLES.md` — Worked examples for each source type.
- `references/AI-HELPERS.md` — Reusable LLM prompts for planning, troubleshooting, and review.
- `scripts/` — Executable tooling (`create-source.js`, `validate-source.js`, `test-source.js`, `update-manifest.py`, etc.).
