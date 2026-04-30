---
id: twitter-dataminr
name: Dataminr - Real-Time Event Detection
type: twitter
status: active
description: |
  Dataminr is a leading real-time information discovery platform that uses AI to detect high-impact
  events and emerging risks from publicly available data sources. Their Twitter account shares alerts
  and insights on breaking news, crisis events, natural disasters, security incidents, and major
  developments globally. Known for early detection capabilities often ahead of traditional media.
  High reliability due to algorithmic verification and professional curation, though commercial
  platform nature means focus on demonstrable, high-impact events.
created_date: "2026-04-30"
last_updated: "2026-04-30"
tags:
  - real-time-intelligence
  - event-detection
  - breaking-news
  - crisis-monitoring
  - ai-powered
  - global-coverage
  - early-warning
  - osint
reliability: high
confidence_score: 80
update_frequency: "15m"
priority: high
language:
  - en
geographic_focus:
  - global
  - all-regions
cost: free
requires_auth: true
maintainer: osint-team
alert_keywords:
  - breaking
  - alert
  - developing
  - crisis
  - attack
  - disaster
  - explosion
  - shooting
  - earthquake
  - evacuation
---

# Dataminr - Real-Time Event Detection

## Overview

Dataminr (@Dataminr) is a professional real-time information discovery and alerting platform that uses artificial intelligence and machine learning to detect high-impact events and emerging risks from publicly available data sources worldwide. The company's Twitter account showcases their detection capabilities by sharing alerts on breaking news, crisis events, natural disasters, security incidents, and major global developments, often providing early warning before traditional media coverage.

**Account Characteristics:**
- Professional AI-powered event detection platform
- Early warning and real-time alerts
- Global coverage across all event types
- Algorithmic verification and professional curation
- Mix of crisis events, breaking news, and major incidents
- Often first to detect emerging situations
- High-impact event focus
- Showcase of platform capabilities
- Corporate/professional communication style

**Intelligence Value:**
- Early warning of breaking events (often minutes ahead of media)
- Verified crisis event notifications
- Natural disaster and emergency alerts
- Security incident detection
- Mass casualty event notifications
- Infrastructure disruption alerts
- High-confidence event verification
- Pattern detection across multiple data sources
- Professional quality control and curation

## Data Collection Criteria

### Twitter Account Details

- **Handle**: Dataminr
- **Account Type**: Professional technology/platform company
- **Geographic Focus**: Global (all regions)
- **Strategic Significance**: AI-powered early event detection
- **Content Type**: Real-time alerts, event detection, breaking news
- **Tweet Frequency**: Variable, event-driven (multiple per day during active periods)
- **Language**: English

### Collection Method

- **Method**: timeline
- **Poll Interval**: Every 15 minutes
- **Include Retweets**: No (focus on original alerts)
- **Include Replies**: Yes (clarifications and updates)
- **Include Quotes**: No
- **Thread Handling**: Collect full threads for developing situations

### Content Filters

#### Include Criteria

- Breaking event alerts and notifications
- Crisis and emergency situations
- Natural disasters and severe weather
- Security incidents and attacks
- Mass casualty events
- Infrastructure disruptions
- Major political developments
- Significant protest or civil unrest
- Aviation and maritime incidents
- Critical infrastructure threats
- Cyber incidents with physical impact
- Public safety emergencies

#### Exclude Criteria

- Company news and announcements
- Product updates or features
- Marketing and promotional content
- Customer testimonials
- General corporate communications
- Conference or event announcements
- Job postings or hiring
- Industry news without event specifics

### Keyword Monitoring

**High-Priority Keywords:**
- Breaking, alert, developing, urgent, confirmed
- Attack, shooting, explosion, bombing, gunfire
- Earthquake, tsunami, hurricane, tornado, flood
- Fire, wildfire, evacuation, emergency
- Crash, collision, accident, derailment
- Protest, unrest, riot, violence, clashes
- Cyber attack, outage, disruption, breach
- Casualties, injured, killed, victims, fatalities
- Crisis, disaster, emergency, incident

**Event Type Keywords:**
- Natural disaster, severe weather, seismic
- Terror, terrorism, active shooter, hostage
- Aviation incident, flight emergency, helicopter
- Maritime incident, vessel, ship, collision
- Infrastructure, power outage, blackout
- Chemical, hazmat, toxic, contamination
- Pandemic, outbreak, health emergency

**Geographic Keywords:**
- Major cities globally
- Conflict zones and crisis regions
- Critical infrastructure locations
- International borders and checkpoints
- Strategic locations (straits, canals, bases)

## Expected Data Format

### Raw Tweet Object

```json
{
  "id": "1234567890",
  "text": "BREAKING: Dataminr alerts: Multiple reports of explosions near Kyiv city center, Ukraine. Emergency services responding. Developing situation. [Map/Location data]",
  "created_at": "2026-04-30T08:23:00Z",
  "author": {
    "username": "Dataminr",
    "name": "Dataminr"
  },
  "metrics": {
    "retweet_count": 2100,
    "like_count": 3800,
    "reply_count": 420
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
event_type: security-incident
location:
  city: "Kyiv"
  area: "city center"
  country: "Ukraine"
entities:
  locations:
    - "Kyiv city center"
    - "Ukraine"
  organizations:
    - "Emergency services"
  detection_platform:
    - "Dataminr"
activities:
  - "explosions"
  - "emergency response"
status: "developing"
detection_time: "2026-04-30T08:23:00Z"
priority: high
tags:
  - ukraine
  - kyiv
  - explosion
  - breaking-news
  - real-time-alert
verification_level: "Dataminr AI-verified + multiple sources"
```

## Processing Instructions

### Data Extraction

1. **Fetch Timeline**
   - Use Twitter API v2 to fetch recent tweets
   - Prioritize breaking alerts and notifications
   - Monitor for high-impact event announcements
   - Track developing situation updates

2. **Content Classification**
   - Distinguish breaking alerts from company content
   - Identify event type and severity
   - Extract detection timing information
   - Assess geographic scope and impact
   - Categorize by urgency and priority

3. **Entity Extraction**
   - Geographic locations (precise as available)
   - Event type and characteristics
   - Casualties and impacts (if mentioned)
   - Response organizations involved
   - Detection confidence indicators
   - Time-to-detection metrics
   - Source diversity indicators

4. **Significance Assessment**
   - High: Mass casualty events, major attacks, critical infrastructure, natural disasters
   - Medium: Significant incidents, regional crises, notable disruptions
   - Low: Company content, general updates, non-emergency information

### Transformation to World Event Entity

```javascript
function transformToWorldEvent(tweet, extracted) {
  const eventType = classifyDataminrAlert(tweet.text);
  
  return {
    title: buildEventTitle(extracted),
    date: tweet.created_at,
    type: eventType,
    location: extracted.location,
    priority: 'high', // Dataminr alerts are pre-filtered for significance
    confidence: 'high', // AI-verified platform with professional curation
    reliability: 'high', // Professional platform with quality controls
    tags: generateTags(extracted),
    source: {
      type: 'twitter',
      handle: 'Dataminr',
      tweet_id: tweet.id,
      url: `https://twitter.com/Dataminr/status/${tweet.id}`,
      platform: 'ai-event-detection',
      detection_method: 'algorithmic-verification'
    },
    entities: extracted.entities,
    detection_metadata: {
      platform: 'Dataminr',
      verification: 'AI-powered multi-source',
      early_warning: true
    },
    contents: generateMarkdown(tweet, extracted),
    verification_notes: 'Dataminr AI-powered detection with professional curation - high confidence'
  };
}
```

## Quality Indicators

### High Quality Signals

- Specific location details (city, neighborhood, landmark)
- Precise timing information
- Event type clearly identified
- Multiple data points mentioned
- Maps or location data included
- Casualty information when available
- Response organization actions noted
- "Dataminr alerts" or similar verification language
- Follow-up updates provided
- Cross-platform detection indicators
- Time-to-detection highlighted

### Low Quality Signals

- Vague locations
- No specific event details
- Unverified or unsubstantiated claims
- Lack of context
- No follow-up on major alerts
- Inconsistent with known facts

### Red Flags (Interpret with Caution)

- Conflicts with official sources (rare)
- Retracted alerts without explanation
- Misclassified events
- Geographic errors
- Note: Dataminr's professional nature means red flags are extremely rare

## Known Issues

### Issue 1: Commercial Platform Showcase
**Problem**: Twitter account showcases capabilities, may not represent all alerts from full platform  
**Workaround**: Understand this is sample of detection capabilities, full platform has more comprehensive coverage  
**Status**: Expected for corporate account, still provides high-value early warnings

### Issue 2: Limited Context in Alerts
**Problem**: Alerts prioritize speed, may lack full context initially  
**Workaround**: Treat as early warning, gather additional context from follow-up tweets and other sources  
**Status**: Feature of real-time alerting, not a bug

### Issue 3: Variable Update Frequency
**Problem**: Posting frequency depends on global event activity, may be quiet during calm periods  
**Workaround**: This is appropriate behavior - alerts should be event-driven  
**Status**: Expected and desired for alert-focused account

## Examples

### Example 1: Security Incident Alert - High Priority

**Raw Tweet:**
```
BREAKING: Dataminr alerts to multiple explosions reported in central Beirut, 
Lebanon. Heavy smoke visible. Emergency services responding. Casualties 
reported. Situation developing. Multiple independent sources confirming. 
Location: Near port area. [Map attached]
```

**Extracted World Event:**
```yaml
title: "Multiple explosions reported in central Beirut, Lebanon"
date: 2026-04-30T09:15:00Z
type: explosion
location:
  city: "Beirut"
  area: "central Beirut, near port area"
  country: "Lebanon"
priority: high
confidence: high
reliability: high
tags:
  - lebanon
  - beirut
  - explosion
  - breaking-news
  - casualties
  - emergency-response
entities:
  locations:
    - "Central Beirut"
    - "Port area"
    - "Lebanon"
  organizations:
    - "Emergency services"
  impacts:
    - "heavy smoke"
    - "casualties reported"
detection_metadata:
  platform: "Dataminr"
  verification: "Multiple independent sources"
  detection_method: "AI-powered multi-source"
  early_warning: true
activities:
  - "multiple explosions"
  - "emergency response"
status: "developing"
strategic_context: "Significant explosion event in major city, potential mass casualty"
verification_notes: "Dataminr AI verification with multiple independent sources - very high confidence"
```

### Example 2: Natural Disaster Alert - High Priority

**Raw Tweet:**
```
ALERT: Dataminr detecting strong earthquake reported in central Japan. 
Preliminary magnitude 7.2. Tsunami warning issued for Pacific coast. 
Multiple cities reporting strong shaking. Nuclear facilities on alert. 
Monitoring for impacts.
```

**Extracted World Event:**
```yaml
title: "Magnitude 7.2 earthquake strikes central Japan, tsunami warning issued"
date: 2026-04-30T11:30:00Z
type: natural-disaster
location:
  region: "Central Japan"
  country: "Japan"
  affected_area: "Pacific coast"
priority: high
confidence: high
reliability: high
tags:
  - japan
  - earthquake
  - tsunami-warning
  - natural-disaster
  - nuclear-alert
entities:
  locations:
    - "Central Japan"
    - "Pacific coast"
  countries:
    - "Japan"
  facilities:
    - "Nuclear facilities"
  warnings:
    - "Tsunami warning"
detection_metadata:
  platform: "Dataminr"
  detection_method: "Real-time seismic + social monitoring"
  early_warning: true
event_details:
  magnitude: 7.2
  type: "earthquake"
  warnings_issued:
    - "tsunami warning"
  impacts:
    - "strong shaking in multiple cities"
    - "nuclear facilities on alert"
status: "developing - monitoring impacts"
strategic_context: "Major earthquake with tsunami potential and nuclear facility concerns"
verification_notes: "Dataminr alert with seismic data - immediate high confidence"
```

### Example 3: Aviation Incident - High Priority

**Raw Tweet:**
```
Dataminr alerting: Commercial aircraft declaring emergency over North 
Atlantic. Flight LH458 Frankfurt to New York. Diverting to Shannon, Ireland. 
Emergency services on standby. Monitoring situation.
```

**Extracted World Event:**
```yaml
title: "Commercial aircraft LH458 declares emergency, diverts to Shannon"
date: 2026-04-30T14:45:00Z
type: aviation-incident
location:
  airspace: "North Atlantic"
  diversion: "Shannon, Ireland"
  route: "Frankfurt to New York"
priority: high
confidence: high
reliability: high
tags:
  - aviation
  - emergency
  - flight-incident
  - ireland
  - atlantic
entities:
  flights:
    - "LH458 (Frankfurt to New York)"
  locations:
    - "North Atlantic"
    - "Shannon, Ireland"
  organizations:
    - "Emergency services"
detection_metadata:
  platform: "Dataminr"
  detection_method: "Flight tracking + communications monitoring"
  early_warning: true
activities:
  - "emergency declaration"
  - "diversion to alternate airport"
  - "emergency services standby"
status: "monitoring"
strategic_context: "Commercial aviation emergency over ocean, diverting to nearest suitable airport"
verification_notes: "Dataminr alert based on flight tracking and communications - high confidence"
```

## Validation Checklist

Before marking source as active:

- [x] Twitter handle verified (@Dataminr)
- [x] Account type identified (professional AI event detection platform)
- [x] Strategic relevance established (early warning system with high reliability)
- [x] Collection method appropriate (timeline, frequent polling for real-time)
- [x] Filters configured (breaking alerts, exclude corporate content)
- [x] Keywords defined for crisis and emergency events
- [x] Entity extraction patterns defined
- [x] Quality indicators specific and measurable
- [x] Professional platform nature documented in reliability score
- [x] Examples comprehensive and realistic
- [ ] Account verification (confirm active and posting)
- [ ] Authentication configured (Twitter API access)
- [ ] Integration tested with collection system
- [ ] Alert escalation workflow configured for high-priority events

## Monitoring & Maintenance

### Daily Checks
- API connectivity and tweet collection
- High-priority alert collection
- Response time to breaking events
- Integration with alert workflows

### Weekly Tasks
- Review alert quality and accuracy
- Update keyword filters if needed (rare)
- Track early warning performance
- Compare detection time with other sources
- Verify no missed critical alerts

### Monthly Tasks
- Audit event classification accuracy
- Review reliability score (should remain high)
- Analyze coverage patterns by region and event type
- Compare with other early warning sources
- Measure value added vs other sources
- Update documentation with new example types

## Related Sources

Complementary sources for verification and comprehensive coverage:

- **@USGSBigQuakes**: Earthquake verification
- **@NHC_Atlantic**: Hurricane tracking
- **@NWS**: Weather emergencies
- **@ICAO**: Aviation incidents
- **@IAEA_org**: Nuclear incidents
- **Flight tracking**: FlightRadar24, FlightAware
- **@GDACS**: Global disaster alert system
- **News wires**: Reuters, AP, AFP for confirmation
- **Official emergency services**: By country/region
- **@UN**: Major humanitarian emergencies
- **Commercial satellite imagery**: Event verification
- **Other AI detection**: Recorded Future, Jane's

## Notes

**Why This Source Is Valuable:**

Dataminr represents a unique category of OSINT source - a professional AI-powered event detection platform that serves as an early warning system. Key advantages:

1. **Speed**: Often detects events minutes to hours before traditional media
2. **Verification**: Algorithmic verification across multiple data sources
3. **Quality Control**: Professional curation and false positive filtering
4. **Global Coverage**: Comprehensive monitoring across all regions and event types
5. **Reliability**: Corporate reputation and professional standards ensure high accuracy

**Integration Considerations:**

- Treat Dataminr alerts as high-priority, high-confidence early warnings
- Use for immediate awareness and alerting workflows
- Follow up with traditional sources for comprehensive context
- Leverage early warning advantage for faster response
- Consider Dataminr detection time as benchmark for system performance

**Commercial Platform Context:**

While Dataminr is a commercial platform, their Twitter account provides public value by showcasing detection capabilities. The full commercial platform offers more comprehensive coverage, but the public Twitter feed still provides significant intelligence value for OSINT operations.
