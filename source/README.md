# source/

Per-source OSINT collection specs read by the cloud agent.

## Files

- `manifest.json` — registry; deny-list (skip if `status` ∈ `{inactive, archived, deprecated}`)
- `sources/<id>.md` — per-source spec (front matter + body)
- `examples/` — type templates (`twitter`, `webpage`, `api`, `email`, `rss`)
- [`CONTRIBUTING.md`](CONTRIBUTING.md) — how to add a source (schema + step-by-step)

## Quick Add

```bash
cp examples/twitter-example.md sources/twitter-newaccount.md
# edit, then:
node ../skills/create-source/scripts/validate-source.js sources/twitter-newaccount.md
node ../skills/create-source/scripts/update-manifest.py
```

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for the detailed schema, type-specific requirements,
and validation rules. The world-event-entity output schema lives in [`../data/SCHEMA.md`](../data/SCHEMA.md).
