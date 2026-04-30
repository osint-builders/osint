---
id: twitter-hawkeye360
name: HawkEye360 - Satellite RF Detection & Geolocation Intelligence
type: twitter
status: active
description: |
  Commercial satellite constellation providing radio frequency (RF) geolocation intelligence.
  HawkEye360 detects and geolocates RF transmissions globally using space-based sensors,
  enabling tracking of vessels, aircraft, and ground-based emitters. Valuable for maritime
  domain awareness, spectrum monitoring, and detecting illegal activity through RF signatures.
created_date: "2026-04-30"
last_updated: "2026-04-30"
tags:
  - satellite
  - rf-geolocation
  - geoint
  - maritime
  - spectrum-monitoring
  - osint
  - remote-sensing
  - vessel-tracking
reliability: high
confidence_score: 90
update_frequency: "1h"
priority: high
language:
  - en
geographic_focus:
  - global
cost: free
requires_auth: true
maintainer: osint-team
alert_keywords:
  - satellite
  - rf detection
  - geolocation
  - tracking
  - vessel
  - imagery
  - spectrum
  - emitter
  - maritime
  - detection
---

# HawkEye360 - Satellite RF Detection & Geolocation Intelligence

## Overview

HawkEye360 (@HawkEye360) is a leading commercial satellite constellation operator specializing in radio frequency (RF) geolocation intelligence. The company provides unique space-based RF detection capabilities for:

- Maritime vessel tracking via RF emissions
- Illegal fishing detection (IUU fishing)
- Spectrum monitoring and interference detection
- Dark vessel identification (AIS-off vessels)
- Emergency beacon detection (EPIRB, PLB)
- Communications intelligence (COMINT)
- Electronic intelligence (ELINT)
- Sanctions enforcement support
- Search and rescue operations
- Border security and smuggling detection

**Account Characteristics:**
- Corporate account with technical expertise
- Regular product updates and case studies
- Satellite constellation status updates
- Partnership announcements
- Customer success stories
- Technical blog content
- Conference presentations and webinars

**Intelligence Value:**
- Unique RF-based vessel detection capabilities
- Complement to optical/SAR satellite imagery
- Detection of vessels with AIS transponders off
- Identification of illegal maritime activity
- Spectrum anomaly detection
- Emergency response support
- Geopolitical maritime intelligence

## Data Collection Criteria

### Twitter Account Details

- **Handle**: HawkEye360
- **Account Type**: Commercial satellite company
- **Geographic Focus**: Global RF monitoring
- **Strategic Significance**: Maritime domain awareness, sanctions monitoring
- **Content Type**: Product updates, case studies, detection reports, imagery
- **Tweet Frequency**: Several times per week
- **Language**: English

### Collection Method

- **Method**: timeline
- **Poll Interval**: Every 1 hour
- **Include Retweets**: Yes (industry news and partnerships)
- **Include Replies**: Yes (technical discussions)
- **Include Quotes**: Yes
- **Thread Handling**: Collect full threads for case studies

### Content Filters

#### Include Criteria

- RF detection case studies
- Vessel tracking demonstrations
- Dark vessel detection reports
- Illegal fishing identification
- Satellite constellation updates
- Technical capability announcements
- Partnership and integration news
- Sanctions enforcement applications
- Emergency beacon detection
- Maritime domain awareness content

#### Exclude Criteria

- Pure corporate marketing without technical content
- Job postings (unless technical roles)
- General company culture posts
- Non-intelligence related content

### Keyword Monitoring

**High-Priority Keywords:**
- satellite, constellation, RF detection
- geolocation, tracking, vessel
- dark vessel, AIS off, IUU fishing
- maritime, ocean, shipping
- detection, monitoring, surveillance
- spectrum, emitter, signal
- sanctions, illegal, smuggling
- EPIRB, beacon, emergency
- imagery, data, intelligence

**Activity Keywords:**
- detected, identified, tracked
- monitoring, observing, analyzing
- geolocated, positioned, located
- discovered, found, revealed

**Technical Keywords:**
- radio frequency, RF signature
- cluster payload, satellite constellation
- geospatial intelligence, GEOINT
- spectrum monitoring, SIGINT
- AIS, VMS, LRIT
- maritime domain awareness, MDA

## Expected Data Format

### Raw Tweet Object

```json
{
  "id": "1234567890",
  "text": "New case study: HawkEye360's RF data detected 15 dark vessels operating with AIS transponders off in the South China Sea, supporting maritime law enforcement efforts. Full report: [link] #MaritimeSecurity #GEOINT",
  "created_at": "2026-04-30T10:30:00Z",
  "author": {
    "username": "HawkEye360",
    "name": "HawkEye360"
  },
  "metrics": {
    "retweet_count": 89,
    "like_count": 234,
    "reply_count": 12
  },
  "media": [
    {
      "type": "photo",
      "url": "https://pbs.twimg.com/media/..."
    }
  ]
}
```

### Structured Data Extraction

```yaml
event_type: satellite-rf-detection
capability: "dark vessel detection"
technology: "RF geolocation"
location:
  region: "South China Sea"
vessels_detected: 15
activity: "AIS transponders off"
application: "maritime law enforcement"
priority: high
tags:
  - satellite
  - rf-detection
  - dark-vessel
  - south-china-sea
  - maritime-security
  - geoint
```

## Processing Instructions

### Data Extraction

1. **Fetch Timeline**
   - Use Twitter API v2 to fetch recent tweets and threads
   - Filter for technical content and case studies
   - Prioritize detection reports and capability demonstrations

2. **Content Classification**
   - Identify intelligence type (RF detection, tracking, etc.)
   - Extract technical capabilities described
   - Determine application area (maritime, border, emergency)
   - Assess strategic significance

3. **Entity Extraction**
   - Geographic regions and locations
   - Vessel types and quantities
   - RF signature types
   - Partners and customers
   - Technical specifications
   - Detection methods

4. **Significance Assessment**
   - High: Detection reports, dark vessel cases, sanctions applications
   - Medium: Technical capabilities, constellation updates
   - Low: Corporate news, general marketing

### Transformation to World Event Entity

```javascript
function transformToWorldEvent(tweet, extracted) {
  const eventType = classifyGeointEvent(tweet.text);
  
  return {
    title: buildEventTitle(extracted),
    date: tweet.created_at,
    type: eventType,
    location: {
      region: extracted.region,
      coordinates: extracted.coordinates
    },
    priority: calculatePriority(eventType, extracted),
    confidence: 'high',
    tags: generateTags(extracted),
    source: {
      type: 'twitter',
      handle: 'HawkEye360',
      tweet_id: tweet.id,
      url: `https://twitter.com/HawkEye360/status/${tweet.id}`
    },
    entities: extracted.entities,
    contents: generateMarkdown(tweet, extracted)
  };
}
```

## Quality Indicators

### High Quality Signals

- Specific detection reports with locations
- Technical capability demonstrations
- Case studies with data/imagery
- Partnership announcements with intelligence agencies
- Quantified results (number of vessels detected, etc.)
- Links to detailed reports or blog posts
- Correlation with other intelligence sources
- Real-world application examples

### Low Quality Signals

- Generic corporate messaging
- Marketing content without substance
- Vague capability claims
- No specific examples or data

### Red Flags (Skip/Low Priority)

- Pure promotional content
- Job postings
- Event announcements without content
- General news reposts without analysis

## Known Issues

### Issue 1: Commercial Sensitivity
**Problem**: Company may not share detailed operational data  
**Workaround**: Focus on publicly released case studies and sanitized reports  
**Status**: Monitor for public releases

### Issue 2: Technical Jargon
**Problem**: Heavy use of RF and satellite technical terminology  
**Workaround**: Maintain glossary of RF/GEOINT terms  
**Status**: Documentation in progress

### Issue 3: Delayed Releases
**Problem**: Detection reports may be published weeks after actual detection  
**Workaround**: Note publication date vs. detection date when available  
**Status**: Include timestamp context in processing

## Examples

### Example 1: Dark Vessel Detection - High Priority

**Raw Tweet:**
```
🛰️ Case Study: HawkEye360 RF data identified a cluster of 23 vessels 
operating with AIS off near disputed fishing grounds in the East China Sea. 
RF signatures matched commercial fishing vessel profiles. Data supports 
IUU fishing enforcement. Read more: [link] #GEOINT #MaritimeSecurity
```

**Extracted World Event:**
```yaml
title: "HawkEye360 detects 23 dark fishing vessels in East China Sea"
date: 2026-04-30T14:20:00Z
type: satellite-rf-detection
detection:
  method: "RF geolocation"
  platform: "HawkEye360 satellite constellation"
  vessels: 23
  vessel_type: "commercial fishing vessels"
location:
  region: "East China Sea"
  area: "disputed fishing grounds"
activity:
  type: "AIS transponders off"
  suspected: "IUU illegal fishing"
application: "IUU fishing enforcement"
priority: high
confidence: high
tags:
  - satellite
  - rf-detection
  - dark-vessel
  - iuu-fishing
  - east-china-sea
  - geoint
  - maritime-enforcement
```

### Example 2: Technical Capability - Medium Priority

**Raw Tweet:**
```
HawkEye360's Cluster 8 satellites launched successfully! New capabilities 
include improved RF geolocation accuracy (<500m CEP) and expanded frequency 
coverage. Enhancing maritime domain awareness and spectrum monitoring globally.
```

**Extracted World Event:**
```yaml
title: "HawkEye360 launches Cluster 8 with enhanced RF capabilities"
date: 2026-04-30T09:45:00Z
type: satellite-capability-update
capability:
  platform: "Cluster 8 satellites"
  improvement: "RF geolocation accuracy"
  accuracy: "<500m CEP"
  coverage: "expanded frequency coverage"
applications:
  - "maritime domain awareness"
  - "spectrum monitoring"
priority: medium
confidence: high
tags:
  - satellite
  - rf-detection
  - constellation
  - capability-update
  - geoint
```

## Validation Checklist

Before marking source as active:

- [x] Twitter handle verified (@HawkEye360)
- [x] Content focus confirmed (RF detection, satellite GEOINT)
- [x] Strategic relevance established (maritime intelligence, tracking)
- [x] Collection method appropriate (timeline with threads)
- [x] Filters configured (technical content focus)
- [x] Keywords defined for RF and satellite intelligence
- [x] Entity extraction patterns defined
- [x] Quality indicators specific and measurable
- [x] Examples comprehensive and realistic
- [ ] Account verification (confirm active and posting)
- [ ] Authentication configured (Twitter API access)
- [ ] Integration tested with collection system

## Monitoring & Maintenance

### Daily Checks
- API connectivity and tweet collection
- No collection gaps during constellation updates
- Monitor for major detection announcements

### Weekly Tasks
- Review detection reports for accuracy
- Update RF terminology glossary
- Verify classification accuracy

### Monthly Tasks
- Audit event classification accuracy
- Review reliability score based on verified detections
- Check for new capabilities or constellation updates
- Update partner and customer list

## Related Sources

Complementary sources for satellite and maritime intelligence:

- **@MDA_space**: MDA space-based intelligence
- **@planetlabs**: Optical satellite imagery
- **@Maxar**: Commercial satellite imagery
- **@capellaspace**: SAR satellite imagery
- **@ICEYE_Ltd**: SAR imaging for maritime
- **@TankerTrackers**: Maritime vessel tracking
- **@Esri**: GIS and geospatial analysis
- **Maritime Domain Awareness agencies**: USCG, EU NAVFOR
