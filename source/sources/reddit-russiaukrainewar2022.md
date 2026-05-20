---
id: reddit-russiaukrainewar2022
type: api
status: testing
---
# r/RussiaUkraineWar2022 (reddit.com/r/RussiaUkraineWar2022)
Conflict aggregation subreddit for monitoring pro-Russian narratives, propaganda trends, sentiment shaping, and recycled media. Treat as narrative-monitoring source, not factual reporting. Fetch https://www.reddit.com/r/RussiaUkraineWar2022/new.json?limit=25&raw_json=1 with User-Agent: osint-bot/1.0; parse .data.children[].data; filter by created_utc in time window (Unix seconds); map title→title, selftext→contents, https://reddit.com+permalink→links[0], url→links[1] if external; image_urls:[].
Keywords: Russia, Ukraine, propaganda, narrative, conflict, military, frontline, war, information-operation
Notes: priority:medium | Low reliability — use for narrative and IO tracking only
