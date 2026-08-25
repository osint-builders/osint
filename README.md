# OSINT Data Collector

Automated collection of world-event intelligence from OSINT sources (Twitter/X, Telegram, Reddit, news sites, APIs). Three times a day, the pipeline samples a 1-hour window, normalizes findings into structured **World Event Entities** (JSONL), and commits them back to this repo. A search UI at [osint.builders](https://osint.builders/) and a cross-platform CLI consume the data downstream.

![Snapshot Collection](https://github.com/osint-builders/osint/actions/workflows/collection.yml/badge.svg)
![Data Release](https://github.com/osint-builders/osint/actions/workflows/create-release.yml/badge.svg)

> **For agents/contributors editing this repo:** see [`AGENTS.md`](AGENTS.md). The runtime prompt and conventions live there. This README serves humans getting their bearings.

---

## How a run works

The schedule fires at 09:00, 13:00, and 17:00 America/New_York. Each run samples the hour before dispatch — intentional snapshots, not continuous coverage.

```
GitHub Actions cron (3×/day)
    │
    ▼
builder/index.ts                       # oz-agent-sdk orchestrator
  • reads source/manifest.json         # deny-list: skip status ∈ {inactive,archived,deprecated}
  • partitions sources into buckets    # deterministic: priority desc, then id; ~12 sources/agent
  • fans out one Warp Cloud Agent per bucket (parallel)
    │
    ▼
Warp Cloud Agent (per bucket)
  • clones this repo, then drives builder/runtime/*.sh:
    init → verify-ids → precheck → [collect → translate → E-PRIME → geocode
    → enrich-link-preview → validate-confidence] per source → validate
    → merge-events (dedup) → submit (commit + push)
    │
    ▼
embeddings.yml                         # cross-bucket dedupe + search index rebuild
pages.yml / build-cli.yml              # UI deploy + CLI release
```

`builder/index.ts::buildCollectionPrompt()` renders the prompt from `builder/prompts/collection-prompt.md` — that template, plus the scripts in `builder/runtime/`, form the source of truth. Not this README.

---

## Where things live

| Path | Role |
|---|---|
| `builder/index.ts` | Orchestrator. Buckets sources, renders prompts, dispatches Warp agents. |
| `builder/prompts/collection-prompt.md` | Runtime prompt template (one per bucket). |
| `builder/runtime/*.sh` | Versioned helper scripts the agent invokes (pre-check, geocode, enrich, merge, submit). |
| `source/manifest.json` | Authoritative source registry + status + liveness notes. |
| `source/sources/*.md` | Per-source collection spec (front matter + body). |
| `source/REVIEW.md` | Manual-review queue for wrong-handle / fixable-URL sources. |
| `skills/<name>/SKILL.md` | Procedural references the cloud agent reads on demand. |
| `data/SCHEMA.md` | World Event Entity schema (canonical). |
| `data/events/YYYY-MM/YYYY-MM-DD.jsonl` | Output: one JSON event per line. |
| `LEARNINGS.md` | Cross-run learnings injected into the next run's prompts. |
| `.github/workflows/collection.yml` | Cron entry point. |

---

## Quick start

```bash
git clone https://github.com/osint-builders/osint.git
cd osint
cd builder && npm install && cd ..

export WARP_API_KEY="***"
export WARP_ENVIRONMENT_ID="your-warp-environment-uid"

cd builder && npm run collect      # or: npm run dry-run (no agents dispatched)

# inspect what was written
cat data/events/$(date +%Y-%m)/$(date +%Y-%m-%d).jsonl | jq .
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
| `WARP_API_KEY` | secret | Authenticates `oz-agent-sdk` against Warp. |
| `WARP_ENVIRONMENT_ID` | secret | UID of the pre-built Warp Cloud Agent environment image (see below). |
| `OSINT_GH_TOKEN` *or* `GH_TOKEN` | secret | Fine-grained PAT with `Contents: write` on this repo. The agent uses it to push each run's commits. |
| `PARALLEL_AGENT_COUNT` | variable | Optional. Bucket-count override; unset → auto-sized at ~12 sources/agent. |
| `WARP_MODEL_ID` | variable | Optional. Overrides the pinned Oz `model_id` (default: `claude-4-5-haiku` in `builder/index.ts`). Keeps every collection run on a Warp/Anthropic model instead of the account/environment default. |

### Key rotation / credit exhaustion

When Warp credits run out or the key expires, agent spawns fail with HTTP 401/402, the orchestrator exits non-zero, and the `alert-on-failure` job opens (or updates) a **"Collection workflow failing"** issue. To recover: generate a fresh key in Warp, update the `WARP_API_KEY` secret, and re-run via **Actions → OSINT Snapshot Collection → Run workflow**. Collection resumes at the next scheduled slot either way.

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
- [`source/README.md`](source/README.md) — source system overview.
- [`source/CONTRIBUTING.md`](source/CONTRIBUTING.md) — adding sources.
- [`skills/README.md`](skills/README.md) — skill index.
- [`.github/workflows/README.md`](.github/workflows/README.md) — workflow config & troubleshooting.

---

## License

MIT
