---
id: twitter-pizzainwatch
name: Pizza in Watch - Maritime Vessel Tracking & AIS Intelligence
type: twitter
status: testing
description: |
  Independent maritime tracking account providing real-time vessel movements, AIS data analysis,
  and maritime intelligence. Focuses on tracking commercial vessels, naval movements, and suspicious
  maritime activity. Particularly valuable for identifying sanctions evasion, dark vessel activity,
  and unusual shipping patterns. Known for detailed vessel identification and route analysis.
created_date: "2026-04-30"
last_updated: "2026-04-30"
tags:
  - maritime
  - vessel-tracking
  - ais
  - shipping
  - sanctions
  - osint
  - naval
  - cargo
reliability: high
confidence_score: 85
update_frequency: "30m"
priority: high
language:
  - en
geographic_focus:
  - global
  - high-seas
  - straits
cost: free
requires_auth: true
maintainer: osint-team
alert_keywords:
  - sanctions
  - iran
  - russia
  - dark vessel
  - AIS off
  - tanker
  - oil
  - tracking
  - suspicious
  - vessel
---

# Pizza in Watch - Maritime Vessel Tracking & AIS Intelligence

## Overview

Pizza in Watch (@pizzainwatch) is an independent maritime intelligence analyst specializing in real-time vessel tracking using Automatic Identification System (AIS) data. The account provides high-quality OSINT on:

- Commercial vessel movements and tracking
- Naval vessel identification and movements
- Sanctions evasion through ship-to-ship transfers
- Dark vessel activity (AIS transponders turned off)
- Tanker tracking, especially oil and gas shipments
- Suspicious maritime behavior patterns
- Port activities and vessel ownership analysis
- Flag changes and vessel renaming patterns
- Iran and Russia sanctions circumvention
- Maritime chokepoint monitoring (Straits, canals)

**Account Characteristics:**
- Technical expertise in AIS data interpretation
- Detailed vessel identification with IMO numbers
- Route analysis and destination tracking
- Real-time monitoring and alerts
- Focus on sanctions-relevant shipping activity
- Use of multiple maritime tracking platforms

**Intelligence Value:**
- Early detection of sanctions evasion activities
- Tracking of strategic cargo movements
- Identification of front companies and shell vessel networks
- Maritime security threat identification
- Commercial intelligence on shipping patterns
- Geopolitical insight through vessel movements

## Data Collection Criteria

### Twitter Account Details

- **Handle**: pizzainwatch
- **Account Type**: Individual maritime OSINT analyst
- **Geographic Focus**: Global maritime operations
- **Strategic Significance**: Sanctions monitoring, vessel tracking
- **Content Type**: AIS data analysis, vessel tracking reports, screenshots
- **Tweet Frequency**: Multiple times daily
- **Language**: English

### Collection Method

- **Method**: timeline
- **Poll Interval**: Every 30 minutes
- **Include Retweets**: Yes (often shares related maritime intelligence)
- **Include Replies**: Yes (detailed analysis often in threads)
- **Include Quotes**: Yes
- **Thread Handling**: Collect full threads for vessel tracking updates

### Content Filters

#### Include Criteria

- Vessel tracking with AIS data
- Sanctions-relevant maritime activity
- Ship-to-ship transfers
- Dark vessel operations
- Tanker movements (oil, LNG, chemical)
- Naval vessel tracking
- Port activity intelligence
- Vessel ownership and flag changes
- Suspicious route deviations
- Strategic cargo monitoring

#### Exclude Criteria

- Personal opinions unrelated to maritime tracking
- General shipping industry news without specific vessels
- Historical maritime content
- Non-intelligence related posts

### Keyword Monitoring

**High-Priority Keywords:**
- sanctions, Iran, Russia, North Korea
- tanker, oil, LNG, crude
- AIS off, dark vessel, transponder off
- ship-to-ship, STS transfer
- IMO number, MMSI
- tracking, vessel, cargo
- suspicious, evasion, circumvention
- flag change, rename

**Activity Keywords:**
- sailing, anchored, docked
- loading, unloading, transfer
- destination, route, heading
- departed, arrived, en route
- port call, berth

**Location Keywords:**
- Strait of Hormuz, Suez Canal
- Bosphorus, Singapore Strait
- Persian Gulf, South China Sea
- Mediterranean, Black Sea
- Bandar Abbas, Fujairah

## Expected Data Format

### Raw Tweet Object

```json
{
  "id": "1234567890",
  "text": "Iranian-flagged tanker SABITI (IMO 9441065) has turned off AIS transponder near Kharg Island after loading crude oil. Last position 29.25N 50.32E heading southeast. Vessel previously sanctioned in 2023. #MaritimeTracking #Sanctions",
  "created_at": "2026-04-30T08:15:00Z",
  "author": {
    "username": "pizzainwatch",
    "name": "Pizza in Watch"
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
event_type: maritime-sanctions-activity
vessel:
  name: "SABITI"
  imo: "9441065"
  type: "tanker"
  flag: "Iran"
  cargo: "crude oil"
location:
  lat: 29.25
  lon: 50.32
  area: "Persian Gulf"
  port: "Kharg Island"
activity: "AIS transponder disabled"
context: "Previously sanctioned vessel, potential sanctions evasion"
priority: high
tags:
  - iran
  - sanctions
  - dark-vessel
  - crude-oil
  - ais-off
```

## Processing Instructions

### Data Extraction

1. **Fetch Timeline**
   - Use Twitter API v2 to fetch recent tweets and threads
   - Filter for vessel tracking and maritime intelligence content
   - Prioritize AIS data and vessel identification posts

2. **Content Classification**
   - Identify vessel types (tanker, cargo, naval, etc.)
   - Extract IMO numbers and vessel identifiers
   - Determine activity type (tracking, sanctions evasion, STS transfer)
   - Assess strategic significance

3. **Entity Extraction**
   - Vessel names, IMO numbers, MMSI codes
   - Locations (coordinates, ports, waterways)
   - Countries and flags
   - Cargo types
   - Companies and vessel owners
   - Sanctions status

4. **Significance Assessment**
   - High: Sanctions evasion, dark vessels, strategic cargo
   - Medium: Notable vessel movements, unusual patterns
   - Low: Routine tracking updates

### Transformation to World Event Entity

```javascript
function transformToWorldEvent(tweet, extracted) {
  const eventType = classifyMaritimeEvent(tweet.text);
  
  return {
    title: buildEventTitle(extracted),
    date: tweet.created_at,
    type: eventType,
    location: {
      coordinates: extracted.location,
      waterway: extracted.waterway,
      region: extracted.region
    },
    priority: calculatePriority(eventType, extracted),
    confidence: 'high',
    tags: generateTags(extracted),
    source: {
      type: 'twitter',
      handle: 'pizzainwatch',
      tweet_id: tweet.id,
      url: `https://twitter.com/pizzainwatch/status/${tweet.id}`
    },
    entities: extracted.entities,
    contents: generateMarkdown(tweet, extracted)
  };
}
```

## Quality Indicators

### High Quality Signals

- Specific vessel identification (IMO/MMSI numbers)
- GPS coordinates and precise locations
- AIS data screenshots or evidence
- Cargo type and quantity details
- Historical context on vessel
- Sanctions status verification
- Timeline of movements
- Multiple data points corroborating activity

### Low Quality Signals

- Vague vessel descriptions
- Unverified information
- Lack of identifying details
- No supporting evidence

### Red Flags (Skip/Low Priority)

- Speculation without data
- Historical content without current relevance
- Non-maritime topics
- Personal commentary unrelated to tracking

## Known Issues

### Issue 1: AIS Data Gaps
**Problem**: Vessels turning off AIS creates data gaps  
**Workaround**: Use last known position and typical routes for inference  
**Status**: Monitor for vessel reappearance

### Issue 2: Vessel Name Changes
**Problem**: Sanctioned vessels frequently rename to evade detection  
**Workaround**: Track by IMO number (permanent identifier)  
**Status**: Cross-reference vessel databases

### Issue 3: Technical Jargon
**Problem**: Heavy use of maritime technical terminology  
**Workaround**: Maintain glossary of maritime terms and vessel types  
**Status**: Documentation in progress

## Examples

### Example 1: Dark Vessel Activity - High Priority

**Raw Tweet:**
```
🚨 ALERT: Russian-flagged Aframax tanker OCEAN PEARL (IMO 9876543) 
disabled AIS at 23:45 UTC after departing Novorossiysk. Last position: 
44.72N 37.78E, heading toward Bosphorus. Vessel carrying ~700k barrels 
crude. Sanctions status: OFAC designated March 2024. #OSINT
```

**Extracted World Event:**
```yaml
title: "Russian tanker OCEAN PEARL disables AIS after departing Novorossiysk"
date: 2026-04-30T23:45:00Z
type: maritime-sanctions-evasion
vessel:
  name: "OCEAN PEARL"
  imo: "9876543"
  type: "Aframax tanker"
  flag: "Russia"
  cargo: "crude oil"
  capacity: "700,000 barrels"
location:
  lat: 44.72
  lon: 37.78
  departure_port: "Novorossiysk"
  heading: "Bosphorus"
sanctions:
  status: "OFAC designated"
  date: "2024-03"
priority: high
confidence: high
tags:
  - russia
  - sanctions
  - dark-vessel
  - crude-oil
  - ais-off
  - ofac
  - black-sea
```

### Example 2: Ship-to-Ship Transfer - High Priority

**Raw Tweet:**
```
Iranian tanker ARMAN 114 (IMO 9330897) conducting STS transfer with 
Cameroon-flagged VOYAGER I (IMO 9123456) at 24.15N 61.25E (Arabian Sea).
Both vessels static for 6+ hours. ARMAN 114 likely transferring Iranian 
crude to evade sanctions. VOYAGER I owner: shell company Dubai.
```

**Extracted World Event:**
```yaml
title: "Iranian tanker ARMAN 114 conducting STS transfer in Arabian Sea"
date: 2026-04-30T14:30:00Z
type: ship-to-ship-transfer
vessels:
  - name: "ARMAN 114"
    imo: "9330897"
    flag: "Iran"
    role: "source"
  - name: "VOYAGER I"
    imo: "9123456"
    flag: "Cameroon"
    owner: "shell company Dubai"
    role: "destination"
location:
  lat: 24.15
  lon: 61.25
  area: "Arabian Sea"
activity:
  type: "ship-to-ship transfer"
  duration: "6+ hours"
  cargo_type: "Iranian crude oil"
context: "Suspected sanctions evasion"
priority: high
confidence: high
tags:
  - iran
  - sanctions
  - sts-transfer
  - shell-company
  - crude-oil
  - arabian-sea
```

## Validation Checklist

Before marking source as active:

- [x] Twitter handle verified (@pizzainwatch)
- [x] Content focus confirmed (maritime tracking, AIS intelligence)
- [x] Strategic relevance established (sanctions monitoring)
- [x] Collection method appropriate (timeline with replies for threads)
- [x] Filters configured (vessel tracking focus)
- [x] Keywords defined for maritime intelligence
- [x] Entity extraction patterns defined
- [x] Quality indicators specific and measurable
- [x] Examples comprehensive and realistic
- [ ] Account verification (confirm active and posting)
- [ ] Authentication configured (Twitter API access)
- [ ] Integration tested with collection system

## Monitoring & Maintenance

### Daily Checks
- API connectivity and tweet collection
- Vessel tracking data completeness
- No collection gaps during major maritime events

### Weekly Tasks
- Review sanctions-relevant posts for accuracy
- Update vessel databases with new IMO numbers
- Verify maritime activity classifications

### Monthly Tasks
- Audit event classification accuracy
- Review reliability score based on verified intelligence
- Update maritime terminology glossary
- Check for new tracking methodologies

## Related Sources

Complementary sources for maritime intelligence:

- **@TankerTrackers**: Focus on Iran/Venezuela oil tracking
- **@MDAT_GoG**: Gulf of Guinea maritime security
- **@Fleetnumbers**: Naval fleet tracking
- **@seawatch_intl**: Search and rescue operations
- **@WarshipCam**: Naval vessel photography and identification
- **@gCaptain**: Maritime news and incidents
- **@tradewindsnews**: Shipping industry intelligence
