---
id: twitter-therealshipdude
name: TheRealShipDude - Ship Identification and Maritime OSINT
type: twitter
status: active
description: |
  Expert ship identification specialist providing detailed vessel analysis, maritime OSINT,
  and commercial/naval ship tracking. Known for rapid vessel identification from limited
  information, AIS analysis, and comprehensive ship intelligence. Valuable for identifying
  unknown vessels, analyzing maritime activity patterns, and providing context on vessel
  ownership, history, and strategic significance.
created_date: "2026-04-30"
last_updated: "2026-04-30"
tags:
  - ship-identification
  - maritime-osint
  - vessel-analysis
  - ais
  - naval
  - commercial-shipping
  - osint
reliability: high
confidence_score: 85
update_frequency: "2h"
priority: high
language:
  - en
geographic_focus:
  - global
cost: free
requires_auth: true
maintainer: osint-team
alert_keywords:
  - vessel
  - ship
  - identified
  - tracking
  - sanctions
  - iran
  - russia
  - tanker
  - cargo
  - naval
  - ais
---

# TheRealShipDude - Ship Identification and Maritime OSINT

## Overview

TheRealShipDude (@TheRealShipDude) is a highly respected maritime OSINT analyst specializing in ship identification and vessel intelligence. The account provides:

- Expert vessel identification from photos, AIS, or descriptions
- Commercial and naval ship tracking
- Vessel ownership and corporate structure analysis
- Flag of convenience and shell company investigations
- Sanctions evasion identification
- Ship history and name change tracking
- IMO number cross-referencing
- Cargo type and capacity analysis
- Vessel age, condition, and specifications
- Maritime chokepoint monitoring
- Unusual or suspicious vessel activity analysis
- Ship-to-ship transfer identification
- Dark vessel tracking (AIS off)
- Port call patterns and route analysis

**Account Characteristics:**
- Deep expertise in vessel identification
- Rapid response to identification requests
- Technical knowledge of ship types and classes
- Access to maritime databases and AIS platforms
- Collaborative with maritime OSINT community
- Detailed analytical methodology explanations

**Intelligence Value:**
- Authoritative vessel identification
- Sanctions evasion detection
- Corporate ownership tracking
- Fleet composition analysis
- Maritime activity pattern recognition
- Commercial intelligence on shipping
- Naval vessel identification support
- Verification of vessel claims and identity
- Historical vessel tracking
- Strategic cargo movement monitoring

## Data Collection Criteria

### Twitter Account Details

- **Handle**: TheRealShipDude
- **Account Type**: Individual maritime OSINT expert
- **Geographic Focus**: Global maritime operations
- **Strategic Significance**: Vessel identification, sanctions monitoring
- **Content Type**: Vessel analysis, identification, tracking reports
- **Tweet Frequency**: Multiple times daily
- **Language**: English

### Collection Method

- **Method**: timeline
- **Poll Interval**: Every 2 hours
- **Include Retweets**: Yes (maritime intelligence community)
- **Include Replies**: Yes (identification discussions and analysis)
- **Include Quotes**: Yes
- **Thread Handling**: Collect full threads for detailed analysis

### Content Filters

#### Include Criteria

- Vessel identification and analysis
- Sanctions-relevant shipping activity
- Iranian, Russian, North Korean vessels
- Tanker tracking and oil shipments
- Corporate ownership investigations
- Flag changes and vessel renaming
- Ship-to-ship transfers
- Dark vessel activity
- Naval vessel identification
- Strategic cargo movements
- Unusual maritime patterns
- AIS manipulation detection

#### Exclude Criteria

- General maritime industry news
- Non-intelligence personal commentary
- Historical shipping trivia
- Routine commercial shipping without strategic relevance

### Keyword Monitoring

**High-Priority Keywords:**
- identified, identification, ID'd
- vessel, ship, tanker, cargo
- IMO, MMSI, pennant number
- sanctions, Iran, Russia, North Korea
- ownership, flag, renamed
- AIS, tracking, spotted
- ship-to-ship, STS, transfer
- dark vessel, AIS off, transponder
- oil, crude, LNG, cargo
- suspicious, unusual, evasion

**Activity Keywords:**
- sailing, anchored, docked
- departed, arrived, transiting
- loading, unloading, transfer
- renamed, reflagged, sold
- spotted, sighted, observed

**Location Keywords:**
- Strait of Hormuz, Persian Gulf
- Suez Canal, Bosphorus
- South China Sea, Malacca Strait
- Singapore, Fujairah, Rotterdam
- Bandar Abbas, Novorossiysk

## Expected Data Format

### Raw Tweet Object

```json
{
  "id": "1234567890",
  "text": "Vessel identified: That's the Iranian tanker FORTUNE (IMO 9446427), previously named HORSE. Aframax tanker, 113k DWT. Sanctioned by OFAC 2021. Currently showing flag as Tanzania but managed by front company in Malaysia. Last spotted loading at Kharg Island. #MaritimeOSINT",
  "created_at": "2026-04-30T10:45:00Z",
  "author": {
    "username": "TheRealShipDude",
    "name": "TheRealShipDude"
  },
  "metrics": {
    "retweet_count": 567,
    "like_count": 1234,
    "reply_count": 89
  }
}
```

### Structured Data Extraction

```yaml
event_type: vessel-identification-analysis
vessel:
  current_name: "FORTUNE"
  previous_name: "HORSE"
  imo: "9446427"
  type: "Aframax tanker"
  dwt: "113,000"
  flag: "Tanzania"
  management: "front company in Malaysia"
sanctions:
  status: "OFAC sanctioned"
  date: "2021"
last_activity:
  location: "Kharg Island"
  action: "loading"
context: "Iranian sanctions evasion vessel"
priority: high
tags:
  - iran
  - sanctions
  - tanker
  - vessel-identification
  - ofac
  - flag-of-convenience
  - kharg-island
```

## Processing Instructions

### Data Extraction

1. **Fetch Timeline**
   - Use Twitter API v2 to fetch recent tweets and threads
   - Filter for vessel identification and analysis content
   - Prioritize sanctions-relevant identifications

2. **Content Classification**
   - Identify vessel type and characteristics
   - Extract IMO numbers and identifiers
   - Determine sanctions status
   - Assess ownership and corporate structure
   - Evaluate strategic significance

3. **Entity Extraction**
   - Vessel names (current and historical)
   - IMO numbers, MMSI codes
   - Flag states and flag changes
   - Ownership and management companies
   - Sanctions designations
   - Locations and ports
   - Cargo types
   - Vessel specifications
   - Activity patterns

4. **Significance Assessment**
   - High: Sanctions evasion, Iranian/Russian/North Korean vessels, strategic cargo
   - Medium: Flag changes, corporate investigations, unusual patterns
   - Low: Routine vessel identification, non-strategic commercial shipping

### Transformation to World Event Entity

```javascript
function transformToWorldEvent(tweet, extracted) {
  const eventType = classifyVesselIntelligence(tweet.text);
  
  return {
    title: buildEventTitle(extracted),
    date: tweet.created_at,
    type: eventType,
    location: extracted.location,
    priority: calculatePriority(eventType, extracted),
    confidence: 'high',
    tags: generateTags(extracted),
    source: {
      type: 'twitter',
      handle: 'TheRealShipDude',
      tweet_id: tweet.id,
      url: `https://twitter.com/TheRealShipDude/status/${tweet.id}`
    },
    entities: extracted.entities,
    contents: generateMarkdown(tweet, extracted)
  };
}
```

## Quality Indicators

### High Quality Signals

- IMO number provided and verified
- Current and historical vessel names
- Sanctions status with designation details
- Ownership and corporate structure analysis
- Flag history documented
- Location and activity evidence
- Cross-referenced with multiple databases
- Photo or AIS evidence included
- Methodology explained
- Historical context provided

### Low Quality Signals

- Uncertain identification
- Missing key identifiers (IMO)
- Vague ownership information
- Unverified sanctions claims
- Lack of supporting evidence

### Red Flags (Skip/Low Priority)

- Historical trivia without current relevance
- General shipping news
- Speculation without evidence
- Routine commercial vessels without strategic value

## Known Issues

### Issue 1: Name Changes
**Problem**: Vessels frequently renamed to evade detection  
**Workaround**: Focus on IMO number (permanent identifier), track name history  
**Status**: Core expertise of source

### Issue 2: Corporate Complexity
**Problem**: Shell companies and flag of convenience complicate ownership  
**Workaround**: Source specializes in unraveling these structures  
**Status**: High value-add

### Issue 3: AIS Spoofing
**Problem**: Vessels may transmit false AIS data  
**Workaround**: Source cross-references multiple data points and uses photo evidence  
**Status**: Detection capability present

## Examples

### Example 1: Sanctions Evasion Identification - High Priority

**Raw Tweet:**
```
THREAD: Identified the tanker conducting STS transfer in Arabian Sea as 
OCEAN GLORY (IMO 9123456), previously STAR OF PERSIA. Registered Panama 
but beneficial owner traced to Iranian shipping company through 3 shell 
companies in UAE/Malaysia. OFAC should have sanctioned but slipped through. 
Transferring Iranian crude to Vietnam-flagged recipient. 1/3
```

**Extracted World Event:**
```yaml
title: "Iranian tanker OCEAN GLORY conducting sanctions evasion STS transfer"
date: 2026-04-30T14:30:00Z
type: sanctions-evasion-vessel-identified
vessel:
  current_name: "OCEAN GLORY"
  previous_name: "STAR OF PERSIA"
  imo: "9123456"
  type: "tanker"
  registered_flag: "Panama"
  beneficial_owner: "Iranian shipping company"
  ownership_structure:
    - "3 shell companies"
    - "UAE and Malaysia"
location:
  area: "Arabian Sea"
activity:
  type: "ship-to-ship transfer"
  cargo: "Iranian crude oil"
  recipient: "Vietnam-flagged vessel"
sanctions_status: "Should be sanctioned, not yet designated"
priority: high
confidence: high
tags:
  - iran
  - sanctions-evasion
  - sts-transfer
  - shell-company
  - crude-oil
  - arabian-sea
  - vessel-identification
```

### Example 2: Fleet Analysis - High Priority

**Raw Tweet:**
```
Update on Russian shadow tanker fleet: Now tracking 47 vessels carrying 
Russian crude/products. Average age 17 years. 23 flagged Gabon, 12 Cameroon, 
8 Palau, 4 St Kitts. Most insured by Russian companies or uninsured. 
Collectively moving ~1.8M bpd. Fleet expanding monthly. Spreadsheet attached.
```

**Extracted World Event:**
```yaml
title: "Russian shadow tanker fleet analysis: 47 vessels moving 1.8M bpd"
date: 2026-04-30T16:00:00Z
type: fleet-analysis
fleet:
  description: "Russian shadow tanker fleet"
  vessel_count: 47
  cargo: "Russian crude oil and products"
  volume: "1.8 million barrels per day"
  average_age: "17 years"
  flag_distribution:
    Gabon: 23
    Cameroon: 12
    Palau: 8
    St_Kitts: 4
  insurance: "Russian companies or uninsured"
  trend: "expanding monthly"
context: "Sanctions circumvention infrastructure"
evidence: "detailed spreadsheet attached"
priority: high
confidence: high
tags:
  - russia
  - sanctions
  - shadow-fleet
  - crude-oil
  - flag-of-convenience
  - fleet-analysis
```

## Validation Checklist

Before marking source as active:

- [x] Twitter handle verified (@TheRealShipDude)
- [x] Content focus confirmed (ship identification and maritime OSINT)
- [x] Strategic relevance established (sanctions monitoring, vessel intelligence)
- [x] Collection method appropriate (timeline with replies for analysis threads)
- [x] Filters configured (vessel intelligence focus)
- [x] Keywords defined for maritime OSINT
- [x] Entity extraction patterns defined
- [x] Quality indicators specific and measurable
- [x] Examples comprehensive and realistic
- [ ] Account verification (confirm active and posting)
- [ ] Authentication configured (Twitter API access)
- [ ] Integration tested with collection system

## Monitoring & Maintenance

### Daily Checks
- API connectivity and analysis collection
- Sanctions-relevant identification tracking
- Vessel database updates

### Weekly Tasks
- Review vessel identification accuracy
- Update sanctions designation tracking
- Verify IMO number databases
- Cross-reference with official sanctions lists

### Monthly Tasks
- Audit identification methodology
- Review reliability score (consistently high)
- Update fleet composition tracking
- Assess emerging maritime evasion tactics
- Track shadow fleet expansion

## Related Sources

Complementary sources for maritime intelligence:

- **@pizzainwatch**: AIS vessel tracking
- **@TankerTrackers**: Iran/Venezuela oil tracking
- **@Fleetnumbers**: Naval vessel tracking
- **@WarshipCam**: Naval photography
- **@gCaptain**: Maritime news
- **@tradewindsnews**: Shipping intelligence
- **OFAC**: Sanctions designations
- **Lloyd's List Intelligence**: Vessel databases
