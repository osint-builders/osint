---
id: reddit-intelligence
type: api
status: testing
---
# r/Intelligence (reddit.com/r/Intelligence)
Intelligence-community discussions covering HUMINT/SIGINT methodology, historical parallels, analytic frameworks, and IC doctrine. Fetch https://www.reddit.com/r/Intelligence/new.json?limit=25&raw_json=1 with User-Agent: osint-bot/1.0; parse .data.children[].data; filter by created_utc in time window (Unix seconds); map title→title, selftext→contents, https://reddit.com+permalink→links[0], url→links[1] if external; image_urls:[].
Keywords: intelligence, HUMINT, SIGINT, analysis, tradecraft, CIA, NSA, methodology, espionage, counterintelligence
