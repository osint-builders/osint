# LEARNINGS

Cross-run learnings the **next** Warp Cloud Agent reads at the top of its prompt. Treat this file as a compact, append-only knowledge base — not a log.

## Rules for what goes here

Add an entry when, and only when, at least one of these holds true:

1. A source's documented selectors / handle / auth changed and the new working approach.
2. A non-obvious shortcut that saved time or API calls.
3. A repeated failure pattern across **≥3 runs** with a known mitigation.
4. A schema or validation gap that bit you, plus the workaround.
5. A cost or budget signal worth surfacing to the next run.

Do **not** put per-source telemetry here (`No events parsed`, `Created event: …`, dedup skips, time-window snaps). That noise belongs in `$WORK_DIR/<source_id>/notes.md` — local to the agent, never committed. Per-source liveness verdicts (dead handle, wrong account, stale site) belong in `source/manifest.json` notes — record one short entry naming the source and evidence so a maintainer can move it there.

## Required entry format

```markdown
## YYYY-MM-DD HH:MMZ — <one-line topic>

Brief context / finding (2–4 sentences max).
```

For performance data: latency, cost, dedup info, or validator impact.  
For pattern findings: failure root cause, mitigation, affected sources (by list or rule).  
For schema findings: the gap, and concrete minimum fix.  
Link to manifest or SCHEMA.md when direct evidence lives there.

Cap: max 10 KB and 100 entries; orchestrator auto-prunes expired entries. Each entry carries an implicit expiry; when superseded by a manifest edit or your own rerun finding a different root cause, remove the old entry to keep the file fresh.

<!-- entries below this line; newest first -->

## 2026-09-05 08:09Z — ClashReport editorial focus shift to US domestic news

During 2026-09-05 batch 1, all three telegram-clashreport candidates were US domestic defense policy posts (Pentagon leak investigation, Deputy Defense Secretary replacement, DOJ-Canada trade cooperation). These do not align with the documented source profile ("breaking conflict zones worldwide" — Ukraine, Middle East, Africa). This indicates either a recent channel pivot or a data error. Recommend maintainer review ClashReport's recent posts to confirm scope change and update manifest accordingly.

