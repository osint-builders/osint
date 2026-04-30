---
id: twitter-imo-hq
name: International Maritime Organization - Official Account
type: twitter
status: testing
description: |
  Official Twitter account for the International Maritime Organization (IMO), the UN specialized 
  agency responsible for maritime safety, security, and environmental protection. Provides 
  announcements on maritime security incidents, piracy alerts, shipping regulations, port state 
  control, and international maritime cooperation. Critical source for monitoring maritime 
  security threats, shipping disruptions, and naval incidents affecting global trade.
created_date: "2026-04-30"
last_updated: "2026-04-30"
tags:
  - maritime-security
  - shipping
  - international-maritime
  - piracy
  - port-security
  - naval-incidents
  - osint
  - official-source
  - un-agency
reliability: high
confidence_score: 94
update_frequency: "1h"
priority: medium
language:
  - en
geographic_focus:
  - global
  - maritime-chokepoints
  - international-waters
cost: free
requires_auth: true
maintainer: osint-team
alert_keywords:
  - piracy
  - attack
  - hijacking
  - security incident
  - maritime threat
  - Red Sea
  - Gulf of Aden
  - Strait of Hormuz
  - South China Sea
  - Malacca Strait
  - seizure
  - boarding
  - Houthi
  - naval incident
---

# International Maritime Organization - Official Account

## Overview

The International Maritime Organization (@IMOHQ) is the official Twitter account for the UN specialized agency responsible for regulating shipping and ensuring maritime safety and security worldwide. With 175 member states, IMO develops international maritime conventions and coordinates responses to maritime security threats. The account provides:

- Maritime security incident reports and alerts
- Piracy and armed robbery notifications
- Shipping disruption and port closure announcements
- Maritime security regulation updates
- Port state control and flag state responsibilities
- International maritime cooperation initiatives
- Search and rescue coordination
- Maritime security threat assessments
- Convention implementation and compliance
- Maritime boundary and sovereignty issues
- Naval incident reports affecting commercial shipping
- Environmental and pollution incidents affecting navigation

**Account Characteristics:**
- Official UN specialized agency account (verified)
- Global maritime regulatory authority
- Technical and regulatory focus
- Professional maritime industry communication
- Coordination with member states and flag registries
- Balance of safety, security, and environmental concerns

**Intelligence Value:**
- Authoritative source on maritime security incidents
- Early warning of shipping disruptions and chokepoint threats
- Insight into maritime threat patterns and hotspots
- Piracy trends and affected sea lanes
- State-sponsored maritime aggression indicators
- Port security and vulnerability assessments
- International maritime cooperation gaps
- Naval incidents affecting commercial operations

## Data Collection Criteria

### Twitter Account Details

- **Handle**: IMOHQ
- **Account Type**: Official UN specialized agency
- **Geographic Focus**: Global oceans, maritime chokepoints, international shipping lanes
- **Strategic Significance**: Maritime security, global trade, naval incidents
- **Content Type**: Security incident reports, regulatory updates, cooperation announcements
- **Tweet Frequency**: Several times per week
- **Language**: English (technical maritime terminology)
- **Verification**: Official verified international organization account

### Collection Method

- **Method**: timeline
- **Poll Interval**: Every 1 hour
- **Include Retweets**: Yes (often amplify member states, maritime authorities)
- **Include Replies**: Yes (incident updates and clarifications)
- **Include Quotes**: Yes
- **Thread Handling**: Collect full threads for major incidents and regulatory updates

### Content Filters

#### Include Criteria

- Maritime security incidents and attacks
- Piracy and armed robbery reports
- Naval incidents affecting commercial shipping
- Port closures and access restrictions
- Shipping lane disruptions and diversions
- Maritime threat warnings and alerts
- Hijacking and vessel seizure incidents
- Search and rescue operations with security implications
- Maritime security cooperation and exercises
- Port state control enforcement actions
- Flag state sanctions and vessel detentions
- Maritime boundary disputes affecting navigation
- Environmental incidents affecting shipping safety

#### Exclude Criteria

- Routine regulatory updates without security implications
- Administrative and organizational announcements
- General maritime safety awareness (unless incident-driven)
- Historical commemorations without current relevance
- Technical standards discussions without operational impact

### Keyword Monitoring

**High-Priority Keywords:**
- Piracy, pirate attack, armed robbery at sea
- Hijacking, seizure, boarding, capture
- Maritime security, security incident, maritime threat
- Attack, assault, fired upon, under fire
- Naval incident, naval confrontation, military vessel
- Port closure, access denied, navigation restriction
- Disruption, diversion, chokepoint, blockade
- Red Sea, Bab el-Mandeb, Suez Canal
- Gulf of Aden, Strait of Hormuz, Persian Gulf
- South China Sea, Malacca Strait, Singapore Strait
- Houthi, Yemen, Iran, Iranian, IRGC

**Geographic Keywords:**
- Red Sea, Gulf of Aden, Bab el-Mandeb Strait
- Strait of Hormuz, Persian Gulf, Gulf of Oman
- South China Sea, Taiwan Strait, Malacca Strait
- Gulf of Guinea, West Africa, Somalia
- Singapore Strait, Sunda Strait, Lombok Strait
- Black Sea, Kerch Strait, Sea of Azov
- Mediterranean, Suez Canal, Gibraltar

**Incident Keywords:**
- Attack, assault, fired upon, shelling
- Boarding, seizure, capture, hijacking
- Kidnapping, hostage, crew detention
- Damage, disabled, sinking, distress
- Mine, torpedo, missile, drone
- Collision, ramming, confrontation
- Detention, arrest, inspection, search

**Threat Actor Keywords:**
- Houthi, Ansar Allah, Yemen
- Pirates, maritime criminals, armed gangs
- Iranian, IRGC, Revolutionary Guard
- Chinese, PLAN, Coast Guard, maritime militia
- Russian, Black Sea Fleet
- Non-state actors, extremists

**Vessel Keywords:**
- Tanker, oil tanker, LNG carrier
- Container ship, cargo vessel, bulk carrier
- Fishing vessel, research vessel, survey ship
- Naval vessel, warship, coast guard
- Civilian vessel, merchant ship

## Expected Data Format

### Raw Tweet Object

```json
{
  "id": "1234567890",
  "text": "MARITIME SECURITY ALERT: IMO informed of missile attack on container vessel in Red Sea 60nm west of Hodeidah, Yemen. No casualties reported, vessel proceeding under own power. Third attack this week on commercial shipping. IMO coordinates with UKMTO and coalition naval forces. Mariners advised heightened vigilance in region.",
  "created_at": "2026-04-30T08:30:00Z",
  "author": {
    "username": "IMOHQ",
    "name": "International Maritime Organization (IMO)"
  },
  "metrics": {
    "retweet_count": 3450,
    "like_count": 5670,
    "reply_count": 892
  }
}
```

### Structured Data Extraction

```yaml
event_type: maritime-security-incident
incident_type: "missile attack"
target: "container vessel"
location:
  sea: "Red Sea"
  position: "60nm west of Hodeidah"
  country: "Yemen"
casualties: "none reported"
vessel_status: "proceeding under own power"
pattern: "third attack this week"
coordination:
  - "UKMTO" # UK Maritime Trade Operations
  - "coalition naval forces"
warning_level: "heightened vigilance"
priority: high
tags:
  - red-sea
  - yemen
  - missile-attack
  - container-vessel
  - houthi
  - maritime-security
```

## Processing Instructions

### Data Extraction

1. **Fetch Timeline**
   - Use Twitter API v2 to fetch recent tweets and threads
   - Priority increases during maritime security crises
   - Monitor for incident alerts and security warnings

2. **Content Classification**
   - Distinguish security incidents from regulatory updates
   - Identify attack patterns and threat trends
   - Assess impact on global shipping and trade
   - Extract geographic patterns and chokepoint vulnerabilities

3. **Entity Extraction**
   - Vessel types and identification details
   - Precise geographic coordinates or positions
   - Threat actors and attack methods
   - Casualties and damage assessments
   - Coordinating maritime authorities
   - Timeline information and incident patterns
   - Affected shipping lanes and diversions
   - Port closures and access restrictions

4. **Significance Assessment**
   - Critical: Major attacks, chokepoint closures, pattern of escalation, strategic waterway disruptions
   - High: Individual attacks, hijackings, naval incidents, port closures
   - Medium: Armed robbery, minor incidents, security warnings, cooperation updates
   - Low: Routine regulatory updates, general maritime safety content

### Transformation to World Event Entity

```javascript
function transformToWorldEvent(tweet, extracted) {
  const eventType = classifyMaritimeIncident(tweet.text);
  const priority = assessMaritimeSignificance(extracted);
  
  return {
    title: buildEventTitle(extracted),
    date: tweet.created_at,
    type: eventType,
    location: {
      sea: extracted.sea,
      position: extracted.position,
      country: extracted.country
    },
    priority: priority,
    confidence: 'high', // Official UN agency
    tags: generateTags(extracted),
    source: {
      type: 'twitter',
      handle: 'IMOHQ',
      tweet_id: tweet.id,
      url: `https://twitter.com/IMOHQ/status/${tweet.id}`,
      reliability: 'high'
    },
    entities: extracted.entities,
    contents: generateMarkdown(tweet, extracted)
  };
}
```

## Quality Indicators

### High Quality Signals

- Specific vessel types and identification
- Precise geographic coordinates or positions
- Casualty and damage details
- Attack methods and weapons described
- Coordination with maritime authorities mentioned
- Timeline and incident frequency patterns
- Impact on shipping routes specified
- Links to maritime security bulletins
- Flag state and port state authorities involved
- Pattern recognition (e.g., "third attack this week")

### Low Quality Signals

- Vague location descriptions
- No vessel or incident details
- Lack of coordination information
- General awareness messaging without specifics

### Red Flags (Skip/Low Priority)

- Routine administrative updates
- General maritime safety awareness
- Historical content without current relevance
- Technical standards without operational impact

## Known Issues

### Issue 1: Reporting Delays
**Problem**: IMO reports may lag behind real-time maritime security alerts from UKMTO or regional centers  
**Workaround**: Cross-reference with UKMTO, MSCHOA, and national maritime authorities for real-time data  
**Status**: Expected for international coordination body, use for authoritative confirmation

### Issue 2: Attribution Challenges
**Problem**: IMO may avoid explicit attribution of attacks for diplomatic reasons  
**Workaround**: Correlate with naval intelligence and threat actor pattern analysis  
**Status**: Ongoing, supplement with defense and intelligence sources

### Issue 3: Incident Verification
**Problem**: Initial reports may lack complete details pending investigation  
**Workaround**: Monitor for follow-up statements and final incident reports  
**Status**: Standard practice, track temporal updates

## Examples

### Example 1: Red Sea Attack Pattern - Critical Priority

**Raw Tweet:**
```
CRITICAL ALERT: IMO reports 5 container vessels and 2 oil tankers attacked 
by Houthi forces in Red Sea this week. 12 missiles fired, 3 vessels damaged, 
crews safe. Major shipping companies diverting via Cape of Good Hope, adding 
10-14 days transit. Coordinating with @NATO_MARCOM coalition for maritime 
security corridor. Escalating threat to global supply chains.
```

**Extracted World Event:**
```yaml
title: "Escalating Houthi attacks in Red Sea disrupt global shipping"
date: 2026-04-30T08:30:00Z
type: maritime-security-crisis
incident_pattern: "5 container vessels, 2 oil tankers attacked this week"
threat_actor: "Houthi forces"
location:
  sea: "Red Sea"
attack_details:
  missiles: 12
  vessels_damaged: 3
  casualties: "none, crews safe"
impact:
  diversion: "Cape of Good Hope"
  delay: "10-14 days added transit"
  scope: "major shipping companies"
coordination: "NATO Maritime Command coalition"
strategic_impact: "global supply chain disruption"
priority: critical
confidence: high
tags:
  - red-sea
  - houthi
  - missile-attacks
  - shipping-disruption
  - supply-chain
  - cape-of-good-hope
  - pattern-of-attacks
```

### Example 2: Strait of Hormuz Incident - High Priority

**Raw Tweet:**
```
IMO informed: Iranian Revolutionary Guard vessels detained Singapore-flagged 
oil tanker in Strait of Hormuz territorial waters. Crew of 24 (mixed 
nationalities) safe but vessel diverted to Iranian port. Singapore Maritime 
Authority coordinating with IMO and regional partners for crew safety and 
vessel release. 5th detention this year in strategic waterway.
```

**Extracted World Event:**
```yaml
title: "IRGC detains oil tanker in Strait of Hormuz"
date: 2026-04-30T11:15:00Z
type: maritime-vessel-seizure
threat_actor: "Iranian Revolutionary Guard"
vessel:
  type: "oil tanker"
  flag: "Singapore"
location:
  sea: "Strait of Hormuz"
  waters: "Iranian territorial"
crew:
  count: 24
  status: "safe"
  nationalities: "mixed"
action: "diverted to Iranian port"
coordination:
  - "Singapore Maritime Authority"
  - "IMO"
  - "regional partners"
pattern: "5th detention this year"
strategic_significance: "strategic waterway"
priority: high
confidence: high
tags:
  - strait-of-hormuz
  - iran
  - irgc
  - vessel-detention
  - oil-tanker
  - crew-safety
  - strategic-chokepoint
```

### Example 3: South China Sea Naval Incident - High Priority

**Raw Tweet:**
```
IMO receives reports of dangerous Chinese Coast Guard maneuvers near Philippine 
resupply vessels in South China Sea. Water cannons used, collision narrowly 
avoided. IMO emphasizes importance of maritime safety and freedom of navigation 
in international waters per UNCLOS. Monitoring situation with Philippines 
maritime authorities.
```

**Extracted World Event:**
```yaml
title: "Chinese Coast Guard confronts Philippine vessels in South China Sea"
date: 2026-04-30T14:20:00Z
type: maritime-confrontation
actor: "Chinese Coast Guard"
target: "Philippine resupply vessels"
location:
  sea: "South China Sea"
  legal_status: "international waters"
incident_details:
  - "dangerous maneuvers"
  - "water cannons used"
  - "collision narrowly avoided"
legal_framework: "UNCLOS freedom of navigation"
coordination: "Philippines maritime authorities"
priority: high
confidence: high
tags:
  - south-china-sea
  - china
  - philippines
  - coast-guard
  - freedom-of-navigation
  - unclos
  - near-collision
```

## Validation Checklist

Before marking source as active:

- [x] Twitter handle verified (@IMOHQ)
- [x] Official UN agency account confirmed
- [x] Strategic relevance established (maritime security, global trade)
- [x] Collection method appropriate (timeline with retweets and replies)
- [x] Filters configured (security incidents and maritime threats)
- [x] Keywords defined for incidents, threats, and chokepoints
- [x] Entity extraction patterns defined
- [x] Quality indicators specific and measurable
- [x] Examples comprehensive and realistic
- [ ] Account verification (confirm active and posting)
- [ ] Authentication configured (Twitter API access)
- [ ] Integration tested with collection system

## Monitoring & Maintenance

### Daily Checks
- API connectivity and tweet collection
- No collection gaps during maritime security incidents
- Real-time monitoring during chokepoint disruptions
- Cross-reference with UKMTO and naval authorities

### Weekly Tasks
- Review classification accuracy for incident types
- Update threat actor and geographic pattern tracking
- Verify vessel and incident detail extraction
- Audit maritime chokepoint monitoring coverage

### Monthly Tasks
- Assess reliability score (should remain high for official source)
- Review maritime threat landscape and patterns
- Update geographic and threat actor focus areas
- Analyze shipping disruption trends
- Check account changes or communication policy updates

## Related Sources

Complementary sources for maritime security intelligence:

- **@NATO_MARCOM**: NATO Maritime Command operations
- **@US5thFleet**: US naval operations in Middle East waters
- **@US7thFleet**: US naval operations in Indo-Pacific
- **@RoyalNavy**: UK Royal Navy operations
- **UKMTO**: UK Maritime Trade Operations (primary incident reporting)
- **MSCHOA**: Maritime Security Centre Horn of Africa
- **@UN_MARITIMESEC**: UN maritime security initiatives
- **Maritime executive publications**: Commercial shipping intelligence
- **Lloyd's List**: Shipping industry news and incidents
