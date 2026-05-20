---
id: reddit-lesscredibledefence
type: api
status: testing
---
# r/LessCredibleDefence (reddit.com/r/LessCredibleDefence)
Faster-moving defense discussion covering leaks, rumors, procurement chatter, experimental systems, naval activity, and emerging developments. Fetch https://www.reddit.com/r/LessCredibleDefence/new.json?limit=25&raw_json=1 with User-Agent: osint-bot/1.0; parse .data.children[].data; filter by created_utc in time window (Unix seconds); map title→title, selftext→contents, https://reddit.com+permalink→links[0], url→links[1] if external; image_urls:[].
Keywords: defense, leak, procurement, naval, experimental, rumor, military, weapon, development, emerging
