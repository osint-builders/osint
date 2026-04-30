---
id: twitter-cnni
name: CNN International - Global Breaking News
type: twitter
status: active
description: |
  CNN International provides 24/7 breaking news coverage focused on
  international events, conflicts, and global politics. Strong presence
  in Asia, Europe, Middle East, and Africa. Excellent for non-US world
  events and real-time crisis coverage.
created_date: "2026-04-30"
last_updated: "2026-04-30"
tags:
  - osint
  - breaking-news
  - international
  - world-events
  - conflict
  - crisis
reliability: high
confidence_score: 85
update_frequency: "5m"
priority: high
language:
  - en
geographic_focus:
  - global
  - asia
  - europe
  - middle-east
  - africa
cost: free
requires_auth: true
maintainer: osint-team
alert_keywords:
  - breaking
  - urgent
  - conflict
  - military
  - attack
  - explosion
  - crisis
  - war
  - missile
  - troops
---

# CNN International - Global Breaking News

## Overview

CNN International (@cnni) is CNN's dedicated international news service, providing 24/7 coverage of global events with emphasis on non-US news. CNNI has strong bureaus across Asia, Europe, Middle East, and Africa, making it essential for international event monitoring.

**Account Characteristics:**
- Verified news organization
- 19M+ followers
- Frequent updates (hourly to minute-by-minute during crises)
- Strong international bureau network
- Focus on global perspective
- Live breaking news coverage
- Video-first reporting
- On-the-ground correspondents worldwide

**Intelligence Value:**
- Real-time international crisis coverage
- Strong Middle East and Asia coverage
- European political developments
- Global conflict monitoring
- Natural disasters worldwide
- International terrorism and security
- Diplomatic developments
- Regional tensions and protests

## Data Collection Criteria

### Twitter Account Details

- **Handle**: cnni
- **Account Type**: Verified news organization
- **Follower Count**: ~19,000,000
- **Verification**: Twitter verified
- **Time Zone**: UTC/GMT
- **Tweet Frequency**: 40-80 tweets per day
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

- Breaking international news
- Conflict and military developments
- Political crises and coups
- Natural disasters (non-US focus)
- Terrorism and security incidents
- Regional tensions
- Major accidents or incidents
- Diplomatic developments

#### Exclude Criteria

- US domestic news (unless global impact)
- Sports (unless major international event)
- Entertainment news
- Business news (unless crisis-level)
- Tweets older than 7 days

### Keyword Monitoring

**High-Priority Keywords:**
- Breaking, urgent, developing
- Conflict, war, military, attack, airstrike
- Explosion, bombing, shooting, missile
- Troops, deployment, invasion
- Coup, uprising, protest
- Earthquake, typhoon, cyclone, tsunami
- Terror, terrorist, hostage
- Sanctions, blockade
- Crisis, emergency, evacuate

**Geographic Keywords:**
- Middle East: Iran, Israel, Syria, Yemen, Iraq
- Asia: China, Taiwan, North Korea, Myanmar
- Europe: Russia, Ukraine, Balkans
- Africa: conflict zones, coups
- Latin America: political instability

**Event Type Keywords:**
- Casualties, deaths, injured
- Strike, raid, offensive
- Ceasefire, truce, negotiation
- Refugee, displaced, humanitarian

### Entity Extraction

**Event Information:**
- Event type and category
- Location (country, region, city)
- Casualty figures
- Military units or actors involved
- Timeline of developments
- Impact assessment

**Source Information:**
- CNN bureau reporting
- Video/photo evidence
- Live coverage indicators
- Correspondent attribution

## Expected Data Format

### Raw Tweet Object

```json
{
  "id": "1789023456789012345",
  "text": "BREAKING: Missile strikes reported in eastern Ukraine. Multiple impacts in Dnipro region. Ukrainian officials say at least 12 injured. More details coming.",
  "created_at": "2026-04-30T09:15:00Z",
  "author": {
    "id": "2097571",
    "username": "cnni",
    "name": "CNN International",
    "verified": true
  },
  "metrics": {
    "retweet_count": 3421,
    "like_count": 5678,
    "reply_count": 456
  }
}
```

### Structured Data Extraction

```yaml
event:
  type: "military-conflict"
  subtype: "missile-strike"
  severity: "significant"
  status: "developing"

location:
  country: "Ukraine"
  region: "Dnipro region"
  specificity: "regional"

impact:
  casualties:
    injured: 12
    status: "at least"
  damage: "multiple impacts"

source:
  organization: "CNN International"
  reliability: "high"
  attribution: "Ukrainian officials"

priority: "high"
alert: true
```

## Processing Instructions

### Data Extraction

1. **Fetch Timeline**
   ```javascript
   const endpoint = '/2/users/2097571/tweets';
   const params = {
     'tweet.fields': 'created_at,public_metrics,entities,attachments',
     'expansions': 'attachments.media_keys,referenced_tweets.id',
     'media.fields': 'url,alt_text,variants,preview_image_url',
     'max_results': 100
   };
   ```

2. **Initial Filtering**
   - Detect breaking news indicators
   - Filter for international focus (not US domestic)
   - Check high-priority keywords
   - Assess engagement velocity
   - Identify crisis/conflict content

3. **Entity Extraction**
   ```javascript
   function extractEntities(tweetText) {
     return {
       eventType: classifyEventType(tweetText),
       locations: extractInternationalLocations(tweetText),
       casualties: extractCasualties(tweetText),
       militaryActors: extractMilitaryActors(tweetText),
       urgency: assessUrgency(tweetText),
       attribution: extractSourceAttribution(tweetText)
     };
   }
   
   function extractMilitaryActors(text) {
     const patterns = [
       /(?:troops|forces|military|army|units) (?:from|of) ([A-Z][a-z]+)/g,
       /([A-Z][a-z]+) (?:military|forces|troops)/g,
       /(rebel|militant|insurgent) groups?/g
     ];
     return extractMatchingPatterns(text, patterns);
   }
   ```

4. **Context Analysis**
   - Link to ongoing conflicts/crises
   - Identify update vs new event
   - Extract video/photo evidence
   - Note correspondent location
   - Track developing story patterns

5. **Significance Scoring**
   - High: BREAKING + conflict/crisis/disaster, major casualties
   - Medium: Significant regional developments, political events
   - Low: Updates, background, routine developments

## Quality Indicators

### High Quality Signals

- **BREAKING tag**: Verified urgent news
- **Bureau/correspondent attribution**: Direct reporting
- **Video/photo evidence**: Visual confirmation
- **Specific casualty figures**: Concrete details
- **Official source quotes**: Government/military attribution
- **High engagement**: Community validation
- **Live coverage indicator**: Real-time reporting
- **Multiple tweets on topic**: Developing story coverage

### Medium Quality Signals

- General regional updates
- Political statements without action
- Scheduled events (summits, votes)
- Background analysis pieces

### Low Priority Signals

- Opinion pieces
- Feature stories
- Historical context threads
- Business news
- Entertainment coverage

## Validation Checklist

- [x] Twitter handle verified (@cnni)
- [x] Account is verified news organization
- [x] Collection method configured
- [x] International focus filters defined
- [x] Entity extraction patterns defined
- [x] Quality indicators specific
- [x] Priority calculation logic defined
- [ ] Authentication configured (TWITTER_API_KEY required)
- [ ] Rate limits monitored

## Monitoring & Maintenance

### Daily Checks
- API response success rate
- Tweet collection completeness
- International focus maintained (not drowning in US news)
- Alert keywords triggering appropriately

### Weekly Tasks
- Review high-priority event accuracy
- Update keyword lists
- Check for content drift toward US news
- Verify casualty extraction accuracy

### Monthly Tasks
- Audit event classification
- Review geographic coverage balance
- Validate reliability score (maintain 85+)
- Update filters for content patterns

## Related Sources

Complementary international news sources:
- @AP - Highest reliability standard
- @BBCWorld - British perspective
- @Reuters - Business/financial angle
- @AlJazeera - Middle East depth
