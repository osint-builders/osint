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

## 2026-05-24 00:15Z — Late-night UTC window (23:15-00:15) yields zero Twitter API results for active handles
**Trigger:** Bucket 15 collection. Twitter API search/recent returned result_count=0 for all 5 verified-active handles (Thewarzonewire, Gcaptain, AuroraIntel, Esri, USFleetForces) despite confirmed account existence and recent posting activity.
**Finding:** The 23:15-00:15 UTC collection window falls during late evening in the Americas and early morning in Europe/Middle East. Defense and OSINT Twitter accounts rarely post during this hour, producing zero in-window results from the API even when accounts remain active. exa_web_search proved effective as a fallback for all sources, surfacing 10 events from wire services and 24/7 news outlets that covered the same topic areas.
**Action for next run:** For buckets scheduled in the 22:00-02:00 UTC range, expect zero or near-zero Twitter API results from most handles. Skip straight to exa_web_search with source-specific keywords to avoid wasting API rate limits. Reserve Twitter API calls for buckets aligned with 12:00-22:00 UTC when posting activity peaks.
**Expires:** permanent

## 2026-05-23 16:15Z — @EsriTraining, @John_Pollock22, @Oilcfd dormant; skip API for these
**Trigger:** Bucket 2 collection. Twitter API returned 0 tweets for all three handles. r.jina.ai mirror confirmed: @EsriTraining last tweet 2024-01-01 (17+ months dormant), @John_Pollock22 last tweet 2025-06-22 (11 months dormant), @Oilcfd last tweet 2025-06-22 (11 months dormant).
**Finding:** All three accounts have ceased posting relevant content. @EsriTraining (GIS training) has not posted in over 17 months. @John_Pollock22 (defense analysis) and @Oilcfd (oil/sanctions tracking) have not posted in 11 months. Twitter API calls for these handles waste rate-limited API calls. exa_web_search with source-specific topic keywords remains effective for their coverage areas.
**Action for next run:** Skip Twitter API and r.jina.ai for twitter-esri-training, twitter-john-pollock, and twitter-oilcfd. Use exa_web_search with source-specific topic keywords instead. Flag all three sources for manifest status review.
**Expires:** 2026-08-23

## 2026-05-23 06:45Z — reddit-russiaukrainewar2022 subreddit appears inactive; all posts from 2025
**Trigger:** Bucket 6 collection. Reddit JSON API returned posts but all created_utc timestamps resolved to May 2025, not 2026. Zero posts within the 1-hour collection window or even within the current year.
**Finding:** The r/RussiaUkraineWar2022 subreddit appears to have stopped receiving new submissions in 2026. The most recent post dates to May 24, 2025. The subreddit may have migrated, gone private for new posts, or effectively died. exa_web_search with Ukraine/Russia keywords yields results from other sources but none attributable to this subreddit.
**Action for next run:** Skip Reddit JSON API for reddit-russiaukrainewar2022. Use exa_web_search with Russia Ukraine conflict keywords instead. Flag source for manifest status review (recommend status change to inactive or handle update).
**Expires:** 2026-08-23

## 2026-05-21 22:49Z — @US5thFleet, @PLATracker, @Borrowed7Time inactive or stale; skip API for these
**Trigger:** Bucket 10 Twitter API returned 0 results for all three handles. Jina.ai mirror confirmed: @US5thFleet last tweet 2023-10-21, @PLATracker last tweet 2025-03-25, @Borrowed7Time last original tweet 2026-05-02 (only RTs since).
**Finding:** @US5thFleet appears to have ceased posting entirely (no tweets in 19+ months). @PLATracker has not posted in 14+ months. @Borrowed7Time only retweets non-OSINT content. Twitter API calls for these handles consistently return 0 in-window results and waste rate-limited API calls.
**Action for next run:** Skip Twitter API for twitter-us-5th-fleet, twitter-platracker, and twitter-borrowed7time. Use exa_web_search with source-specific topic keywords instead. Flag all three sources for manifest status review.
**Expires:** 2026-08-21

## 2026-05-21 22:50Z — @EtienneLh Twitter handle does not resolve; account deleted or renamed
**Trigger:** Bucket 8 collection. Twitter API v2 user lookup for @EtienneLh returned no data object (user not found).
**Finding:** twitter-etienne-lh handle @EtienneLh does not resolve to any account. The European defense analyst may have changed handles, gone private, or left the platform. exa_web_search with NATO and European defense keywords found relevant Baltic drone/NATO coverage but all articles published before the collection window.
**Action for next run:** Skip Twitter API for twitter-etienne-lh. Use exa_web_search with European defense, NATO, and defense procurement keywords. Flag source for manifest handle investigation or status change to inactive.
**Expires:** 2026-08-21

## 2026-05-21 21:40Z — @Jkgarokgov Twitter account does not exist; @IranObserver dormant since 2016
**Trigger:** Bucket 8 collection. r.jina.ai mirror for @Jkgarokgov returned "This account doesn't exist." @IranObserver last tweeted January 2016.
**Finding:** twitter-jkgarokgov handle @Jkgarokgov resolves to a non-existent account page. twitter-iran-observer handle @IranObserver has not posted since 2016 — effectively dormant. Neither account produces collectible events.
**Action for next run:** Skip Twitter API and r.jina.ai for twitter-jkgarokgov and twitter-iran-observer. Use exa_web_search with Korea government policy keywords for jkgarokgov and Iran IRGC nuclear keywords for iran-observer. Flag both sources for manifest status review (recommend inactive).
**Expires:** 2026-08-21

## 2026-05-21 — Twitter image extraction not viable; skip for all Twitter sources
**Trigger:** data/media directory contained only a .gitkeep after multiple collection runs. Twitter/X images at pbs.twimg.com require authenticated sessions the agent does not have.
**Finding:** For type:twitter sources, image extraction always fails silently. ~80% of sources are Twitter type. Only type:webpage, type:api, type:rss, and type:telegram sources yield extractable images.
**Action for next run:** For type:twitter sources, set `image_urls:[]` immediately and skip the image step entirely. Only attempt image extraction for non-Twitter source types.
**Expires:** permanent

## 2026-05-21 — E-PRIME violations common in generated contents; automated cleanup required
**Trigger:** 5 of 27 events in a bucket contained "been" in contents field, failing strict validation. "has been," "had been," "have been," "is," "are," "was," "were" appear regularly in LLM-generated text.
**Finding:** E-PRIME enforcement must happen as a post-generation pass, not just as a prompt instruction. Key substitutions: "has been X" → "has X" or "X'd"; "had been" → "had previously"; "have been" → "have remained/have"; "is" → active verb. Apply this pass before calling the validator.
**Action for next run:** After generating each event's `contents`, run an explicit E-PRIME cleanup substitution pass before validation. Build this into the generation loop, not as a separate step.
**Expires:** permanent

## 2026-05-21 — Nominatim geocoding hardcoded fallbacks: DRC cities + Spratly Islands
**Trigger:** Geocoding returned null lat/lon for Goma, Uvira, and Bunia (all DRC) and Spratly Islands across multiple runs.
**Finding:** OpenStreetMap Nominatim does not reliably resolve these locations. Confirmed working hardcoded coordinates: Goma, DRC (-1.6777, 29.2285); Uvira, DRC (-3.4, 29.14); Bunia, DRC (1.5667, 30.25); Spratly Islands, South China Sea (10.68, 117.83).
**Action for next run:** Pre-populate geocoding cache with these four entries before any Nominatim queries: `{"Goma, Democratic Republic of Congo": {"lat": "-1.6777", "lon": "29.2285"}, "Uvira, Democratic Republic of Congo": {"lat": "-3.4", "lon": "29.14"}, "Bunia, Democratic Republic of Congo": {"lat": "1.5667", "lon": "30.25"}, "Spratly Islands, South China Sea": {"lat": "10.68", "lon": "117.83"}}`.
**Expires:** permanent

## 2026-05-21 — 47 X/Twitter handles dead, wrong, or blocked — skip API, use exa_web_search
**Trigger:** Verified across multiple runs (2026-05-15 through 2026-05-21) via Twitter API v2 user lookup and r.jina.ai mirror checks.
**Finding:** The following handles do not resolve to the intended accounts or cannot be collected from. Attempting Twitter API or r.jina.ai for these wastes time and yields zero usable events. exa_web_search with source-specific topic keywords remains effective for all of them.

*Not found / deleted / suspended:*
twitter-schizoint-rel (@SchizointRel), twitter-joseph-dempsey (@JosephDempsey), twitter-natlhistships (@Natlhistships), twitter-yortukisgk (@YortukIsgk), twitter-the-pacific-brief (@ThePacificBrief), twitter-kc-nwt (@KC_NWT), twitter-pyongyang-today (@PyongyangToday), twitter-tatarigamiua (@TatarigamiUA), twitter-allsource4 (@Allsource4), twitter-raytoribo (@Raytoribo), twitter-korea-times-alt (@KoreaTimesAlt), twitter-scpandura (@Scpandura), twitter-olongapo-times (@olongapotimes), twitter-songss44 (@Songss44), twitter-batesgill (@BatesGill), twitter-klsummary (@KlSummary), twitter-rayfunseth (@Rayfunseth), twitter-chinapower (@ChinaP0wer), twitter-modjapan-en (@ModjapanEn), twitter-faa-south (@FAASouth), twitter-yonkosmc (@YonkosMC), twitter-nguyenthiho88 (@Nguyenthiho88), twitter-wartv7890 (@WarTV7890), twitter-beltel-free-audio (@BeltelFreeAudio), twitter-beltele-facts (@BelteleFacts), twitter-tafarms18 (@TaFarms18), twitter-pizzainwatch (@pizzainwatch), twitter-fleetnumbers (@Fleetnumbers), twitter-jasdf-pao-eng (@JasdfPaoEng), twitter-korea-times (@TheKorea_Times), twitter-jnb-summary (@JnbSummary), twitter-chadobcnews (@Chadobcnews), twitter-info-fusion-ctr (@InfoFusionCtr), twitter-ofac-alert (@ofacalert), twitter-sindikasyontek (@Sindikasyontek), twitter-united-nations (@United_Nations, suspended)

*Wrong account (resolves to unrelated person with minimal activity):*
twitter-kylebass (@kylebass → Kyle Manning), twitter-the-diplomat (@TheDiplomat → private individual), twitter-armed-forces-phil (@ArmedForcesPhil → zero-tweet account), twitter-mndchina (@MNDChina → 0-tweet private account), twitter-megatronlion (@Megatronlion → unrelated personal account), twitter-ntonc (@ntonc → 1-tweet account), twitter-detresfa (@detresfa → personal account), twitter-mda-space (@MdaSpace → 0-tweet account), twitter-the-koreaview (@TheKoreaview → private individual "J", 34 followers), twitter-jaime-ocon (@JaimeOcon → personal account, 5 followers)

*Protected (private):*
twitter-jason-brodsky (@jasonbrodsky), twitter-ausnav (@AusNavy), twitter-key-to-med (@key2med)

*Handle exceeds Twitter's 15-char limit; API returns HTTP 400:*
twitter-national-interest (@NationalInterest, 16 chars)

**Action for next run:** For every source ID listed above, skip Twitter API and r.jina.ai. Go directly to exa_web_search with source-specific topic keywords. These sources' topic areas remain coverable via web search.
**Expires:** 2026-08-21

## 2026-05-21 — breakingdefense.com/global/ returns 404; URL structure changed
**Trigger:** Bucket run opened breakingdefense.com/global/ and received "Page not found."
**Finding:** The Breaking Defense /global/ URL path no longer resolves. The site restructured its URL scheme. Defense news for this topic area remains accessible via exa_web_search.
**Action for next run:** Skip direct URL fetch for webpage-breakingdefense source. Use exa_web_search with Breaking Defense and global defense keywords as primary collection method. Flag source for URL update.
**Expires:** 2026-08-21

## 2026-05-21 — Twitter API credits restore on monthly billing cycle; use API first
**Trigger:** Credits depleted 2026-05-01; confirmed restored 2026-05-15. Multiple subsequent runs confirmed API operational through 2026-05-21.
**Finding:** The TWITTER_BEARER_TOKEN credit pool resets on a monthly cycle. After depletion, credits return within ~15 days. When credits are active, the search/recent endpoint with start_time/end_time parameters is the most precise method for in-window tweet discovery. r.jina.ai mirror and exa_web_search remain valid fallbacks if credits deplete again mid-month.
**Action for next run:** Attempt Twitter API search/recent first for all twitter-* sources. If HTTP 402 CreditsDepleted received, fall back to r.jina.ai mirror, then exa_web_search. Check credit status once per run at start — do not check per-source.
**Expires:** 2026-07-15

## 2026-05-15 — r.jina.ai mirror returns usable X profile snapshots; snowflake IDs decode to UTC
**Trigger:** Needed Twitter fallback after API credit depletion; unauthenticated X timelines hid recent posts.
**Finding:** `https://r.jina.ai/http://x.com/<handle>` returns readable profile snapshots for X accounts, including tweet status IDs. Snowflake ID decoding formula: `timestamp_ms = (snowflake_id >> 22) + 1288834974657` recovers exact UTC posting time even when the page shows relative labels ("1m", "2h"). Broken or zero-activity accounts still return stale or missing timelines.
**Action for next run:** When Twitter API unavailable or returns no results, fetch r.jina.ai mirror as second-pass. Decode snowflake IDs from status URLs to recover UTC timestamps. Keep only tweets whose decoded times fall within the bucket window.
**Expires:** 2026-07-15

## 2026-05-21 — Reddit JSON API: intermittent 403 from agent environment; attempt first, fall back on failure
**Trigger:** Same-day bucket runs produced both 403 blocks and successful JSON responses for identical endpoints. The block appears IP-rotation-dependent, not permanent.
**Finding:** reddit.com/r/*/new.json endpoints with User-Agent osint-bot/1.0 return HTTP 403 in some agent environment IP ranges and valid JSON in others. The block is not consistent or permanent. exa_web_search with subreddit-specific keywords is an effective fallback when blocked.
**Action for next run:** For reddit-* sources, attempt the JSON API first. If 403 received, do not retry — fall back immediately to exa_web_search with source-specific keywords.
**Expires:** 2026-08-21

## 2026-05-21 — exa_web_search effective primary tool; URL dedup critical; late buckets get diminishing returns
**Trigger:** Multiple runs with Twitter API depleted; observed 45% URL collision rate in bucket 5 vs buckets 1-4.
**Finding:** exa_web_search reliably surfaces events within the target window. However, major wire service stories (Reuters, AP, AFP) get surfaced across all source topic areas, so later buckets (4+) see 40-50% URL collision. Use `jq -sc` (compact flag required) not `jq -s` for JSONL dedup — the `-c` flag maintains one-object-per-line format.
**Action for next run:** Assign wire-service-heavy sources to early buckets, niche/specialist sources (OFAC, opennuclear, SIGINT analysts) to later buckets to maximize unique URL yield. Always use `jq -sc 'unique_by(.links[0].url)'` for dedup.
**Expires:** 2026-08-21

## 2026-05-21 20:33Z — @JaimeOcon Twitter handle resolves to wrong account with 5 followers
**Trigger:** Bucket 13 Twitter API user lookup returned user "Jaime Ocon" (uid 369135813, 5 followers, 17 tweets) — clearly not a professional GIS analyst or OSINT practitioner.
**Finding:** The handle @JaimeOcon configured for source twitter-jaime-ocon resolves to a personal account with minimal activity (5 followers, 17 tweets). The intended GIS/geospatial intelligence analyst may operate under a different handle or have left the platform. exa_web_search with GIS and OSINT keywords yielded no relevant in-window events.
**Action for next run:** Skip Twitter API for twitter-jaime-ocon. Use exa_web_search with GIS, OSINT, and geospatial intelligence keywords. Flag source for manifest handle investigation or status change.
**Expires:** 2026-08-21

## 2026-05-21 22:30Z — twitter-dprk-news @DPRK_News resolves to parody/satire account
**Trigger:** Bucket 11 collection attempted to scrape @DPRK_News via r.jina.ai mirror. Content returned included satirical posts about Epstein, fashion week, and other joke content clearly unrelated to actual DPRK intelligence.
**Finding:** The handle @DPRK_News ("DPRK News Service") operates as a well-known parody account, not an official or aggregator North Korea news source. It has 0 usable OSINT content. The source file description ("News aggregation account focused on North Korea developments") does not match the actual account. exa_web_search with DPRK keywords yields real news but none attributable to this source.
**Action for next run:** Skip Twitter API and r.jina.ai for twitter-dprk-news entirely. Use exa_web_search with DPRK/North Korea keywords only. Flag source for manifest status change to inactive or handle correction.
**Expires:** permanent

## 2026-05-21 22:35Z — @Osaindawg Twitter handle not found; add to dead handles list
**Trigger:** Bucket 15 Twitter API user lookup for @Osaindawg returned no .data object — account not found or suspended.
**Finding:** The twitter-osaindawg source (maritime OSINT, vessel tracking) references handle @Osaindawg which does not resolve via Twitter API v2 user lookup. exa_web_search with maritime OSINT keywords yielded results (Russian navy DPRK ship escort story from NK News) but none published within the 1-hour collection window. The source topic area remains coverable via exa_web_search.
**Action for next run:** Add twitter-osaindawg (@Osaindawg) to the dead/not-found handles list. Skip Twitter API and r.jina.ai for this source. Use exa_web_search with maritime OSINT, vessel tracking, and AIS keywords.
**Expires:** 2026-08-21

## 2026-05-23 20:20Z — webpage-cuashub-defense source description misidentifies site content
**Trigger:** Bucket 6 collection opened cuashub.com; site content covers Counter-UAS (unmanned aircraft systems) defense technology, NOT financial security or credit union threats.
**Finding:** The source file source/sources/webpage-cuashub-defense.md describes CUASHUB as covering "financial security threats, cybersecurity, fraud prevention" for credit unions. The actual site (cuashub.com) stands for "C-UAS Hub" — a counter-drone defense technology news aggregator (drone detection, NATO counter-UAS integration, military counter-drone capability). Keywords in the source file do not match site content.
**Action for next run:** Flag webpage-cuashub-defense for source description correction. Update keywords to match actual content: counter-drone, counter-UAS, drone-detection, NATO, military, defense-technology. Do not expect financial security content from this source.
**Expires:** permanent
## 2026-05-23 20:12Z — @Therealshipdude Twitter handle not found; add to dead handles list
**Trigger:** Bucket 12 collection. Twitter API v2 user lookup for @Therealshipdude returned no .data object — account not found or suspended.
**Finding:** twitter-therealshipdude source references handle @Therealshipdude which does not resolve via Twitter API v2 user lookup. The maritime OSINT / ship identification specialist may have changed handles, gone private, or left the platform. exa_web_search with maritime OSINT and vessel tracking keywords remains effective for the topic area.
**Action for next run:** Skip Twitter API and r.jina.ai for twitter-therealshipdude. Use exa_web_search with maritime OSINT, vessel tracking, AIS, and ship identification keywords. Flag source for manifest handle investigation or status change to inactive.
**Expires:** 2026-08-23

## 2026-05-24 00:15Z — @XKorea Twitter handle resolves to X/Twitter Korea office, not security/defense content
**Trigger:** Bucket 6 collection. r.jina.ai mirror confirmed @XKorea account posts about X platform features (subscription services, K-pop engagement, BTS milestones). Zero defense, security, or Korean peninsula content.
**Finding:** The source file source/sources/twitter-xkorea.md describes the account as providing "focused updates and news coverage on Korean Peninsula developments with emphasis on breaking news, military activities, and security incidents." The actual @XKorea account operates as X/Twitter's official Korea office account focused on platform marketing. It produces no OSINT-relevant content whatsoever. exa_web_search with Korea security keywords yields results from other sources but none attributable to @XKorea.
**Action for next run:** Skip Twitter API and r.jina.ai for twitter-xkorea. Flag source for manifest status change to inactive or handle correction. The intended Korea security news source may operate under a different handle.
**Expires:** permanent

## 2026-05-24 16:17Z — @MofajapanEn Twitter handle not found; API returns user-not-found error
**Trigger:** Bucket 9 collection. Twitter API v2 user lookup for @MofajapanEn returned "Could not find user with username: [MofajapanEn]" error.
**Finding:** The twitter-mofajapan-en source references handle @MofajapanEn which does not resolve via Twitter API v2 user lookup. The account may have changed handles, gone private, or left the platform. Japan MOFA official English content remains accessible via mofa.go.jp and exa_web_search with Japan foreign affairs keywords.
**Action for next run:** Skip Twitter API for twitter-mofajapan-en. Use exa_web_search with Japan MOFA, foreign affairs, and diplomatic keywords. Flag source for manifest handle investigation or status change.
**Expires:** 2026-08-24

## 2026-05-24 20:16Z — webpage-cuashub-defense site content stale since January 2026; skip direct fetch
**Trigger:** Bucket 5 collection. cuashub.com reachable (HTTP 200) but most recent article date on the page: 2026-01-28, nearly 4 months ago. Zero fresh content available for any hourly collection window.
**Finding:** cuashub.com (C-UAS Hub) has effectively stopped publishing new content since late January 2026. The site loads successfully but contains no articles from the past 4 months. Direct URL fetch yields zero in-window events every run. exa_web_search with counter-drone keywords remains effective for the topic area.
**Action for next run:** Skip direct URL fetch for webpage-cuashub-defense. Use exa_web_search with counter-UAS, counter-drone, and drone-defense keywords as primary collection method. Consider flagging source for manifest status change to inactive if the site remains stale.
**Expires:** 2026-08-24
