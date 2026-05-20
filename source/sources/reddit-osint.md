---
id: reddit-osint
type: api
status: testing
---
# r/OSINT (reddit.com/r/OSINT)
Open-source intelligence tradecraft, tooling, geolocation workflows, scraping techniques, satellite analysis, and investigative methodologies. Fetch https://www.reddit.com/r/OSINT/new.json?limit=25&raw_json=1 with User-Agent: osint-bot/1.0; parse .data.children[].data; filter by created_utc in time window (Unix seconds); map title→title, selftext→contents, https://reddit.com+permalink→links[0], url→links[1] if external; image_urls:[].
Keywords: osint, geolocation, investigation, surveillance, scraping, tracking, satellite, tool, methodology, intelligence
Notes: priority:high
