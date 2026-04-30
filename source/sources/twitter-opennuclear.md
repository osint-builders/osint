---
id: twitter-opennuclear
name: OpenNuclear - Nuclear Facilities & Weapons Monitoring
type: twitter
status: active
description: |
  OpenNuclear provides monitoring and analysis of nuclear facilities, weapons
  programs, and nuclear-related developments using open-source intelligence.
  Focus on nuclear site activities, weapons testing, proliferation concerns,
  and nuclear safety incidents using satellite imagery and public data.
created_date: "2026-04-30"
last_updated: "2026-04-30"
tags:
  - osint
  - nuclear
  - proliferation
  - weapons
  - satellite-imagery
  - nuclear-facilities
  - arms-control
  - wmd
reliability: medium
confidence_score: 75
update_frequency: "30m"
priority: high
language:
  - en
geographic_focus:
  - global
cost: free
requires_auth: true
maintainer: osint-team
alert_keywords:
  - nuclear
  - enrichment
  - plutonium
  - uranium
  - reactor
  - missile
  - test
  - proliferation
---

# OpenNuclear - Nuclear Facilities & Weapons Monitoring

## Overview

OpenNuclear (@OpenNuclear) specializes in monitoring nuclear facilities and weapons programs using open-source intelligence methods. Coverage includes:

- Nuclear facility monitoring via satellite imagery
- Nuclear weapons program developments
- Enrichment and reprocessing activities
- Nuclear testing (atmospheric, underground)
- Reactor operations and construction
- Nuclear safety incidents
- Proliferation concerns
- Arms control verification
- Nuclear material trafficking
- Missile and delivery system developments

**Account Characteristics:**
- Nuclear OSINT expertise
- Satellite imagery analysis
- Technical nuclear knowledge
- Evidence-based reporting
- Regular facility monitoring
- Updates weekly or when significant developments occur
- High technical quality
- Collaboration with nuclear experts

**Intelligence Value:**
- Nuclear proliferation early warning
- Weapons program monitoring
- Facility activity intelligence
- Safety incident detection
- Arms control verification
- Strategic weapons tracking

## Data Collection Criteria

### Twitter Account Details

- **Handle**: OpenNuclear
- **Account Type**: Specialized OSINT account
- **Tweet Frequency**: 3-8 tweets per week (event-driven)
- **Engagement**: High within nuclear and OSINT communities

### Collection Method

- **Method**: timeline
- **Poll Interval**: Every 30 minutes
- **Include Retweets**: Yes (shares expert analysis)
- **Include Replies**: Yes (often contains technical details)
- **Include Quotes**: Yes
- **Thread Handling**: Collect entire thread (analysis often detailed)

### Content Filters

#### Include Criteria

- Nuclear facility monitoring
- Satellite imagery analysis of nuclear sites
- Enrichment and reprocessing reports
- Nuclear testing activities
- Reactor operations
- Nuclear incidents or accidents
- Proliferation concerns
- Weapons program developments
- Missile testing
- Arms control developments

#### Exclude Criteria

- General nuclear energy policy (unless security-relevant)
- Promotional content
- Off-topic discussions
- Tweets older than 90 days (slower update cycle)

### Keyword Monitoring

**High-Priority Keywords:**
- Nuclear, enrichment, reprocessing
- Plutonium, uranium, HEU, LEU
- Reactor, facility, plant, site
- Weapons, warhead, bomb, device
- Test, explosion, detonation, seismic
- Proliferation, non-proliferation, NPT
- IAEA, safeguards, inspection
- Missile, ICBM, SLBM, delivery system
- Centrifuge, cascade, separation

**Facility Keywords:**
- Yongbyon, Natanz, Fordow, Dimona
- Tajoura, Pelindaba, Kahuta
- Los Alamos, Savannah River, Oak Ridge
- Specific known nuclear sites

**Technical Keywords:**
- Isotope, isotopic, signature
- Radiation, radioactive, contamination
- Kiloton, megaton, yield
- Critical, criticality, fissile

### Entity Extraction

**Facility Information:**
- Facility names and locations
- Site coordinates
- Facility types (enrichment, reactor, etc.)
- Operational status
- Construction or expansion activities

**Technical Information:**
- Enrichment levels
- Material quantities
- Reactor types and capabilities
- Test yields
- Isotopic compositions

**Imagery Information:**
- Satellite source and date
- Observable changes
- Activity indicators
- Comparative analysis

## Expected Data Format

### Raw Tweet Object

```json
{
  "id": "1234567890",
  "text": "New satellite imagery shows construction activity at Yongbyon nuclear facility, North Korea. Two new buildings under construction near enrichment complex. Activity consistent with expansion. Images from Planet Labs, 2026-04-25. Analysis thread below. #Nuclear #DPRK",
  "created_at": "2026-04-30T14:32:00Z",
  "author": {
    "id": "123456789",
    "username": "OpenNuclear",
    "name": "OpenNuclear"
  },
  "metrics": {
    "retweet_count": 456,
    "like_count": 789,
    "reply_count": 123
  }
}
```

### Structured Data Extraction

```yaml
monitoring_type: "facility-expansion"

facility:
  name: "Yongbyon nuclear facility"
  location: "North Korea"
  complex: "enrichment complex"

observation:
  activity: "construction"
  details: "two new buildings under construction"
  assessment: "consistent with expansion"

source:
  type: "satellite imagery"
  provider: "Planet Labs"
  date: "2026-04-25"

tags:
  - nuclear-facility
  - north-korea
  - enrichment
  - expansion
  - satellite-osint

priority: "high"
confidence: "high"
```

## Processing Instructions

### Data Extraction

1. **Fetch Timeline**
   - Use Twitter API v2
   - Include all content types
   - Prioritize threads with technical analysis

2. **Initial Filtering**
   - Check for nuclear relevance
   - Verify technical content
   - Look for satellite imagery or evidence
   - Filter out policy-only discussions

3. **Entity Extraction**
   - Facility names and locations
   - Coordinates if provided
   - Activity types
   - Technical specifications
   - Satellite imagery sources and dates
   - Countries and programs

4. **Context Analysis**
   - Classify activity type
   - Assess proliferation significance
   - Identify trends in facility operations
   - Extract technical details

5. **Significance Scoring**
   - High: Weapons testing, enrichment expansion, new facilities
   - Medium: Reactor operations, facility modifications, safety incidents
   - Low: Routine monitoring, minor activities

### Transformation to World Event Entity

```javascript
function transformToWorldEvent(tweet, extractedEntities) {
  const eventType = classifyNuclearEvent(tweet.text, extractedEntities);
  const location = extractFacilityLocation(extractedEntities);
  const title = buildEventTitle(extractedEntities, eventType);
  const priority = calculatePriority(eventType, extractedEntities);
  
  return {
    title: title,
    date: tweet.created_at,
    type: eventType,
    location: location,
    priority: priority,
    confidence: 'high',
    tags: generateTags(extractedEntities, eventType),
    source: {
      type: 'twitter',
      handle: 'OpenNuclear',
      tweet_id: tweet.id,
      url: `https://twitter.com/OpenNuclear/status/${tweet.id}`,
      analyst: 'OpenNuclear',
      specialization: 'Nuclear OSINT'
    },
    entities: extractedEntities,
    contents: generateMarkdown(tweet, extractedEntities)
  };
}
```

## Quality Indicators

### High Quality Signals

- **Satellite Imagery**: Includes or references imagery
- **Source Attribution**: Names satellite provider and date
- **Technical Details**: Provides specific facility or activity information
- **Coordinates**: Includes geographic coordinates
- **Comparative Analysis**: Shows changes over time
- **Expert Validation**: High engagement from nuclear community
- **Thread Format**: Detailed multi-tweet technical analysis
- **Cross-Verification**: References multiple sources or methods
- **Technical Accuracy**: Demonstrates nuclear knowledge

### Low Quality Signals

- **Vague Claims**: General statements without specifics
- **No Evidence**: Lacks imagery or data
- **Speculation Only**: Unverified assertions
- **Policy-Only**: Lacks technical intelligence component
- **Low Engagement**: Minimal expert community interaction

## Known Issues

### Issue 1: Imagery Resolution and Interpretation
**Problem**: Satellite imagery interpretation can have uncertainty
**Workaround**: Note confidence levels, prefer confirmed observations
**Status**: Confidence scoring implemented

### Issue 2: Facility Identification
**Problem**: Some facilities are camouflaged or misidentified
**Workaround**: Prioritize known facilities, cross-reference coordinates
**Status**: Facility database maintained

### Issue 3: Technical Classification
**Problem**: Nuclear technical terms can be misused or unclear
**Workaround**: Maintain technical glossary, verify with experts
**Status**: Technical validation process

## Examples

### Example 1: Facility Expansion - High Priority

**Raw Tweet:**
```
New satellite imagery shows construction activity at Yongbyon nuclear 
facility, North Korea. Two new buildings under construction near 
enrichment complex. Activity consistent with expansion. Images from 
Planet Labs, 2026-04-25. Analysis thread below. #Nuclear #DPRK
```

**Extracted World Event:**
```yaml
title: "North Korea expanding Yongbyon enrichment facility, satellite shows"
date: 2026-04-30T14:32:00Z
type: nuclear-facility-expansion
location:
  facility: "Yongbyon nuclear facility"
  country: "North Korea"
  coordinates: "39.8°N 125.8°E"
priority: high
confidence: high
tags:
  - nuclear-proliferation
  - north-korea
  - enrichment
  - facility-expansion
  - satellite-osint
facility:
  name: "Yongbyon"
  type: "enrichment complex"
activity:
  type: "construction"
  details: "two new buildings under construction"
  assessment: "expansion of enrichment capacity"
imagery_source:
  provider: "Planet Labs"
  date: "2026-04-25"
proliferation_significance: "potential increase in enrichment capacity"
source:
  type: twitter
  handle: OpenNuclear
  methodology: "satellite imagery analysis"
```

### Example 2: Nuclear Test - High Priority

**Raw Tweet:**
```
Seismic activity detected near Punggye-ri test site, North Korea. 
Magnitude 4.2 earthquake at shallow depth. Location consistent with 
previous nuclear tests. USGS and CTBTO confirming unnatural seismic 
signature. Likely nuclear test, yield estimated 5-10 kilotons.
```

**Extracted World Event:**
```yaml
title: "North Korea conducts nuclear test, ~5-10kt yield detected"
date: 2026-04-30T09:15:00Z
type: nuclear-test
location:
  site: "Punggye-ri"
  country: "North Korea"
priority: high
confidence: high
tags:
  - nuclear-test
  - north-korea
  - weapons-program
  - proliferation
detection:
  method: "seismic"
  magnitude: "4.2"
  depth: "shallow"
  signature: "unnatural (explosion)"
  sources:
    - "USGS"
    - "CTBTO"
assessment:
  type: "nuclear test"
  yield_estimate: "5-10 kilotons"
  consistency: "location matches previous test sites"
```

### Example 3: Enrichment Activity - High Priority

**Raw Tweet:**
```
Iran's Fordow facility now enriching uranium to 60% purity according 
to IAEA report. Significant increase from previous 20%. 60% enrichment 
brings material close to weapons-grade (90%). Enrichment at underground 
facility raises proliferation concerns. Breaking NPT limits.
```

**Extracted World Event:**
```yaml
title: "Iran enriching to 60% at Fordow, approaching weapons-grade"
date: 2026-04-30T13:45:00Z
type: enrichment-escalation
location:
  facility: "Fordow"
  country: "Iran"
priority: high
confidence: high
tags:
  - iran
  - enrichment
  - proliferation
  - npt-violation
  - weapons-grade
enrichment:
  current_level: "60%"
  previous_level: "20%"
  weapons_grade: "90%"
  facility_type: "underground"
source_report: "IAEA"
proliferation_assessment:
  significance: "approaching weapons-grade capability"
  violation: "exceeds NPT limits"
  concern: "underground facility reduces detection"
```

## Validation Checklist

- [x] Twitter handle verified (@OpenNuclear)
- [x] Collection method appropriate
- [x] Filters configured for nuclear focus
- [x] Entity extraction patterns defined
- [x] Quality indicators measurable
- [x] Priority calculation logic defined
- [x] Examples comprehensive
- [x] Reliability set to medium
- [ ] Authentication configured
- [ ] Rate limits monitored
- [ ] Integration verified

## Monitoring & Maintenance

### Daily Checks
- API response and collection completeness
- No missed updates (critical for nuclear intelligence)

### Weekly Tasks
- Review all nuclear events
- Verify satellite imagery sources
- Update facility databases
- Check technical accuracy

### Monthly Tasks
- Audit event classification
- Review proliferation assessments
- Validate reliability score
- Update nuclear keyword lists
- Cross-reference with IAEA reports
- Update facility coordinate database

## Technical Integration

### Authentication Setup

Required environment variables from Twitter Developer Portal.

### Rate Limits

- Twitter API v2: Standard rate limits
- 30-minute polling interval sufficient (slower update cycle)

## Related Sources

- **@ArmsControlWonk**: Arms control expertise
- **@HKSKorea**: North Korea analysis
- **@IAEAORG**: Official IAEA reports
- **@CTBTO_AlertBot**: Nuclear test detection
- **@nucleardiner**: Nuclear weapons analysis
