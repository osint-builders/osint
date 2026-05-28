# OSINT Data Collector

Automated, hourly collection of world-event intelligence from ~140 OSINT sources (Twitter, news sites, RSS, APIs). Each run produces structured **World Event Entities** as JSONL plus normalized 720×720 PNG media, committed back to this repo.

![Hourly Collection](https://github.com/osint-builders/osint/actions/workflows/hourly-collection.yml/badge.svg)
![Data Release](https://github.com/osint-builders/osint/actions/workflows/create-release.yml/badge.svg)

> **For agents/contributors editing this repo:** see [`AGENTS.md`](AGENTS.md). The runtime prompt and conventions live there. This README is for humans getting their bearings.

---

## How a run works

```
GitHub Actions (cron @ :00 UTC)
    │
    ▼
builder/index.ts                       # Orchestrator with provider abstraction
  • reads source/manifest.json         # deny-list: skip status ∈ {inactive,archived,deprecated}
  • partitions sources into N buckets  # sized to fit 1 MB prompt cap
  • selects provider: Warp (primary) or Vibe (fallback on quota)
  • fans out agents per bucket (parallel)
    │
    ├── Warp Cloud Agent (Claude Code, primary)
    │     • inlines source/sources/*.md for its bucket
    │     • per source: scrape → E-PRIME transform → geocode → confidence-validate
    │     • emits World Event Entities to data/events/YYYY-MM/YYYY-MM-DD.jsonl
    │     • normalizes media → data/media/YYYY-MM/{images,videos}/YYYY-MM-DD/
    │     • commits + pushes
    │
    └── Mistral Vibe CLI (local, fallback on Warp quota exhaustion)
          • same collection workflow, executes locally
          • uses Mistral models via vibe CLI
```

The actual prompt sent to the agent is constructed in `builder/index.ts::buildCollectionPrompt()` — that is the source of truth, not this README.

---

## Where things live

| Path | Role |
|---|---|
| `builder/index.ts` | Orchestrator. Builds the per-bucket prompt and dispatches agents to providers. |
| `builder/providers/` | Agent provider implementations (Warp, Vibe) and interface. |
| `source/manifest.json` | Authoritative list of sources + status. |
| `source/sources/*.md` | Per-source collection spec (front matter + body). |
| `source/CONTRIBUTING.md` | How to add a new source. |
| `skills/<name>/SKILL.md` | Procedural references the cloud agent reads on demand. |
| `data/SCHEMA.md` | World Event Entity schema (canonical). |
| `data/events/YYYY-MM/YYYY-MM-DD.jsonl` | Output: one JSON event per line. |
| `data/media/YYYY-MM/...` | Output: normalized 720×720 PNGs and video stills. |
| `memory.md` | Cross-run learnings the next agent reads. |
| `.github/workflows/hourly-collection.yml` | Cron entry point. |

---

## Quick start

```bash
git clone https://github.com/osint-builders/osint.git
cd osint
cd builder && npm install && cd ..

# Warp (default primary provider)
export WARP_API_KEY="***"
export WARP_ENVIRONMENT_ID="your-warp-environment-uid"

# For automatic fallback to Vibe on Warp quota errors
export MISTRAL_API_KEY="your-mistral-key"

# Optional: force a specific provider
export AGENT_PROVIDER="auto"  # default: uses Warp, falls back to Vibe
export AGENT_PROVIDER="warp"  # Warp only
export AGENT_PROVIDER="vibe"  # Vibe only

cd builder && npm run collect

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
  "image_urls": ["./media/2026-04/images/2026-04-29/evt_..._img1.png"],
  "geo": {"lat": 37.27, "lon": 37.02, "country": "Turkey"},
  "topics": ["earthquake"],
  "confidence": 0.95
}
```

Full schema: [`data/SCHEMA.md`](data/SCHEMA.md).

**E-PRIME**: `contents` strings must avoid forms of *to be* (is, are, was, were, be, been, being). Use specific active verbs.

---

## Configuration

### GitHub Actions secrets/variables

Set these in **Settings → Secrets and variables → Actions**:

| Name | Type | Required | Purpose |
|---|---|---|---|
| `WARP_API_KEY` | secret | No | Authenticates `oz-agent-sdk` against Warp Cloud Agents. |
| `WARP_ENVIRONMENT_ID` | secret | No | UID of the pre-built Warp Cloud Agent environment image (see below). |
| `MISTRAL_API_KEY` | secret | No | Mistral API key for Mistral Vibe provider. Required if using Vibe or auto mode with Warp quota exhaustion. |
| `OSINT_GH_TOKEN` *or* `GH_TOKEN` | secret | Yes | Fine-grained PAT with `Contents: write` on this repo. The agent uses it to push each run's commits. |
| `AGENT_PROVIDER` | variable | No | Provider selection mode: `auto` (default), `warp`, or `vibe`. In `auto` mode, Warp is used first with automatic fallback to Vibe on quota errors. |
| `PARALLEL_AGENT_COUNT` | variable | No | Bucket count override; otherwise auto-sized to fit the 1 MB prompt budget. |

### Agent Providers

The collection orchestrator (`builder/index.ts`) supports multiple agent providers with automatic fallback. 

**Architecture:**
```
Orchestrator (builder/index.ts)
    │
    ├── WarpAgentProvider (primary) → Warp Cloud Agents via oz-agent-sdk
    └── VibeAgentProvider (fallback) → Mistral Vibe CLI (local subprocess)
```

**Provider Modes:**

| Mode | Behavior | Use Case |
|------|----------|----------|
| `auto` | Uses Warp first, falls back to Vibe on quota errors | Production: maximize speed, fallback on exhaustion |
| `warp` | Uses Warp only, errors if unavailable | Warp-only environments |
| `vibe` | Uses Vibe only, errors if unavailable | Testing or Warp maintenance windows |

**Fallback Behavior:**
- Only triggers in `auto` mode when Warp throws a `ProviderQuotaError` (credits exhausted)
- Vibe must be configured (MISTRAL_API_KEY set) for fallback to work
- Fallback is per-bucket: if Warp quota exhausted mid-run, remaining buckets use Vibe
- No fallback for authentication errors, rate limits, or network issues

**Local Testing:**
```bash
# Use Warp only
export AGENT_PROVIDER=warp
export WARP_API_KEY=your-key
export WARP_ENVIRONMENT_ID=your-env

# Use Vibe only
export AGENT_PROVIDER=vibe
export MISTRAL_API_KEY=your-key

# Auto mode (default)
export WARP_API_KEY=your-key
export WARP_ENVIRONMENT_ID=your-env
export MISTRAL_API_KEY=your-key
# Uses Warp, falls back to Vibe on quota errors
```

### Warp Cloud Agent environment image

`WARP_ENVIRONMENT_ID` points at a pre-configured Warp environment that the orchestrator launches per bucket. **The image — not this repo — installs the CLI tools and bakes in API keys.** Rebuild the image with this install list:

```bash
# Node 20+ (LTS)
npm install -g agent-browser
agent-browser install                  # downloads Chrome for Testing

apt-get install -y \
    git curl jq bc \
    ffmpeg imagemagick \
    ca-certificates
```

Bake these env vars into the image as Warp environment-level secrets:

| Variable | Required | Purpose |
|---|---|---|
| `ANTHROPIC_API_KEY` | ✅ | Claude API used by the agent. |
| `OSINT_GH_TOKEN` *or* `GH_TOKEN` | ✅ | Push token (same value as the GitHub Actions secret). |
| `PERPLEXITY_API_KEY` | optional | Runtime confidence-validation queries; degrades gracefully when absent. |
| `TWITTER_BEARER_TOKEN` | optional | Twitter API path; the `agent-browser` scraping path doesn't need it. |

Verify a freshly built image with this throwaway prompt before running production collection against it:

```bash
node --version            # ≥ 20
agent-browser --version
ffmpeg -version | head -1
magick --version | head -1
jq --version
test -n "$ANTHROPIC_API_KEY" && echo "ANTHROPIC_API_KEY set"
test -n "$OSINT_GH_TOKEN" -o -n "$GH_TOKEN" && echo "push token set"
```

When you add a CLI dependency in a new skill, update this section in the same PR and rebuild the image before merge. The collection prompt does not introspect the env at runtime — if a tool is missing, the agent fails partway through a bucket.

---

## Adding a source

```bash
node skills/create-source/scripts/create-source.js
```

Walks you through type, metadata, and validation. Full guide: [`source/CONTRIBUTING.md`](source/CONTRIBUTING.md).

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
