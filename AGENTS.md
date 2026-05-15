# AGENTS.md

Agent + human guidance. Max ~150 lines.

## What this repo is

Hourly OSINT collector. GitHub Actions cron → parallel Warp Cloud Agents (`oz-agent-sdk`) → scrape ~140 sources → normalize to **World Event Entities** → commit to `data/`.

Human overview: [`README.md`](README.md). Schema: [`data/SCHEMA.md`](data/SCHEMA.md).

## Source of truth (read this before editing)

| Concern | File |
|---|---|
| Runtime prompt sent to the cloud agent | `builder/prompts/collection-prompt.md` |
| Source registry | `source/manifest.json` |
| Per-source spec | `source/sources/<id>.md` |
| Entity schema | `data/SCHEMA.md` |
| Cross-run learnings the next agent reads | `LEARNINGS.md` (capped & expiry-filtered by `builder/index.ts::loadLearnings()`) |
| CI entry point | `.github/workflows/hourly-collection.yml` |

**Do not** treat `README.md` as agent documentation. It is humans-only.

## Conventions

### Manifest semantics
- Manifest = **deny-list**. Source runs unless `status` is `inactive`, `archived`, or `deprecated`.
- New sources default `status: testing`, run immediately — bugs surface fast.
- Orchestrator embeds sentinel ID list; aborts on manifest disagreement — no silent drops.

### World Event Entity output
- One JSON obj/line → `data/events/YYYY-MM/YYYY-MM-DD.jsonl`.
- Required: `id`, `source`, `title`, `summary`, `contents`, `date_published`, `links`, `image_urls`, `geo` (`lat`+`lon`).
- IDs: `evt_YYYYMMDD_NNN` (extraction date, 1-hr lookback).
- `contents`: ≥100 words, E-PRIME — no `is/are/was/were/be/been/being`.
- All events need geocodes. Nominatim + cache; fallback: country → global default. See `skills/geocoding/SKILL.md`.
- `link_preview` — automatically fetched in collection step 7.5 using `$LINKPREVIEW_API_KEY`. Do not skip this step. Structure: `{title, description, image, url}`. Non-blocking — failure is acceptable, but the step must run.

### Media output
- Every image normalizes to **720×720 PNG**, compression level 9, metadata stripped.
- Path inside the agent: `$WORK_DIR/<source_id>/media/images/<event_id>_imgN.png`.
- Path written into `image_urls`: `./media/YYYY-MM/images/YYYY-MM-DD/<event_id>_imgN.png` (relative to repo root after consolidation).

### Time window
- Each run: **1-hour lookback** from execution time (UTC).
- Reject + log events outside window.

### CLI tooling

Cloud agent env image (`WARP_ENVIRONMENT_ID`) installs all CLIs. Repo carries no vendored binaries.

Install list: [`README.md`](README.md#warp-cloud-agent-environment-image). Adding skill needing new CLI → update list + rebuild image in same PR.

### `LEARNINGS.md`

See `skills/remember-as-you-go/SKILL.md`. Cap: 100 entries / 30 KB. Orchestrator prunes — never rotate manually.

## Skills

Cloud agent reads `skills/<name>/SKILL.md` on demand:

- `agent-browser` — web/tweet scraping with deterministic ref selectors
- `perplexity-search` — confidence-validation queries
- `data-to-markdown` — E-PRIME transformation
- `geocoding` — Nominatim with caching
- `image-extraction` — full media pipeline (download → 720×720 PNG)
- `imagemagick`, `ffmpeg-cli` — primitives the above leans on
- `world-event-entities` — entity schema patterns (defers to `data/SCHEMA.md`)
- `remember-as-you-go` — write rules for `LEARNINGS.md`
- `create-source` — authoring tool, **not used at runtime**

Skill editing rules:
- ≤150 lines per SKILL.md. Deep content → `references/`.
- No duplicate content across SKILL.md files — factor into `references/`.

## Pitfalls (real ones we've hit)

- **README drift**: runtime prompt lives in `builder/prompts/collection-prompt.md` — don't re-document in README.
- **Prompt-size cap**: 1 MB limit; orchestrator targets 80%, auto-buckets. Giant source body → more buckets.
- **CRLF**: enforce LF in `builder/prompts/**` via `.gitattributes` — mixed endings inflate byte counts.
- **`oz-agent-sdk` cannot answer interactive prompts** — never put a question in the prompt; always make the instruction unambiguous.

## Don't

- Don't add agent-runtime instructions to `README.md`.
- Don't hand-write entries to `LEARNINGS.md` that aren't actionable for the next run.
- Don't introduce `os.getenv`-style secret reading from the agent prompt; secrets flow through the Warp env, not the repo.
- Don't commit `node_modules/` to the repo. Skill `scripts/` directories should not pull in dependencies.
- **Don't open pull requests.** Collection agents commit and push directly to `main`. Never use `gh pr create` or any equivalent. If push fails after retries, exit 1.
