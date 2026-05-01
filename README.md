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
builder/index.ts                       # oz-agent-sdk client
  • reads source/manifest.json         # deny-list: skip status ∈ {inactive,archived,deprecated}
  • partitions sources into N buckets  # sized to fit Warp's 1 MB prompt cap
  • fans out one Warp Cloud Agent per bucket (parallel)
    │
    ▼
Warp Cloud Agent (Claude Code)
  • inlines source/sources/*.md for its bucket
  • per source: scrape → E-PRIME transform → geocode → confidence-validate
  • emits World Event Entities to data/events/YYYY-MM/YYYY-MM-DD.jsonl
  • normalizes media → data/media/YYYY-MM/{images,videos}/YYYY-MM-DD/
  • commits + pushes
```

The actual prompt sent to the Warp agent is constructed in `builder/index.ts::buildCollectionPrompt()` — that is the source of truth, not this README.

---

## Where things live

| Path | Role |
|---|---|
| `builder/index.ts` | Orchestrator. Builds the per-bucket prompt and dispatches Warp agents. |
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

export WARP_API_KEY="***"
export WARP_ENVIRONMENT_ID="your-warp-environment-uid"

cd builder && npm run collect

# inspect what was written
cat data/events/$(date +%Y-%m)/$(date +%Y-%m-%d).jsonl | jq .
```

---

## World Event Entity (at a glance)

```json
{
  "id": "evt_20260429_001",
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

Set these in GitHub Actions **Settings → Secrets and variables**:

| Secret / Variable | Purpose |
|---|---|
| `WARP_API_KEY` | Authenticates oz-agent-sdk against Warp |
| `WARP_ENVIRONMENT_ID` | Pre-built Warp env image (has `agent-browser`, `ffmpeg`, `imagemagick`, `jq`, plus `ANTHROPIC_API_KEY` / `PERPLEXITY_API_KEY` / `TWITTER_BEARER_TOKEN` baked in) |
| `PARALLEL_AGENT_COUNT` (var) | Optional. Bucket count override; otherwise auto-sized from prompt budget. |

The Warp environment image — not this repo — is responsible for installing CLI tools the agent uses. See [`AGENTS.md`](AGENTS.md) for the canonical install list.

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
