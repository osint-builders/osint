---
id: reddit-northkoreanews
type: api
status: testing
---
# r/NorthKoreaNews (reddit.com/r/NorthKoreaNews)
DPRK-focused aggregation covering missile launches, sanctions evasion, military activity, cyber operations, and regional developments. Fetch https://www.reddit.com/r/NorthKoreaNews/new.json?limit=25&raw_json=1 with User-Agent: osint-bot/1.0; parse .data.children[].data; filter by created_utc in time window (Unix seconds); map title→title, selftext→contents, https://reddit.com+permalink→links[0], url→links[1] if external; image_urls:[].
Keywords: DPRK, missile, nuclear, sanctions, Kim, military, cyber, North Korea, launch, Korea
