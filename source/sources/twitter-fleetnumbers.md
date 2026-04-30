---
id: twitter-fleetnumbers
name: Fleetnumbers - Naval Fleet Tracking & Ship Pennant Numbers
type: twitter
status: testing
description: |
  Specialized naval fleet tracking account monitoring warship movements, fleet compositions,
  commissioning/decommissioning events, and pennant number assignments globally. Provides
  detailed tracking of naval vessel deployments, port calls, exercises, and fleet readiness.
  Valuable for understanding naval force posture and maritime military activities worldwide.
created_date: "2026-04-30"
last_updated: "2026-04-30"
tags:
  - naval
  - fleet-tracking
  - warships
  - military
  - deployments
  - osint
  - pennant-numbers
  - naval-movements
reliability: high
confidence_score: 85
update_frequency: "2h"
priority: high
language:
  - en
geographic_focus:
  - global
  - naval-worldwide
cost: free
requires_auth: true
maintainer: osint-team
alert_keywords:
  - deployment
  - carrier
  - destroyer
  - frigate
  - submarine
  - fleet
  - naval
  - commissioning
  - decommissioning
  - exercise
  - tracking
  - vessel
  - russia
  - china
  - iran
---

# Fleetnumbers - Naval Fleet Tracking & Ship Pennant Numbers

## Overview

Fleetnumbers (@Fleetnumbers) is a specialized OSINT account tracking global naval fleet movements, commissioning events, and force posture changes. The account provides:

- Real-time naval vessel tracking worldwide
- Fleet composition monitoring and changes
- Commissioning and decommissioning events
- Pennant number assignments and changes
- Deployment tracking and force rotations
- Naval exercise participation
- Port calls and naval visits
- Fleet readiness assessments
- Ship class tracking and identification
- Naval modernization programs
- Vessel transfer and sales between nations
- Strategic force posture analysis

**Account Characteristics:**
- Detailed naval vessel tracking expertise
- Global coverage of major navies
- Technical knowledge of fleet compositions
- Regular updates on vessel movements
- Focus on strategic deployments
- Photo documentation when available

**Intelligence Value:**
- Naval force posture monitoring
- Early warning of deployments and exercises
- Fleet modernization tracking
- Strategic intent assessment through deployments
- Alliance and partnership naval activities
- Regional naval balance analysis
- Sanctioned nation naval capabilities
- Naval readiness indicators

## Data Collection Criteria

### Twitter Account Details

- **Handle**: Fleetnumbers
- **Account Type**: Independent naval tracking specialist
- **Geographic Focus**: Global naval operations
- **Strategic Significance**: Naval force projection and readiness
- **Content Type**: Naval vessel tracking, fleet analysis, photos
- **Tweet Frequency**: Multiple times daily
- **Language**: English

### Collection Method

- **Method**: timeline
- **Poll Interval**: Every 2 hours
- **Include Retweets**: Yes (official navy announcements and naval analysts)
- **Include Replies**: Yes (detailed discussions in threads)
- **Include Quotes**: Yes
- **Thread Handling**: Collect full threads for deployment tracking

### Content Filters

#### Include Criteria

- Naval vessel deployments and movements
- Commissioning and decommissioning events
- Fleet composition changes
- Naval exercises and operations
- Strategic force posture changes
- Carrier strike group movements
- Submarine activity when surfaced/reported
- Naval modernization milestones
- Vessel transfers between nations
- Port calls with strategic significance
- Russian, Chinese, Iranian naval activities

#### Exclude Criteria

- Historical naval content without current relevance
- Non-naval military content
- General military news without naval specifics
- Personal opinions without tracking data

### Keyword Monitoring

**High-Priority Keywords:**
- carrier, aircraft carrier, CVN
- destroyer, cruiser, frigate
- submarine, SSBN, SSN
- deployment, deployed, deploying
- commissioning, decommissioning
- fleet, strike group, task force
- exercise, drills, operations
- tracking, spotted, identified
- Russia, China, Iran, North Korea
- sanctions, restricted, monitored

**Activity Keywords:**
- sailed, departed, arrived
- anchored, moored, docked
- transited, passed, crossing
- port call, visit, stop
- underway, at sea, operating
- commissioned, decommissioned, retired

**Location Keywords:**
- South China Sea, Taiwan Strait
- Persian Gulf, Strait of Hormuz
- Mediterranean, Black Sea
- Baltic Sea, North Sea
- Indo-Pacific, Pacific Fleet
- Atlantic, Arctic
- naval base, port, harbor

## Expected Data Format

### Raw Tweet Object

```json
{
  "id": "1234567890",
  "text": "Russian destroyer Admiral Gorshkov (pennant 454) departed Severomorsk heading south through Norwegian Sea. Armed with Zircon hypersonic missiles. Likely deploying to Mediterranean. NATO maritime patrol aircraft tracking. #NavalTracking",
  "created_at": "2026-04-30T09:30:00Z",
  "author": {
    "username": "Fleetnumbers",
    "name": "Fleetnumbers"
  },
  "metrics": {
    "retweet_count": 456,
    "like_count": 1203,
    "reply_count": 89
  }
}
```

### Structured Data Extraction

```yaml
event_type: naval-deployment
vessel:
  name: "Admiral Gorshkov"
  pennant: "454"
  type: "destroyer"
  class: "Admiral Gorshkov-class"
  navy: "Russian Navy"
  armament: "Zircon hypersonic missiles"
location:
  departure: "Severomorsk"
  current: "Norwegian Sea"
  heading: "south"
  destination: "Mediterranean (likely)"
activity: "deployment"
monitoring: "NATO maritime patrol aircraft tracking"
priority: high
tags:
  - russia
  - destroyer
  - deployment
  - hypersonic-missiles
  - norwegian-sea
  - mediterranean
  - naval-tracking
```

## Processing Instructions

### Data Extraction

1. **Fetch Timeline**
   - Use Twitter API v2 to fetch recent tweets and threads
   - Filter for naval vessel tracking content
   - Prioritize strategic deployment information

2. **Content Classification**
   - Identify vessel type and class
   - Extract pennant numbers and identifiers
   - Determine activity type (deployment, exercise, commissioning)
   - Assess strategic significance

3. **Entity Extraction**
   - Vessel names and pennant numbers
   - Naval organizations and fleets
   - Locations and routes
   - Armament and capabilities
   - Countries and navies
   - Exercise names and participants
   - Timeline information

4. **Significance Assessment**
   - High: Strategic deployments, carrier movements, Russian/Chinese/Iranian naval activity
   - Medium: Routine exercises, port calls, allied naval movements
   - Low: Administrative fleet changes, historical updates

### Transformation to World Event Entity

```javascript
function transformToWorldEvent(tweet, extracted) {
  const eventType = classifyNavalEvent(tweet.text);
  
  return {
    title: buildEventTitle(extracted),
    date: tweet.created_at,
    type: eventType,
    location: {
      current: extracted.location,
      destination: extracted.destination,
      region: extracted.region
    },
    priority: calculatePriority(eventType, extracted),
    confidence: 'high',
    tags: generateTags(extracted),
    source: {
      type: 'twitter',
      handle: 'Fleetnumbers',
      tweet_id: tweet.id,
      url: `https://twitter.com/Fleetnumbers/status/${tweet.id}`
    },
    entities: extracted.entities,
    contents: generateMarkdown(tweet, extracted)
  };
}
```

## Quality Indicators

### High Quality Signals

- Specific vessel names and pennant numbers
- Precise location information
- Deployment routes and destinations
- Vessel capabilities and armament details
- Strategic context provided
- Photos or tracking evidence
- Multiple source corroboration
- Historical deployment patterns referenced

### Low Quality Signals

- Vague vessel descriptions
- Unconfirmed sightings
- Lack of strategic context
- Speculation without evidence

### Red Flags (Skip/Low Priority)

- Historical content without current relevance
- Non-naval military topics
- Speculation without data
- Administrative announcements

## Known Issues

### Issue 1: Submarine Tracking Limitations
**Problem**: Submarine activity rarely observable or reportable  
**Workaround**: Focus on surfaced submarines and official announcements  
**Status**: Limited submarine coverage expected

### Issue 2: Classification Sensitivities
**Problem**: Some naval movements may be classified or sensitive  
**Workaround**: Report only publicly observable or officially announced movements  
**Status**: OSINT boundaries respected

### Issue 3: Vessel Identification
**Problem**: Similar vessel classes can be difficult to distinguish  
**Workaround**: Use pennant numbers and multiple identifying features  
**Status**: Cross-reference with naval databases

## Examples

### Example 1: Carrier Strike Group Deployment - High Priority

**Raw Tweet:**
```
USS Ronald Reagan (CVN-76) Carrier Strike Group departed Yokosuka 
heading toward South China Sea. Strike group includes destroyers USS 
Shiloh (CG-67), USS Fitzgerald (DDG-62), USS McCampbell (DDG-85). 
Routine patrol amid heightened tensions. 7th Fleet operations.
#USNavy #IndoPacific
```

**Extracted World Event:**
```yaml
title: "USS Ronald Reagan Strike Group deploys to South China Sea"
date: 2026-04-30T06:45:00Z
type: naval-carrier-deployment
vessels:
  carrier:
    name: "USS Ronald Reagan"
    pennant: "CVN-76"
    type: "aircraft carrier"
  escort:
    - name: "USS Shiloh"
      pennant: "CG-67"
      type: "cruiser"
    - name: "USS Fitzgerald"
      pennant: "DDG-62"
      type: "destroyer"
    - name: "USS McCampbell"
      pennant: "DDG-85"
      type: "destroyer"
location:
  departure: "Yokosuka"
  destination: "South China Sea"
  fleet: "7th Fleet"
operation_type: "routine patrol"
context: "Heightened regional tensions"
priority: high
confidence: high
tags:
  - us-navy
  - carrier-strike-group
  - south-china-sea
  - cvn-76
  - 7th-fleet
  - deployment
  - indo-pacific
```

### Example 2: Naval Commissioning - Medium Priority

**Raw Tweet:**
```
China's third Type 055 cruiser Dalian (pennant 105) officially 
commissioned into PLAN North Sea Fleet. 13,000-ton vessel with 112 VLS 
cells, most capable Chinese surface combatant. Brings total Type 055s 
in service to 3, with 5 more under construction. #PLAN #China
```

**Extracted World Event:**
```yaml
title: "Chinese Type 055 cruiser Dalian commissioned to PLAN"
date: 2026-04-30T12:20:00Z
type: naval-commissioning
vessel:
  name: "Dalian"
  pennant: "105"
  type: "cruiser"
  class: "Type 055"
  displacement: "13,000 tons"
  armament: "112 VLS cells"
  navy: "PLAN (People's Liberation Army Navy)"
  fleet: "North Sea Fleet"
fleet_context:
  type_055_in_service: 3
  type_055_under_construction: 5
  total_planned: 8
significance: "Most capable Chinese surface combatant"
priority: high
confidence: high
tags:
  - china
  - plan
  - cruiser
  - commissioning
  - type-055
  - fleet-expansion
  - north-sea-fleet
```

## Validation Checklist

Before marking source as active:

- [x] Twitter handle verified (@Fleetnumbers)
- [x] Content focus confirmed (naval fleet tracking)
- [x] Strategic relevance established (force posture monitoring)
- [x] Collection method appropriate (timeline with replies)
- [x] Filters configured (naval vessel focus)
- [x] Keywords defined for naval intelligence
- [x] Entity extraction patterns defined
- [x] Quality indicators specific and measurable
- [x] Examples comprehensive and realistic
- [ ] Account verification (confirm active and posting)
- [ ] Authentication configured (Twitter API access)
- [ ] Integration tested with collection system

## Monitoring & Maintenance

### Daily Checks
- API connectivity and tracking updates
- Major deployment tracking accuracy
- No missed strategic naval movements

### Weekly Tasks
- Review naval classification accuracy
- Update pennant number databases
- Verify fleet composition tracking

### Monthly Tasks
- Audit naval event prioritization
- Review reliability score adjustments
- Update naval terminology and vessel classes
- Assess strategic deployment patterns

## Related Sources

Complementary sources for naval intelligence:

- **@USNavy**: Official US Navy announcements
- **@US7thFleet**: Indo-Pacific operations
- **@RoyalNavy**: UK naval operations
- **@WarshipCam**: Naval photography and identification
- **@pizzainwatch**: Vessel tracking with AIS
- **IISS**: Fleet analysis and assessments
- **USNI News**: Professional naval reporting
