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

Brief context / finding (2–4 sentences max).
```

For performance data: latency, cost, dedup info, or validator impact.  
For pattern findings: failure root cause, mitigation, affected sources (by list or rule).  
For schema findings: the gap, and concrete minimum fix.  
Link to manifest or SCHEMA.md when direct evidence lives there.

Cap: max 10 KB and 100 entries; orchestrator auto-prunes expired entries. Each entry carries an implicit expiry; when superseded by a manifest edit or your own rerun finding a different root cause, remove the old entry to keep the file fresh.

<!-- entries below this line; newest first -->

## 2026-09-05 08:09Z — ClashReport editorial focus shift to US domestic news

During 2026-09-05 batch 1, all three telegram-clashreport candidates were US domestic defense policy posts (Pentagon leak investigation, Deputy Defense Secretary replacement, DOJ-Canada trade cooperation). These do not align with the documented source profile ("breaking conflict zones worldwide" — Ukraine, Middle East, Africa). This indicates either a recent channel pivot or a data error. Recommend maintainer review ClashReport's recent posts to confirm scope change and update manifest accordingly.


- **telegram-warmonitors (testing)**: t.me URLs not directly fetchable via curl; requires authenticated Telegram client or agent-browser with Telegram session. Fetches consistently return authentication walls. Consider marking status as `testing` with note about authentication barriers if this persists.


- **twitter-minhdr18 (batch 7)**: All 3 candidates filtered out (off-scope: volcano disaster; insufficient context: 2× unattributed claims). Monitor for future content alignment with military systems focus. Source remains active but produced zero events this run.

## 2026-09-10 08:45Z — ClashReport second consecutive batch of off-topic content

Batch 1/9 (2026-09-10) confirms ClashReport content misalignment. All three candidates (95899–95901) are George W. Bush 9/11 anniversary quotes unrelated to documented source scope (breaking conflict, military, strikes, etc.). Combined with 2026-09-05 findings (Pentagon/DOJ posts), this indicates either systematic channel pivot or persistent data error. Recommend maintainer review manifest status; source may need marking as `inactive` or scope redefinition.

- **telegram-geopolitics-prime**: Post 74388 rejected (Italian channel promo, off-topic for geopolitics; source context shows bias:anti-Western-establishment but promotions don't constitute events).
- **telegram-insiderpaper**: Posts 44509, 44510 rejected (domestic US political comments without geopolitical substance or actionable event data; insufficient scope for world event entity).


## 2026-09-11 19:00Z — Geopolitics Prime predominantly conspiracy theory content

Batch 1/12 (2026-09-11) confirms telegram-geopolitics-prime source publishes significant conspiracy content alongside geopolitical news. All three candidates (74427, 74431, 74432) contained well-debunked 9/11 "controlled demolition" narratives. While the source does publish occasional legitimate geopolitical topics (BRICS, Israel-Palestine), the primary editorial stance centers conspiracy theories and anti-mainstream media narratives. Content does not meet publication standards for World Event Entities. Recommend maintainer review manifest status and consider reclassification or deactivation.


## 2026-09-13 22:10Z — telegram-serhii-flash publishes off-topic EV content

Batch 4/11 (2026-09-13) identified one off-topic candidate from telegram-serhii-flash/7750: electric vehicle to-home charging technology post. The source is documented as military SIGINT/EW (radio-electronic reconnaissance, electronic warfare, military communications), but this post concerns civilian vehicle technology with no military relevance. While one post may represent a channel glitch or repost, maintainer should monitor future content to confirm scope or consider marking as `testing` with a scope-drift note if the pattern repeats across runs.
## 2026-09-14 21:37Z — All telegram-* sources in batch 1/12 inaccessible via t.me web interface

Batch 1/12 (2026-09-14) attempted to process 5 candidates across 3 sources (telegram-clashreport 96522–96524, telegram-ddgeopolitics 193455, telegram-geopolitics-prime 74591). All candidates proved completely inaccessible: t.me web interface exposes only widget metadata and truncated og:description (first sentence max) in static HTML. curl, curl+User-Agent, and agent-browser all failed to yield full post content needed for E-PRIME validation and entity extraction. 

**Root cause:** Telegram's t.me public web view (https://t.me/ChannelName/PostID) is designed for UI embedding/sharing, not programmatic scraping. Full post text loads dynamically via JavaScript and is not available in the initial HTML response.

**Mitigation:** Telegram sources in the queue require either (1) deprecated TDLib API access (requires auth + complex setup), (2) authenticated Telegram client session (not available in this environment), or (3) manual human review. For now, skip Telegram candidates in the queue and propose that telegram-* sources move to `inactive` status in manifest with a note: "t.me web interface does not support programmatic content extraction."

**Affected sources:** telegram-clashreport, telegram-ddgeopolitics, telegram-geopolitics-prime (and likely all others marked type:telegram).


## 2026-09-15 13:17Z — Telegram web sources not scrapable
**Trigger:** Batch 4 attempted to process 9 candidates from 3 Telegram sources (telegram-intelslava, telegram-middle-east-spectator, telegram-qudsnen) — all failed to fetch.
**Finding:** Telegram's web interface (t.me/...) loads message content in iframes not accessible to agent-browser's parent window eval. Tips identified no snippet capture, preventing alternate extraction. The identify stage should note that Telegram sources need either (a) Bot API access, (b) authenticated client library, or (c) removal from collection.
**Action for next run:** Mark telegram-intelslava, telegram-middle-east-spectator, telegram-qudsnen with status: deprecated or archived in source/manifest.json with note: "Web scraping not feasible; requires Telegram Bot API or authenticated client." Alternative: implement Telegram Bot API support if credentials available.
**Expires:** 2026-12-31
