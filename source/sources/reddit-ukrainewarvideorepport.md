---
id: reddit-ukrainewarvideorepport
type: api
status: testing
---
# r/UkraineWarVideoReport (reddit.com/r/UkraineWarVideoReport)
Ukraine conflict tracking with frontline footage, drone operations, trench warfare developments, battlefield adaptation, and equipment observations. Fetch https://www.reddit.com/r/UkraineWarVideoReport/new.json?limit=25&raw_json=1 with User-Agent: osint-bot/1.0; parse .data.children[].data; filter by created_utc in time window (Unix seconds); map title→title, selftext→contents, https://reddit.com+permalink→links[0], url→links[1] if external; image_urls:[].
Keywords: Ukraine, Russia, frontline, drone, trench, warfare, military, equipment, combat, attack
Notes: priority:high
