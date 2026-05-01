---
name: remember-as-you-go
description: Strict criteria for what to write into LEARNINGS.md (the cross-run knowledge base read by the next Warp Cloud Agent). Distinguishes durable findings from per-run telemetry, which goes to data/run-logs/ instead. Use this skill at Step 7 of each collection run.
license: MIT
metadata:
  author: osint-builders
  version: "2.0.0"
  reads: "../../LEARNINGS.md"
  writes: "../../LEARNINGS.md, ../../data/run-logs/YYYY-MM/YYYY-MM-DD.log"
---

# remember-as-you-go

Two files. Two purposes. Don't conflate them.

| File | Purpose | Read by next run? |
|---|---|---|
| `data/run-logs/YYYY-MM/YYYY-MM-DD.log` | Per-run operational telemetry — `Processing <id>`, `Created event:`, dedup skips, time-window snaps, parse counts. Every run, full firehose. | ❌ |
| `LEARNINGS.md` (repo root) | Durable findings, shortcuts, optimization opportunities. Append only when criteria below are met. | ✅ Injected at the top of every prompt as `## Prior Learnings`. |

The orchestrator (`builder/index.ts::loadLearnings()`) reads `LEARNINGS.md`, drops entries past their `Expires` date, caps at 100 entries / 30 KB, then injects the result. You never have to manage rotation yourself.

## When to write to `LEARNINGS.md`

Append a new entry **only** when at least one of these is true:

1. **Source spec changed.** Selectors, handle, or auth shifted; you found the new working approach.
2. **Non-obvious shortcut.** Something saved real time or API calls — not a documented happy path.
3. **Repeated failure (≥3 runs).** A pattern you've now seen often enough that the fix should outlive this run.
4. **Schema or validation gap.** The pipeline or schema let through (or rejected) something it shouldn't have, and you have a workaround.
5. **Cost or budget signal.** Hit Perplexity / Twitter / Nominatim quota in a way the next run should know about.

## When NOT to write to `LEARNINGS.md`

- "No events parsed" / "Created event: …" / per-source success counts → `data/run-logs/` only.
- Dedup skip lines (`[skip] dup url: …`) → `data/run-logs/` only.
- Time-window snap notices (`[snap] 2026-…`) → `data/run-logs/` only.
- Standard documented behavior. If it worked the way the docs say, no entry.
- One-off context. If the cause is unique to this run (transient network blip, single bad source response), no entry.

If your finding is "huh, that's odd" but you can't fit it into criterion 1-5, write it to `data/run-logs/` and move on.

## Required entry format

```markdown
## YYYY-MM-DD HH:MMZ — <one-line topic>
**Trigger:** <what surfaced this — failure, repeated pattern, optimization spotted>
**Finding:** <what is true, in 1-3 sentences>
**Action for next run:** <concrete instruction the next agent should follow>
**Expires:** YYYY-MM-DD | permanent
```

All five lines required. The orchestrator parses them; missing fields cause the entry to be dropped silently.

## Editing rules

- **Append only.** Add new entries below the `<!-- entries below this line; newest first -->` marker.
- **Never modify or delete existing entries.** If a finding is wrong, write a new entry that supersedes it.
- **Never re-order existing entries.** The orchestrator handles ordering.
- Set `**Expires:**` to a real `YYYY-MM-DD` date when the finding is genuinely time-bound (e.g., "Twitter UI A/B test ends 2026-06-01"). Use `permanent` only for invariants — repository conventions, schema rules, hard quotas.

## Good vs. bad entries

### ✅ Good

```markdown
## 2026-05-01 16:34Z — twitter-cnn API timeline returns 401
**Trigger:** 4 consecutive runs failed for twitter-cnn with HTTP 401 on /2/users/:id/tweets despite valid TWITTER_BEARER_TOKEN.
**Finding:** CNN's account is no longer accessible via the API tier we use; agent-browser scraping with `wait --selector article` works.
**Action for next run:** Skip the API path for twitter-cnn; jump straight to agent-browser.
**Expires:** 2026-08-01
```

### ❌ Bad — telemetry, not learning

```markdown
## 2026-05-01 16:34Z — twitter-cnn produced 0 events
**Trigger:** Run completed.
**Finding:** No events from twitter-cnn this hour.
**Action for next run:** None.
**Expires:** 2026-05-02
```

(That belongs in `data/run-logs/`; the next run gains nothing from knowing one source was quiet for one hour.)

### ❌ Bad — too vague to act on

```markdown
## 2026-05-01 16:34Z — Twitter is flaky
**Trigger:** Some sources failed.
**Finding:** Twitter scraping is unreliable.
**Action for next run:** Be careful.
**Expires:** permanent
```

(No specific source, no specific symptom, no concrete action.)

## Pitfalls

- **Don't write to `memory.md`.** That file was renamed to `LEARNINGS.md` in PR-3 and removed. References to `memory.md` in older docs are stale.
- **Don't trim or rotate `LEARNINGS.md`.** The orchestrator does that.
- **Don't merge multiple findings into one entry.** Each entry is independently filterable; bundling makes expiry useless.
