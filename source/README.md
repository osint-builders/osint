# source/

Per-source OSINT collection specs read by the cloud agent.

## Files

- `manifest.json` — registry; deny-list (skip if `status` ∈ `{inactive, archived, deprecated}`). Deactivated entries carry a `note` explaining the evidence.
- `sources/<id>.md` — per-source spec (front matter + body). The `#` header doubles as the canonical `source.name`.
- `REVIEW.md` — manual-review queue for sources with wrong-handle or fixable-URL evidence.
- `examples/` — type templates (`twitter`, `webpage`, `api`, `email`, `rss`)
- `scripts/sync-manifest-names.js` — syncs manifest `name` fields from source headers (`--check` mode for CI/local drift checks)
- [`CONTRIBUTING.md`](CONTRIBUTING.md) — how to add a source (schema + step-by-step)

## Quick Add

```bash
cp examples/twitter-example.md sources/twitter-newaccount.md
# edit, then:
node ../skills/create-source/scripts/validate-source.js sources/twitter-newaccount.md
node ../skills/create-source/scripts/update-manifest.py
node scripts/sync-manifest-names.js
```

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for the detailed schema, type-specific requirements,
and validation rules. The world-event-entity output schema lives in [`../data/SCHEMA.md`](../data/SCHEMA.md).
