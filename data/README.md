# data/

All collected OSINT data and derived artifacts.

```
data/
├── SCHEMA.md                           # World Event Entity schema + field spec
├── stats.json                          # unified statistics (rebuilt by embeddings.yml)
├── events/YYYY-MM/YYYY-MM-DD.jsonl     # collected events (one JSON object per line)
├── media/YYYY-MM/{images,videos}/      # extracted media (images normalized to 720×720 PNG)
├── indexes/                            # search + data indexes
│   ├── by-source.json                  # events grouped by source
│   ├── by-topic.json                   # events grouped by topic
│   ├── by-location.json                # events grouped by country
│   ├── metadata.json                   # lean search index (id + summary fields)
│   ├── schema.json                     # embedding model schema
│   ├── fingerprints.json               # change detection fingerprints
│   ├── pca_transform.json              # PCA reduction transform
│   └── events/                         # per-event detail JSON (gitignored; generated at deploy)
├── examples/                           # sample events for reference
└── scripts/                            # validation, indexing, normalization, retention
```

## Schema

See [`SCHEMA.md`](SCHEMA.md). The validator at `scripts/validate-events.js` enforces it.

## Scripts

| Script | Purpose |
|---|---|
| `validate-events.js` | Schema validator (`--all` baseline in CI; `--strict --time-window` at runtime). |
| `rebuild-indexes.js` | Rebuild all indexes + `data/stats.json` from JSONL. |
| `normalize-topics.py`| One-time and ongoing topic normalization (lowercase, hyphenate, singularize). |
| `cleanup-old-data.sh`| 90-day retention sweep (run weekly by `create-release.yml`). |

```bash
# Rebuild indexes locally:
node scripts/rebuild-indexes.js

# Validate (baseline, matches CI):
node scripts/validate-events.js --all
```

## Search UI deploy flow

```
collection (hourly-collection.yml) succeeds
        │
        ▼
embeddings.yml  ← rebuilds data/indexes/{metadata,schema,fingerprints,pca}.json
                   runs rebuild-indexes.js → data/stats.json + data/indexes/by-*.json
        │
        ▼  (workflow_run)
pages.yml       ← runs backfill_event_details.py (generates data/indexes/events/)
                   copies data/indexes/ → docs/indexes/
                   builds frontend/ → docs/
                   uploads docs/ to GitHub Pages
```

The site is deployed at `https://osint.builders/`.

```bash
# Local frontend preview (after building the search index once):
cd frontend && npm install && npm run dev   # http://localhost:5173/
```

## Retention

90-day sweep runs weekly via `.github/workflows/create-release.yml`.
