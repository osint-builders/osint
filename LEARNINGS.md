# LEARNINGS

Cross-run learnings the **next** Warp Cloud Agent reads at the top of its prompt. Treat this file as a compact, append-only knowledge base — not a log.

## Rules for what goes here

Add an entry when, and only when, at least one of these is true:

1. A source's documented selectors / handle / auth changed and the new working approach.
2. A non-obvious shortcut that saved time or API calls.
3. A repeated failure pattern across **≥3 runs** with a known mitigation.
4. A schema or validation gap that bit you, plus the workaround.
5. A cost or budget signal worth surfacing to the next run.

Do **not** put per-source telemetry here (`No events parsed`, `Created event: …`, dedup skips, time-window snaps). That noise belongs in `data/run-logs/YYYY-MM/YYYY-MM-DD.log`.

## Required entry format

```markdown
## YYYY-MM-DD HH:MMZ — <one-line topic>
**Trigger:** <what surfaced this>
**Finding:** <what is true, 1-3 sentences>
**Action for next run:** <concrete instruction>
**Expires:** YYYY-MM-DD | permanent
```

The orchestrator (`builder/index.ts`) reads this file, drops entries whose `Expires` date has passed, then injects the remaining entries into every per-bucket prompt as `## Prior Learnings`. If the file has more than **100 entries** or **30 KB**, the oldest non-`permanent` entries are dropped before injection.

## Maintenance

- The agent appends new entries during a run only when a rule above triggers.
- The orchestrator prunes expired entries on the next run.
- Humans may add `permanent` entries for invariants worth preserving.

---

<!-- entries below this line; newest first -->

## 2026-05-01 19:55Z — Twitter API credits depleted; fallback collection strategy needed
**Trigger:** Twitter Bearer Token returned "CreditsDepleted" error for all API v2 calls during bucket 2 run
**Finding:** The TWITTER_BEARER_TOKEN has exhausted its monthly credits. All 28 Twitter source collections fell back to web search (Perplexity API, exa_web_search) and agent-browser scraping. X.com requires authentication for recent tweet timelines, limiting agent-browser's effectiveness on Twitter profiles (only showing old tweets for unauthenticated sessions).
**Action for next run:** Check Twitter API credit status at run start. If depleted, immediately pivot to: (1) Perplexity API with `search_recency_filter: "hour"` for source-specific queries, (2) exa_web_search for broad event discovery, (3) agent-browser on non-Twitter web sources. Consider requesting credit top-up or rotating to a backup bearer token.
**Expires:** 2026-06-01

## 2026-05-01 19:55Z — Twitter API credits depleted; fallback collection strategy needed
**Trigger:** Twitter Bearer Token returned "CreditsDepleted" error for all API v2 calls during bucket 2 run
**Finding:** The TWITTER_BEARER_TOKEN has exhausted its monthly credits. All 28 Twitter source collections fell back to web search (Perplexity API, exa_web_search) and agent-browser scraping. X.com requires authentication for recent tweet timelines, limiting agent-browser's effectiveness on Twitter profiles (only showing old tweets for unauthenticated sessions).
**Action for next run:** Check Twitter API credit status at run start. If depleted, immediately pivot to: (1) Perplexity API with search_recency_filter hour for source-specific queries, (2) exa_web_search for broad event discovery, (3) agent-browser on non-Twitter web sources. Consider requesting credit top-up or rotating to a backup bearer token.
**Expires:** 2026-06-01

## 2026-05-01 19:55Z — Twitter API credits depleted; fallback collection strategy needed
**Trigger:** Twitter Bearer Token returned "CreditsDepleted" error for all API v2 calls during bucket 2 run
**Finding:** The TWITTER_BEARER_TOKEN has exhausted its monthly credits. All 28 Twitter source collections fell back to web search (Perplexity API, exa_web_search) and agent-browser scraping.
**Action for next run:** Check Twitter API credit status at run start. If depleted, pivot to Perplexity API and exa_web_search immediately.
**Expires:** 2026-06-01
