# OSINT Data Collector

Automated collection of world-event intelligence from OSINT sources (Twitter/X, Telegram, Reddit, news sites, APIs), using a **Tip & Queue** pipeline: a cheap non-LLM scan identifies candidate content, then a separate stage does the LLM-heavy extraction in small batches. Findings normalize into structured **World Event Entities** (JSONL) and commit back to this repo. A search UI at [osint.builders](https://osint.builders/) and a cross-platform CLI consume the data downstream.

![Identify Tips](https://github.com/osint-builders/osint/actions/workflows/identify.yml/badge.svg)
![Qualify Tips](https://github.com/osint-builders/osint/actions/workflows/qualify.yml/badge.svg)
![Data Release](https://github.com/osint-builders/osint/actions/workflows/create-release.yml/badge.svg)

> **Cadence right now**: both `identify.yml` and `qualify.yml` have no cron while the new pipeline gets validated. The legacy `collection.yml` single-phase flow still exists but also runs on demand only. See [`.github/workflows/README.md`](.github/workflows/README.md) for details.

> **For agents/contributors editing this repo:** see [`AGENTS.md`](AGENTS.md). The runtime prompt and conventions live there. This README serves humans getting their bearings.

---

## How a run works

Two stages, each on demand for now (see the cadence note above):

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
    init (token check) → [fetch → translate → E-PRIME → geocode → enrich
    → validate-confidence] per tip → validate → merge-events (dedup)
    → archive tip to data/queue/processed/ → submit (commit + push)
    │
    ▼
embeddings.yml                         # cross-batch dedupe + search index rebuild
deploy-downstream.yml                  # UI deploy + CLI release (parallel jobs)
```

A legacy single-phase flow (`collection.yml` → `builder/index.ts`) still exists, paused: one Warp agent processes a whole bucket of ~12 sources sequentially instead of small per-tip batches. `builder/qualify.ts::buildQualifyPrompt()` renders the prompt from `builder/prompts/qualify-prompt.md` — that template, plus the scripts in `builder/runtime/` and the shared spawn/poll logic in `builder/lib/agent-runner.ts`, form the source of truth. Not this README.

---

## Where things live

| Path | Role |
|---|---|
| `builder/runtime/identify.sh` | Non-LLM tip scan (stage 1), run directly by `identify.yml`. |
| `builder/qualify.ts` | Queue-drain orchestrator (stage 2). Batches tips, dispatches Warp agents. |
| `builder/prompts/qualify-prompt.md` | Runtime prompt template (one per batch of tips). |
| `builder/lib/agent-runner.ts` | Shared spawn/poll/cancel logic (per-run deadline, BLOCKED handling) used by both `builder/index.ts` and `builder/qualify.ts`. |
| `builder/index.ts` | Legacy orchestrator (paused). Buckets whole sources, renders `collection-prompt.md`. |
| `builder/runtime/*.sh` | Versioned helper scripts the agent invokes (init/token-check, geocode, enrich, merge, submit). |
| `source/manifest.json` | Authoritative source registry + status + liveness notes. |
| `source/sources/*.md` | Per-source collection spec (front matter + body). |
| `source/REVIEW.md` | Manual-review queue for wrong-handle / fixable-URL sources. |
| `skills/<name>/SKILL.md` | Procedural references the cloud agent reads on demand. |
| `data/SCHEMA.md` | World Event Entity schema (canonical). |
| `data/queue/README.md` | Tip record schema + pending/processed queue lifecycle. |
| `data/events/YYYY-MM/YYYY-MM-DD.jsonl` | Output: one JSON event per line. |
| `LEARNINGS.md` | Cross-run learnings injected into the next run's prompts. |
| `.github/workflows/identify.yml`, `.github/workflows/qualify.yml` | Tip & Queue entry points (on demand for now). |

---

## Quick start

```bash
git clone https://github.com/osint-builders/osint.git
cd osint
cd builder && npm install && cd ..

export WARP_API_KEY="***"
export WARP_ENVIRONMENT_ID="your-warp-environment-uid"

cd builder
REPO_ROOT=.. TIME_WINDOW_START=$(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%SZ) TIME_WINDOW_END=$(date -u +%Y-%m-%dT%H:%M:%SZ) \
  bash ../builder/runtime/identify.sh $(jq -r '.sources[].id' ../source/manifest.json)  # writes data/queue/pending/*.json, no agents
npm run qualify-dry-run            # renders qualify prompts without dispatching agents
# or: npm run dry-run              # legacy single-phase flow (builder/index.ts)

# inspect what was written
cat ../data/events/$(date +%Y-%m)/$(date +%Y-%m-%d).jsonl | jq .
```

---

## World Event Entity (at a glance)

```json
{
  "id": "evt_52117619469189120",
  "source": {"name": "Reuters", "provider": "news"},
  "title": "...",
  "summary": "...",
  "contents": "## ...\n\n... (markdown, 100+ words, E-PRIME)",
  "date_published": "2026-04-29T10:30:00Z",
  "links": [{"url": "..."}],
  "image_urls": ["https://example.com/og-image.jpg"],
  "geo": {"lat": 37.27, "lon": 37.02, "country": "Turkey"},
  "topics": ["earthquake"],
  "confidence": 0.95
}
```

Full schema: [`data/SCHEMA.md`](data/SCHEMA.md). `image_urls` holds **remote** URLs — the pipeline never downloads or re-hosts media.

**E-PRIME**: `contents` strings must avoid forms of *to be* (is, are, was, were, be, been, being). Use specific active verbs.

---

## Configuration

### GitHub Actions secrets/variables

Set these in **Settings → Secrets and variables → Actions**:

| Name | Type | Purpose |
|---|---|---|
| `WARP_API_KEY` | secret | Authenticates `oz-agent-sdk` against Warp. Used by `qualify.yml`/legacy `collection.yml` only — `identify.yml` never touches Warp. |
| `WARP_ENVIRONMENT_ID` | secret | UID of the pre-built Warp Cloud Agent environment image (see below). |
| `OSINT_GH_TOKEN` *or* `GH_TOKEN` | secret | Fine-grained PAT with `Contents: write` on this repo. The **Warp environment** (not GitHub Actions) needs this — `builder/runtime/init.sh` checks it fast, before any qualify work starts. `identify.yml` pushes with the ephemeral `github.token` instead and needs no PAT at all. |
| `TWITTER_BEARER_TOKEN` | secret | Optional but recommended. Used by both `identify.yml` (tip scan) and the qualify agent; Twitter sources produce no tips without it. |
| `PARALLEL_AGENT_COUNT` | variable | Optional. Legacy `collection.yml` bucket-count override; unset → auto-sized at ~12 sources/agent. |
| `QUALIFY_BATCH_SIZE` | variable | Optional. Tips per qualify agent; unset → defaults to 3 (`builder/qualify.ts`). |
| `WARP_MODEL_ID` | variable | Optional. Overrides the pinned Oz `model_id` (default: `claude-4-5-haiku`). Keeps every agent run on a Warp/Anthropic model instead of the account/environment default. |

### Key rotation / credit exhaustion

When Warp credits run out, the `WARP_API_KEY` expires, or the `OSINT_GH_TOKEN` push token expires, agent spawns/pushes fail, the orchestrator exits non-zero, and the `alert-on-failure` job opens (or updates) a **"Qualify workflow failing"** (or legacy **"Collection workflow failing"**) issue. `builder/runtime/init.sh` checks the push token up front so an expired `OSINT_GH_TOKEN` surfaces in seconds, not after a full batch of work. To recover: rotate the relevant secret (`oz secret update OSINT_GH_TOKEN --team --value` for the push token; the Warp dashboard for `WARP_API_KEY`), then re-run via **Actions → Qualify OSINT Tips → Run workflow**.

### Warp Cloud Agent environment image

`WARP_ENVIRONMENT_ID` points at a pre-configured Warp environment that the orchestrator launches per bucket. **The image — not this repo — installs the CLI tools and bakes in API keys.** Rebuild the image with this install list:

```bash
# Node 20+ (LTS)
npm install -g agent-browser
agent-browser install                  # downloads Chrome for Testing

apt-get install -y \
    git curl jq bc \
    ca-certificates
```

Bake these env vars into the image as Warp environment-level secrets:

| Variable | Required | Purpose |
|---|---|---|
| `ANTHROPIC_API_KEY` | ✅ | Claude API used by the agent. |
| `OSINT_GH_TOKEN` *or* `GH_TOKEN` | ✅ | Push token (same value as the GitHub Actions secret). |
| `PERPLEXITY_API_KEY` | optional | Confidence validation (model `sonar`, priority-high events only); degrades gracefully when absent. |
| `LINKPREVIEW_API_KEY` | optional | `link_preview` enrichment; non-blocking when absent. |
| `TWITTER_BEARER_TOKEN` | optional | Twitter API path + banner-image fallback; the `agent-browser` scraping path works without it. |

Verify a freshly built image with this throwaway prompt before running production collection against it:

```bash
node --version            # ≥ 20
agent-browser --version
jq --version
test -n "$ANTHROPIC_API_KEY" && echo "ANTHROPIC_API_KEY set"
test -n "$OSINT_GH_TOKEN" -o -n "$GH_TOKEN" && echo "push token set"
```

When you add a CLI dependency in a new skill, update this section in the same PR and rebuild the image before merge. The collection prompt does not introspect the env at runtime — a missing tool fails the agent partway through a bucket.

---

## Adding a source

```bash
node skills/create-source/scripts/create-source.js
```

Walks you through type, metadata, and validation. Full guide: [`source/CONTRIBUTING.md`](source/CONTRIBUTING.md). After editing source headers, run `node source/scripts/sync-manifest-names.js` to keep the manifest in lockstep.

---

## Related documentation

- [`AGENTS.md`](AGENTS.md) — conventions for AI agents and humans editing this repo.
- [`data/SCHEMA.md`](data/SCHEMA.md) — entity schema.
- [`data/README.md`](data/README.md) — storage layout, retention, validation scripts.
- [`data/queue/README.md`](data/queue/README.md) — Tip & Queue record schema + lifecycle.
- [`source/README.md`](source/README.md) — source system overview.
- [`source/CONTRIBUTING.md`](source/CONTRIBUTING.md) — adding sources.
- [`skills/README.md`](skills/README.md) — skill index.
- [`.github/workflows/README.md`](.github/workflows/README.md) — workflow config & troubleshooting.

---

## License

MIT
