---
id: twitter-cnn
name: CNN - Breaking News & World Events
type: twitter
status: active
description: |
  CNN's main Twitter account provides comprehensive breaking news coverage
  including US and international events, politics, disasters, and major
  developments. Fast-breaking coverage with strong resources worldwide.
created_date: "2026-04-30"
last_updated: "2026-04-30"
tags:
  - osint
  - breaking-news
  - world-events
  - politics
  - disaster
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
  - attack
  - explosion
  - shooting
  - conflict
  - military
  - disaster
  - earthquake
  - hurricane
---

# CNN - Breaking News & World Events

## Overview

CNN (@CNN) is the main Twitter account for Cable News Network, one of the world's leading 24/7 news organizations. The account provides comprehensive breaking news coverage with particular strength in US and international events, political developments, natural disasters, and security incidents.

**Account Characteristics:**
- Verified major news organization
- 66M+ followers (one of largest news accounts)
- Very frequent updates (100+ tweets per day)
- Mix of US and international coverage
- Fast-breaking news alerts
- Strong video and live coverage
- Multiple bureaus worldwide
- Quick on-scene reporting

**Intelligence Value:**
- Rapid breaking news alerts
- Major US and international events
- Political developments and crises
- Natural disasters with live coverage
- Security incidents and active situations
- Economic market-moving events
- Military and conflict developments
- Public safety emergencies

## Data Collection Criteria

### Twitter Account Details

- **Handle**: CNN
- **Account Type**: Verified news organization
- **Follower Count**: ~66,000,000
- **Verification**: Twitter verified
- **Time Zone**: UTC/ET
- **Tweet Frequency**: 100-150 tweets per day
- **Engagement**: Very high (thousands to tens of thousands)

### Collection Method

- **Method**: timeline
- **Poll Interval**: Every 5 minutes
- **Include Retweets**: No
- **Include Replies**: No
- **Include Quotes**: Yes
- **Thread Handling**: Collect threads for major developing stories

### Content Filters

#### Include Criteria

- Breaking news (BREAKING tag)
- International conflicts and military action
- Natural disasters
- Major accidents and incidents
- Terrorism and security events
- Political crises
- Mass casualty events
- Significant economic events

#### Exclude Criteria

- Routine political coverage (unless crisis)
- Celebrity news
- Sports (unless major event with broader impact)
- Opinion pieces
- Feature stories
- Tweets older than 7 days

### Keyword Monitoring

**High-Priority Keywords:**
- Breaking, urgent, just in
- Attack, shooting, explosion, bombing
- Military, troops, strike, missile
- Earthquake, hurricane, tornado, tsunami, wildfire
- Crash, collision, derailment
- Active shooter, hostage
- Evacuation, emergency
- Casualties, deaths, killed, injured
- Conflict, war, invasion

**Geographic Keywords:**
- Major world conflict zones
- US states (for disasters/emergencies)
- International capitals
- Strategic locations

**Event Type Keywords:**
- Disaster, crisis, emergency
- Protest, riot, unrest
- Cyberattack, hack
- Coup, assassination
- Sanctions, embargo

### Entity Extraction

**Event Information:**
- Event type (disaster, conflict, incident, etc.)
- Location (country, state, city)
- Casualties (deaths, injuries)
- Response (evacuations, emergency services)
- Scale and severity
- Timeline

**Source Information:**
- CNN bureau or correspondent
- Official sources (government, police, etc.)
- Witness reports
- Video/photo evidence

## Expected Data Format

### Raw Tweet Object

```json
{
  "id": "1789034567890123456",
  "text": "BREAKING: Major earthquake strikes California. USGS reports magnitude 6.8 quake centered near Los Angeles. Buildings shaking across Southern California. Tsunami warning issued for coastal areas.",
  "created_at": "2026-04-30T10:45:00Z",
  "author": {
    "id": "759251",
    "username": "CNN",
    "name": "CNN",
    "verified": true
  },
  "metrics": {
    "retweet_count": 12456,
    "like_count": 18234,
    "reply_count": 2341
  }
}
```

### Structured Data Extraction

```yaml
event:
  type: "natural-disaster"
  subtype: "earthquake"
  severity: "major"
  magnitude: 6.8
  status: "developing"

location:
  country: "United States"
  state: "California"
  epicenter: "near Los Angeles"
  affected_region: "Southern California"

impact:
  effects: "buildings shaking"
  warnings: "tsunami warning issued"
  areas: "coastal areas"

source:
  organization: "CNN"
  data_source: "USGS"
  reliability: "high"

priority: "high"
alert: true
```

## Processing Instructions

### Data Extraction

1. **Fetch Timeline**
   ```javascript
   const endpoint = '/2/users/759251/tweets';
   const params = {
     'tweet.fields': 'created_at,public_metrics,entities,attachments',
     'expansions': 'attachments.media_keys,referenced_tweets.id',
     'media.fields': 'url,alt_text,variants,preview_image_url',
     'max_results': 100
   };
   ```

2. **Initial Filtering**
   - Detect BREAKING or urgent indicators
   - Filter for high-impact events (exclude routine news)
   - Check priority keywords
   - Assess engagement rate (viral = significant)
   - Identify crisis vs routine coverage

3. **Entity Extraction**
   ```javascript
   function extractEntities(tweetText) {
     return {
       eventType: classifyEventType(tweetText),
       locations: extractLocations(tweetText),
       casualties: extractCasualties(tweetText),
       scale: assessEventScale(tweetText),
       urgency: assessUrgency(tweetText),
       warnings: extractWarnings(tweetText)
     };
   }
   
   function extractWarnings(text) {
     const warningPatterns = [
       /tsunami warning/i,
       /evacuation (?:order|mandatory)/i,
       /shelter in place/i,
       /emergency alert/i,
       /imminent threat/i
     ];
     return extractMatchingPatterns(text, warningPatterns);
   }
   ```

4. **Context Analysis**
   - Link to ongoing crisis/disaster
   - Identify first report vs update
   - Check for live coverage indicator
   - Extract video/photo evidence
   - Note official source attribution

5. **Significance Scoring**
   - High: BREAKING + major disaster/conflict/attack, mass casualties
   - Medium: Significant regional events, political developments
   - Low: Updates, background, routine news

## Quality Indicators

### High Quality Signals

- **BREAKING tag**: Verified urgent news
- **Official source attribution**: USGS, government, police
- **Video evidence**: Live or recent footage
- **High engagement velocity**: Rapid viral spread
- **Correspondent reporting**: On-scene coverage
- **Multiple updates**: Developing story
- **Specific details**: Numbers, locations, times
- **Warning/alert language**: Emergency indicators

### Medium Quality Signals

- Regional news without BREAKING tag
- Political statements or announcements
- Scheduled events (votes, summits)
- Economic reports

### Low Priority Signals

- Opinion pieces
- Analysis threads
- Entertainment news
- Feature stories
- Historical context

## Validation Checklist

- [x] Twitter handle verified (@CNN)
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
- High-impact event detection accuracy
- Alert triggering appropriately

### Weekly Tasks
- Review event classification accuracy
- Update keyword lists
- Check engagement thresholds
- Verify casualty extraction

### Monthly Tasks
- Audit priority assignments
- Review geographic coverage
- Validate reliability score (maintain 85+)
- Update filters based on content patterns

## Related Sources

Complementary news sources:
- @cnnbrk - Dedicated breaking news alerts
- @cnni - International focus
- @AP - Higher verification standard
- @ABC - Alternative major network
