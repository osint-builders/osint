---
id: reddit-geopolitics
type: api
status: testing
---
# r/geopolitics (reddit.com/r/geopolitics)
Strategic geopolitical analysis covering China, Russia, sanctions, energy warfare, BRICS, Taiwan, proxy conflicts, and global power competition. Fetch https://www.reddit.com/r/geopolitics/new.json?limit=25&raw_json=1 with User-Agent: osint-bot/1.0; parse .data.children[].data; filter by created_utc in time window (Unix seconds); map title→title, selftext→contents, https://reddit.com+permalink→links[0], url→links[1] if external; image_urls:[].
Keywords: geopolitics, China, Russia, sanctions, energy, Taiwan, BRICS, proxy, nuclear, diplomacy, conflict
Notes: priority:high
