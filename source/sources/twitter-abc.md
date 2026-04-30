---
id: twitter-abc
name: ABC News - Breaking News & World Events
type: twitter
status: active
description: |
  ABC News provides comprehensive breaking news coverage including
  international events, natural disasters, politics, and major incidents.
  Strong US network with international bureaus. Reliable mainstream
  source for world event monitoring.
created_date: "2026-04-30"
last_updated: "2026-04-30"
tags:
  - osint
  - breaking-news
  - world-events
  - disaster
  - politics
  - conflict
reliability: high
confidence_score: 85
update_frequency: "5m"
priority: high
language:
  - en
geographic_focus:
  - global
  - united-states
cost: free
requires_auth: true
maintainer: osint-team
alert_keywords:
  - breaking
  - urgent
  - disaster
  - attack
  - shooting
  - explosion
  - earthquake
  - military
  - conflict
---

# ABC News - Breaking News & World Events

## Overview

ABC News (@ABC) is one of the major US broadcast networks with a strong digital presence and international bureaus. The account provides comprehensive breaking news coverage with particular strength in US news, natural disasters, and major international events. ABC News maintains high journalistic standards and verification processes.

**Account Characteristics:**
- Verified major news organization
- 16M+ followers
- Frequent updates (60-80 tweets per day)
- Strong disaster and weather coverage
- International bureau network
- Live breaking news coverage
- Video-first reporting
- Good Balance of US and international news

**Intelligence Value:**
- Breaking news alerts
- Strong natural disaster coverage
- Political developments
- Security incidents
- International conflicts
- Mass casualty events
- Major accidents
- Public safety emergencies

## Data Collection Criteria

### Twitter Account Details

- **Handle**: ABC
- **Account Type**: Verified news organization
- **Follower Count**: ~16,000,000
- **Verification**: Twitter verified
- **Time Zone**: UTC/ET
- **Tweet Frequency**: 60-80 tweets per day
- **Engagement**: High (thousands of interactions)

### Collection Method

- **Method**: timeline
- **Poll Interval**: Every 5 minutes
- **Include Retweets**: No
- **Include Replies**: No
- **Include Quotes**: Yes
- **Thread Handling**: Collect threads for developing stories

### Content Filters

#### Include Criteria

- Breaking news alerts
- Natural disasters (hurricanes, earthquakes, wildfires)
- International conflicts
- Major accidents
- Terrorism and security incidents
- Political crises
- Mass casualty events
- Significant economic events

#### Exclude Criteria

- Celebrity news
- Entertainment coverage
- Sports (unless major event)
- Lifestyle features
- Opinion pieces
- Tweets older than 7 days

### Keyword Monitoring

**High-Priority Keywords:**
- Breaking, urgent, just in
- Hurricane, earthquake, tornado, wildfire, tsunami
- Attack, shooting, explosion, bombing
- Military, conflict, strike, troops
- Crash, collision, derailment
- Disaster, emergency, evacuation
- Casualties, killed, deaths, injured
- Active shooter, hostage
- War, invasion, coup

**Geographic Keywords:**
- US states (for disasters)
- Major world regions
- Conflict zones
- International capitals

**Event Type Keywords:**
- Crisis, emergency
- Protest, riot, unrest
- Cyberattack
- Sanctions, blockade
- Terror, terrorist

### Entity Extraction

**Event Information:**
- Event type (disaster, conflict, incident)
- Location (country, state, city)
- Casualties (deaths, injuries)
- Scale and severity
- Response actions (evacuations, emergency response)
- Timeline of developments

**Source Information:**
- ABC correspondent or bureau
- Official sources (government, emergency services)
- Video/photo evidence
- Verification status

## Expected Data Format

### Raw Tweet Object

```json
{
  "id": "1789056789012345678",
  "text": "BREAKING: Hurricane Category 5 storm making landfall in Florida. Sustained winds 160+ mph. Mandatory evacuations for coastal areas. Life-threatening storm surge expected.",
  "created_at": "2026-04-30T12:15:00Z",
  "author": {
    "id": "28785486",
    "username": "ABC",
    "name": "ABC News",
    "verified": true
  },
  "metrics": {
    "retweet_count": 8234,
    "like_count": 12456,
    "reply_count": 1234
  }
}
```

### Structured Data Extraction

```yaml
event:
  type: "natural-disaster"
  subtype: "hurricane"
  category: 5
  severity: "extreme"
  status: "occurring"

location:
  country: "United States"
  state: "Florida"
  area: "coastal areas"

impact:
  winds: "160+ mph"
  surge: "life-threatening storm surge"
  evacuations: "mandatory"
  threat_level: "life-threatening"

source:
  organization: "ABC News"
  reliability: "high"

priority: "critical"
alert: true
```

## Processing Instructions

### Data Extraction

1. **Fetch Timeline**
   ```javascript
   const endpoint = '/2/users/28785486/tweets';
   const params = {
     'tweet.fields': 'created_at,public_metrics,entities,attachments',
     'expansions': 'attachments.media_keys,referenced_tweets.id',
     'media.fields': 'url,alt_text,variants,preview_image_url',
     'max_results': 100
   };
   ```

2. **Initial Filtering**
   - Detect BREAKING or urgent indicators
   - Filter for high-impact events
   - Check priority keywords
   - Assess engagement velocity
   - Exclude entertainment/lifestyle content

3. **Entity Extraction**
   ```javascript
   function extractEntities(tweetText) {
     return {
       eventType: classifyEventType(tweetText),
       locations: extractLocations(tweetText),
       casualties: extractCasualties(tweetText),
       weatherData: extractWeatherData(tweetText),
       evacuations: extractEvacuationInfo(tweetText),
       urgency: assessUrgency(tweetText)
     };
   }
   
   function extractWeatherData(text) {
     return {
       category: extractHurricaneCategory(text),
       winds: extractWindSpeed(text),
       surge: extractStormSurge(text),
       warnings: extractWeatherWarnings(text)
     };
   }
   
   function extractEvacuationInfo(text) {
     const patterns = [
       /mandatory evacuation/i,
       /evacuation order/i,
       /residents urged to evacuate/i,
       /shelter in place/i
     ];
     return extractMatchingPatterns(text, patterns);
   }
   ```

4. **Context Analysis**
   - Link to ongoing disasters/crises
   - Identify first report vs update
   - Check for live coverage indicator
   - Extract video/photo evidence
   - Note official source attribution

5. **Significance Scoring**
   - High: BREAKING + major disaster/conflict, mass casualties
   - Medium: Significant regional events, political developments
   - Low: Updates, background, routine news

## Quality Indicators

### High Quality Signals

- **BREAKING tag**: Verified urgent news
- **Official source attribution**: NWS, USGS, government
- **Video evidence**: Live or recent footage
- **High engagement**: Rapid retweets indicate significance
- **Correspondent reporting**: On-scene coverage
- **Specific details**: Numbers, locations, measurements
- **Warning language**: Mandatory evacuations, life-threatening
- **Multiple updates**: Developing story coverage

### Medium Quality Signals

- Regional news without BREAKING
- Political statements
- Scheduled events
- Economic reports

### Low Priority Signals

- Entertainment news
- Feature stories
- Opinion content
- Historical context

## Validation Checklist

- [x] Twitter handle verified (@ABC)
- [x] Account is verified news organization
- [x] Collection method configured
- [x] Filters defined for high-impact events
- [x] Entity extraction patterns defined
- [x] Quality indicators specific
- [x] Priority calculation logic defined
- [ ] Authentication configured (TWITTER_API_KEY required)
- [ ] Rate limits monitored

## Monitoring & Maintenance

### Daily Checks
- API response success rate
- Tweet collection completeness
- Event detection accuracy
- Alert triggering appropriately

### Weekly Tasks
- Review event classification accuracy
- Update keyword lists
- Check engagement thresholds
- Verify disaster data extraction (categories, wind speeds)

### Monthly Tasks
- Audit priority assignments
- Review geographic coverage
- Validate reliability score (maintain 85+)
- Update filters based on content patterns

## Related Sources

Complementary news sources:
- @AP - Highest reliability standard
- @CNN - Alternative major network
- @NBCNews - Third major network
- @CBSNews - Fourth major network
- @weatherchannel - Specialized weather coverage
