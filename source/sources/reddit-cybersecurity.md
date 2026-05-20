---
id: reddit-cybersecurity
type: api
status: testing
---
# r/cybersecurity (reddit.com/r/cybersecurity)
Broad operational cybersecurity discussions covering ransomware, enterprise incidents, threat intelligence, and security operations center workflows. Fetch https://www.reddit.com/r/cybersecurity/new.json?limit=25&raw_json=1 with User-Agent: osint-bot/1.0; parse .data.children[].data; filter by created_utc in time window (Unix seconds); map title→title, selftext→contents, https://reddit.com+permalink→links[0], url→links[1] if external; image_urls:[].
Keywords: ransomware, breach, incident, threat, vulnerability, APT, enterprise, security, attack, defense
