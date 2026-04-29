---
id: twitter-example-account
name: Example Twitter OSINT Account
type: twitter
status: testing
description: |
  Example Twitter source for monitoring world events. This account tweets
  breaking news, geopolitical updates, and crisis information relevant to
  global event tracking.
created_date: 2026-04-29
last_updated: 2026-04-29
tags:
  - world-events
  - breaking-news
  - geopolitical
  - crisis-monitoring
reliability: high
confidence_score: 85
update_frequency: "5m"
priority: high
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
  - crisis
  - conflict
  - disaster
  - emergency
---

# Twitter Source: Example OSINT Account

## Overview

This is a high-reliability Twitter account specializing in real-time reporting of significant world events. The account has a track record of accurate, timely information with verification processes in place. Content includes breaking news, crisis updates, conflict monitoring, and geopolitical analysis.

**Account Characteristics:**
- Verified account
- 500K+ followers
- Average response time: 5-15 minutes from event occurrence
- Tweet frequency: 20-30 per day
- Engagement rate: High (1K+ interactions per tweet)

## Data Collection Criteria

### Twitter Account Details
- **Handle**: example_osint
- **User ID**: 1234567890
- **Account Type**: News aggregator / OSINT collective
- **Follower Count**: ~500,000
- **Verification**: Verified ✓
- **Account Created**: 2020-01-15
- **Time Zone**: UTC

### Collection Method
- **Method**: timeline
- **Poll Interval**: Every 5 minutes
- **Include Retweets**: No (unless from verified accounts)
- **Include Replies**: No (only original tweets and quote tweets)
- **Include Quotes**: Yes
- **Thread Handling**: Collect entire thread when detected

### Content Filters

#### Include Criteria
- Tweets containing geopolitical keywords
- Tweets with location tags
- Tweets with media (images/videos of events)
- Tweets with minimum 100 likes OR 50 retweets
- Tweets marked with alert hashtags

#### Exclude Criteria
- Pure opinion/analysis tweets (unless tagged #analysis)
- Promotional content
- Off-topic discussions
- Tweets older than 7 days (archive separately)

### Keyword Monitoring
**High-Priority Keywords:**
- breaking, urgent, developing
- conflict, war, military
- earthquake, tsunami, disaster
- explosion, attack, incident
- coup, revolution, protest
- sanctions, embargo, treaty

**Location Keywords:**
- Country names
- Major cities
- Conflict zones
- Strategic locations

### Hashtag Monitoring
- #breaking
- #worldnews
- #osint
- #geopolitics
- #crisis
- [Any trending geopolitical hashtags]

## Expected Data Format

### Raw Tweet Object
```json
{
  "id": "1234567890",
  "text": "BREAKING: Major development in Region X...",
  "created_at": "2026-04-29T14:32:00Z",
  "author": {
    "id": "1234567890",
    "username": "example_osint",
    "name": "Example OSINT"
  },
  "metrics": {
    "retweet_count": 234,
    "like_count": 567,
    "reply_count": 89
  },
  "entities": {
    "hashtags": ["breaking", "worldnews"],
    "urls": ["https://source.com/article"],
    "mentions": []
  },
  "geo": {
    "place_id": "...",
    "coordinates": [...]
  },
  "media": [
    {
      "type": "photo",
      "url": "https://pbs.twimg.com/..."
    }
  ]
}
```

## Processing Instructions

### Data Extraction

1. **Fetch Timeline**
   - Use Twitter API v2 `/users/{id}/tweets` endpoint
   - Include expansions: `author_id,geo.place_id,attachments.media_keys`
   - Include fields: `created_at,public_metrics,entities,geo`

2. **Initial Filtering**
   - Check tweet age (< 7 days)
   - Verify not a reply (unless quote tweet)
   - Check engagement threshold
   - Verify keyword match

3. **Content Analysis**
   - Extract main event description from tweet text
   - Identify if part of thread (collect full context)
   - Extract mentioned locations
   - Classify event type based on keywords
   - Determine urgency level

### Transformation to World Event Entity

```markdown
**Title Extraction:**
- Remove hashtags and URLs
- Extract first sentence or up to 100 characters
- Clean up formatting (caps, emojis)

**Date:**
- Use tweet `created_at` timestamp
- Convert to ISO 8601 format

**Location:**
- Extract from geo tag if available
- Parse location mentions from text
- Use geocoding if needed
- Default to "Unknown" if ambiguous

**Content (Markdown):**
# [Event Title]

**Source**: Twitter @example_osint  
**Posted**: [ISO timestamp]  
**Engagement**: [likes] likes, [retweets] retweets

[Tweet content with hashtags removed]

[If thread, include subsequent tweets]

**Media**: [Links to images/videos if present]

**External Links**: [URLs mentioned in tweet]

**Tags:**
- Generated from hashtags
- Inferred from content
- Event type classification
```

### Quality Indicators

**High Quality Signals:**
- Contains specific location
- Includes timestamp or time reference
- Has media evidence (photos/videos)
- Links to credible external source
- High engagement (500+ likes)
- Quote tweets from verified accounts
- Part of detailed thread

**Low Quality Signals:**
- Vague language ("something happened")
- No location specified
- No external corroboration
- Very low engagement
- Speculation language ("rumored", "unconfirmed")
- Satire/parody account indicators

### Priority Assignment

**High Priority:**
- Contains "BREAKING" or "URGENT"
- High-risk locations
- Mass casualty events
- Military/conflict events
- Government actions (coups, sanctions)

**Medium Priority:**
- Political developments
- Economic events
- Protests/demonstrations
- Natural disasters (non-catastrophic)

**Low Priority:**
- Historical analysis
- Background information
- Follow-up updates to known events

## Known Issues

### Issue 1: Rate Limiting
**Problem**: Twitter API rate limits can restrict data collection during high-activity periods  
**Workaround**: Implement exponential backoff, prioritize high-engagement tweets  
**Status**: Monitoring

### Issue 2: Thread Detection
**Problem**: Initial tweet may lack context, full thread needed  
**Workaround**: Check for thread replies when processing, collect entire thread  
**Status**: Handled in processing logic

### Issue 3: Deleted Tweets
**Problem**: Tweets may be deleted after collection, breaking references  
**Workaround**: Archive tweet content immediately, note if deleted on re-check  
**Status**: Archival system in place

### Issue 4: Bot Detection
**Problem**: Account occasionally triggers Twitter's automated limits  
**Workaround**: Reduce polling frequency during detection, use multiple API keys  
**Status**: Rare occurrence

## Examples

### Example 1: Breaking Crisis Event

**Raw Tweet:**
```
BREAKING: Reports of explosion at Port of Exampleville. 
Emergency services on scene. Multiple casualties reported. 
Developing situation. #breaking #crisis

[Image attached showing smoke plume]

Posted: 2026-04-29T14:32:00Z
Likes: 2.3K | Retweets: 1.1K
```

**Extracted World Event:**
```yaml
title: "Explosion at Port of Exampleville with multiple casualties"
date: 2026-04-29T14:32:00Z
type: crisis
location:
  name: "Port of Exampleville"
  city: "Exampleville"
  country: "Example Country"
priority: high
confidence: medium
tags:
  - explosion
  - crisis
  - casualties
  - port-incident
source:
  type: twitter
  handle: example_osint
  tweet_id: "1234567890"
  engagement:
    likes: 2300
    retweets: 1100
```

**Markdown Content:**
```markdown
# Explosion at Port of Exampleville with multiple casualties

**Source**: Twitter [@example_osint](https://twitter.com/example_osint/status/1234567890)  
**Posted**: 2026-04-29T14:32:00Z  
**Engagement**: 2,300 likes, 1,100 retweets  

Reports of explosion at Port of Exampleville. Emergency services on scene. 
Multiple casualties reported. Developing situation.

**Media**: [Image: Smoke plume visible from port area]

**Status**: Developing  
**Priority**: HIGH  
**Confidence**: Medium (awaiting official confirmation)
```

### Example 2: Geopolitical Development

**Raw Tweet:**
```
NEW: Country A announces sanctions package targeting Country B's 
energy sector. Effective May 1st. Full details: [link]

Posted: 2026-04-29T09:15:00Z
Likes: 456 | Retweets: 234
```

**Extracted World Event:**
```yaml
title: "Country A announces sanctions on Country B energy sector"
date: 2026-04-29T09:15:00Z
type: political-economic
location:
  countries:
    - "Country A"
    - "Country B"
priority: medium
confidence: high
tags:
  - sanctions
  - energy
  - geopolitical
  - economic-policy
source:
  type: twitter
  handle: example_osint
  tweet_id: "1234567891"
  external_link: "https://source.com/article"
```

### Example 3: Low-Priority Update

**Raw Tweet:**
```
Analysis: Historical context of trade relations between Region X and Y. 
Thread 🧵 1/12

Posted: 2026-04-29T11:00:00Z
Likes: 89 | Retweets: 23
```

**Action**: Skip or mark low priority (analysis thread, not breaking news)

## Validation Checklist

Before processing tweets from this source:

- [ ] Verify account is still active and not suspended
- [ ] Check authentication credentials are valid
- [ ] Confirm rate limits not exceeded
- [ ] Validate webhook/streaming connection if used
- [ ] Test keyword filters are working
- [ ] Review recent false positives/negatives

## Monitoring Metrics

Track these metrics for source health:

- **Collection Success Rate**: Should be > 95%
- **False Positive Rate**: Tweets collected but not relevant (target < 10%)
- **False Negative Rate**: Relevant tweets missed (monitor via spot-checks)
- **Average Processing Time**: < 30 seconds per tweet
- **Data Quality Score**: Based on completeness and accuracy (target > 80%)

## Maintenance Schedule

- **Daily**: Check for API errors, review collected tweets
- **Weekly**: Adjust keyword filters based on trends
- **Monthly**: Update reliability score, review metrics
- **Quarterly**: Full audit of source performance
