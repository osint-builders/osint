---
id: twitter-mdat-gog
name: MDAT GoG - Maritime Domain Awareness Gulf of Guinea
type: twitter
status: testing
description: |
  Official Maritime Domain Awareness for Trade (MDAT) Gulf of Guinea account providing
  real-time maritime security alerts, piracy incidents, and threat assessments for the
  Gulf of Guinea region. Critical source for West African maritime security intelligence,
  including kidnappings, armed robberies, suspicious approaches, and vessel attacks.
  Authoritative source with direct industry and military coordination.
created_date: "2026-04-30"
last_updated: "2026-04-30"
tags:
  - maritime-security
  - piracy
  - gulf-of-guinea
  - west-africa
  - shipping
  - security-alerts
  - kidnapping
  - armed-robbery
  - osint
reliability: high
confidence_score: 90
update_frequency: "1h"
priority: high
language:
  - en
geographic_focus:
  - gulf-of-guinea
  - west-africa
  - nigeria
  - cameroon
  - benin
  - togo
  - ghana
cost: free
requires_auth: true
maintainer: osint-team
alert_keywords:
  - piracy
  - kidnapping
  - attack
  - robbery
  - suspicious
  - vessel
  - incident
  - security
  - threat
  - armed
---

# MDAT GoG - Maritime Domain Awareness Gulf of Guinea

## Overview

MDAT GoG (@MDAT_GoG) is the official Maritime Domain Awareness for Trade Gulf of Guinea coordination center. It provides authoritative maritime security intelligence for one of the world's most dangerous maritime regions. The account delivers:

- Real-time piracy and maritime crime alerts
- Kidnapping for ransom incidents
- Armed robbery at sea and in anchorages
- Suspicious vessel approaches and activity
- Vessel hijacking attempts
- Security threat assessments
- Safe passage recommendations
- Incident location coordinates and details
- Vessel attack methodologies
- Regional maritime security trends
- Coordination with naval forces and industry

**Account Characteristics:**
- Official maritime security coordination center
- Real-time incident reporting with precise details
- Authoritative source recognized by shipping industry
- Direct coordination with navies and coast guards
- Rapid dissemination of security threats
- Professional, concise reporting format

**Intelligence Value:**
- Authoritative maritime security intelligence
- Real-time threat awareness for commercial shipping
- Pattern analysis of piracy and criminal activity
- Risk assessment for specific maritime zones
- Evidence of state capacity and security presence
- Economic impact intelligence (insurance, routing)
- Geopolitical insight into regional stability

## Data Collection Criteria

### Twitter Account Details

- **Handle**: MDAT_GoG
- **Account Type**: Official maritime security coordination center
- **Geographic Focus**: Gulf of Guinea (West Africa)
- **Strategic Significance**: Global maritime security, energy shipping routes
- **Content Type**: Security alerts, incident reports, threat assessments
- **Tweet Frequency**: Multiple times daily during incidents
- **Language**: English

### Collection Method

- **Method**: timeline
- **Poll Interval**: Every 60 minutes (1 hour)
- **Include Retweets**: Yes (official coordination with other agencies)
- **Include Replies**: No (focus on primary alerts)
- **Include Quotes**: Yes
- **Thread Handling**: Collect full threads for developing incidents

### Content Filters

#### Include Criteria

- Piracy incidents and alerts
- Kidnapping for ransom reports
- Armed robbery at sea
- Suspicious vessel approaches
- Vessel attacks and hijacking attempts
- Security threat assessments
- Incident location coordinates
- Casualty and crew status reports
- Security zone warnings
- Naval response coordination

#### Exclude Criteria

- General maritime news unrelated to security
- Administrative announcements
- Historical retrospectives
- Non-security maritime activity

### Keyword Monitoring

**High-Priority Keywords:**
- piracy, pirates, attack
- kidnapping, kidnapped, abducted
- armed robbery, armed attack
- suspicious approach, suspicious activity
- hijack, hijacking, seized
- crew, crew members, kidnapped crew
- vessel, tanker, cargo ship
- incident, security incident
- threat, security threat
- gunfire, weapons, armed men

**Activity Keywords:**
- boarded, approached, fired upon
- attacked, attempted, evaded
- kidnapped, seized, detained
- escaped, released, rescued
- anchored, underway, drifting

**Location Keywords:**
- Gulf of Guinea, GoG
- Nigeria, Lagos, Bonny
- Cameroon, Douala, Limbe
- Benin, Cotonou
- Togo, Lome
- Ghana, Tema, Takoradi
- offshore, anchorage, territorial waters
- nautical miles, coordinates

## Expected Data Format

### Raw Tweet Object

```json
{
  "id": "1234567890",
  "text": "INCIDENT REPORT: Armed attack on product tanker 35nm SW of Bonny Island, Nigeria at 0430UTC. 6 armed persons in speedboat fired upon vessel. Crew mustered in citadel, vessel increased speed and evaded. No casualties. Position: 04°10'N 007°05'E. All vessels advised exercise caution.",
  "created_at": "2026-04-30T05:15:00Z",
  "author": {
    "username": "MDAT_GoG",
    "name": "MDAT GoG"
  },
  "metrics": {
    "retweet_count": 189,
    "like_count": 234,
    "reply_count": 23
  }
}
```

### Structured Data Extraction

```yaml
event_type: maritime-security-incident
incident_type: armed-attack
vessel:
  type: "product tanker"
location:
  coordinates:
    lat: 4.167
    lon: 7.083
  description: "35nm SW of Bonny Island"
  country: "Nigeria"
  area: "Gulf of Guinea"
time: "2026-04-30T04:30:00Z"
attackers:
  count: 6
  method: "speedboat"
  weapons: "armed, gunfire"
vessel_response:
  action: "crew mustered in citadel, increased speed"
  outcome: "evaded attack"
casualties: "none"
status: "vessel safe"
priority: high
tags:
  - piracy
  - armed-attack
  - nigeria
  - bonny-island
  - gulf-of-guinea
  - tanker
```

## Processing Instructions

### Data Extraction

1. **Fetch Timeline**
   - Use Twitter API v2 to fetch recent tweets
   - Filter for incident reports and security alerts
   - Prioritize reports with location coordinates

2. **Content Classification**
   - Identify incident type (piracy, kidnapping, robbery, suspicious activity)
   - Extract vessel details and type
   - Determine attack methodology
   - Assess outcome and casualties

3. **Entity Extraction**
   - Vessel types and names (when available)
   - Precise location coordinates
   - Number of attackers and weapons used
   - Crew status and casualties
   - Time and date of incident
   - Countries and territorial waters
   - Response actions taken

4. **Significance Assessment**
   - High: Kidnappings, successful attacks, casualties, hijackings
   - Medium: Armed attacks evaded, suspicious approaches
   - Low: General security advisories, historical context

### Transformation to World Event Entity

```javascript
function transformToWorldEvent(tweet, extracted) {
  const eventType = classifySecurityIncident(tweet.text);
  
  return {
    title: buildEventTitle(extracted),
    date: tweet.created_at,
    type: eventType,
    location: {
      coordinates: extracted.coordinates,
      area: extracted.area,
      country: extracted.country,
      region: "Gulf of Guinea"
    },
    priority: calculatePriority(eventType, extracted),
    confidence: 'high',
    tags: generateTags(extracted),
    source: {
      type: 'twitter',
      handle: 'MDAT_GoG',
      tweet_id: tweet.id,
      url: `https://twitter.com/MDAT_GoG/status/${tweet.id}`
    },
    entities: extracted.entities,
    contents: generateMarkdown(tweet, extracted)
  };
}
```

## Quality Indicators

### High Quality Signals

- Precise GPS coordinates provided
- Specific time and date (UTC)
- Vessel type and description
- Number of attackers and methodology
- Crew status and casualty information
- Distance and bearing from landmarks
- Outcome and vessel status
- Official incident report format
- Coordination with authorities mentioned

### Low Quality Signals

- Vague location descriptions
- Unconfirmed reports
- Lack of timing information
- Unclear incident outcome

### Red Flags (Skip/Low Priority)

- Historical content or retrospectives
- General advisory without specific incident
- Non-security maritime news
- Administrative announcements

## Known Issues

### Issue 1: Incident Classification
**Problem**: Some incidents blend multiple categories (armed robbery + kidnapping attempt)  
**Workaround**: Tag with all relevant incident types, prioritize by severity  
**Status**: Multi-tag classification implemented

### Issue 2: Vessel Identification
**Problem**: Vessel names often withheld for security/privacy  
**Workaround**: Focus on vessel type and incident details, cross-reference with AIS data  
**Status**: Monitoring

### Issue 3: Follow-up Information
**Problem**: Updates on kidnapping resolutions may be delayed or incomplete  
**Workaround**: Link related incidents by location and vessel, track over time  
**Status**: Incident tracking system needed

## Examples

### Example 1: Kidnapping Incident - High Priority

**Raw Tweet:**
```
CRITICAL: Kidnapping incident 60nm S of Bayelsa coast, Nigeria. 
Container vessel boarded by 8 armed pirates at 0200UTC. 4 crew members 
kidnapped and taken ashore. Vessel proceeding to safe port with 
remaining crew. Position: 03°45'N 005°30'E. Authorities notified.
#MaritimeSecurity
```

**Extracted World Event:**
```yaml
title: "4 crew members kidnapped from container vessel off Nigeria"
date: 2026-04-30T02:00:00Z
type: maritime-kidnapping
incident_type: "kidnapping-for-ransom"
vessel:
  type: "container vessel"
location:
  coordinates:
    lat: 3.75
    lon: 5.50
  description: "60nm S of Bayelsa coast"
  country: "Nigeria"
  area: "Gulf of Guinea"
attackers:
  count: 8
  status: "armed pirates"
  action: "boarded vessel, kidnapped crew"
victims:
  count: 4
  status: "kidnapped, taken ashore"
vessel_status: "proceeding to safe port"
authorities: "notified"
priority: high
confidence: high
tags:
  - kidnapping
  - piracy
  - nigeria
  - bayelsa
  - crew-kidnapping
  - gulf-of-guinea
  - container-vessel
```

### Example 2: Armed Robbery - Medium Priority

**Raw Tweet:**
```
Suspicious approach reported: Bulk carrier at anchor Lome Roads, Togo. 
2 small boats with 4 persons approached vessel at 2345UTC. Crew raised 
alarm, activated deck lights. Boats departed immediately. No boarding, 
no casualties. Position: 06°08'N 001°16'E. Vigilance advised.
```

**Extracted World Event:**
```yaml
title: "Suspicious approach on anchored bulk carrier in Lome, Togo"
date: 2026-04-30T23:45:00Z
type: maritime-suspicious-activity
incident_type: "suspicious-approach"
vessel:
  type: "bulk carrier"
  status: "at anchor"
location:
  coordinates:
    lat: 6.133
    lon: 1.267
  description: "Lome Roads anchorage"
  country: "Togo"
  area: "Gulf of Guinea"
attackers:
  count: 4
  method: "2 small boats"
  action: "approached vessel"
vessel_response:
  action: "crew raised alarm, activated deck lights"
  outcome: "boats departed, no boarding"
casualties: "none"
priority: medium
confidence: high
tags:
  - suspicious-activity
  - togo
  - lome
  - anchorage
  - bulk-carrier
  - gulf-of-guinea
```

## Validation Checklist

Before marking source as active:

- [x] Twitter handle verified (@MDAT_GoG)
- [x] Content focus confirmed (Gulf of Guinea maritime security)
- [x] Strategic relevance established (piracy, kidnapping intelligence)
- [x] Collection method appropriate (timeline, hourly polling)
- [x] Filters configured (security incident focus)
- [x] Keywords defined for maritime security
- [x] Entity extraction patterns defined
- [x] Quality indicators specific and measurable
- [x] Examples comprehensive and realistic
- [ ] Account verification (confirm active and posting)
- [ ] Authentication configured (Twitter API access)
- [ ] Integration tested with collection system

## Monitoring & Maintenance

### Daily Checks
- API connectivity and alert collection
- No missed critical security incidents
- Incident classification accuracy

### Weekly Tasks
- Review kidnapping incidents for resolution updates
- Update location reference points
- Verify coordinate extraction accuracy

### Monthly Tasks
- Audit incident pattern analysis
- Review reliability score (consistently high)
- Update regional security assessment
- Track incident frequency trends

## Related Sources

Complementary sources for maritime security intelligence:

- **@ICC_IMB**: International Maritime Bureau piracy reporting
- **@pizzainwatch**: Vessel tracking and AIS intelligence
- **@gCaptain**: Maritime incident news
- **@seawatch_intl**: Search and rescue operations
- **@WarshipCam**: Naval presence monitoring
- **UKMTO**: UK Maritime Trade Operations
- **Regional navies**: Nigerian, French, US naval forces
