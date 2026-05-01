# AGENTS.md

Guidance for AI agents (Claude Code, Cursor, Hermes, Warp Cloud Agent) and humans editing this repo. Keep this file under ~150 lines.

## What this repo is

An hourly OSINT collector. A GitHub Actions cron fans out parallel Warp Cloud Agents (via `oz-agent-sdk`) that scrape ~140 sources, normalize hits into **World Event Entities**, and commit them back to `data/`.

For the human-friendly overview see [`README.md`](README.md). For the entity schema see [`data/SCHEMA.md`](data/SCHEMA.md).

## Source of truth (read this before editing)

| Concern | File |
|---|---|
| Runtime prompt sent to the cloud agent | `builder/index.ts::buildCollectionPrompt()` (will move to `builder/prompts/collection-prompt.md` in a follow-up PR) |
| Source registry | `source/manifest.json` |
| Per-source spec | `source/sources/<id>.md` |
| Entity schema | `data/SCHEMA.md` |
| Cross-run learnings the next agent reads | `LEARNINGS.md` (capped & expiry-filtered by `builder/index.ts::loadLearnings()`) |
| CI entry point | `.github/workflows/hourly-collection.yml` |

**Do not** treat `README.md` as agent documentation. It is humans-only.

## Conventions

### Manifest semantics
- The manifest is a **deny-list**, not an allow-list. A source is included in every run unless its `status` is one of `inactive`, `archived`, `deprecated` (case-insensitive).
- New sources default to `status: testing` and ride along on the next run immediately. This is intentional — bugs surface fast.
- The orchestrator embeds a sentinel ID list in the prompt and aborts if the agent's live manifest snapshot disagrees, so a source can never be silently dropped.

### World Event Entity output
- One JSON object per line, written to `data/events/YYYY-MM/YYYY-MM-DD.jsonl`.
- Required fields: `id`, `source`, `title`, `summary`, `contents`, `date_published`, `links`, `image_urls`, `geo` (with `lat` and `lon`).
- IDs follow `evt_YYYYMMDD_NNN` using the extraction date (1-hour lookback from execution).
- `contents` must be ≥100 words of E-PRIME markdown — no forms of *to be*: is, are, was, were, be, been, being.
- All events must be geocoded. Use Nominatim with caching; fall back to country-level coords; last-resort global default. See `skills/geocoding/SKILL.md`.

### Media output
- Every image normalizes to **720×720 PNG**, compression level 9, metadata stripped.
- Path inside the agent: `$WORK_DIR/<source_id>/media/images/<event_id>_imgN.png`.
- Path written into `image_urls`: `./media/YYYY-MM/images/YYYY-MM-DD/<event_id>_imgN.png` (relative to repo root after consolidation).

### Time window
- Each run targets a **1-hour lookback** from the workflow execution time (UTC).
- Events with `date_published` outside the window must be rejected and logged.

### CLI tooling

The Warp Cloud Agent environment image (`WARP_ENVIRONMENT_ID`) installs every CLI the agent uses. The repo does **not** carry vendored binaries.

The canonical install list lives in [`README.md`](README.md#warp-cloud-agent-environment-image). When you add a skill that needs a new CLI, update that list in the same PR and rebuild the image before merge.

### `LEARNINGS.md` (the cross-run learnings file)
- The next run reads it. Write only when a finding will help the next agent.
- Keep entries to: source-spec changes, non-obvious shortcuts, repeated failure patterns (≥3 occurrences) with mitigations, schema/validation gaps, cost/budget signals.
- Do **not** dump per-source telemetry (`No events parsed`, `Created event: …`) into `LEARNINGS.md`. That noise belongs in `data/run-logs/YYYY-MM/YYYY-MM-DD.log`.
- Format every entry:
  ```
  ## YYYY-MM-DD HH:MMZ — <topic>
  **Trigger:** ...
  **Finding:** ...
  **Action for next run:** ...
  **Expires:** YYYY-MM-DD | permanent
  ```
- Hard cap: 100 entries or ~30 KB. Prune expired entries before adding new ones.

## Skills

The cloud agent reads `skills/<name>/SKILL.md` on demand. Skills currently in scope:

- `agent-browser` — web/tweet scraping with deterministic ref selectors
- `perplexity-search` — confidence-validation queries
- `data-to-markdown` — E-PRIME transformation
- `geocoding` — Nominatim with caching
- `image-extraction` — full media pipeline (download → 720×720 PNG)
- `imagemagick`, `ffmpeg-cli` — primitives the above leans on
- `world-event-entities` — entity schema patterns (defers to `data/SCHEMA.md`)
- `remember-as-you-go` — write rules for `LEARNINGS.md`
- `create-source` — authoring tool, **not used at runtime**

When editing skills:
- Keep `SKILL.md` ≤ ~150 lines: Overview, When to use, Entry-point commands, Pitfalls, Pointers. Push deep content into `references/`.
- Do not embed the same content in multiple SKILL.md files. If two skills need the same procedure, factor it into a shared `references/` doc.

## Pitfalls (real ones we've hit)

- **README drift**: the README used to contain a duplicate copy of the runtime instructions. It went stale within days. The runtime prompt now lives only in `builder/index.ts` (and soon `builder/prompts/`). Don't re-document the runtime in the README.
- **Prompt-size cap**: Warp enforces 1 MB per prompt. The orchestrator targets 80% of that and auto-buckets. If you add a source with a giant body, expect your bucket count to rise.
- **CRLF in prompt files**: enforce LF in `builder/prompts/**` via `.gitattributes` once those files exist; mixed line endings inflate byte counts unpredictably.
- **`oz-agent-sdk` cannot answer interactive prompts** — never put a question in the prompt; always make the instruction unambiguous.

## Don't

- Don't add agent-runtime instructions to `README.md`.
- Don't hand-write entries to `LEARNINGS.md` that aren't actionable for the next run.
- Don't introduce `os.getenv`-style secret reading from the agent prompt; secrets flow through the Warp env, not the repo.
- Don't commit `node_modules/` to the repo. Skill `scripts/` directories should not pull in dependencies.
