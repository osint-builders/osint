# data/

All collected OSINT data and derived artifacts.

```
data/
├── SCHEMA.md                           # World Event Entity schema + field spec
├── stats.json                          # unified statistics (rebuilt by embeddings.yml)
├── events/YYYY-MM/YYYY-MM-DD.jsonl     # collected events (one JSON object per line)
├── indexes/                            # search + data indexes
│   ├── by-source.json                  # events grouped by source
│   ├── by-topic.json                   # events grouped by topic
│   ├── by-location.json                # events grouped by country
│   ├── metadata.json                   # lean search index (id + summary fields)
│   ├── schema.json                     # embedding model schema
│   ├── fingerprints.json               # change detection fingerprints
│   ├── embeddings.bin                  # flat float32 vectors (384-dim MiniLM)
│   └── events/                         # per-event detail JSON (gitignored; generated at deploy)
├── examples/                           # sample events for reference
└── scripts/                            # validation, indexing, dedup, retention
```

Events reference imagery via remote URLs (`image_urls`, `link_preview.image`); the repo stores no media files.

## Schema

See [`SCHEMA.md`](SCHEMA.md). The validator at `scripts/validate-events.js` enforces it.

## Scripts

| Script | Purpose |
|---|---|
| `validate-events.js` | Schema validator (`--all` baseline in CI; `--strict --time-window` at runtime). |
| `dedupe-events.js` | Cross-batch dedupe of recent day files (runs in embeddings.yml after each collection/qualify run). |
| `rebuild-indexes.js` | Rebuild all indexes + `data/stats.json` from JSONL. |
| `snowflake.js` | Event ID generator (`evt_<snowflake>`, worker = bucket number). |
| `normalize-topics.py` | One-time and ongoing topic normalization (lowercase, hyphenate, singularize). |
| `cleanup-old-data.sh` | 90-day retention sweep (run weekly by `create-release.yml`, "Create Weekly Data Release"). |

```bash
# Rebuild indexes locally:
node scripts/rebuild-indexes.js

# Validate (baseline, matches CI):
node scripts/validate-events.js --all

# Dedupe recent day files:
node scripts/dedupe-events.js --dry-run
```

## Pipeline context

The Tip & Queue pipeline writes `events/`; `indexes/` and `stats.json` get
rebuilt downstream from it. Tip handoff format: [`queue/README.md`](queue/README.md).

Run flow, per-workflow triggers, and the 90-day retention schedule live in the
repository rather than here — see the root `README.md` and
`.github/workflows/README.md` at <https://github.com/osint-builders/osint>.
(This file also ships inside the weekly data release tarball, where those paths
do not exist.)
