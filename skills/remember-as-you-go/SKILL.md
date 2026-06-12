---
name: remember-as-you-go
description: Strict criteria for what to write into LEARNINGS.md (the cross-run knowledge base read by the next Warp Cloud Agent). Distinguishes durable findings from per-run telemetry, which stays in the agent's local work directory. Use this skill at Step 7 of each collection run.
license: MIT
compatibility: linux (warp-cloud-agent-env-image)
metadata:
  author: osint-builders
  version: "2.1.0"
  reads: "../../LEARNINGS.md"
  writes: "../../LEARNINGS.md"
---

# remember-as-you-go

Three destinations. Three purposes. Don't conflate.

| Destination | Purpose | Next run reads? |
|---|---|---|
| `$WORK_DIR/<source_id>/notes.md` | Per-run telemetry — `Processing <id>`, `Created event:`, dedup skips, window snaps, parse counts. Local to the agent; never committed. | ❌ |
| `source/manifest.json` `note` field | Per-source liveness verdicts (dead handle, wrong account, stale site). A maintainer applies these — the agent only proposes via a LEARNINGS entry. | ✅ (as status filtering) |
| `LEARNINGS.md` | Durable cross-cutting findings, shortcuts, cost signals. Append only when criteria met. | ✅ Injected as `## Prior learnings`. |

Orchestrator reads `LEARNINGS.md`, drops expired entries, caps at 100 entries / 10 KB, injects result into every bucket prompt. Never rotate manually — every byte here multiplies across all bucket prompts.

## When to write to `LEARNINGS.md`

Append only when:

1. **Source spec changed** — selectors/handle/auth shifted + working fix found.
2. **Non-obvious shortcut** — saved real time or API calls.
3. **Repeated failure (≥3 runs)** — fix outlives this run.
4. **Schema/validation gap** + workaround.
5. **Cost signal** — hit Perplexity/Twitter/Nominatim quota next run should know.
6. **Source liveness verdict** — ONE short entry naming the source + evidence, so a maintainer can set the manifest `status`/`note`. Keep it to two lines; the manifest, not LEARNINGS, owns this fact long-term.

## When NOT to write to `LEARNINGS.md`

- `No events parsed` / `Created event:` / per-source counts → `$WORK_DIR/<id>/notes.md` only.
- `[skip] dup url` lines → `$WORK_DIR/<id>/notes.md` only.
- `[snap]` time-window notices → `$WORK_DIR/<id>/notes.md` only.
- Standard documented behavior → no entry.
- One-off cause (network blip, single bad response) → no entry.

Doesn't fit criteria 1-6 → `$WORK_DIR/<id>/notes.md` only.

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

(Belongs in `$WORK_DIR/<id>/notes.md`.)

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

- **Never trim `LEARNINGS.md`** — the orchestrator prunes expired entries; maintainers prune superseded ones.
- **One finding per entry** — bundling breaks expiry.
- **Liveness verdicts stay short** — the full evidence trail belongs in the manifest note, not here.
