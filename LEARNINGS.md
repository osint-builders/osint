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

## 2026-05-21 12:22Z — X accounts @YortukIsgk and @ThePacificBrief do not exist
**Trigger:** Bucket 2 Twitter API v2 user lookup returned "Could not find user with username" for @YortukIsgk and @ThePacificBrief.
**Finding:** Both X/Twitter accounts do not resolve to active accounts. Events for these sources remain accessible via exa_web_search with source-specific keywords.
**Action for next run:** Skip Twitter API for twitter-yortukisgk and twitter-the-pacific-brief. Use exa_web_search. Flag for manifest review.
**Expires:** 2026-08-21

## 2026-05-21 12:22Z — @KC_NWT and @PyongyangToday X accounts do not exist; @jasonbrodsky account protected
**Trigger:** Bucket 15 Twitter API v2 user lookup returned "Could not find user with username" for @KC_NWT and @PyongyangToday. Separate lookup returned protected:true for @jasonbrodsky (user ID 15975913 — lowercase "jasonbrodsky", not the intended Iran policy expert Jason Brodsky).
**Finding:** The handles KC_NWT and PyongyangToday do not resolve to active X/Twitter accounts. The jasonbrodsky handle resolves to a protected account with only 33 followers and 121 tweets — likely not the intended UANI Policy Director Jason Brodsky. All three sources yielded zero direct Twitter collection. exa_web_search with source-specific topic keywords (Iran/sanctions for Jason Brodsky, Korean Peninsula/DPRK for KC_NWT, Pyongyang/KCNA for PyongyangToday) produced relevant events.
**Action for next run:** Skip Twitter API for twitter-kc-nwt, twitter-pyongyang-today, and twitter-jason-brodsky. Use exa_web_search as primary discovery. Investigate correct Twitter handles for Jason Brodsky (UANI) and KC_NWT. Flag all three for manifest handle review.
**Expires:** 2026-08-21

## 2026-05-19 19:29Z — @TatarigamiUA X account no longer exists; source should update handle or deactivate
**Trigger:** Bucket 5 r.jina.ai mirror for @TatarigamiUA returned "This account does not exist" on X.
**Finding:** The Twitter handle @TatarigamiUA configured for source twitter-tatarigamiua does not resolve to an active X/Twitter account. Events for Ukraine conflict analysis remain accessible via exa_web_search with conflict keywords.
**Action for next run:** Skip Twitter API and r.jina.ai for twitter-tatarigamiua. Use exa_web_search with Ukraine conflict keywords as primary discovery. Flag source for manifest handle investigation or status change.
**Expires:** 2026-08-19


## 2026-05-17 16:16Z — Nominatim fails to geocode Goma, DRC and Spratly Islands — use hardcoded fallbacks
**Trigger:** Bucket 8 geocoding returned null lat/lon for both "Goma, Democratic Republic of Congo" and "Spratly Islands, South China Sea."
**Finding:** OpenStreetMap Nominatim does not resolve these locations. Goma lies at approximately -1.6777°S, 29.2285°E on the northern shore of Lake Kivu. Spratly Islands center at approximately 10.68°N, 117.83°E in the South China Sea.
**Action for next run:** Pre-populate geocoding cache with Goma (-1.6777, 29.2285) and Spratly Islands (10.68, 117.83) before querying Nominatim.
**Expires:** 2026-08-17

## 2026-05-15 01:35Z — Twitter accounts Allsource4 and Raytoribo no longer exist on X
**Trigger:** Bucket 13 r.jina.ai mirror returned "This account doesn't exist" for both @Allsource4 and @Raytoribo handles.
**Finding:** Both X/Twitter accounts have disappeared entirely — not suspended, not renamed, but returning "This account doesn't exist" pages. exa_web_search still yields relevant events for their topic areas, so sources remain viable for news discovery but direct Twitter collection produces zero results.
**Action for next run:** For twitter-allsource4 and twitter-raytoribo, skip r.jina.ai mirror entirely and go straight to exa_web_search with source-specific keywords. Consider flagging these sources for manifest status review.
**Expires:** 2026-08-15
## 2026-05-15 01:35Z — Twitter API credits restored; direct search now works for in-window tweet discovery
**Trigger:** Bucket 6 Twitter API calls returned valid responses (result_count: 0 or 1) instead of CreditsDepleted errors for all 10 handles tested.
**Finding:** The TWITTER_BEARER_TOKEN credits have replenished since the depletion reported on 2026-05-01. The recent search endpoint (/2/tweets/search/recent) now returns data when tweets exist within the queried time range. WarshipCam returned 1 in-window tweet; all other handles returned 0 (no tweets during the 00:35-01:35 UTC window). exa_web_search proved effective for article-level discovery when Twitter sources had no tweets.
**Action for next run:** Use Twitter API search as the primary method for tweet discovery before falling back to r.jina.ai or web search. The API now correctly returns in-window tweets when they exist.
**Expires:** 2026-07-15



## 2026-05-01 19:55Z — Twitter API credits depleted; fallback collection strategy needed
**Trigger:** Twitter Bearer Token returned "CreditsDepleted" error for all API v2 calls during bucket 2 run
**Finding:** The TWITTER_BEARER_TOKEN has exhausted its monthly credits. All 28 Twitter source collections fell back to web search (Perplexity API, exa_web_search) and agent-browser scraping. X.com requires authentication for recent tweet timelines, limiting agent-browser's effectiveness on Twitter profiles (only showing old tweets for unauthenticated sessions).
**Action for next run:** Check Twitter API credit status at run start. If depleted, immediately pivot to: (1) Perplexity API with `search_recency_filter: "hour"` for source-specific queries, (2) exa_web_search for broad event discovery, (3) agent-browser on non-Twitter web sources. Consider requesting credit top-up or rotating to a backup bearer token.
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
## 2026-05-15 01:35Z — Twitter API credits restored; search/recent endpoint returns data
**Trigger:** Bucket 2 tested Twitter API v2 search/recent for all 10 source handles and received HTTP 200 with valid tweet data for active accounts (gCaptain, thewarzonewire, coastguardph, ianellisjones).
**Finding:** The TWITTER_BEARER_TOKEN now returns valid responses from the search/recent endpoint, contradicting the "CreditsDepleted" status documented since 2026-05-01. Credits likely renewed on a monthly billing cycle. The API successfully returned recent tweets with created_at fields for time-window filtering.
**Action for next run:** Attempt Twitter API search/recent first before falling back to r.jina.ai mirrors or exa_web_search. Use start_time/end_time parameters to filter tweets to the exact bucket window. Keep fallback paths active in case credits deplete again mid-month.
**Expires:** 2026-07-15

## 2026-05-15 01:35Z — Three source X accounts defunct or inactive: Scpandura, olongapotimes, Songss44
**Trigger:** Bucket 2 r.jina.ai mirror for @Scpandura returned "This account doesn't exist", @olongapotimes showed 0 posts, and @Songss44 returned "Something went wrong" error.
**Finding:** @Scpandura (twitter-scpandura) no longer exists on X. @olongapotimes (twitter-olongapo-times) has zero posts despite being joined Sep 2025. @Songss44 (twitter-songss44) returns an error page. These sources cannot produce in-window tweets; events must come entirely from web search matching source topic areas.
**Action for next run:** For these three sources, skip Twitter API and r.jina.ai entirely. Use exa_web_search with source-specific topic keywords as the primary discovery method. Consider flagging these sources for manifest review (status change to inactive or handle update).
**Expires:** 2026-08-15

## 2026-05-15 01:35Z — Three Twitter source accounts no longer exist on X platform
**Trigger:** Bucket 14 r.jina.ai mirror returned "This account doesn't exist" for @BatesGill, @KlSummary, and @Rayfunseth.
**Finding:** Three source handles — BatesGill, KlSummary, and Rayfunseth — returned X's "account doesn't exist" page, indicating the accounts have either changed handles, gone private, or gotten suspended/deleted. Events for these sources can only come from exa_web_search on their topic areas, reducing collection specificity.
**Action for next run:** Verify these three account handles still resolve before allocating collection time. If confirmed dead, flag source manifest entries for handle update or status change to inactive.
**Expires:** 2026-08-15

## 2026-05-15 03:20Z — @ChinaP0wer X account does not exist; source should update handle or deactivate
**Trigger:** Bucket 7 r.jina.ai mirror for @ChinaP0wer returned "This account doesn't exist" on X.
**Finding:** The Twitter handle @ChinaP0wer configured for source twitter-chinapower does not resolve to an active X/Twitter account. The CSIS China Power Project may operate under a different handle or have migrated off the platform entirely.
**Action for next run:** Mark source twitter-chinapower for handle investigation. Skip direct Twitter API and r.jina.ai attempts. Use exa_web_search with CSIS China Power keywords.
**Expires:** 2026-08-15

## 2026-05-15 18:14Z — @KoreaHerald X account suspended; source should update handle or deactivate
**Trigger:** Bucket 8 r.jina.ai mirror for @KoreaHerald returned "Account suspended" page on X.
**Finding:** The Twitter handle @KoreaHerald configured for source twitter-korea-herald has received a suspension from X/Twitter. The Korea Herald continues publishing at koreaherald.com but the X account cannot produce tweets for collection. Events for this source's topic area can come from web search (Yonhap, Korea Herald website, Seoul Economic Daily).
**Action for next run:** Skip Twitter API and r.jina.ai for twitter-korea-herald. Use exa_web_search with Korea Herald topic keywords. Flag source for manifest status review or handle update.
**Expires:** 2026-08-15

## 2026-05-15 18:14Z — @ModjapanEn X account does not exist; source should update handle or deactivate
**Trigger:** Bucket 8 r.jina.ai mirror for @ModjapanEn returned "This account doesn't exist" on X.
**Finding:** The Twitter handle @ModjapanEn configured for source twitter-modjapan-en does not resolve to an active X/Twitter account. Japan's Ministry of Defense may operate under a different English-language handle or have consolidated social media presence. Events for this source's topic area remain accessible via Japan News, Mainichi, and defense industry publications.
**Action for next run:** Skip Twitter API and r.jina.ai for twitter-modjapan-en. Use exa_web_search with Japan MOD/defense policy keywords. Flag source for manifest handle investigation or status change to inactive.
**Expires:** 2026-08-15

## 2026-05-15 18:14Z — Nominatim fails to geocode Uvira, DRC — use hardcoded fallback
**Trigger:** Bucket 14 geocoding returned null lat/lon for "Uvira, Democratic Republic of Congo."
**Finding:** OpenStreetMap Nominatim does not resolve "Uvira, Democratic Republic of Congo" as a searchable location. Hardcoded fallback coordinates (-3.4, 29.14) resolve the issue. Uvira sits on the northern shore of Lake Tanganyika in South Kivu province.
**Action for next run:** Pre-populate geocoding cache with Uvira coordinates (-3.4, 29.14) before querying Nominatim for DRC locations.
**Expires:** 2026-08-15

## 2026-05-20 17:11Z — Reddit JSON API returns 403 for public subreddits; exa_web_search effective fallback
**Trigger:** Bucket 7 attempted to fetch r/NorthKoreaNews/new.json and r/OSINT/new.json with User-Agent osint-bot/1.0; both returned HTTP 403 with HTML body instead of JSON.
**Finding:** Reddit appears to block programmatic access to the public JSON API endpoints from the agent environment. The r/*/new.json endpoints that previously returned valid JSON now return 403 Forbidden. exa_web_search with subreddit-specific topic keywords yielded relevant current events as an effective alternative.
**Action for next run:** For reddit-* sources, attempt the JSON API first but fall back immediately to exa_web_search with source-specific keywords if HTTP 403 received. Do not retry the Reddit API — the block appears environment-wide.
## 2026-05-20 17:12Z — Three X accounts do not exist: FAASouth, YonkosMC, Nguyenthiho88
**Trigger:** Bucket 11 Twitter API user lookup returned "Could not find user with username" for @FAASouth, @YonkosMC, and @Nguyenthiho88.
**Finding:** The Twitter handles @FAASouth (twitter-faa-south), @YonkosMC (twitter-yonkosmc), and @Nguyenthiho88 (twitter-nguyenthiho88) do not resolve to active X/Twitter accounts. The API returns explicit "Could not find user" errors rather than suspension or protected status. Events for these sources' topic areas remain accessible via exa_web_search with source-specific keywords.
**Action for next run:** Skip Twitter API and r.jina.ai for twitter-faa-south, twitter-yonkosmc, and twitter-nguyenthiho88. Use exa_web_search with source-specific topic keywords. Flag these sources for manifest handle investigation or status change to inactive.
**Expires:** 2026-08-20

## 2026-05-20 17:11Z — Five Twitter source accounts do not exist: WarTV7890, BeltelFreeAudio, BelteleFacts, MofajapanEn, BatesGill
**Trigger:** Bucket 9 Twitter API v2 user lookup returned "Could not find user with username" for @WarTV7890, @BeltelFreeAudio, @BelteleFacts, @MofajapanEn, and @BatesGill.
**Finding:** These five X/Twitter accounts do not exist on the platform. The handles may have changed, accounts may have been deleted or suspended. All five produced zero direct collection results. exa_web_search with source-specific keywords yielded relevant events for each source topic area.
**Action for next run:** Skip Twitter API and r.jina.ai for these five sources. Use exa_web_search with source-specific topic keywords as primary discovery. Flag all five for manifest handle investigation or status change.
**Expires:** 2026-08-20

## 2026-05-20 17:11Z — Reddit API returns 403 from cloud agent environment for both cybersecurity and LessCredibleDefence subreddits
**Trigger:** Bucket 9 curl requests to reddit.com/r/cybersecurity/new.json and reddit.com/r/LessCredibleDefence/new.json both returned HTTP 403 with HTML error page instead of JSON.
**Finding:** Reddit appears to block requests from the Warp Cloud Agent environment IP range despite using the documented User-Agent header (osint-bot/1.0). The 403 response contains an HTML page rather than JSON, suggesting IP-based rate limiting or datacenter IP blocking rather than an authentication issue.
**Action for next run:** For Reddit API sources, attempt the API call first. If 403 received, immediately fall back to exa_web_search with subreddit-specific keywords. Consider adding Reddit OAuth authentication as a longer-term fix.
**Expires:** 2026-08-20

## 2026-05-20 17:11Z — Nominatim fails to geocode Bunia, DRC — use hardcoded fallback
**Trigger:** Bucket 12 geocoding returned null lat/lon for "Bunia, Democratic Republic of Congo."
**Finding:** OpenStreetMap Nominatim does not resolve Bunia as a searchable location. Bunia serves as the capital of Ituri Province in eastern DRC at approximately 1.5667°N, 30.25°E.
**Action for next run:** Pre-populate geocoding cache with Bunia coordinates (1.5667, 30.25) before querying Nominatim for DRC locations.
**Expires:** 2026-08-20

## 2026-05-20 20:37Z — Twitter accounts TaFarms18 and pizzainwatch do not exist; use exa_web_search
**Trigger:** Bucket 5 Twitter API v2 user lookup returned "Could not find user with username" for @TaFarms18 and @pizzainwatch.
**Finding:** Both X/Twitter accounts do not resolve to active accounts. The API returned explicit "Could not find user" errors. Events for these sources' topic areas remain accessible via exa_web_search with source-specific keywords (agriculture/food security for TaFarms18; maritime tracking/sanctions for pizzainwatch).
**Action for next run:** Skip Twitter API and r.jina.ai for twitter-tafarms18 and twitter-pizzainwatch. Use exa_web_search with source-specific topic keywords. Flag these sources for manifest handle investigation or status change.
## 2026-05-20 20:37Z — @Fleetnumbers X account does not exist; source should update handle or deactivate
**Trigger:** Bucket 6 Twitter API v2 user lookup returned "Could not find user with username: [Fleetnumbers]."
**Finding:** The Twitter handle @Fleetnumbers configured for source twitter-fleetnumbers does not resolve to an active X/Twitter account. The account may have changed handles, deleted, or received a suspension. Events for this source's topic area (naval fleet tracking) remain accessible via exa_web_search with naval/fleet keywords.
**Action for next run:** Skip Twitter API and r.jina.ai for twitter-fleetnumbers. Use exa_web_search with naval fleet tracking keywords as primary discovery. Flag source for manifest handle investigation or status change.
**Expires:** 2026-08-20

## 2026-05-20 20:37Z — @AusNavy X account now protected (private); direct tweet collection blocked
**Trigger:** Bucket 6 Twitter API v2 user lookup returned protected:true for @AusNavy (user ID 786700712570941440).
**Finding:** The Royal Australian Navy's @AusNavy Twitter account has switched to protected (private) status, preventing all direct tweet collection via API, r.jina.ai, or browser scraping. The account still exists but tweets require follow approval to access.
**Action for next run:** Skip Twitter API tweet search for twitter-ausnav. Use exa_web_search with "Royal Australian Navy" and Indo-Pacific maritime keywords. Consider flagging source for manifest review.
**Expires:** 2026-08-20

## 2026-05-20 20:37Z — Reddit JSON API now returns valid data from agent environment
**Trigger:** Bucket 4 successfully fetched r/CombatFootage, r/Intelligence, r/cybersecurity, and r/RussiaUkraineWar2022 via JSON API without 403 errors.
**Finding:** The Reddit JSON API endpoints (reddit.com/r/*/new.json) returned valid JSON responses with User-Agent osint-bot/1.0 from the Warp Cloud Agent environment. This supersedes earlier findings from the same day reporting 403 blocks. The block appears to have been temporary or IP-rotation-dependent.
**Action for next run:** Attempt Reddit JSON API first as the primary collection method for reddit-* sources. Keep exa_web_search as fallback only if 403 received.
**Expires:** 2026-08-20

## 2026-05-21 12:22Z — @TheDiplomat X handle resolves to wrong account; not The Diplomat magazine
**Trigger:** Bucket 14 Twitter API user lookup for @TheDiplomat returned user "Aiaz Mohammed" (uid 132967082, 40 followers, 221 tweets) instead of The Diplomat magazine.
**Finding:** The X/Twitter handle @TheDiplomat does not belong to The Diplomat magazine (thediplomat.com). The actual account appears to belong to a private individual with minimal activity. The Diplomat magazine may operate under a different handle or may have left the platform. exa_web_search with Asia-Pacific security keywords yielded relevant events from the magazine's topic areas.
**Action for next run:** Skip Twitter API for twitter-the-diplomat source. Use exa_web_search with Asia-Pacific diplomacy and security keywords. Flag source for manifest handle investigation or update to correct handle.
**Expires:** 2026-08-21

## 2026-05-21 12:22Z — @JasdfPaoEng X account does not exist; source should update handle or deactivate
**Trigger:** Bucket 14 Twitter API v2 user lookup returned "Could not find user with usernames: [JasdfPaoEng]."
**Finding:** The Twitter handle @JasdfPaoEng configured for source twitter-jasdf-pao-eng does not resolve to an active X/Twitter account. The JASDF may operate its English-language public affairs under a different handle or have consolidated social media accounts. Events for Japanese air defense topics remain accessible via exa_web_search.
**Action for next run:** Skip Twitter API and r.jina.ai for twitter-jasdf-pao-eng. Use exa_web_search with JASDF and Japan air defense keywords. Flag source for manifest handle investigation or status change to inactive.
## 2026-05-21 12:22Z — @ArmedForcesPhil Twitter handle resolves to wrong account with zero tweets
**Trigger:** Bucket 12 Twitter API user lookup returned username "armedforcesphil" (user ID 135013193) with 0 tweets, 0 followers, display name "joey radaman" — clearly not the official Armed Forces of the Philippines account.
**Finding:** The handle @ArmedForcesPhil configured for source twitter-armed-forces-phil resolves to an unrelated personal account with zero activity. The official AFP account likely operates under a different handle. Events for this source's topic area remain accessible via exa_web_search with Philippines military and South China Sea keywords.
**Action for next run:** Skip Twitter API for twitter-armed-forces-phil. Use exa_web_search with "Armed Forces Philippines," "West Philippine Sea," and "South China Sea" keywords. Flag source for manifest handle investigation.
**Expires:** 2026-08-21

## 2026-05-21 12:22Z — @NationalInterest handle exceeds Twitter 15-character limit; cannot query API
**Trigger:** Bucket 12 Twitter API batch user lookup returned HTTP 400 because "NationalInterest" (16 characters) violates Twitter's ^[A-Za-z0-9_]{1,15}$ username constraint.
**Finding:** The handle @NationalInterest configured for source twitter-national-interest exceeds Twitter's 15-character handle limit. The actual account may operate under a shortened handle (e.g., @NatInterest). The API rejects any batch query containing this username.
**Action for next run:** Investigate the correct Twitter handle for The National Interest. Skip API lookup for this source until handle corrected. Use exa_web_search with "National Interest defense analysis" keywords.
**Expires:** 2026-08-21

## 2026-05-21 12:22Z — @key2med account now protected (private); direct tweet collection blocked
**Trigger:** Bucket 12 Twitter API user lookup returned protected:true for @key2med (user ID 318556348, display name "Michael J Sanchez").
**Finding:** The @key2med account configured for source twitter-key-to-med has switched to protected status, preventing all direct tweet collection via API or scraping. The account still exists but requires follow approval.
**Action for next run:** Skip Twitter API tweet search for twitter-key-to-med. Use exa_web_search with Middle East defense, Iran military, and missile keywords. Flag source for manifest review.
**Expires:** 2026-08-21

## 2026-05-21 12:22Z — Three X accounts do not exist: Osaindawg, EtienneLh, Therealshipdude
**Trigger:** Bucket 12 Twitter API v2 user lookup returned "Could not find user with username" for @Osaindawg, @EtienneLh, and @Therealshipdude.
**Finding:** These three Twitter handles do not resolve to active X/Twitter accounts. The accounts may have changed handles, deleted, or received suspensions. Events for their topic areas remain accessible via exa_web_search with source-specific keywords.
**Action for next run:** Skip Twitter API and r.jina.ai for twitter-osaindawg, twitter-etienne-lh, and twitter-therealshipdude. Use exa_web_search with source-specific topic keywords. Flag these sources for manifest handle investigation or status change.
**Expires:** 2026-08-21

## 2026-05-21 12:22Z — Twitter accounts TheKorea_Times and JnbSummary do not exist; use exa_web_search
**Trigger:** Bucket 5 Twitter API v2 user lookup returned "Could not find user with username" for @TheKorea_Times and @JnbSummary.
**Finding:** Both X/Twitter accounts do not resolve to active accounts. Events for these sources' topic areas remain accessible via exa_web_search with source-specific keywords.
**Action for next run:** Skip Twitter API for twitter-korea-times and twitter-jnb-summary. Use exa_web_search with source-specific topic keywords.
**Expires:** 2026-08-21

## 2026-05-21 12:22Z — Reddit API unreachable from agent environment for r/Intelligence
**Trigger:** Bucket 5 curl request to reddit.com/r/Intelligence/new.json returned connection failure.
**Finding:** Reddit JSON API endpoint for r/Intelligence failed to respond. exa_web_search with intelligence keywords yielded effective alternative.
**Action for next run:** Attempt Reddit JSON API first, fall back to exa_web_search if connection fails.
**Expires:** 2026-08-21

## 2026-05-21 12:22Z — @ntonc and @detresfa X accounts appear to have wrong handles configured
**Trigger:** Bucket 7 Twitter API user lookup returned an account with 1 follower and 1 total tweet for @ntonc, and a personal account "Elle" with 443 followers for @detresfa. Neither matches the described OSINT/military intelligence or maritime distress monitoring profiles.
**Finding:** The Twitter handles @ntonc and @detresfa configured in sources twitter-ntonc and twitter-detresfa do not correspond to the described analyst accounts. @ntonc has essentially zero activity, and @detresfa belongs to a personal user unrelated to maritime distress monitoring. exa_web_search with source-specific keywords yielded relevant events as an effective alternative.
**Action for next run:** Skip Twitter API for twitter-ntonc and twitter-detresfa. Use exa_web_search with source-specific keywords. Flag both sources for manifest handle investigation or status change.
**Expires:** 2026-08-21

## 2026-05-21 19:35Z — @Chadobcnews X account does not exist
**Trigger:** Bucket 10 Twitter API v2 user lookup returned "Could not find user with usernames: [Chadobcnews]."
**Finding:** The Twitter handle @Chadobcnews configured for source twitter-chadobcnews does not resolve to an active X/Twitter account. Events for Korea-focused defense topics remain accessible via exa_web_search with Korean Peninsula and military keywords.
**Action for next run:** Skip Twitter API for twitter-chadobcnews. Use exa_web_search with Korea defense, DPRK missile, and ROK military keywords. Flag source for manifest handle investigation or status change.

## 2026-05-21 19:30Z — @MNDChina X handle resolves to wrong account; not China Ministry of National Defense
**Trigger:** Bucket 14 Twitter API user lookup for @MNDChina returned user "Xin Tomberg" (uid 1998378585636442112, 3 followers, 0 tweets) instead of the Chinese Ministry of National Defense.
**Finding:** The X/Twitter handle @MNDChina does not belong to China's Ministry of National Defense. The actual account belongs to a private individual with zero activity. The Chinese MoD may operate under a different handle or may not maintain an active English-language X presence. exa_web_search with China defense and PLA keywords yielded relevant events.
**Action for next run:** Skip Twitter API for twitter-mndchina source. Use exa_web_search with China military, PLA, and defense policy keywords. Flag source for manifest handle investigation or update.
**Expires:** 2026-08-21

## 2026-05-21 19:30Z — @InfoFusionCtr X account does not exist; use exa_web_search
**Trigger:** Bucket 3 Twitter API v2 user lookup returned "Could not find user with usernames: [InfoFusionCtr]."
**Finding:** The Twitter handle @InfoFusionCtr configured for source twitter-info-fusion-ctr does not resolve to an active X/Twitter account. Events for multi-source intelligence and OSINT analysis topics remain accessible via exa_web_search.
**Action for next run:** Skip Twitter API for twitter-info-fusion-ctr. Use exa_web_search with intelligence fusion and OSINT keywords. Flag source for manifest handle investigation.
**Expires:** 2026-08-21

## 2026-05-21 19:30Z — @Megatronlion X handle resolves to wrong account with 0 tweets
**Trigger:** Bucket 3 Twitter API v2 user lookup returned user "chuck cantley" (uid 1727367912, 2 followers, 0 tweets) for @megatronlion — clearly not the OSINT analyst described in the source specification.
**Finding:** The handle @Megatronlion configured for source twitter-megatronlion resolves to an unrelated personal account with zero activity. The intended OSINT military analyst may operate under a different handle or have left the platform.
**Action for next run:** Skip Twitter API for twitter-megatronlion. Use exa_web_search with military operations, conflict zone, and weapons analysis keywords. Flag source for manifest handle investigation.
**Expires:** 2026-08-21

## 2026-05-21 19:30Z — @ofacalert X account does not exist; use exa_web_search
**Trigger:** Bucket 12 Twitter API v2 user lookup returned "Could not find user with username: [ofacalert]."
**Finding:** The Twitter handle @ofacalert configured for source twitter-ofac-alert does not resolve to an active X/Twitter account. The OFAC sanctions alert service may operate under a different handle or have migrated off the platform. Events for OFAC sanctions topics remain accessible via exa_web_search with OFAC, sanctions, and Treasury keywords.
**Action for next run:** Skip Twitter API for twitter-ofac-alert. Use exa_web_search with OFAC sanctions enforcement keywords. Flag source for manifest handle investigation.
**Expires:** 2026-08-21
