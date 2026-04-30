---
id: twitter-nytimes-world
name: New York Times World News - International Coverage
type: twitter
status: active
description: |
  New York Times World News provides comprehensive international coverage
  with in-depth analysis, investigative reporting, and strong bureau
  network. Excellent for context, background, and detailed reporting on
  major world events, conflicts, and political developments.
created_date: "2026-04-30"
last_updated: "2026-04-30"
tags:
  - osint
  - international
  - world-news
  - in-depth
  - investigative
  - analysis
  - conflict
reliability: high
confidence_score: 90
update_frequency: "10m"
priority: high
language:
  - en
geographic_focus:
  - global
  - international
cost: free
requires_auth: true
maintainer: osint-team
alert_keywords:
  - breaking
  - exclusive
  - investigation
  - conflict
  - war
  - crisis
  - reveals
  - documents
---

# New York Times World News - International Coverage

## Overview

New York Times World (@nytimesworld) is the international news desk of the New York Times, providing comprehensive global coverage with emphasis on in-depth reporting, investigative journalism, and detailed analysis. Known for high-quality journalism, strong foreign correspondents, and breaking major international stories.

**Account Characteristics:**
- Verified major news organization
- 8M+ followers
- Moderate frequency (20-40 tweets per day)
- In-depth international reporting
- Investigative journalism
- Foreign correspondent network
- Pulitzer-winning journalism
- Strong analytical content

**Intelligence Value:**
- Deep investigative reporting
- Context and background on conflicts
- Exclusive stories and documents
- Expert analysis of international events
- Long-form international coverage
- Government document reporting
- Intelligence community sources
- Political analysis and implications

## Data Collection Criteria

### Twitter Account Details

- **Handle**: nytimesworld
- **Account Type**: Verified news organization
- **Follower Count**: ~8,000,000
- **Verification**: Twitter verified
- **Time Zone**: UTC/ET
- **Tweet Frequency**: 20-40 tweets per day
- **Engagement**: High (thousands of interactions)

### Collection Method

- **Method**: timeline
- **Poll Interval**: Every 10 minutes (less urgent than breaking news feeds)
- **Include Retweets**: No
- **Include Replies**: No
- **Include Quotes**: Yes
- **Thread Handling**: Collect threads for investigative pieces

### Content Filters

#### Include Criteria

- Breaking international news
- Investigative reports
- Conflict analysis and coverage
- Political developments worldwide
- Intelligence and security stories
- Document revelations
- Major international events
- Geopolitical analysis
- Humanitarian crises

#### Exclude Criteria

- US domestic news (unless international impact)
- Opinion pieces (focus on news)
- Culture and lifestyle (unless newsworthy)
- Book reviews and features
- Tweets older than 7 days

### Keyword Monitoring

**High-Priority Keywords:**
- Breaking, exclusive, reveals
- Investigation, documents, obtained
- Conflict, war, military, offensive
- Intelligence, classified, leak
- Crisis, emergency, humanitarian
- Coup, uprising, revolution
- Sanctions, embargo, pressure
- Nuclear, weapons, missiles
- Cyberattack, espionage, surveillance

**Geographic Keywords:**
- Russia, Ukraine, China, Iran, North Korea
- Middle East (Syria, Yemen, Israel, Palestine)
- Afghanistan, Pakistan
- Africa (major conflicts)
- Latin America (political instability)

**Event Type Keywords:**
- Secret, covert, operation
- Officials say, sources say
- Casualties, deaths, destruction
- Negotiations, diplomacy, treaty
- Protest, crackdown, repression
- Refugees, displacement, migration

### Entity Extraction

**Event Information:**
- Event type and significance
- Location and actors involved
- Casualties and impact
- Political implications
- Intelligence/classified information
- Documentary evidence
- Expert analysis

**Source Information:**
- NYT correspondent location
- Government officials (anonymous/named)
- Intelligence sources
- Document sources
- Expert sources
- Verification status

## Expected Data Format

### Raw Tweet Object

```json
{
  "id": "1789091234567890123",
  "text": "BREAKING: Secret documents reveal extensive Russian military plans for Ukraine offensive. U.S. intelligence officials say operation involves 50,000 troops. Investigation by @nytimes:",
  "created_at": "2026-04-30T17:00:00Z",
  "author": {
    "id": "1877831",
    "username": "nytimesworld",
    "name": "New York Times World",
    "verified": true
  },
  "metrics": {
    "retweet_count": 8234,
    "like_count": 15678,
    "reply_count": 2345
  }
}
```

### Structured Data Extraction

```yaml
event:
  type: "intelligence-revelation"
  subtype: "military-planning"
  classification: "secret documents"
  status: "exclusive"

location:
  country: "Russia"
  target: "Ukraine"
  scope: "offensive plans"

details:
  troop_numbers: 50000
  sources: "U.S. intelligence officials"
  documentation: "secret documents"
  
reporting:
  type: "investigative"
  exclusivity: "exclusive"
  verification: "document-based"

source:
  organization: "New York Times"
  desk: "World"
  reliability: "very-high"
  journalism_type: "investigative"

priority: "high"
significance: "major-revelation"
```

## Processing Instructions

### Data Extraction

1. **Fetch Timeline**
   ```javascript
   const endpoint = '/2/users/1877831/tweets';
   const params = {
     'tweet.fields': 'created_at,public_metrics,entities,attachments',
     'expansions': 'attachments.media_keys,referenced_tweets.id',
     'media.fields': 'url,alt_text,variants',
     'max_results': 100
   };
   ```

2. **Initial Filtering**
   - Prioritize BREAKING and EXCLUSIVE tags
   - Focus on investigative reports
   - Check for document revelations
   - Assess international significance
   - Filter opinion/analysis unless newsworthy

3. **Entity Extraction**
   ```javascript
   function extractEntities(tweetText) {
     return {
       eventType: classifyInternationalEvent(tweetText),
       locations: extractLocations(tweetText),
       exclusivity: detectExclusiveReporting(tweetText),
       sources: extractSources(tweetText),
       documents: detectDocumentBased(tweetText),
       intelligence: detectIntelligenceReporting(tweetText)
     };
   }
   
   function detectExclusiveReporting(text) {
     const exclusivePatterns = [
       /exclusive:/i,
       /reveals?:/i,
       /investigation (?:by|from) @nytimes/i,
       /documents? (?:obtained|reveal|show)/i,
       /sources? (?:tell|say)/i
     ];
     return exclusivePatterns.some(p => p.test(text));
   }
   
   function detectDocumentBased(text) {
     const docPatterns = [
       /documents? (?:reveal|show|obtained|leaked)/i,
       /classified/i,
       /secret (?:plans|documents|files)/i,
       /internal (?:documents|memos|communications)/i
     ];
     return docPatterns.some(p => p.test(text));
   }
   
   function detectIntelligenceReporting(text) {
     const intelPatterns = [
       /intelligence (?:officials|sources|agencies)/i,
       /CIA|NSA|Pentagon/i,
       /classified/i,
       /covert/i,
       /espionage/i
     ];
     return intelPatterns.some(p => p.test(text));
   }
   ```

4. **Context Analysis**
   - Extract linked articles for full context
   - Note investigative vs breaking news
   - Identify exclusive vs aggregated reporting
   - Check for document/source attribution
   - Assess geopolitical implications

5. **Significance Scoring**
   - High: Exclusive revelations, major conflicts, intelligence stories
   - Medium: Significant developments, political analysis
   - Low: Background pieces, features, routine coverage

## Quality Indicators

### High Quality Signals

- **Exclusive/Investigation tag**: Original NYT reporting
- **Document-based**: "documents reveal", "obtained by NYT"
- **Intelligence sources**: CIA, NSA, Pentagon officials
- **Named correspondents**: Bylined reporting
- **Multiple sources**: "officials say", "sources confirm"
- **High engagement**: Significant story indicator
- **Breaking tag with analysis**: Major development
- **Geopolitical significance**: International implications

### Medium Quality Signals

- Analysis of events reported elsewhere
- Political statements and reactions
- Regional developments
- Diplomatic news

### Lower Priority Signals

- Opinion pieces
- Cultural features
- Book excerpts
- Historical context without news hook

## Quality Considerations

**NYT Strengths:**
- Rigorous fact-checking and verification
- Strong foreign correspondent network
- Access to government/intelligence sources
- Investigative journalism capabilities
- Document verification expertise
- Pulitzer-winning international coverage
- Deep context and analysis

**Editorial Perspective:**
- US perspective on international events
- Liberal editorial stance (news section maintains standards)
- Strong investigative tradition
- Government accountability focus
- Human rights emphasis

**Processing Notes:**
- Prioritize exclusive/investigative content
- Extract document-based revelations
- Note intelligence source reporting
- Cross-reference major claims
- Value context and analysis

## Validation Checklist

- [x] Twitter handle verified (@nytimesworld)
- [x] Account is verified NYT news organization
- [x] Collection method configured
- [x] Investigative content prioritized
- [x] Entity extraction patterns defined
- [x] Document detection implemented
- [x] Intelligence reporting detection configured
- [ ] Authentication configured (TWITTER_API_KEY required)
- [ ] Rate limits monitored

## Monitoring & Maintenance

### Daily Checks
- API response success rate
- Tweet collection completeness
- Exclusive story detection
- Document-based reporting flagged

### Weekly Tasks
- Review investigative story collection
- Update keyword lists
- Check source attribution extraction
- Verify international focus maintained

### Monthly Tasks
- Audit classification accuracy
- Review exclusive vs aggregated ratio
- Validate reliability score (maintain 90+)
- Assess value of investigative content

## Related Sources

Complementary investigative sources:
- @washingtonpost - Similar investigative depth
- @WSJ - Business/financial investigations
- @guardian - British investigative perspective
- @ProPublica - Non-profit investigative journalism

Complementary breaking news:
- @AP - Fastest breaking news
- @Reuters - International breaking
- @BBCBreaking - International alerts

## Special Notes

**Why NYT World is Valuable:**

1. **Investigative Depth**: Exclusive stories not available elsewhere
2. **Document Access**: Obtains classified/internal documents
3. **Source Network**: Deep government/intelligence sources
4. **Verification Standards**: Rigorous fact-checking
5. **Context**: Deep background and analysis
6. **Foreign Correspondents**: On-ground expertise worldwide
7. **Geopolitical Analysis**: Expert interpretation

**Best Use Cases:**

1. **Exclusive Revelations**: Major scoops and investigations
2. **Document-Based Reporting**: Classified leaks, internal docs
3. **Conflict Analysis**: Deep coverage of wars and conflicts
4. **Intelligence Stories**: CIA, NSA, Pentagon reporting
5. **Context**: Understanding background of events
6. **Implications**: Geopolitical and diplomatic analysis

**Integration Strategy:**

- Use for deep context on breaking news from other sources
- Prioritize exclusive/investigative content
- Cross-reference document revelations
- Extract intelligence reporting
- Complement fast-breaking sources with depth
- Use for analysis of events reported by AP/Reuters/BBC
