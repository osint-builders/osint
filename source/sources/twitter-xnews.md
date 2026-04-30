---
id: twitter-xnews
name: X News - Platform Breaking News
type: twitter
status: active
description: |
  X News (formerly Twitter News) is the official news account of the
  X platform, aggregating breaking news from verified sources. Provides
  rapid alerts on major events with multi-source validation. Useful for
  early detection of emerging stories across diverse sources.
created_date: "2026-04-30"
last_updated: "2026-04-30"
tags:
  - osint
  - breaking-news
  - aggregated-news
  - platform-curated
  - world-events
  - multi-source
reliability: medium
confidence_score: 75
update_frequency: "5m"
priority: medium
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
  - developing
  - major
  - significant
  - alert
---

# X News - Platform Breaking News

## Overview

X News (@XNews) is the official news account of the X platform (formerly Twitter), providing curated breaking news alerts aggregated from verified news sources. The account serves as a meta-source, highlighting major stories that are breaking across multiple news outlets on the platform. This makes it useful for early detection of emerging stories and understanding what the platform's algorithm identifies as significant.

**Account Characteristics:**
- Official X platform account
- Verified platform account
- Moderate frequency (20-40 tweets per day)
- Aggregates news from multiple sources
- Algorithmic curation with editorial oversight
- Links to trending news on platform
- Multi-source validation before posting
- Global coverage

**Intelligence Value:**
- Early detection of viral news stories
- Platform-level view of breaking news
- Multi-source validation (what multiple outlets report)
- Trending event identification
- Diverse source aggregation
- Real-time news velocity indicator
- Alternative to single-source monitoring

## Data Collection Criteria

### Twitter Account Details

- **Handle**: XNews
- **Account Type**: Official platform account
- **Verification**: Platform verified
- **Time Zone**: UTC
- **Tweet Frequency**: 20-40 tweets per day
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
- Major international events
- Significant political developments
- Natural disasters
- Security incidents
- Mass casualty events
- Trending news stories
- Multi-outlet reported events

#### Exclude Criteria

- Entertainment news (unless major cultural event)
- Sports (unless exceptional circumstances)
- Technology product launches
- Social media trends without news value
- Tweets older than 7 days

### Keyword Monitoring

**High-Priority Keywords:**
- Breaking, developing, urgent
- Major, significant, unprecedented
- Attack, explosion, shooting
- Disaster, emergency, crisis
- Conflict, military, war
- Casualties, deaths, killed
- Earthquake, hurricane, tsunami
- Political crisis, coup, protest

**Meta-News Indicators:**
- "Multiple sources report"
- "According to reports"
- "Developing story"
- "Major news"
- Links to trending topics

### Entity Extraction

**Event Information:**
- Event type
- Location
- Scale and impact
- Source attribution (which outlets reporting)
- Trending status
- Multi-source confirmation

**Source Information:**
- Which news outlets cited
- Platform trending status
- Engagement velocity
- Cross-source validation

## Expected Data Format

### Raw Tweet Object

```json
{
  "id": "1789090123456789012",
  "text": "BREAKING: Major earthquake reported in Turkey. Multiple sources reporting magnitude 7.0+ quake. Widespread damage in several cities. More details emerging.",
  "created_at": "2026-04-30T16:00:00Z",
  "author": {
    "id": "XNewsID",
    "username": "XNews",
    "name": "X News"
  },
  "metrics": {
    "retweet_count": 12345,
    "like_count": 23456,
    "reply_count": 3456
  }
}
```

### Structured Data Extraction

```yaml
event:
  type: "natural-disaster"
  subtype: "earthquake"
  magnitude: "7.0+"
  status: "emerging"

location:
  country: "Turkey"
  scope: "several cities"

reporting:
  multi_source: true
  status: "multiple sources reporting"
  detail_level: "emerging"

source:
  organization: "X News"
  type: "aggregated"
  reliability: "medium"
  validation: "multi-source"

priority: "medium-high"
alert: true
```

## Processing Instructions

### Data Extraction

1. **Fetch Timeline**
   ```javascript
   const endpoint = '/2/users/{XNewsID}/tweets';
   const params = {
     'tweet.fields': 'created_at,public_metrics,entities,attachments',
     'expansions': 'attachments.media_keys,referenced_tweets.id',
     'media.fields': 'url,alt_text,variants',
     'max_results': 100
   };
   ```

2. **Initial Filtering**
   - Focus on breaking news indicators
   - Check for multi-source validation language
   - Prioritize developing stories
   - Filter entertainment/lifestyle
   - Assess platform-level significance

3. **Entity Extraction**
   ```javascript
   function extractEntities(tweetText) {
     return {
       eventType: classifyEventType(tweetText),
       locations: extractLocations(tweetText),
       multiSource: detectMultiSourceReporting(tweetText),
       developingStatus: assessDevelopingStatus(tweetText),
       urgency: assessUrgency(tweetText)
     };
   }
   
   function detectMultiSourceReporting(text) {
     const multiSourcePatterns = [
       /multiple sources? (?:report|confirm|say)/i,
       /according to (?:reports|multiple outlets)/i,
       /various news (?:outlets|agencies)/i,
       /widespread reports/i
     ];
     return multiSourcePatterns.some(p => p.test(text));
   }
   
   function assessDevelopingStatus(text) {
     const developingPatterns = [
       /developing story/i,
       /more details emerging/i,
       /breaking:/i,
       /just in:/i,
       /unfolding/i
     ];
     return developingPatterns.some(p => p.test(text));
   }
   ```

4. **Context Analysis**
   - Check which sources are reporting (from links)
   - Assess platform trending status
   - Note information completeness
   - Identify if first alert or follow-up
   - Evaluate engagement velocity

5. **Significance Scoring**
   - High: Breaking + major disaster/conflict + multi-source
   - Medium: Significant events, developing stories
   - Low: Single-source, unverified, or lower-impact news

## Quality Indicators

### High Quality Signals

- **Multi-source attribution**: "Multiple sources report"
- **Breaking tag**: Urgent news indicator
- **High engagement velocity**: Rapid viral spread
- **Platform trending**: Featured on X trending topics
- **Specific details**: Numbers, locations, facts
- **Major news outlets cited**: AP, Reuters, BBC, CNN
- **Developing story tag**: Ongoing coverage

### Medium Quality Signals

- Single-source reports (but platform-curated)
- Regional news
- Political statements
- Economic news

### Lower Quality Signals

- Vague "reports say" without specifics
- No multi-source validation
- Entertainment/celebrity news
- Technology news without broader impact

## Quality Considerations

**Aggregated Source Nature:**
- X News is a meta-source, not original reporting
- Reliability depends on underlying sources
- Value is in early detection and multi-source validation
- Should be verified against primary sources (AP, Reuters, BBC)
- Useful for identifying what's trending/significant
- Less reliable than direct news organizations
- Better for discovering stories than sole verification

**Reliability Adjustments:**
- Multi-source reports: Higher reliability
- Single vague reports: Lower reliability
- Cross-reference with @AP, @BBCBreaking, @Reuters
- Treat as early warning system, not final source
- Use to discover, then verify with primary sources

## Validation Checklist

- [x] Twitter handle verified (@XNews)
- [x] Account is official platform account
- [x] Collection method configured
- [x] Aggregated source nature documented
- [x] Entity extraction patterns defined
- [x] Multi-source detection implemented
- [x] Quality considerations documented
- [ ] Authentication configured (TWITTER_API_KEY required)
- [ ] Cross-source verification workflow defined
- [ ] Rate limits monitored

## Monitoring & Maintenance

### Daily Checks
- API response success rate
- Tweet collection completeness
- Multi-source detection accuracy
- Cross-source verification functioning

### Weekly Tasks
- Review event classification accuracy
- Check which underlying sources most cited
- Update keyword lists
- Verify developing story tracking

### Monthly Tasks
- Audit reliability vs primary sources
- Review priority assignments
- Validate confidence score (maintain 75+)
- Assess value for early detection
- Update cross-reference procedures

## Related Sources

Primary sources for verification:
- @AP - Highest reliability primary source
- @Reuters - Business/international primary source
- @BBCBreaking - International primary source
- @cnnbrk - US primary source

Complementary aggregated sources:
- Google News alerts
- News aggregator APIs

## Special Notes

**Best Use Cases for X News:**

1. **Early Detection**: Often posts shortly after major news breaks
2. **Multi-Source Validation**: Indicates multiple outlets reporting
3. **Trending Identification**: Shows what platform considers significant
4. **Coverage Gaps**: May highlight stories missed by US-centric sources
5. **Platform Pulse**: Understanding real-time news velocity

**Limitations:**

1. **Not Primary Source**: Always verify with original reporting
2. **Algorithm Dependent**: Curation may have biases
3. **Variable Quality**: Depends on underlying sources
4. **Less Detail**: Aggregated nature means less depth
5. **Verification Lag**: May post before full verification

**Recommended Workflow:**

1. X News alerts to potential significant event
2. Immediately check @AP, @BBCBreaking, @Reuters
3. If confirmed by primary sources, proceed with high confidence
4. If only X News reporting, flag as unverified/developing
5. Use for discovery, not final verification
