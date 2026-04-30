---
id: twitter-shipnews
name: ShipNews - Shipping Industry News and Intelligence
type: twitter
status: active
description: |
  Shipping industry news platform covering vessel movements, maritime incidents, port
  operations, and commercial shipping developments. Provides timely reporting on vessel
  casualties, port disruptions, sanctions enforcement, and shipping industry events.
  Complements TradeWinds with broader shipping news coverage and real-time incident
  reporting.
created_date: "2026-04-30"
last_updated: "2026-04-30"
tags:
  - shipping-news
  - maritime
  - vessel-tracking
  - port-operations
  - maritime-incidents
  - sanctions
  - osint
reliability: medium
confidence_score: 75
update_frequency: "3h"
priority: medium
language:
  - en
geographic_focus:
  - global
  - shipping-worldwide
cost: free
requires_auth: true
maintainer: osint-team
alert_keywords:
  - vessel
  - ship
  - incident
  - sanctions
  - iran
  - russia
  - port
  - cargo
  - tanker
  - collision
---

# ShipNews - Shipping Industry News and Intelligence

## Overview

ShipNews (@ShipNews) is a shipping industry news platform providing coverage of maritime events, vessel movements, and shipping developments. The account delivers:

- Vessel casualty and incident reporting
- Port operations and disruptions
- Shipping route and service updates
- Container shipping developments
- Bulk and tanker market news
- Maritime sanctions enforcement
- Vessel detention and arrests
- Piracy and maritime security
- Environmental incidents
- Flag state enforcement
- Ship delivery and scrapping
- Charter and freight market updates
- Weather impacts on shipping
- Regulatory developments

**Account Characteristics:**
- Timely shipping industry news
- Global maritime coverage
- Mix of breaking news and analysis
- Industry source access
- Regular updates on shipping events
- Commercial shipping focus

**Intelligence Value:**
- Maritime situational awareness
- Vessel incident intelligence
- Port operational status
- Sanctions enforcement tracking
- Supply chain disruption indicators
- Maritime security incident awareness
- Fleet movement intelligence
- Commercial shipping trends
- Regulatory compliance patterns
- Environmental incident tracking

## Data Collection Criteria

### Twitter Account Details

- **Handle**: ShipNews
- **Account Type**: Shipping industry news platform
- **Geographic Focus**: Global shipping operations
- **Strategic Significance**: Maritime intelligence, incident reporting
- **Content Type**: News updates, incident reports, industry developments
- **Tweet Frequency**: Multiple times daily
- **Language**: English

### Collection Method

- **Method**: timeline
- **Poll Interval**: Every 3 hours
- **Include Retweets**: Yes (industry sources and breaking news)
- **Include Replies**: No (focus on main news posts)
- **Include Quotes**: Yes
- **Thread Handling**: Collect full threads for developing stories

### Content Filters

#### Include Criteria

- Vessel casualties and maritime incidents
- Port disruptions and closures
- Sanctions enforcement and vessel detentions
- Russian, Iranian vessel activity
- Maritime security incidents
- Strategic waterway disruptions
- Major vessel movements with intelligence value
- Environmental incidents with impact
- Piracy and maritime crime
- Vessel arrests and seizures

#### Exclude Criteria

- Routine commercial shipping announcements
- General industry business news
- Personnel and company announcements
- Historical shipping content
- Marketing and promotional posts
- Conference and event announcements

### Keyword Monitoring

**High-Priority Keywords:**
- incident, casualty, accident, collision
- grounding, sinking, fire, explosion
- sanctions, detained, seized, arrested
- Russia, Iran, North Korea, Venezuela
- piracy, attack, hijacking, security
- port, terminal, disruption, closure
- tanker, container ship, bulk carrier
- oil, cargo, vessel, ship
- blocked, damaged, disabled

**Activity Keywords:**
- collided, grounded, sank
- detained, seized, arrested
- attacked, boarded, hijacked
- closed, blocked, disrupted
- damaged, disabled, adrift
- evacuated, rescued, salvaged

**Location Keywords:**
- Suez Canal, Panama Canal
- Strait of Hormuz, Malacca Strait
- South China Sea, Persian Gulf
- Black Sea, Mediterranean
- Singapore, Rotterdam, Houston
- Shanghai, Ningbo, Hong Kong

## Expected Data Format

### Raw Tweet Object

```json
{
  "id": "1234567890",
  "text": "BREAKING: Container ship EVER FORWARD refloated after 35-day grounding in Chesapeake Bay. 12,000 TEU vessel removed 5,000 containers to lighten ship. Salvage cost estimated $100M+. Vessel proceeding to Norfolk for inspection. #Shipping #Maritime",
  "created_at": "2026-04-30T15:30:00Z",
  "author": {
    "username": "ShipNews",
    "name": "ShipNews"
  },
  "metrics": {
    "retweet_count": 234,
    "like_count": 567,
    "reply_count": 45
  }
}
```

### Structured Data Extraction

```yaml
event_type: maritime-incident-resolution
vessel:
  name: "EVER FORWARD"
  type: "container ship"
  size: "12,000 TEU"
incident:
  type: "grounding"
  duration: "35 days"
location:
  waterway: "Chesapeake Bay"
  destination: "Norfolk (for inspection)"
  country: "United States"
salvage:
  action: "removed 5,000 containers to lighten"
  cost: "estimated $100M+"
  outcome: "vessel refloated"
status: "resolved, proceeding to port"
priority: medium
tags:
  - maritime-incident
  - grounding
  - container-ship
  - salvage
  - chesapeake-bay
  - vessel-casualty
```

## Processing Instructions

### Data Extraction

1. **Fetch Timeline**
   - Use Twitter API v2 to fetch recent tweets
   - Filter for incident reports and strategic shipping news
   - Prioritize breaking news and sanctions-relevant content

2. **Content Classification**
   - Identify news type (incident, detention, disruption)
   - Extract vessel and cargo details
   - Determine location and impact
   - Assess strategic significance

3. **Entity Extraction**
   - Vessel names and types
   - Incident types and causes
   - Locations and waterways
   - Countries and authorities
   - Companies and operators
   - Casualties and impacts
   - Financial costs
   - Timeline information

4. **Significance Assessment**
   - High: Strategic waterway disruptions, sanctions detentions, major casualties
   - Medium: Port disruptions, vessel incidents, security events
   - Low: Routine shipping news, minor incidents

### Transformation to World Event Entity

```javascript
function transformToWorldEvent(tweet, extracted) {
  const eventType = classifyShippingNews(tweet.text);
  
  return {
    title: buildEventTitle(extracted),
    date: tweet.created_at,
    type: eventType,
    location: {
      port: extracted.port,
      waterway: extracted.waterway,
      country: extracted.country
    },
    priority: calculatePriority(eventType, extracted),
    confidence: 'medium',
    tags: generateTags(extracted),
    source: {
      type: 'twitter',
      handle: 'ShipNews',
      tweet_id: tweet.id,
      url: `https://twitter.com/ShipNews/status/${tweet.id}`
    },
    entities: extracted.entities,
    contents: generateMarkdown(tweet, extracted)
  };
}
```

## Quality Indicators

### High Quality Signals

- Specific vessel names and details
- Precise location information
- Timeline and date specifics
- Impact assessment included
- Multiple data points provided
- Official source citations
- Cost or scale quantification
- Photo or video evidence
- Authority involvement noted

### Low Quality Signals

- Vague vessel descriptions
- Unclear location information
- Missing timeline details
- Unconfirmed reports
- Lack of context or impact

### Red Flags (Skip/Low Priority)

- General industry business news
- Personnel announcements
- Historical content
- Marketing or promotional posts
- Conference announcements

## Known Issues

### Issue 1: News Aggregation
**Problem**: May repost news from other sources without verification  
**Workaround**: Cross-reference with primary sources, note original source when cited  
**Status**: Medium confidence rating reflects aggregation nature

### Issue 2: Commercial Focus
**Problem**: Heavy commercial shipping focus may dilute strategic intelligence  
**Workaround**: Filter for sanctions, incidents, and strategic relevance only  
**Status**: Keyword filtering configured

### Issue 3: Timeliness Variability
**Problem**: Some news may lag behind breaking sources  
**Workaround**: Use as complementary source, not primary for breaking intelligence  
**Status**: Medium priority rating reflects this

## Examples

### Example 1: Sanctions Vessel Detention - High Priority

**Raw Tweet:**
```
UPDATE: Iranian-flagged tanker SAMANGAN detained by Indonesian 
authorities in Batam anchorage. Vessel carrying 272,000 barrels crude 
oil suspected of violating sanctions. Crew of 26 being questioned. 
Ship last reported position off Singapore 3 days ago. Investigation 
ongoing with US coordination.
```

**Extracted World Event:**
```yaml
title: "Iranian tanker SAMANGAN detained in Indonesia for sanctions violation"
date: 2026-04-30T12:00:00Z
type: sanctions-enforcement-vessel-detention
vessel:
  name: "SAMANGAN"
  type: "tanker"
  flag: "Iran"
  cargo: "272,000 barrels crude oil"
  crew: "26"
detention:
  authority: "Indonesian authorities"
  location: "Batam anchorage"
  reason: "suspected sanctions violation"
  status: "crew being questioned"
coordination: "US involvement"
previous_location: "off Singapore, 3 days ago"
status: "investigation ongoing"
priority: high
confidence: medium
tags:
  - sanctions
  - iran
  - detention
  - indonesia
  - crude-oil
  - vessel-arrest
```

### Example 2: Port Disruption - Medium Priority

**Raw Tweet:**
```
Port of Shanghai container terminals suspend operations due to typhoon 
approaching. 45+ container ships waiting outside port. Backlog expected 
to take 5-7 days to clear after storm passes. Supply chain impacts 
anticipated for trans-Pacific routes. Weather update in 12 hours.
```

**Extracted World Event:**
```yaml
title: "Shanghai port suspends operations, 45+ ships waiting due to typhoon"
date: 2026-04-30T09:30:00Z
type: port-disruption-weather
port:
  name: "Port of Shanghai"
  facility: "container terminals"
cause: "typhoon approaching"
impact:
  vessels_waiting: "45+"
  vessel_type: "container ships"
  backlog_duration: "5-7 days to clear"
  supply_chain: "trans-Pacific routes affected"
status: "operations suspended"
update: "weather update in 12 hours"
priority: medium
confidence: high
tags:
  - port-disruption
  - shanghai
  - typhoon
  - container-shipping
  - supply-chain
  - weather
```

## Validation Checklist

Before marking source as active:

- [x] Twitter handle verified (@ShipNews)
- [x] Content focus confirmed (shipping industry news)
- [x] Strategic relevance established (incident and sanctions intelligence)
- [x] Collection method appropriate (timeline, 3-hour polling)
- [x] Filters configured (incident and strategic news focus)
- [x] Keywords defined for shipping intelligence
- [x] Entity extraction patterns defined
- [x] Quality indicators specific and measurable
- [x] Examples comprehensive and realistic
- [ ] Account verification (confirm active and posting)
- [ ] Authentication configured (Twitter API access)
- [ ] Integration tested with collection system

## Monitoring & Maintenance

### Daily Checks
- API connectivity and news collection
- Incident report tracking
- Sanctions enforcement monitoring

### Weekly Tasks
- Review incident classification accuracy
- Update vessel casualty database
- Verify port disruption intelligence
- Cross-reference with primary sources

### Monthly Tasks
- Audit event prioritization
- Review reliability score based on verification
- Update shipping incident taxonomy
- Assess source value vs other maritime news
- Track maritime incident trends

## Related Sources

Complementary sources for shipping intelligence:

- **@tradewindsnews**: Competing shipping news publication
- **@gCaptain**: Maritime news and incidents
- **@pizzainwatch**: Vessel tracking
- **@TheRealShipDude**: Ship identification
- **@Fleetnumbers**: Naval vessel tracking
- **@WarshipCam**: Naval photography
- **Lloyd's List**: Maritime news competitor
- **Splash247**: Alternative shipping news
