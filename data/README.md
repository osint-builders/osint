# data/

Output directory for the hourly collection pipeline.

## Layout

```
data/
├── SCHEMA.md          # canonical World Event Entity schema
├── manifest.json      # collection statistics (regenerated each run)
├── events/YYYY-MM/YYYY-MM-DD.jsonl
├── media/YYYY-MM/{images,videos}/YYYY-MM-DD/
├── indexes/           # by-source.json, by-topic.json, by-location.json, stats.json
├── run-logs/YYYY-MM/YYYY-MM-DD.log    # per-run telemetry firehose
├── examples/          # sample event for reference
└── scripts/           # validation, indexing, retention
```

## Schema

See [`SCHEMA.md`](SCHEMA.md). The validator at `scripts/validate-events.js` is the canonical implementation.

## Scripts

| Script | Purpose |
|---|---|
| `validate-events.js` | Schema validator. Used by CI (`--all` baseline) and the runtime (`--strict --time-window`). |
| `rebuild-indexes.js` | Regenerate `by-source` / `by-topic` / `by-location` indexes from JSONL. |
| `stats-report.js`    | Compute statistics for `manifest.json`. |
| `cleanup-old-data.sh`| 90-day retention sweep (wired into `create-release.yml`). |
| `export-date-range.sh` | Export events between two dates. |

## Retention

The 90-day retention sweep runs weekly via `.github/workflows/create-release.yml`.

## Validation

```bash
# Local baseline check (matches CI):
node scripts/validate-events.js --all

# Strict (matches runtime):
node scripts/validate-events.js <file> --strict
```
