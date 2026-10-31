# OSINT Data Collector

Automated collection of world-event intelligence from OSINT sources (Twitter/X, Telegram, Reddit, news sites, APIs), using a **Tip & Queue** pipeline: a cheap non-LLM scan identifies candidate content, then a separate stage does the LLM-heavy extraction in small batches. Findings normalize into structured **World Event Entities** (JSONL) and commit back to this repo. A search UI at [osint.builders](https://osint.builders/) and a cross-platform CLI consume the data downstream.

![Identify Tips](https://github.com/osint-builders/osint/actions/workflows/identify.yml/badge.svg)
![Qualify Tips](https://github.com/osint-builders/osint/actions/workflows/qualify.yml/badge.svg)
![Data Release](https://github.com/osint-builders/osint/actions/workflows/create-release.yml/badge.svg)

> **Cadence right now**: `identify.yml` runs daily at **09:00 America/New_York** (plus manual dispatch) and `qualify.yml` chains off it automatically, so that one trigger drives a full collection. Each run uses a 1-hour lookback, so a daily cadence samples one hour per day rather than covering it. The legacy `collection.yml` single-phase flow still exists but runs on demand only. See [`.github/workflows/README.md`](.github/workflows/README.md) for details.

> **For agents/contributors editing this repo:** see [`AGENTS.md`](AGENTS.md) for conventions and `builder/prompts/` for runtime prompts. This README serves humans getting their bearings.

---

## How a run works

Two stages, kicked off once daily or on demand (see the cadence note above):

```
identify.yml (GitHub Actions runner — no Warp agent, no LLM)
  • reads source/manifest.json          # deny-list: skip status ∈ {inactive,archived,deprecated}
  • builder/runtime/identify.sh scans every processable source in parallel
    (curl/jq for Twitter API, Reddit JSON API, webpages; python3 for Telegram HTML)
  • writes one tip per hit to data/queue/pending/*.json, commits with github.token
    │
    ▼  (workflow_run)
qualify.yml
  • builder/qualify.ts groups data/queue/pending/*.json into small batches (default 3 tips)
  • fans out one Warp Cloud Agent per batch (parallel)
    │
    ▼
Warp Cloud Agent (per batch)
  • clones this repo, then drives builder/runtime/*.sh:
    init (token check) → [fetch → qualify → translate → structure → geocode
    → attach image → enrich] per tip → validate → merge-events (dedup)
    → remove consumed tip from pending/ → submit (commit + push)
    │
    ▼
embeddings.yml                         # cross-batch dedupe + search index rebuild
    │
    ▼  (workflow_run, in parallel)
deploy-pages.yml                       # UI deploy
release-cli.yml                        # CLI cross-compile + cli-latest release
```

A legacy single-phase flow (`collection.yml` → `builder/index.ts`) still exists, paused: one Warp agent processes a whole bucket of ~12 sources sequentially instead of small per-tip batches. The active template lives in `builder/prompts/qualify-prompt.md`; the shared publication rules live in `builder/prompts/qualified-event-contract.md`. The versioned scripts in `builder/runtime/` handle mechanical steps.

The queue holds only unprocessed tips. Qualification deletes each consumed tip, including tips that produce no event; the pre-run cleanup deletes tips older than 24 hours. A default run selects the 30 newest tips (10 batches of 3). Older pending tips wait for a later run and may expire, so this limit controls Warp spend and coverage.

---

## Where things live

| Path | Role |
|---|---|
| `builder/runtime/identify.sh` | Non-LLM tip scan (stage 1), run directly by `identify.yml`. |
| `builder/qualify.ts` | Queue-drain orchestrator (stage 2). Batches tips, dispatches Warp agents. |
| `builder/prompts/qualify-prompt.md` | Runtime prompt template (one per batch of tips). |
| `builder/prompts/qualified-event-contract.md` | Typed acceptance and output rules for newly published events. |
| `builder/lib/agent-runner.ts` | Shared spawn/poll/cancel logic (per-run deadline, BLOCKED handling) used by both `builder/index.ts` and `builder/qualify.ts`. |
| `builder/index.ts` | Legacy orchestrator (paused). Buckets whole sources, renders `collection-prompt.md`. |
| `builder/runtime/*.sh` | Versioned helper scripts the agent invokes (init/token-check, geocode, enrich, merge, submit). |
| `source/manifest.json` | Authoritative source registry + status + liveness notes. |
| `source/sources/*.md` | Per-source collection spec (front matter + body). |
| `source/REVIEW.md` | Manual-review queue for wrong-handle / fixable-URL sources. |
| `skills/<name>/SKILL.md` | Procedural references the cloud agent reads on demand. |
| `data/SCHEMA.md` | World Event Entity schema (canonical). |
| `data/queue/README.md` | Tip record schema + temporary pending queue lifecycle. |
| `data/events/YYYY-MM/YYYY-MM-DD.jsonl` | Output: one JSON event per line. |
| `LEARNINGS.md` | Cross-run learnings injected into paused legacy collection prompts; active Qualify does not load them. |
| `.github/workflows/identify.yml`, `.github/workflows/qualify.yml` | Daily and on-demand Tip & Queue entry points. |

---

## Quick start

```bash
git clone https://github.com/osint-builders/osint.git
cd osint
npm ci --prefix builder
npm run qualify-dry-run --prefix builder  # renders prompts from pending tips; no Warp run
node data/scripts/validate-events.js --from 2026-10-01

# Optional single-source Identify scan, from the repository root (requires curl, jq, python3):
TIME_WINDOW_START=$(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%SZ) \
TIME_WINDOW_END=$(date -u +%Y-%m-%dT%H:%M:%SZ) \
  bash builder/runtime/identify.sh telegram-afustratcom
```

---

## World Event Entity (at a glance)

Newly qualified events use a typed publication contract. This abbreviated shape shows the fields added for future events; the archive also contains historical records that predate the contract.

```json
{
  "id": "evt_52117619469189120",
  "source": {"name": "Reuters", "provider": "news"},
  "title": "...",
  "summary": "...",
  "contents": "## Event\n\n...\n\n## Location and Time\n\n...\n\n## Evidence\n\n...\n\n## Allied Relevance\n\n...\n\n## Confidence and Gaps\n\n...",
  "date_published": "2026-04-29T10:30:00Z",
  "source_window": {"start": "2026-04-29T10:00:00Z", "end": "2026-04-29T11:00:00Z"},
  "links": [{"url": "..."}],
  "image_urls": ["https://example.com/og-image.jpg"],
  "image_origin": "article",
  "geo": {"lat": 37.27, "lon": 37.02, "location_name": "Gaziantep, Turkey", "precision": "city"},
  "language": "en",
  "category": "major-disaster",
  "audience": "allied-forces",
  "allied_relevance": "The report gives allied disaster-response planners a location for resource coordination.",
  "topics": ["earthquake"],
  "confidence": 0.95
}
```

Full schema and a valid complete example: [`data/SCHEMA.md`](data/SCHEMA.md). `image_urls` holds **remote** URLs — the pipeline verifies image responses but never stores or re-hosts media. If no working article image exists, the qualifier marks a source or default image in `image_origin`.

**E-PRIME**: `contents` strings must avoid forms of *to be* (is, are, was, were, be, been, being). Use specific active verbs.

---

## Configuration

### GitHub Actions secrets/variables

Set these in **Settings → Secrets and variables → Actions**:

| Name | Type | Purpose |
|---|---|---|
| `WARP_API_KEY` | secret | Authenticates `oz-agent-sdk` against Warp. Used by `qualify.yml`/legacy `collection.yml` only — `identify.yml` never touches Warp. |
| `WARP_ENVIRONMENT_ID` | secret | UID of the pre-built Warp Cloud Agent environment image (see below). |
| `OSINT_GH_TOKEN` *or* `GH_TOKEN` | secret | Fine-grained PAT with `Contents: write` on this repo. The **Warp environment** (not GitHub Actions) needs this — `builder/runtime/init.sh` checks authentication and read access before qualification; the push confirms write access. `identify.yml` uses the ephemeral `github.token` instead. |
| `TWITTER_BEARER_TOKEN` | secret | Optional but recommended. Used by both `identify.yml` (tip scan) and the qualify agent; Twitter sources produce no tips without it. |
| `PARALLEL_AGENT_COUNT` | variable | Optional. Legacy `collection.yml` bucket-count override; unset → auto-sized at ~12 sources/agent. |
| `QUALIFY_BATCH_SIZE` | variable | Optional. Tips per qualify agent; unset → defaults to 3 (`builder/qualify.ts`). |
| `QUALIFY_MAX_BATCHES` | variable | Optional. Maximum qualify agents per workflow run; unset → defaults to 10. The newest tips run first. |
| `WARP_MODEL_ID` | variable | Optional. Overrides the pinned Oz `model_id` (default: `claude-4-5-haiku`). Keeps every agent run on a Warp/Anthropic model instead of the account/environment default. |

### Key rotation / credit exhaustion

When Warp credits run out, the `WARP_API_KEY` expires, or the `OSINT_GH_TOKEN` push token expires, agent spawns/pushes fail, the orchestrator exits non-zero, and the `alert-on-failure` job opens (or updates) a **"Qualify workflow failing"** (or legacy **"Collection workflow failing"**) issue. `builder/runtime/init.sh` checks token authentication up front, so an expired token surfaces in seconds; only an actual push proves write access. To recover: rotate the relevant secret (`oz secret update OSINT_GH_TOKEN --team --value` for the push token; the Warp dashboard for `WARP_API_KEY`), then re-run via **Actions → Qualify OSINT Tips → Run workflow**.

### Warp Cloud Agent environment image

`WARP_ENVIRONMENT_ID` points at a pre-configured Warp environment (`osint-collection`, base image `warpdotdev/dev-web:latest-agents`) that the orchestrator launches per bucket/batch. Setup commands run fresh on every single run, so **keep this list minimal and reliable** — a failing setup command fails every run in the batch before the agent even starts, with no retry:

```bash
apt-get update && apt-get install -y jq python3 wget
```

`builder/runtime/init.sh --check-runtime` performs a secret-free CLI preflight. Normal Qualify initialization runs the same checks inside each Oz agent, then checks token authentication. After changing the Warp image or these runtime scripts, dispatch a one-batch Qualify run and verify its agent completes in Oz; local checks alone do not exercise `WARP_ENVIRONMENT_ID`.

`agent-browser` is deliberately **not** a setup command. A mandatory Chrome download previously failed and stopped every qualify batch. When `curl` cannot retrieve enough evidence, agents run `npx --yes agent-browser@0.27.0 install` on demand and use that pinned CLI; browser failure rejects only the affected candidate. Version 0.27.0 runs under Node 20, the minimum checked by `init.sh`; the next release, 0.28.0, declares Node 24 and pnpm 11 requirements. See `skills/agent-browser/SKILL.md` and the "Fetch full content" step in `builder/prompts/qualify-prompt.md`.

Bake these env vars into the environment as Warp Team-scope secrets:

| Variable | Required | Purpose |
|---|---|---|
| `ANTHROPIC_API_KEY` | ✅ | Claude API used by the agent. |
| `OSINT_GH_TOKEN` *or* `GH_TOKEN` | ✅ | Push token. `init.sh` checks it fast at the start of every run — rotate with `oz secret update OSINT_GH_TOKEN --team --value`. |
| `PERPLEXITY_API_KEY` | optional | On-demand source corroboration and location research; degrades gracefully when absent. |
| `LINKPREVIEW_API_KEY` | optional | `link_preview` enrichment; non-blocking when absent. |
| `TWITTER_BEARER_TOKEN` | optional | Twitter API path used by both `identify.sh` and the qualify agent; also used as a banner-image fallback. |

When you add a CLI dependency in a new skill, prefer having the agent install it on demand inside its own prompt steps rather than adding another mandatory `Setup command` — that keeps a single flaky install from failing every run regardless of whether that run's work actually needs it.

---

## Adding a source

Follow [`source/CONTRIBUTING.md`](source/CONTRIBUTING.md) for the current source format, supported Identify adapters, and manifest registration. After editing source headers, run `node source/scripts/sync-manifest-names.js` to keep manifest names in lockstep.

---

## Related documentation

- [`AGENTS.md`](AGENTS.md) — conventions for AI agents and humans editing this repo.
- [`data/SCHEMA.md`](data/SCHEMA.md) — entity schema.
- [`data/README.md`](data/README.md) — storage layout + `data/scripts/` reference. Also ships inside the weekly release tarball.
- [`data/queue/README.md`](data/queue/README.md) — Tip & Queue record schema + lifecycle.
- [`source/README.md`](source/README.md) — source system overview.
- [`source/CONTRIBUTING.md`](source/CONTRIBUTING.md) — adding sources.
- [`frontend/README.md`](frontend/README.md) — search UI components, libraries, local dev.
- [`skills/README.md`](skills/README.md) — skill index.
- [`.github/workflows/README.md`](.github/workflows/README.md) — workflow config & troubleshooting.

---

## License

MIT
