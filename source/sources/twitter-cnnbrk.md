---
id: twitter-cnnbrk
name: CNN Breaking News - Immediate Alerts
type: twitter
status: active
description: |
  CNN Breaking News is CNN's dedicated breaking news alert account,
  delivering only the most urgent and significant news updates. Minimal
  noise, maximum signal. Essential for immediate awareness of major
  world events, disasters, and breaking developments.
created_date: "2026-04-30"
last_updated: "2026-04-30"
tags:
  - osint
  - breaking-news
  - alerts
  - urgent
  - world-events
  - disasters
  - conflict
reliability: high
confidence_score: 90
update_frequency: "5m"
priority: critical
language:
  - en
geographic_focus:
  - global
cost: free
requires_auth: true
maintainer: osint-team
alert_keywords:
  - breaking
  - urgent
  - attack
  - explosion
  - military
  - disaster
  - earthquake
  - shooting
  - casualties
  - emergency
---

# CNN Breaking News - Immediate Alerts

## Overview

CNN Breaking News (@cnnbrk) is CNN's dedicated breaking news alert account, designed to deliver only the most significant and urgent news updates. Unlike CNN's main account, @cnnbrk has a much higher signal-to-noise ratio, posting only when major events occur. This makes it an essential high-priority source for world event monitoring.

**Account Characteristics:**
- Verified news organization
- 66M+ followers
- Low-frequency, high-impact tweets (5-20 per day)
- Only major breaking news
- Minimal commentary, maximum information
- Very high reliability threshold
- Global coverage (US and international)
- Quick, concise alerts

**Intelligence Value:**
- Immediate awareness of major events
- High signal-to-noise ratio
- Only significant breaking news
- First alert on major disasters
- Critical security incidents
- Major political developments
- Mass casualty events
- Large-scale military actions

## Data Collection Criteria

### Twitter Account Details

- **Handle**: cnnbrk
- **Account Type**: Verified news organization (breaking alerts)
- **Follower Count**: ~66,000,000
- **Verification**: Twitter verified
- **Time Zone**: UTC/ET
- **Tweet Frequency**: 5-20 tweets per day (only major events)
- **Engagement**: Very high (tens of thousands per tweet)

### Collection Method

- **Method**: timeline
- **Poll Interval**: Every 5 minutes
- **Include Retweets**: No
- **Include Replies**: No
- **Include Quotes**: No
- **Thread Handling**: Collect full thread (rare, but important)

### Content Filters

#### Include Criteria

- ALL tweets from @cnnbrk (pre-filtered by CNN)
- Breaking news alerts
- Major disasters
- Significant conflicts
- Large-scale attacks
- Political crises
- Mass casualty events
- Critical security incidents

#### Exclude Criteria

- Very minimal exclusion needed
- Possibly exclude corrections/retractions (flag for review)
- Tweets older than 7 days

### Keyword Monitoring

**High-Priority Keywords (Most tweets will match):**
- Breaking news
- Attack, explosion, shooting, bombing
- Military, strike, missile, troops
- Earthquake, hurricane, tsunami, tornado, wildfire
- Casualties, killed, dead, injured
- Emergency, evacuation
- Crash, collision
- Conflict, war, invasion
- Coup, assassination
- Disaster, crisis

**All @cnnbrk tweets are inherently high-priority due to account's curation**

### Entity Extraction

**Event Information:**
- Event type (disaster, attack, conflict, etc.)
- Location (country, state, city)
- Casualties (deaths, injuries)
- Scale indicators
- Time of occurrence
- Immediate impact

**Source Information:**
- CNN verification
- Official sources referenced
- Video/photo evidence when available

## Expected Data Format

### Raw Tweet Object

```json
{
  "id": "1789045678901234567",
  "text": "At least 50 people killed in suicide bombing at marketplace in Baghdad, Iraqi officials say. More than 100 injured. ISIS claims responsibility.",
  "created_at": "2026-04-30T11:30:00Z",
  "author": {
    "id": "428333",
    "username": "cnnbrk",
    "name": "CNN Breaking News",
    "verified": true
  },
  "metrics": {
    "retweet_count": 24567,
    "like_count": 31234,
    "reply_count": 4567
  }
}
```

### Structured Data Extraction

```yaml
event:
  type: "terrorism"
  subtype: "suicide-bombing"
  severity: "major"
  status: "occurred"

location:
  country: "Iraq"
  city: "Baghdad"
  specific_location: "marketplace"

impact:
  casualties:
    killed: 50
    injured: 100
    qualifier: "at least, more than"
  
actors:
  responsible: "ISIS"
  claim_status: "claimed"

source:
  organization: "CNN Breaking News"
  attribution: "Iraqi officials"
  reliability: "very-high"

priority: "critical"
alert: true
```

## Processing Instructions

### Data Extraction

1. **Fetch Timeline**
   ```javascript
   const endpoint = '/2/users/428333/tweets';
   const params = {
     'tweet.fields': 'created_at,public_metrics,entities,attachments',
     'expansions': 'attachments.media_keys,referenced_tweets.id',
     'media.fields': 'url,alt_text,variants',
     'max_results': 100
   };
   ```

2. **Initial Filtering**
   - ALL tweets from @cnnbrk should be collected
   - Every tweet is inherently high-priority
   - No need for keyword filtering (CNN has pre-filtered)
   - Focus on rapid collection and processing

3. **Entity Extraction**
   ```javascript
   function extractEntities(tweetText) {
     return {
       eventType: classifyEventType(tweetText),
       locations: extractLocations(tweetText),
       casualties: extractDetailedCasualties(tweetText),
       actors: extractActors(tweetText),
       claims: extractClaims(tweetText),
       scale: assessEventScale(tweetText)
     };
   }
   
   function extractDetailedCasualties(text) {
     const patterns = {
       killed: /(\d+) (?:people )?(?:killed|dead|deaths)/i,
       injured: /(\d+) (?:people )?(?:injured|wounded|hurt)/i,
       qualifier: /(at least|more than|up to|estimated|approximately)/i
     };
     
     return {
       killed: extractNumber(text, patterns.killed),
       injured: extractNumber(text, patterns.injured),
       qualifier: patterns.qualifier.test(text)
     };
   }
   
   function extractClaims(text) {
     const claimPattern = /([A-Z][A-Za-z\s]+) (?:claims?|takes?|claimed) responsibility/i;
     const match = text.match(claimPattern);
     return match ? match[1] : null;
   }
   ```

4. **Context Analysis**
   - Link to ongoing conflicts/situations
   - Check for follow-up tweets (updates)
   - Extract any linked articles
   - Note official source attribution
   - Assess completeness of information

5. **Significance Scoring**
   - ALL tweets from @cnnbrk are HIGH or CRITICAL priority
   - Mass casualties (50+) = CRITICAL
   - Major disasters = CRITICAL
   - Significant attacks/conflicts = HIGH
   - Political crises = HIGH

## Quality Indicators

### High Quality Signals (Nearly all tweets)

- **Source verification**: CNN's internal verification process
- **Casualty figures**: Specific numbers with attribution
- **Official source quotes**: Government, police, military
- **Location specificity**: City and specific location
- **Actor identification**: Who is responsible
- **Very high engagement**: Community recognition of significance
- **Concise clarity**: Key facts without speculation
- **Attribution clear**: "officials say", "reports indicate"

### Verification Notes

- @cnnbrk has internal CNN verification before posting
- Account rarely posts unverified information
- If posted, assume CNN has verified through multiple sources
- Still extract attribution for transparency

## Processing Priority

**CRITICAL Priority Processing:**
- @cnnbrk tweets should trigger immediate processing
- Generate alerts faster than other sources
- Skip normal filtering (all tweets are pre-filtered)
- Process in real-time, not batch
- Immediate notification to monitoring systems

## Validation Checklist

- [x] Twitter handle verified (@cnnbrk)
- [x] Account is verified breaking news alert account
- [x] Collection method configured for real-time
- [x] All tweets treated as high-priority
- [x] Entity extraction patterns defined
- [x] Quality indicators documented
- [x] CRITICAL priority processing configured
- [ ] Authentication configured (TWITTER_API_KEY required)
- [ ] Real-time alert system configured
- [ ] Rate limits monitored

## Monitoring & Maintenance

### Real-Time Monitoring
- @cnnbrk tweets should trigger immediate alerts
- Monitor API latency (must be <1 minute)
- Ensure no missed tweets
- Verify alert delivery

### Daily Checks
- Collection completeness (zero tolerance for missed tweets)
- Entity extraction accuracy
- Alert delivery success rate
- Processing latency

### Weekly Tasks
- Review all collected events
- Validate casualty extraction accuracy
- Check attribution parsing
- Verify actor identification

### Monthly Tasks
- Audit alert delivery times
- Review classification accuracy
- Validate reliability score (maintain 90+)
- Analyze tweet patterns for any changes

## Related Sources

Complementary breaking news sources:
- @AP - Highest reliability, similar breaking focus
- @BBCBreaking - British perspective on major events
- @Reuters - Business/financial breaking news
- @CNN - Full coverage with context
- @cnni - International depth

## Special Notes

**Why @cnnbrk is Critical:**
- Pre-filtered by CNN's editorial standards
- Only major events that meet CNN's breaking news threshold
- Higher signal-to-noise ratio than almost any other source
- Rapid posting after verification
- Concise format perfect for alerts

**Alert Configuration:**
- Every @cnnbrk tweet should generate system alert
- Priority: CRITICAL for mass casualties, major disasters
- Priority: HIGH for all other tweets
- Process immediately, don't wait for batch cycles
- Notify downstream systems in real-time
