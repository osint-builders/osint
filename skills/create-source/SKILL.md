---
name: create-source
description: Authoring tool for creating new OSINT data sources. Provides templates, validation, and tests for source files. Not used during runtime collection.
license: MIT
compatibility: Linux/macOS (developer tool; not invoked by the cloud agent during collection)
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

## Workflow at a glance

1. **Plan** — Decide source type, reliability, update frequency, collection criteria, and auth needs (see `references/workflow.md` Phase 1 + AI prompts).
2. **Create** — Generate the file via `create-source.js` or copy a template from `source/examples/` and fill in the frontmatter.
3. **Validate** — Run `validate-source.js` to verify required frontmatter, type-specific fields, body sections, examples, and absence of secrets.
4. **Test** — Run `test-source.js --full` to confirm connectivity, extraction, quality scoring, and entity transform.
5. **Deploy** — Run `update-manifest.py`, flip status to `active` via `update-source-status.js`, and commit `source/sources/<file>.md` plus `source/manifest.json`.

## Pitfalls

- **Incomplete frontmatter** — Missing `id`, `type`, `status`, `reliability`, `update_frequency`, or type-specific fields (e.g., webpage `selectors`, api `auth_method`). Run `validate-source.js --check-frontmatter`.
- **Vague collection criteria** — "Monitor Twitter for news" is not actionable; specify handles, keywords, engagement thresholds, include/exclude filters.
- **No realistic examples** — Every source must include at least one real (anonymized if needed) example payload showing the expected structure.
- **Hardcoded credentials** — Never embed API keys, tokens, or passwords. Reference environment variables only; the validator flags secrets.
- **Untested sources marked active** — Always run the full test suite before flipping `status: testing` to `status: active`. Sync the manifest after status changes.

See `references/workflow.md` (Common Pitfalls + Quality Checklist) for the expanded list and remediations.

## See also

- `references/workflow.md` — Full lifecycle: planning, creation, validation, testing, deployment, type-specific guides, maintenance, scripts reference, resources.
- `references/QUICK-REFERENCE.md` — Condensed cheat sheet of fields and commands.
- `references/EXAMPLES.md` — Worked examples for each source type.
- `references/AI-HELPERS.md` — Reusable LLM prompts for planning, troubleshooting, and review.
- `scripts/` — Executable tooling (`create-source.js`, `validate-source.js`, `test-source.js`, `update-manifest.py`, etc.).
