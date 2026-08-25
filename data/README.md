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
| `dedupe-events.js` | Cross-bucket dedupe of recent day files (runs in embeddings.yml after each collection). |
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

## Search UI deploy flow

```
collection (collection.yml) completes
        │
        ▼  (workflow_run)
embeddings.yml  ← dedupes recent events, rebuilds data/indexes/* + data/stats.json,
                   commits the result [skip ci]
        │
        ▼  (workflow_run)
deploy-downstream.yml (pages-build/pages-deploy jobs)
                ← runs backfill_event_details.py (generates data/indexes/events/)
                   copies data/indexes/ → docs/indexes/
                   builds frontend/ → docs/
                   uploads docs/ to GitHub Pages
```

The site deploys to `https://osint.builders/`.

```bash
# Local frontend preview (after building the search index once):
cd frontend && npm install && npm run dev   # http://localhost:5173/
```

## Retention

The 90-day sweep runs weekly via `.github/workflows/create-release.yml`.
