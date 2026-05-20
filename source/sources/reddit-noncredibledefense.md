---
id: reddit-noncredibledefense
type: api
status: testing
---
# r/NonCredibleDefense (reddit.com/r/NonCredibleDefense)
Meme-heavy defense community that occasionally surfaces emerging military developments, internet sentiment, and early anomaly signals before mainstream reporting. Fetch https://www.reddit.com/r/NonCredibleDefense/new.json?limit=25&raw_json=1 with User-Agent: osint-bot/1.0; parse .data.children[].data; filter by created_utc in time window (Unix seconds); map title→title, selftext→contents, https://reddit.com+permalink→links[0], url→links[1] if external; image_urls:[].
Keywords: military, defense, weapons, development, anomaly, emerging, humor, meme
Notes: priority:low | Low reliability — use for early-signal anomaly detection only
