---
id: twitter-oilcfd
name: OilCfd - Oil Shipping and Commodities Intelligence
type: twitter
status: testing
description: |
  Oil shipping and commodities analyst tracking crude oil tanker movements, petroleum
  product flows, energy sanctions enforcement, and oil market dynamics. Specialized focus
  on Iranian, Russian, and Venezuelan oil exports, sanctions circumvention, and strategic
  energy shipping intelligence. Combines vessel tracking with market analysis and
  geopolitical context.
created_date: "2026-04-30"
last_updated: "2026-04-30"
tags:
  - oil-shipping
  - tanker-tracking
  - sanctions
  - commodities
  - energy
  - iran
  - russia
  - venezuela
  - osint
reliability: medium
confidence_score: 75
update_frequency: "3h"
priority: high
language:
  - en
geographic_focus:
  - global
  - oil-markets
cost: free
requires_auth: true
maintainer: osint-team
alert_keywords:
  - oil
  - crude
  - tanker
  - sanctions
  - iran
  - russia
  - venezuela
  - vessel
  - exports
  - tracking
---

# OilCfd - Oil Shipping and Commodities Intelligence

## Overview

OilCfd (@OilCfd) is a specialized analyst focusing on oil shipping, tanker tracking, and energy commodities with emphasis on sanctions and strategic oil flows. The account provides:

- Crude oil tanker tracking and flows
- Iranian oil exports and sanctions evasion
- Russian oil shipment monitoring
- Venezuelan oil trade tracking
- Petroleum product movements
- Ship-to-ship oil transfers
- Dark fleet tanker identification
- Oil market price impacts
- Strategic petroleum reserve movements
- OPEC+ compliance monitoring
- Energy sanctions enforcement
- Refinery intake tracking
- Oil storage and floating storage
- Charter rates and tanker economics

**Account Characteristics:**
- Specialized oil shipping expertise
- Sanctions focus on Iran, Russia, Venezuela
- AIS data analysis for oil tankers
- Market context and price implications
- Geopolitical energy analysis
- Regular tracking updates

**Intelligence Value:**
- Energy sanctions effectiveness assessment
- Strategic oil flow monitoring
- Sanctions circumvention detection
- Shadow fleet tanker identification
- Oil supply chain disruption indicators
- Energy security intelligence
- Geopolitical leverage assessment
- Market manipulation detection
- Storage capacity utilization
- Refinery source tracking

## Data Collection Criteria

### Twitter Account Details

- **Handle**: OilCfd
- **Account Type**: Individual commodities and shipping analyst
- **Geographic Focus**: Global oil markets and shipping
- **Strategic Significance**: Energy sanctions, oil flow intelligence
- **Content Type**: Tanker tracking, oil flow analysis, market commentary
- **Tweet Frequency**: Several times daily
- **Language**: English

### Collection Method

- **Method**: timeline
- **Poll Interval**: Every 3 hours
- **Include Retweets**: Yes (oil market and tanker tracking sources)
- **Include Replies**: Yes (analytical discussions)
- **Include Quotes**: Yes
- **Thread Handling**: Collect full threads for oil flow analysis

### Content Filters

#### Include Criteria

- Iranian, Russian, Venezuelan oil shipments
- Tanker tracking with sanctions relevance
- Ship-to-ship oil transfers
- Dark fleet tanker activity
- Strategic petroleum flows
- Sanctions enforcement impacts
- Unusual tanker movements or patterns
- Oil storage and floating storage
- Major oil export route changes
- Refinery sourcing intelligence

#### Exclude Criteria

- General oil price commentary without shipping context
- Pure financial market analysis
- Historical oil market content
- Non-sanctions related routine shipping
- Personal non-analytical content

### Keyword Monitoring

**High-Priority Keywords:**
- oil, crude, petroleum, products
- tanker, VLCC, Suezmax, Aframax
- Iran, Russia, Venezuela, sanctions
- exports, shipments, flows, barrels
- ship-to-ship, STS, transfer, dark fleet
- tracking, vessel, spotted, identified
- Kharg, Bandar Abbas, Novorossiysk
- India, China, Asia, Europe

**Activity Keywords:**
- loading, loaded, lifted
- discharged, unloaded, delivered
- sailing, heading, destination
- anchored, floating storage
- transferred, STS, renamed
- sanctioned, designated, blacklisted

**Location Keywords:**
- Persian Gulf, Strait of Hormuz
- Kharg Island, Bandar Abbas
- Novorossiysk, Primorsk, Kozmino
- Venezuela, Jose, Amuay
- Fujairah, Singapore, Rotterdam
- Jamnagar, Shandong, Ningbo

## Expected Data Format

### Raw Tweet Object

```json
{
  "id": "1234567890",
  "text": "Update: 3 VLCCs loaded at Kharg Island, Iran this week. Total ~6M barrels Iranian crude. Vessels showing false AIS destinations 'Fujairah' but likely heading to Shandong, China for discharge. All 3 renamed in past 6 months, part of shadow fleet. IMOs: 9123456, 9234567, 9345678",
  "created_at": "2026-04-30T13:45:00Z",
  "author": {
    "username": "OilCfd",
    "name": "OilCfd"
  },
  "metrics": {
    "retweet_count": 89,
    "like_count": 234,
    "reply_count": 23
  }
}
```

### Structured Data Extraction

```yaml
event_type: oil-shipment-tracking
vessels:
  count: 3
  type: "VLCC (Very Large Crude Carrier)"
  imo_numbers:
    - "9123456"
    - "9234567"
    - "9345678"
  status: "shadow fleet, renamed in past 6 months"
cargo:
  type: "Iranian crude oil"
  volume: "~6 million barrels total"
location:
  loading_port: "Kharg Island, Iran"
  ais_destination: "Fujairah (false)"
  likely_destination: "Shandong, China"
timeframe: "this week"
activity: "loaded and departing"
context: "sanctions evasion using false destinations"
priority: high
tags:
  - iran
  - crude-oil
  - sanctions
  - vlcc
  - china
  - kharg-island
  - shadow-fleet
  - ais-spoofing
```

## Processing Instructions

### Data Extraction

1. **Fetch Timeline**
   - Use Twitter API v2 to fetch recent tweets
   - Filter for oil shipment and tanker tracking content
   - Prioritize sanctions-relevant intelligence

2. **Content Classification**
   - Identify tanker types and cargoes
   - Extract volume and flow data
   - Determine sanctions relevance
   - Assess strategic significance

3. **Entity Extraction**
   - Vessel identifiers (IMO, names)
   - Oil volumes and types
   - Loading and discharge ports
   - Countries (exporters, importers)
   - Sanctions status
   - Market price impacts
   - Timeline information
   - Shadow fleet indicators

4. **Significance Assessment**
   - High: Iranian/Russian/Venezuelan oil flows, major sanctions evasion
   - Medium: Shadow fleet activity, unusual patterns, storage changes
   - Low: Routine oil flows, general market commentary

### Transformation to World Event Entity

```javascript
function transformToWorldEvent(tweet, extracted) {
  const eventType = classifyOilShipping(tweet.text);
  
  return {
    title: buildEventTitle(extracted),
    date: tweet.created_at,
    type: eventType,
    location: {
      loading: extracted.loading_port,
      discharge: extracted.discharge_port,
      route: extracted.route
    },
    priority: calculatePriority(eventType, extracted),
    confidence: 'medium',
    tags: generateTags(extracted),
    source: {
      type: 'twitter',
      handle: 'OilCfd',
      tweet_id: tweet.id,
      url: `https://twitter.com/OilCfd/status/${tweet.id}`
    },
    entities: extracted.entities,
    contents: generateMarkdown(tweet, extracted)
  };
}
```

## Quality Indicators

### High Quality Signals

- Specific vessel IMO numbers
- Oil volume quantification (barrels)
- Loading and discharge port identification
- Timeline specificity (dates, weeks)
- Shadow fleet identification
- Multiple vessel pattern analysis
- Historical context provided
- Market impact assessment
- Cross-referenced with AIS data

### Low Quality Signals

- Vague vessel descriptions
- Estimated volumes without data
- Speculation without evidence
- Unclear destinations
- Missing timeline information

### Red Flags (Skip/Low Priority)

- Pure price speculation without shipping data
- General market commentary
- Historical oil market analysis
- Personal opinions without tracking data

## Known Issues

### Issue 1: Analyst Interpretation
**Problem**: Individual analyst perspective, may include speculation  
**Workaround**: Tag analytical hypotheses, verify with other sources, focus on data points  
**Status**: Medium confidence rating reflects this

### Issue 2: AIS Data Limitations
**Problem**: Dark fleet vessels turn off AIS or spoof locations  
**Workaround**: Note stated vs likely destinations, track historical patterns  
**Status**: Acknowledged limitation in extraction

### Issue 3: Volume Estimates
**Problem**: Cargo volumes often estimated, not confirmed  
**Workaround**: Tag estimates as approximate, note confidence level  
**Status**: Extract with uncertainty markers

## Examples

### Example 1: Iranian Oil Export Tracking - High Priority

**Raw Tweet:**
```
THREAD: Iranian oil exports hit 1.8M bpd in April, highest since 2018. 
90% going to China via shadow fleet of 45+ tankers. Majority loaded at 
Kharg Island, using STS transfers in Malacca Strait to Chinese-flagged 
receivers. US sanctions enforcement clearly failing. Detailed breakdown: 1/4
```

**Extracted World Event:**
```yaml
title: "Iranian oil exports reach 1.8M bpd in April via shadow fleet to China"
date: 2026-04-30T10:00:00Z
type: oil-flow-analysis-sanctions
export_data:
  country: "Iran"
  volume: "1.8 million barrels per day"
  timeframe: "April 2026"
  historical_context: "highest since 2018"
destination:
  primary: "China"
  percentage: "90%"
method:
  fleet: "shadow fleet, 45+ tankers"
  loading: "Kharg Island"
  transfer: "STS transfers in Malacca Strait"
  receivers: "Chinese-flagged vessels"
assessment:
  sanctions_effectiveness: "US sanctions enforcement failing"
  significance: "major sanctions circumvention"
priority: high
confidence: medium
tags:
  - iran
  - crude-oil
  - sanctions
  - china
  - shadow-fleet
  - sts-transfer
  - kharg-island
```

### Example 2: Russian Oil Shipment - High Priority

**Raw Tweet:**
```
3 Aframax tankers loading Russian Urals crude at Novorossiysk. Combined 
~2M barrels. Destination India. Charter rates paid above market, suggesting 
sanctions premium. Vessels: OCEAN STAR (IMO 9876543), SEA FORTUNE 
(9765432), EAGLE RIVER (9654321). All recently renamed, Panama flags.
```

**Extracted World Event:**
```yaml
title: "3 Aframax tankers loading Russian Urals crude for India at premium rates"
date: 2026-04-30T14:20:00Z
type: oil-shipment-tracking-sanctions
vessels:
  count: 3
  type: "Aframax tankers"
  names:
    - name: "OCEAN STAR"
      imo: "9876543"
    - name: "SEA FORTUNE"
      imo: "9765432"
    - name: "EAGLE RIVER"
      imo: "9654321"
  flags: "Panama"
  status: "all recently renamed"
cargo:
  type: "Russian Urals crude oil"
  volume: "~2 million barrels combined"
location:
  loading: "Novorossiysk, Russia"
  destination: "India"
charter:
  rates: "above market"
  indication: "sanctions premium"
context: "Russian oil sanctions circumvention"
priority: high
confidence: medium
tags:
  - russia
  - crude-oil
  - sanctions
  - india
  - aframax
  - novorossiysk
  - charter-rates
```

## Validation Checklist

Before marking source as active:

- [x] Twitter handle verified (@OilCfd)
- [x] Content focus confirmed (oil shipping and commodities)
- [x] Strategic relevance established (energy sanctions intelligence)
- [x] Collection method appropriate (timeline with replies)
- [x] Filters configured (sanctions-relevant oil flows)
- [x] Keywords defined for oil shipping intelligence
- [x] Entity extraction patterns defined
- [x] Quality indicators specific and measurable
- [x] Examples comprehensive and realistic
- [ ] Account verification (confirm active and posting)
- [ ] Authentication configured (Twitter API access)
- [ ] Integration tested with collection system

## Monitoring & Maintenance

### Daily Checks
- API connectivity and tracking updates
- Iranian/Russian oil flow monitoring
- Shadow fleet activity tracking

### Weekly Tasks
- Review oil flow volume estimates accuracy
- Update shadow fleet tanker database
- Verify sanctions circumvention patterns
- Cross-reference with official export data

### Monthly Tasks
- Audit analytical accuracy vs confirmed data
- Review reliability score adjustments
- Update oil route and destination patterns
- Assess sanctions effectiveness trends
- Track shadow fleet expansion

## Related Sources

Complementary sources for oil shipping intelligence:

- **@TankerTrackers**: Specialized Iran/Venezuela tracking
- **@TheRealShipDude**: Vessel identification
- **@pizzainwatch**: AIS vessel tracking
- **@tradewindsnews**: Shipping industry intelligence
- **@gCaptain**: Maritime news
- **Kpler**: Oil flow data platform
- **Vortexa**: Vessel tracking analytics
- **IEA**: Official oil market data
