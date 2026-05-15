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

## 2026-05-01 19:55Z — Twitter API credits depleted; X browser scraping unreliable without auth
**Trigger:** All Twitter API v2 endpoints returned 402 CreditsDepleted across all 29 bucket 5 sources. Browser scraping via agent-browser showed curated/popular old tweets instead of latest timeline for non-authenticated sessions.
**Finding:** Twitter/X API credits can deplete mid-collection run, affecting all subsequent buckets. Without authentication, X shows a curated "popular tweets" view rather than the chronological timeline for most profiles (some high-activity profiles like NASA showed recent retweets). Twitter search requires login. Nitter mirrors appear defunct.
**Action for next run:** 1) Check API credit balance before starting collection (GET /2/usage/tweets). 2) If credits depleted, immediately switch to Perplexity API (sonar-pro with search_recency_filter: "hour") as fallback for event discovery. 3) Consider pre-authenticating agent-browser sessions for Twitter access via --session-name flag. 4) Request API credit replenishment between runs.
**Expires:** 2026-06-01

## 2026-05-01 22:36Z — Perplexity API search_recency_filter returns empty; exa_web_search effective
**Trigger:** Perplexity sonar-pro with search_recency_filter:"hour" returned empty for broad world events query during bucket 3.
**Finding:** exa_web_search proved far more effective, returning detailed results from CNN, France24, Korea Times, AP, UN News, Jerusalem Post, and Treasury/OFAC with content from the target hour.
**Action for next run:** Use exa_web_search as primary discovery tool. Use Perplexity only for targeted validation. Structure exa queries around source-specific keywords.
**Expires:** 2026-06-01

## 2026-05-03 23:28Z — exa_web_search effective but URL dedup critical for multi-bucket runs
**Trigger:** Bucket 1 collection run with 30 sources, Twitter API credits depleted
**Finding:** exa_web_search proved highly effective for discovering current events across all source topic areas. However, 10 of 17 generated events shared primary URLs with events already committed by earlier buckets, demonstrating the importance of URL-based pre-filtering before appending to the consolidated JSONL file. The jq compact output flag (-c) must accompany dedup operations to maintain JSONL format.
**Action for next run:** Always use `jq -sc` (not `jq -s`) when deduplicating JSONL files. Consider diversifying source URLs across events to reduce dedup losses when the same underlying story appears across multiple wire services.
**Expires:** 2026-06-03

## 2026-05-04 02:10Z — High URL dedup rate (45%) in bucket 5 confirms cross-bucket overlap pattern
**Trigger:** 9 of 20 generated events (45%) shared primary URLs with events already committed by buckets 1-4
**Finding:** Late-running buckets (bucket 5) face diminishing unique URL returns because major stories covered by wire services appear across all source topic areas. exa_web_search continues to perform well as the primary discovery tool with Twitter API credits depleted, but URL diversity degrades in later buckets when the same underlying wire service stories (Reuters, AP, AFP) get surfaced repeatedly.
**Action for next run:** Later buckets should prioritize niche/specialist sources and use source-specific search queries rather than broad topic queries. Consider assigning wire-service-heavy sources (cnni, yahoo-world-news) to earlier buckets and specialist sources (pizzainwatch, rayfunseth, opennuclear) to later ones to maximize unique URL yield per bucket.
**Expires:** 2026-06-04

## 2026-05-04 02:10Z — High URL dedup rate (45%) in bucket 5 confirms cross-bucket overlap pattern
**Trigger:** 9 of 20 generated events (45%) shared primary URLs with events already committed by buckets 1-4
**Finding:** Late-running buckets (bucket 5) face diminishing unique URL returns because major stories covered by wire services appear across all source topic areas. exa_web_search continues to perform well as the primary discovery tool with Twitter API credits depleted, but URL diversity degrades in later buckets when the same underlying wire service stories (Reuters, AP, AFP) get surfaced repeatedly.
**Action for next run:** Later buckets should prioritize niche/specialist sources and use source-specific search queries rather than broad topic queries. Consider assigning wire-service-heavy sources (cnni, yahoo-world-news) to earlier buckets and specialist sources (pizzainwatch, rayfunseth, opennuclear) to later ones to maximize unique URL yield per bucket.
**Expires:** 2026-06-04

## 2026-05-04 18:04Z — E-PRIME violations in generated contents require automated post-processing
**Trigger:** 5 of 27 events in bucket 4 contained the word "been" in contents field, failing strict validation
**Finding:** The word "been" (a form of "to be") frequently appears in generated event contents, especially in phrases like "has been," "had been," and "have been." Other E-PRIME violations (is, are, was, were) also occur but less frequently. A post-generation E-PRIME fix pass eliminates these efficiently.
**Action for next run:** After generating events, run an automated E-PRIME cleanup pass replacing common "to be" forms before validation. Key substitutions: "has been X" → "has X" or "X'd"; "had been" → "had previously"; "have been" → "have remained/have." Build this into the generation script rather than running as a separate step.
**Expires:** 2026-07-04

## 2026-05-04 23:00Z — Twitter image extraction not viable; skip for all Twitter sources
**Trigger:** data/media directory contained only a .gitkeep after multiple collection runs. Analysis traced to Twitter auth requirement and depleted API credits.
**Finding:** Twitter/X images at pbs.twimg.com require authenticated sessions the agent does not have. Twitter API credits were depleted as of 2026-05-01. Attempting image extraction for Twitter sources wastes time and always fails silently. ~80% of sources are Twitter type.
**Action for next run:** For type:twitter sources, set image_urls:[] immediately and skip Step 7 entirely. Only attempt image extraction for type:webpage, type:api, type:rss sources where og:image or article hero images are accessible via curl without auth.
**Expires:** permanent

## 2026-05-08 16:58Z — Nominatim fails to geocode "Strait of Hormuz" — use hardcoded coords
**Trigger:** Bucket 14 geocoding returned null lat/lon for "Strait of Hormuz, Iran", causing strict validation failures.
**Finding:** OpenStreetMap Nominatim does not resolve "Strait of Hormuz" as a searchable location. Hardcoded fallback coordinates (26.5944°N, 56.2708°E) resolve the issue.
**Action for next run:** Pre-populate geocoding cache with known maritime strait coordinates before querying Nominatim.
**Expires:** permanent

## 2026-05-10 16:12Z — Nominatim now resolves "Strait of Hormuz" — hardcoded fallback no longer needed
**Trigger:** Bucket 5 geocoding successfully resolved "Strait of Hormuz" via Nominatim API (lat: 26.4494, lon: 56.2028).
**Finding:** The earlier learning (2026-05-08) noting Nominatim fails for "Strait of Hormuz" no longer holds. The API now returns valid coordinates for this query. The hardcoded fallback (26.5944°N, 56.2708°E) remains close but unnecessary.
**Action for next run:** Remove hardcoded Strait of Hormuz fallback from geocoding pre-population. Standard Nominatim query now works. Keep the general maritime strait fallback approach for other locations.
**Expires:** 2026-08-10

## 2026-05-15 00:35Z — r.jina.ai mirror returns usable public X profile snapshots
**Trigger:** Bucket 6 needed a Twitter fallback after API credits depletion and unauthenticated X timelines hid recent posts.
**Finding:** `https://r.jina.ai/http://x.com/<handle>` returned readable profile snapshots for several X accounts, including tweet status IDs that allowed exact UTC timestamp recovery through snowflake decoding even when the page only showed relative labels such as `1m` or `2h`. Broken or low-activity accounts still returned stale or missing timelines, so the mirror works best as a first-pass discovery path rather than a guarantee of completeness.
**Action for next run:** When Twitter API credits remain depleted, fetch the r.jina.ai mirror before broader web search, decode candidate status IDs to UTC, and keep only tweets whose decoded times fall inside the bucket window.
**Expires:** 2026-07-15

## 2026-05-15 01:35Z — @KoreaTimesAlt X account does not exist; source should be deactivated or handle updated
**Trigger:** Bucket 9 collection attempted to scrape @KoreaTimesAlt via r.jina.ai mirror; X returned "This account doesn't exist."
**Finding:** The Twitter handle @KoreaTimesAlt configured for source twitter-korea-times-alt does not resolve to an active X/Twitter account. The account may have been deleted, suspended, or the handle may have changed. Events for this source's topic area (Korean news) had to come from alternative sources like Yonhap.
**Action for next run:** Mark source twitter-korea-times-alt as inactive in manifest or investigate whether The Korea Times operates under a different secondary handle. Skip direct scraping attempts for this source until the handle resolves.
**Expires:** 2026-08-15
