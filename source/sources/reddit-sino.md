---
id: reddit-sino
type: api
status: testing
---
# r/Sino (reddit.com/r/Sino)
Chinese nationalist and CCP-aligned narrative space for monitoring propaganda themes, information operations, and adversarial framing. Treat as narrative-monitoring source, not factual reporting. Fetch https://www.reddit.com/r/Sino/new.json?limit=25&raw_json=1 with User-Agent: osint-bot/1.0; parse .data.children[].data; filter by created_utc in time window (Unix seconds); map title→title, selftext→contents, https://reddit.com+permalink→links[0], url→links[1] if external; image_urls:[].
Keywords: China, CCP, propaganda, Taiwan, Hong Kong, military, nationalism, narrative, information-operation
Notes: priority:medium | Low reliability — use for narrative and IO tracking only
