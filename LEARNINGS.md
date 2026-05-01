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

## 2026-05-01 19:41Z — Twitter API credits depleted mid-run
**Trigger:** Twitter API returned HTTP 402 (CreditsDepleted) for all search/recent queries during bucket 4 processing.
**Finding:** The Twitter API v2 account (ID 1420048076681715717) exhausted its credit allocation, preventing direct tweet collection from all 26 Twitter sources in this bucket. Perplexity sonar-pro API with search_recency_filter served as an effective fallback for event discovery, while CNN.com homepage scraping provided real-time headline verification.
**Action for next run:** Check Twitter API credit balance before dispatching buckets. If credits depleted, prioritize agent-browser scraping of X.com (requires login) or nitter instances, and use Perplexity API as primary event discovery mechanism. Consider splitting Twitter API usage across buckets to avoid exhaustion.
**Expires:** 2026-06-01

## 2026-05-01 19:55Z — agent-browser scrapes X.com profiles without auth
**Trigger:** Twitter API credits depleted (confirmed by bucket 1 independently); needed alternative collection approach for 30 Twitter sources.
**Finding:** agent-browser can load X.com/@handle profiles without login and extract article elements containing tweet text, datetime attributes, and tweet URLs. JavaScript eval extracts structured data: `document.querySelectorAll('article')` exposes `<time datetime="">` attributes with ISO timestamps and tweet status URLs. However, most niche OSINT accounts show no tweets or only old pinned/historical tweets without auth — only high-traffic accounts like @BBCWorld reliably surface recent content. Of 30 sources scraped, only 1 (BBCWorld) had tweets within the 1-hour window.
**Action for next run:** Use agent-browser as fallback for Twitter collection, but expect low yield from niche accounts without login. Prioritize high-traffic news accounts (BBCWorld, NASA) for agent-browser scraping. Consider authenticating agent-browser with Twitter credentials via `--profile` flag for better access to lower-traffic accounts.
**Expires:** 2026-06-01
