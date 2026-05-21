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
