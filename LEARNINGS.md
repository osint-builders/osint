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
**Trigger:** <what surfaced this>
**Finding:** <what holds true, 1-3 sentences>
**Action for next run:** <concrete instruction>
**Expires:** YYYY-MM-DD | permanent
```

The orchestrator (`builder/index.ts`) reads this file, drops entries whose `Expires` date has passed, then injects the remaining entries into every per-bucket prompt as `## Prior learnings`. If the file exceeds **100 entries** or **10 KB**, the oldest non-`permanent` entries drop off before injection.

## Maintenance

- The agent appends new entries during a run only when a rule above triggers.
- The orchestrator prunes expired entries on the next run.
- Humans may add `permanent` entries for invariants worth preserving.

---

<!-- entries below this line; newest first -->

## 2026-06-12 — Overhaul: runtime scripts own the mechanics; manifest notes own per-source liveness
**Trigger:** Repo overhaul moved collection mechanics into `builder/runtime/*.sh` and source-liveness facts into `source/manifest.json` notes + `source/REVIEW.md` (~58 dead or wrong sources left the processable set).
**Finding:** Helper scripts now handle pre-checks, geocoding (with seeded fallback coordinates), link-preview enrichment, confidence validation, merge dedup (URL + content fingerprint), and commit/push. Inline bash improvisation caused most past breakage.
**Action for next run:** Invoke the `builder/runtime/` scripts instead of writing ad-hoc bash. Report new per-source liveness findings as one short entry naming the source and evidence; a maintainer moves them into the manifest.
**Expires:** permanent

## 2026-05-25 00:17Z — Telegram t.me embed endpoint reliably extracts post timestamps when agent-browser datetime fails
**Trigger:** Bucket 10 collection. agent-browser eval for `.tgme_widget_message time[datetime]` returned null for all QudsNen and ourwarstoday posts. Fell back to individual post embed endpoints.
**Finding:** `curl -sf https://t.me/<channel>/<post_id>?embed=1 | grep -oP 'datetime="[^"]*"'` reliably returns the exact UTC post timestamp from the HTML embed page. This works even when the full channel preview page (`t.me/s/<channel>`) does not expose datetime attributes in agent-browser's DOM. The approach allows checking specific post IDs sequentially (1 request per post) to find in-window content quickly.
**Action for next run:** When agent-browser datetime extraction returns null for Telegram posts, fall back to checking individual post embeds via `curl https://t.me/<channel>/<last_known_id>?embed=1`. Increment post ID from the last known post to find recent posts, then extract timestamps to filter for the collection window.
**Expires:** permanent

## 2026-05-24 21:22Z — r.jina.ai Telegram output truncation hides in-window posts; use grep for timestamps first
**Trigger:** Bucket 2 collection. Initial 15KB fetch of MES Telegram channel via r.jina.ai showed latest post at 17:31 UTC, appearing to have no posts in the 20:22-21:22 window. A targeted grep for time patterns revealed posts at 20:25, 20:28, 20:30, 20:36 UTC that the truncated initial read missed.
**Finding:** r.jina.ai returns Telegram channel preview pages with posts ordered newest-first, but the raw markdown output can exceed typical fetch limits. When the output gets truncated at 15KB, the newest posts (at the top of the page) get cut off, leaving only older posts visible. Using `grep -oP '\[\d+:\d+\]'` on the full output efficiently extracts all post timestamps without reading the full content.
**Action for next run:** For all Telegram sources, after fetching r.jina.ai output, immediately run `grep -oP '\[\d+:\d+\]'` to extract all post timestamps before reading content. Only then read the full content of posts whose timestamps fall within the collection window.
**Expires:** permanent

## 2026-05-24 00:15Z — Late-night UTC window (23:15-00:15) yields zero Twitter API results for active handles
**Trigger:** Bucket 15 collection. Twitter API search/recent returned result_count=0 for all 5 verified-active handles (Thewarzonewire, Gcaptain, AuroraIntel, Esri, USFleetForces) despite confirmed account existence and recent posting activity.
**Finding:** The 23:15-00:15 UTC collection window falls during late evening in the Americas and early morning in Europe/Middle East. Defense and OSINT Twitter accounts rarely post during this hour, producing zero in-window results from the API even when accounts remain active. exa_web_search proved effective as a fallback for all sources, surfacing 10 events from wire services and 24/7 news outlets that covered the same topic areas.
**Action for next run:** For buckets scheduled in the 22:00-02:00 UTC range, expect zero or near-zero Twitter API results from most handles. Skip straight to exa_web_search with source-specific keywords to avoid wasting API rate limits. Reserve Twitter API calls for buckets aligned with 12:00-22:00 UTC when posting activity peaks.
**Expires:** permanent

## 2026-05-21 — E-PRIME violations common in generated contents; automated cleanup required
**Trigger:** 5 of 27 events in a bucket contained "been" in contents field, failing strict validation. "has been," "had been," "have been," "is," "are," "was," "were" appear regularly in LLM-generated text.
**Finding:** E-PRIME enforcement must happen as a post-generation pass, not just as a prompt instruction. Key substitutions: "has been X" → "has X" or "X'd"; "had been" → "had previously"; "have been" → "have remained/have"; "is" → active verb. Apply this pass before calling the validator.
**Action for next run:** After generating each event's `contents`, run an explicit E-PRIME cleanup substitution pass before validation. Build this into the generation loop, not as a separate step.
**Expires:** permanent

## 2026-05-21 — Twitter API credits restore on monthly billing cycle; use API first
**Trigger:** Credits depleted 2026-05-01; confirmed restored 2026-05-15. Multiple subsequent runs confirmed API operational through 2026-05-21.
**Finding:** The TWITTER_BEARER_TOKEN credit pool resets on a monthly cycle. After depletion, credits return within ~15 days. When credits are active, the search/recent endpoint with start_time/end_time parameters is the most precise method for in-window tweet discovery. r.jina.ai mirror and exa_web_search remain valid fallbacks if credits deplete again mid-month.
**Action for next run:** Attempt Twitter API search/recent first for all twitter-* sources. If HTTP 402 CreditsDepleted received, fall back to r.jina.ai mirror, then exa_web_search. Check credit status once per run at start — do not check per-source.
**Expires:** 2026-07-15

## 2026-05-21 — Reddit JSON API: intermittent 403 from agent environment; attempt first, fall back on failure
**Trigger:** Same-day bucket runs produced both 403 blocks and successful JSON responses for identical endpoints. The block appears IP-rotation-dependent, not permanent.
**Finding:** reddit.com/r/*/new.json endpoints with User-Agent osint-bot/1.0 return HTTP 403 in some agent environment IP ranges and valid JSON in others. The block is not consistent or permanent. exa_web_search with subreddit-specific keywords is an effective fallback when blocked.
**Action for next run:** For reddit-* sources, attempt the JSON API first. If 403 received, do not retry — fall back immediately to exa_web_search with source-specific keywords.
**Expires:** 2026-08-21

## 2026-05-21 — exa_web_search effective primary tool; URL dedup critical; late buckets get diminishing returns
**Trigger:** Multiple runs with Twitter API depleted; observed 45% URL collision rate in bucket 5 vs buckets 1-4.
**Finding:** exa_web_search reliably surfaces events within the target window. However, major wire service stories (Reuters, AP, AFP) get surfaced across all source topic areas, so later buckets see 40-50% URL collision. The merge step (`builder/runtime/merge-events.sh`) plus the post-run dedupe pass now drop these duplicates by URL and content fingerprint.
**Action for next run:** When falling back to exa_web_search for niche sources, prefer angles specific to that source's topic keywords over general breaking-news queries — generic queries mostly yield duplicates that dedup discards.
**Expires:** 2026-08-21

## 2026-05-15 — r.jina.ai mirror returns usable X profile snapshots; snowflake IDs decode to UTC
**Trigger:** Needed Twitter fallback after API credit depletion; unauthenticated X timelines hid recent posts.
**Finding:** `https://r.jina.ai/http://x.com/<handle>` returns readable profile snapshots for X accounts, including tweet status IDs. Snowflake ID decoding formula: `timestamp_ms = (snowflake_id >> 22) + 1288834974657` recovers exact UTC posting time even when the page shows relative labels ("1m", "2h"). Broken or zero-activity accounts still return stale or missing timelines.
**Action for next run:** When Twitter API unavailable or returns no results, fetch r.jina.ai mirror as second-pass. Decode snowflake IDs from status URLs to recover UTC timestamps. Keep only tweets whose decoded times fall within the bucket window.
**Expires:** 2026-07-15

## 2026-08-31 — twitter-clash-report: recent scan yielded off-topic political content
**Trigger:** Batch 5 processing showed all 3 candidates for twitter-clash-report (2026-08-31 18:16–19:16 window) contained JD Vance political commentary, inconsistent with source scope (military conflicts, security incidents, MENA).
**Finding:** The identify stage incorrectly flagged JD Vance posts as matching "military/security" keywords. Account remains active and matches stated profile; false positives were keyword-driven rather than editorial drift.
**Action for next run:** Tighten identify.sh keyword matching for twitter-clash-report to exclude US domestic political figures (JD Vance, etc.) not involved in armed conflict. Consider adding exclusion pattern for campaign-related content.
**Expires:** 2026-09-30
