---
id: reddit-credibledefense
type: api
status: testing
---
# r/CredibleDefense (reddit.com/r/CredibleDefense)
High-signal defense and geopolitical analysis covering military capabilities, doctrine, procurement, China, Russia, NATO, and strategic warfare trends. Fetch https://www.reddit.com/r/CredibleDefense/new.json?limit=25&raw_json=1 with User-Agent: osint-bot/1.0; parse .data.children[].data; filter by created_utc in time window (Unix seconds); map title→title, selftext→contents, https://reddit.com+permalink→links[0], url→links[1] if external; image_urls:[].
Keywords: military, doctrine, procurement, NATO, China, Russia, defense, warfare, conflict, weapons
Notes: priority:high
