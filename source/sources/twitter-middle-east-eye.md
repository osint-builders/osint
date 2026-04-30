---
id: twitter-middle-east-eye
name: Middle East Eye - Regional News & Analysis
type: twitter
status: active
description: |
  Middle East Eye is an independent news organization covering politics, security,
  conflicts, and social developments across the Middle East and North Africa. Provides
  breaking news, investigative journalism, and expert analysis on regional affairs.
  Strong coverage of Palestine, Syria, Iran, Turkey, and Gulf states.
created_date: "2026-04-30"
last_updated: "2026-04-30"
tags:
  - middle-east
  - news
  - politics
  - conflicts
  - iran
  - syria
  - palestine
  - osint
reliability: medium
confidence_score: 75
update_frequency: "20m"
priority: medium
language:
  - en
geographic_focus:
  - middle-east
  - north-africa
cost: free
requires_auth: true
maintainer: osint-team
alert_keywords:
  - breaking
  - israel
  - iran
  - syria
  - war
  - attack
  - killed
  - sanctions
---

# Middle East Eye - Regional News & Analysis

## Overview

Middle East Eye (@MiddleEastEye) is an independent digital news organization providing comprehensive coverage of Middle East and North Africa developments. The outlet focuses on:

- Breaking news and investigative journalism
- Political developments and government policies
- Military conflicts and security incidents
- Israeli-Palestinian conflict
- Iranian regional activities
- Syrian and Iraqi developments
- Turkey and Gulf states politics
- Human rights and civil society
- Economic and social issues
- Regional diplomacy and international relations

**Account Characteristics:**
- Independent editorial voice
- Mix of breaking news and in-depth analysis
- Strong network of regional correspondents
- Investigative reporting capabilities
- Regular expert commentary
- Multilingual coverage (English primary)
- High engagement on regional stories

**Intelligence Value:**
- Ground-level reporting from conflict zones
- Political analysis and insider perspectives
- Regional diplomatic developments
- Social movements and civil unrest indicators
- Economic policy impacts
- Human rights violations documentation
- Cross-border dynamics and regional trends

## Data Collection Criteria

### Twitter Account Details

- **Handle**: MiddleEastEye
- **Account Type**: News organization
- **Geographic Coverage**: Middle East and North Africa
- **Content Type**: Breaking news, analysis, investigations, opinion
- **Tweet Frequency**: 30-60 tweets per day
- **Verification**: Twitter-verified news outlet
- **Engagement**: High for major regional stories

### Collection Method

- **Method**: timeline
- **Poll Interval**: Every 20 minutes
- **Include Retweets**: No (original reporting focus)
- **Include Replies**: No (focus on main news posts)
- **Include Quotes**: Yes (quoted analysis and sources)
- **Thread Handling**: Collect threads for developing stories

### Content Filters

#### Include Criteria

- Breaking news on security and military developments
- Political developments with regional significance
- Israeli operations and Palestinian issues
- Iranian activities and proxy operations
- Syrian and Iraqi conflict developments
- Sanctions and economic warfare
- Regional diplomatic moves
- Major protests and civil unrest
- Terrorism and extremism
- Arms deals and military cooperation
- Investigative reports on security issues

#### Exclude Criteria

- Pure opinion pieces without news value
- Cultural/lifestyle content
- Sports and entertainment
- Routine business news without strategic implications
- Social issues without security/political dimensions

### Keyword Monitoring

**High-Priority Keywords:**
- Breaking, urgent, exclusive, investigation
- Iran, IRGC, Hezbollah, proxies
- Israel, IDF, Palestine, Gaza, West Bank
- Syria, Assad, rebels, ISIS
- Iraq, PMF, militias
- Yemen, Houthis, Saudi Arabia
- Attack, airstrike, bombing, clash
- Killed, casualties, wounded
- Sanctions, embargo, enforcement

**Political Keywords:**
- Government, regime, leadership
- Coup, uprising, protest, demonstration
- Election, parliament, legislation
- Diplomacy, treaty, agreement
- UN, Security Council, resolution

**Security Keywords:**
- Military, army, forces, troops
- Terrorism, extremism, militant
- Assassination, killing, arrest
- Raid, operation, offensive
- Missile, drone, weapon
- Nuclear, chemical, proliferation

**Geographic Keywords:**
- Damascus, Baghdad, Tehran, Beirut
- Gaza, West Bank, Jerusalem
- Sanaa, Riyadh, Doha, Cairo
- Libya, Tunisia, Yemen, Lebanon

### Entity Extraction

**News Elements:**
- Event type and location
- Key actors (governments, groups, individuals)
- Casualty and impact information
- Timeline and sequence
- Sources cited
- Official statements

**Political Actors:**
- Government officials and agencies
- Political parties and movements
- Regional organizations
- International bodies (UN, Arab League)

**Military/Security Actors:**
- Armed forces and units
- Militant groups and militias
- Proxy organizations
- Security services

**Geographic Information:**
- Countries and regions
- Cities and specific locations
- Strategic sites and facilities
- Border areas

## Expected Data Format

### Raw Tweet Object

```json
{
  "id": "1234567890",
  "text": "BREAKING: Iran's foreign ministry confirms IRGC general killed in Israeli airstrike near Damascus. Brig Gen Hassan Sayyad Khodaei was senior adviser to Syrian military. Tehran vows 'decisive response.' Full story: middleeasteye.net/...",
  "created_at": "2026-04-30T15:30:00Z",
  "author": {
    "username": "MiddleEastEye",
    "name": "Middle East Eye"
  },
  "metrics": {
    "retweet_count": 567,
    "like_count": 1234,
    "reply_count": 234
  },
  "entities": {
    "urls": ["https://middleeasteye.net/..."],
    "hashtags": []
  }
}
```

### Structured Data Extraction

```yaml
story_type: breaking_news
event_type: targeted-killing
location:
  city: "Damascus"
  country: "Syria"
entities:
  victim:
    name: "Brig Gen Hassan Sayyad Khodaei"
    affiliation: "IRGC"
    role: "senior adviser to Syrian military"
  attacker:
    attribution: "Israel"
    method: "airstrike"
  confirming_source: "Iran's foreign ministry"
iranian_response: "vows 'decisive response'"
priority: high
tags:
  - irgc
  - israel
  - syria
  - targeted-killing
  - retaliation-risk
article_link: "middleeasteye.net/..."
```

## Processing Instructions

### Data Extraction

1. **Fetch Timeline**
   - Use Twitter API v2 for recent tweets
   - Focus on original content (no retweets)
   - Capture article URLs for full context
   - Track developing stories via threads

2. **Content Classification**
   - Breaking security news (highest priority)
   - Military/conflict developments (high priority)
   - Political developments with security implications (medium-high)
   - Investigative reports (medium-high priority)
   - Diplomatic developments (medium priority)
   - Analysis and commentary (medium priority)
   - General regional news (low priority)

3. **Entity Extraction**
   - Parse key actors and organizations
   - Extract location information
   - Identify casualty figures
   - Capture official statements and sources
   - Extract article URLs for full text
   - Identify expert sources quoted

4. **Verification Assessment**
   - Note if MEE original reporting or aggregation
   - Check if official confirmation cited
   - Assess sourcing transparency
   - Track updates and corrections

### Transformation to World Event Entity

```javascript
function transformToWorldEvent(tweet, extracted) {
  const storyType = classifyStory(tweet.text, extracted);
  
  return {
    title: buildStoryTitle(extracted, storyType),
    date: tweet.created_at,
    type: 'middle-east-news',
    location: extractLocation(extracted),
    priority: calculatePriority(storyType, extracted),
    confidence: 'medium',
    tags: generateTags(extracted, storyType),
    source: {
      type: 'twitter',
      handle: 'MiddleEastEye',
      tweet_id: tweet.id,
      url: `https://twitter.com/MiddleEastEye/status/${tweet.id}`,
      article_url: extracted.article_link
    },
    entities: extracted.entities,
    contents: generateMarkdown(tweet, extracted)
  };
}

function classifyStory(text, entities) {
  const textLower = text.toLowerCase();
  
  if (textLower.match(/breaking|urgent|just in/)) {
    return 'breaking-news';
  }
  if (textLower.match(/exclusive|investigation|reveals/)) {
    return 'investigative';
  }
  if (textLower.match(/analysis|explainer|opinion/)) {
    return 'analysis';
  }
  if (textLower.match(/airstrike|attack|killed|clash/)) {
    return 'security-incident';
  }
  if (textLower.match(/sanctions|iran|nuclear|deal/)) {
    return 'strategic-development';
  }
  
  return 'regional-news';
}
```

## Quality Indicators

### High Quality Signals

- Breaking news with official confirmation
- Multiple sources cited
- Article link provided for full context
- Specific details (names, locations, numbers)
- Original reporting or exclusive information
- Expert analysis included
- Timeline and context provided
- Follow-up reporting on developing stories
- Investigative depth

### Low Quality Signals

- Single unverified source
- Vague or incomplete information
- Lack of context
- No article link for complex stories
- Delayed reporting without added value
- Aggregation without original contribution

### Red Flags (Skip/Low Priority)

- Pure opinion without news value
- Lifestyle/cultural content
- Unverified rumors
- Outdated stories
- Non-strategic business/economic news

## Known Issues

### Issue 1: Editorial Perspective
**Problem**: Independent outlet with particular editorial stance on regional issues  
**Workaround**: Cross-reference with other sources; focus on factual reporting  
**Status**: Reliability scoring accounts for editorial variance

### Issue 2: Article Paywall/Gating
**Problem**: Some full articles may require registration  
**Workaround**: Extract key information from tweet; note article URL  
**Status**: Tweet provides summary for most breaking news

### Issue 3: Volume of Content
**Problem**: High tweet frequency includes varied content relevance  
**Workaround**: Strict keyword filtering for security/strategic focus  
**Status**: Filters configured

### Issue 4: Story Development Timing
**Problem**: May not be first to report breaking incidents  
**Workaround**: Value lies in context and analysis; note timestamp  
**Status**: Acceptable for medium-priority monitoring

## Examples

### Example 1: IRGC General Killed - High Priority

**Raw Tweet:**
```
BREAKING: Iran's foreign ministry confirms IRGC general killed in Israeli 
airstrike near Damascus. Brig Gen Hassan Sayyad Khodaei was senior adviser 
to Syrian military. Tehran vows 'decisive response.'

Full story: middleeasteye.net/...
```

**Extracted World Event:**
```yaml
title: "IRGC general killed in Israeli airstrike near Damascus, Iran vows retaliation"
date: 2026-04-30T15:30:00Z
type: middle-east-news
subtype: security-incident
location:
  city: "Damascus"
  country: "Syria"
priority: high
confidence: medium-high
tags:
  - irgc
  - israel
  - syria
  - targeted-killing
  - iran-israel-shadow-war
entities:
  victim:
    name: "Brig Gen Hassan Sayyad Khodaei"
    affiliation: "IRGC"
    role: "senior adviser to Syrian military"
  attacker: "Israel"
  attack_method: "airstrike"
  confirmation: "Iran's foreign ministry"
iranian_response: "vows 'decisive response'"
escalation_risk: "high"
source_article: "middleeasteye.net/..."
significance: "High-ranking IRGC casualty, retaliation likely"
```

### Example 2: Sanctions Investigation - Medium-High Priority

**Raw Tweet:**
```
EXCLUSIVE: Investigation reveals how Iranian oil reaches European markets 
despite sanctions. Network of shell companies in UAE, Turkey, and Cyprus 
facilitate exports worth $500M annually. EU enforcement agencies unaware of 
scheme. Full investigation: middleeasteye.net/...
```

**Extracted World Event:**
```yaml
title: "Investigation exposes Iranian oil sanctions evasion network worth $500M"
date: 2026-04-30T10:15:00Z
type: middle-east-news
subtype: investigative
priority: medium-high
confidence: medium
tags:
  - iran
  - sanctions-evasion
  - oil-exports
  - investigation
  - eu
entities:
  target: "Iran"
  mechanism: "shell company network"
  countries:
    - "UAE"
    - "Turkey"
    - "Cyprus"
  destination: "European markets"
  value: "$500M annually"
  enforcement_gap: "EU agencies unaware"
significance: "Exposes major sanctions circumvention"
source_article: "middleeasteye.net/..."
```

## Validation Checklist

Before marking source as active:

- [x] Twitter handle verified (@MiddleEastEye)
- [x] News organization credibility confirmed
- [x] Geographic focus appropriate (MENA region)
- [x] Collection method configured (timeline, no retweets)
- [x] Keywords defined for strategic/security content
- [x] Entity extraction patterns defined
- [x] Quality indicators specific and measurable
- [x] Priority levels aligned with intelligence value
- [x] Examples comprehensive
- [ ] Authentication configured (Twitter API access)
- [ ] Integration tested with collection system
- [ ] Article URL extraction verified

## Monitoring & Maintenance

### Daily Checks
- API connectivity and collection
- Article URL extraction working
- Breaking news capture
- Filter effectiveness for strategic content

### Weekly Tasks
- Review story classification accuracy
- Update keyword filters based on coverage patterns
- Track reporting accuracy and corrections
- Assess priority assignments

### Monthly Tasks
- Audit reliability score
- Review editorial balance
- Update geographic keyword coverage
- Compare coverage with other regional news sources

## Related Sources

Complementary sources for Middle East news:

- **@AlJazeera**: Major regional news network
- **@Reuters_ME**: International wire service
- **@AFP**: International news agency
- **@ClashReport**: Real-time incident monitoring
- **@IranObserve0**: Iran-focused intelligence
- **Local language sources**: Arabic news outlets
- **Official government accounts**: Direct statements
