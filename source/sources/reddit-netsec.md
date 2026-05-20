---
id: reddit-netsec
type: api
status: testing
---
# r/netsec (reddit.com/r/netsec)
High-quality cybersecurity discussions focused on APTs, nation-state operations, exploits, malware infrastructure, and offensive security research. Fetch https://www.reddit.com/r/netsec/new.json?limit=25&raw_json=1 with User-Agent: osint-bot/1.0; parse .data.children[].data; filter by created_utc in time window (Unix seconds); map title→title, selftext→contents, https://reddit.com+permalink→links[0], url→links[1] if external; image_urls:[].
Keywords: APT, exploit, malware, zero-day, nation-state, cyber, attack, vulnerability, ransomware, infrastructure
Notes: priority:high
