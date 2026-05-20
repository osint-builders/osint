---
id: reddit-combatfootage
type: api
status: testing
---
# r/CombatFootage (reddit.com/r/CombatFootage)
Battlefield footage from modern conflicts useful for studying drone warfare, electronic warfare, armored tactics, ISR effects, and combat evolution. Fetch https://www.reddit.com/r/CombatFootage/new.json?limit=25&raw_json=1 with User-Agent: osint-bot/1.0; parse .data.children[].data; filter by created_utc in time window (Unix seconds); map title→title, selftext→contents, https://reddit.com+permalink→links[0], url→links[1] if external; image_urls:[].
Keywords: combat, drone, Ukraine, Russia, frontline, warfare, airstrike, EW, armored, ISR, military
