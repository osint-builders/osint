---
name: remember-as-you-go
description: Strict criteria for what to write into LEARNINGS.md (the cross-run knowledge base read by the next Warp Cloud Agent). Distinguishes durable findings from per-run telemetry, which goes to data/run-logs/ instead. Use this skill at Step 7 of each collection run.
license: MIT
compatibility: linux (warp-cloud-agent-env-image)
metadata:
  author: osint-builders
  version: "2.0.0"
  reads: "../../LEARNINGS.md"
  writes: "../../LEARNINGS.md, ../../data/run-logs/YYYY-MM/YYYY-MM-DD.log"
---

# remember-as-you-go

Two files. Two purposes. Don't conflate.

| File | Purpose | Next run reads? |
|---|---|---|
| `data/run-logs/YYYY-MM/YYYY-MM-DD.log` | Per-run telemetry — `Processing <id>`, `Created event:`, dedup skips, window snaps, parse counts. Full firehose. | ❌ |
| `LEARNINGS.md` | Durable findings, shortcuts, optimization opportunities. Append only when criteria met. | ✅ Injected as `## Prior Learnings`. |

Orchestrator reads `LEARNINGS.md`, drops expired entries, caps at 100 entries / 30 KB, injects result. Never rotate manually.

## When to write to `LEARNINGS.md`

Append only when:

1. **Source spec changed** — selectors/handle/auth shifted + working fix found.
2. **Non-obvious shortcut** — saved real time or API calls.
3. **Repeated failure (≥3 runs)** — fix outlives this run.
4. **Schema/validation gap** + workaround.
5. **Cost signal** — hit Perplexity/Twitter/Nominatim quota next run should know.

## When NOT to write to `LEARNINGS.md`

- `No events parsed` / `Created event:` / per-source counts → `data/run-logs/` only.
- `[skip] dup url` lines → `data/run-logs/` only.
- `[snap]` time-window notices → `data/run-logs/` only.
- Standard documented behavior → no entry.
- One-off cause (network blip, single bad response) → no entry.

Doesn't fit criteria 1-5 → `data/run-logs/` only.

## Required entry format

```markdown
## YYYY-MM-DD HH:MMZ — <one-line topic>
**Trigger:** <failure, pattern, optimization>
**Finding:** <what is true, 1-3 sentences>
**Action for next run:** <concrete instruction>
**Expires:** YYYY-MM-DD | permanent
```

All five lines required. Missing fields → silent drop.

## Editing rules

- **Append only** below `<!-- entries below this line; newest first -->`.
- **Never edit existing entries** — supersede with new one.
- **Never re-order** — orchestrator handles.
- `permanent` for invariants (repo conventions, schema, hard quotas). Real date for time-bound.

## Good vs. bad entries

### ✅ Good

```markdown
## 2026-05-01 16:34Z — twitter-cnn API timeline returns 401
**Trigger:** 4 consecutive runs failed for twitter-cnn with HTTP 401 on /2/users/:id/tweets despite valid TWITTER_BEARER_TOKEN.
**Finding:** CNN's account is no longer accessible via the API tier we use; agent-browser scraping with `wait --selector article` works.
**Action for next run:** Skip the API path for twitter-cnn; jump straight to agent-browser.
**Expires:** 2026-08-01
```

### ❌ Bad — telemetry

```markdown
## 2026-05-01 16:34Z — twitter-cnn produced 0 events
**Trigger:** Run completed.
**Finding:** No events from twitter-cnn this hour.
**Action for next run:** None.
**Expires:** 2026-05-02
```

(Belongs in `data/run-logs/`.)

### ❌ Bad — too vague

```markdown
## 2026-05-01 16:34Z — Twitter is flaky
**Trigger:** Some sources failed.
**Finding:** Twitter scraping is unreliable.
**Action for next run:** Be careful.
**Expires:** permanent
```

(No source, symptom, or action — useless.)

## Pitfalls

- **`memory.md` gone** — renamed to `LEARNINGS.md` in PR-3. Old refs stale.
- **Never trim `LEARNINGS.md`** — orchestrator handles.
- **One finding per entry** — bundling breaks expiry.
