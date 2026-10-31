# data/queue/

Tip & Queue handoff between the two collection workflows. Git-committed JSON,
following the same bot-commit convention as the rest of `data/`.

```
data/queue/
├── pending/     # tips identify.yml has written, not yet qualified
├── processed/   # tips qualify.yml has consumed (kept for audit/debugging)
└── expired/     # tips that waited more than 24 hours (retained for backfill)
```

## Tip record shape

One JSON file per source hit, written by `builder/runtime/identify.sh`:

```json
{
  "source_id": "telegram-afustratcom",
  "source_name": "AFU Strategic Communications (@AFUStratCom)",
  "type": "telegram",
  "window_start": "2026-08-25T15:00:00Z",
  "window_end": "2026-08-25T16:00:00Z",
  "identified_at": "2026-08-25T16:00:12Z",
  "candidates": [
    {"url": "https://t.me/AFUStratCom/501", "snippet": "", "published_at": "2026-08-25T15:42:00Z"}
  ]
}
```

`candidates` holds up to 3 items (`MAX_CANDIDATES` in `identify.sh`) — raw
URLs + best-effort snippets, not yet translated, extracted, or geocoded.
`qualify.yml` does that work per tip, then moves the consumed file from
`pending/` to `processed/` as part of its commit.

## Lifecycle

1. `identify.yml` (stage 1, no LLM) scans every processable source and
   writes tips here for anything published in the last hour.
2. Before qualification, `qualify.yml` moves tips older than 24 hours to
   `expired/`. It also removes a redundant pending copy when the same filename
   already exists in `processed/`. The archived JSON remains available for a
   deliberate backfill; the live workflow does not spend LLM credits on it.
3. `qualify.yml` (stage 2) takes the newest pending tips, at most 10 batches
   of 3 by default, and spawns one short-lived Warp cloud agent per batch to
   do the LLM work (translate, extract, E-PRIME, geocode, enrich, confidence)
   and commit the resulting World Event Entities to `data/events/`.
