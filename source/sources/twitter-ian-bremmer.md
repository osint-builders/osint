---
id: twitter-ian-bremmer
name: Ian Bremmer - Eurasia Group Political Risk Analysis
type: twitter
status: active
description: |
  Ian Bremmer is President of Eurasia Group, a leading political risk research and
  consulting firm. Provides expert analysis on geopolitical developments, international
  relations, political risk assessment, and global governance. Highly influential voice
  in international affairs with direct access to world leaders and policymakers.
  Specializes in emerging markets, great power competition, and systemic global risks.
created_date: "2026-04-30"
last_updated: "2026-04-30"
tags:
  - geopolitics
  - political-risk
  - international-relations
  - eurasia-group
  - global-governance
  - great-power-competition
  - emerging-markets
  - osint
reliability: high
confidence_score: 85
update_frequency: "15m"
priority: high
language:
  - en
geographic_focus:
  - global
cost: free
requires_auth: true
maintainer: osint-team
alert_keywords:
  - crisis
  - conflict
  - election
  - sanctions
  - coup
  - war
  - negotiations
  - summit
  - breakdown
  - escalation
---

# Ian Bremmer - Eurasia Group Political Risk Analysis

## Overview

Ian Bremmer (@ianbremmer) is President and Founder of Eurasia Group, the world's leading political risk research and consulting firm. With over 1 million followers, he provides authoritative analysis on global political developments, international relations, and systemic risks. His insights are valued by:

- Government leaders and policymakers
- Multinational corporations
- Financial institutions
- International organizations
- Intelligence analysts

**Account Characteristics:**
- Founded Eurasia Group in 1998, pioneering political risk analysis
- Author of multiple books on global affairs
- Regular media contributor (CNN, Bloomberg, Financial Times)
- Direct access to world leaders and decision-makers
- Annual "Top Risks" report widely followed
- Tweets multiple times daily with original analysis
- High engagement (thousands of likes/retweets)

**Intelligence Value:**
- Expert political risk assessment
- Early warning of geopolitical tensions
- Analysis of great power competition (US-China-Russia)
- Emerging market political developments
- Global governance and institutional breakdown
- Technology and geopolitics intersection
- Climate and political stability connections

## Data Collection Criteria

### Twitter Account Details

- **Handle**: ianbremmer
- **Account Type**: Political risk analyst, thought leader
- **Verification**: Twitter verified
- **Follower Count**: ~1,000,000+
- **Tweet Frequency**: 5-15 tweets per day
- **Engagement**: Very high (thousands of interactions per tweet)
- **Content Type**: Original analysis, commentary, data visualization, media appearances

### Collection Method

- **Method**: timeline
- **Poll Interval**: Every 15 minutes
- **Include Retweets**: Yes (often shares important breaking news)
- **Include Replies**: Yes (valuable context and debate)
- **Include Quotes**: Yes
- **Thread Handling**: Collect entire threads (analysis often multi-part)

### Content Filters

#### Include Criteria

- Geopolitical analysis and assessments
- Political risk forecasts
- International conflict developments
- Great power competition (US-China-Russia)
- Election analysis and predictions
- Sanctions and economic statecraft
- Summit announcements and outcomes
- Crisis developments
- Regime changes and coups
- Trade and technology geopolitics
- Climate and security intersections

#### Exclude Criteria

- Personal/promotional content
- Book promotion tweets (unless containing analysis)
- Pure retweets without commentary
- Off-topic discussions

### Keyword Monitoring

**High-Priority Keywords:**
- Crisis, conflict, war, escalation
- China, Russia, United States, Europe
- Election, coup, regime change
- Sanctions, embargo, restrictions
- Summit, negotiations, talks
- Taiwan, Ukraine, Middle East
- NATO, UN, multilateral
- Risk, threat, instability

**Geographic Keywords:**
- China, Taiwan Strait
- Russia, Ukraine
- Middle East (Iran, Israel, Saudi Arabia)
- North Korea, Korean Peninsula
- India, Pakistan
- Africa (major economies)
- Latin America (Venezuela, Brazil, Mexico)

**Thematic Keywords:**
- Political risk
- Geopolitical
- International relations
- Great power competition
- Emerging markets
- Global governance
- Technology geopolitics
- Climate security

## Expected Data Format

### Raw Tweet Object

```json
{
  "id": "1234567890",
  "text": "BREAKING: US-China tensions escalate as Beijing announces military exercises around Taiwan in response to latest arms sale. Risk of miscalculation rising. Markets will be watching closely. Thread 1/5",
  "created_at": "2026-04-30T14:32:00Z",
  "author": {
    "username": "ianbremmer",
    "name": "ian bremmer",
    "verified": true
  },
  "metrics": {
    "retweet_count": 2500,
    "like_count": 8900,
    "reply_count": 450
  }
}
```

### Structured Data Extraction

```yaml
event_type: geopolitical-tension
assessment: escalation
location:
  region: "Taiwan Strait"
  countries:
    - "China"
    - "Taiwan"
    - "United States"
entities:
  countries: ["China", "Taiwan", "United States"]
  organizations: ["PLA"]
  activities: ["military exercises", "arms sale"]
risk_level: high
impact: "market volatility"
priority: high
tags:
  - us-china-relations
  - taiwan-strait
  - military-exercises
  - political-risk
  - great-power-competition
```

## Processing Instructions

### Data Extraction

1. **Fetch Timeline**
   - Use Twitter API v2 for recent tweets
   - Capture threads completely
   - Include media attachments (charts, maps)
   - Track engagement metrics for significance

2. **Content Classification**
   - Identify analysis vs breaking news
   - Extract risk assessments
   - Determine geographic focus
   - Classify event types
   - Note predictions and forecasts

3. **Entity Extraction**
   - Countries and regions
   - Political leaders
   - International organizations
   - Corporations (when relevant)
   - Specific events and summits

4. **Risk Assessment**
   - Extract explicit risk levels
   - Identify escalation/de-escalation signals
   - Note market implications
   - Track prediction accuracy over time

### Transformation to World Event Entity

```javascript
function transformToWorldEvent(tweet, extracted) {
  const eventType = classifyGeopoliticalEvent(tweet.text);
  const riskLevel = extractRiskLevel(tweet.text);
  
  return {
    title: buildEventTitle(extracted),
    date: tweet.created_at,
    type: eventType,
    location: extracted.location,
    priority: calculatePriority(riskLevel, extracted),
    confidence: 'high',
    tags: generateTags(extracted),
    source: {
      type: 'twitter',
      handle: 'ianbremmer',
      tweet_id: tweet.id,
      url: `https://twitter.com/ianbremmer/status/${tweet.id}`,
      author_credibility: 'expert',
      engagement: {
        likes: tweet.metrics.like_count,
        retweets: tweet.metrics.retweet_count
      }
    },
    analysis: {
      risk_level: riskLevel,
      expert_assessment: extracted.assessment,
      implications: extracted.implications
    },
    entities: extracted.entities,
    contents: generateMarkdown(tweet, extracted)
  };
}
```

## Quality Indicators

### High Quality Signals

- Original analysis (not just news sharing)
- Specific risk assessments or predictions
- Data or evidence cited
- Multi-tweet threads with detailed analysis
- Charts, maps, or data visualizations included
- Reference to Eurasia Group research
- High engagement (>5000 likes)
- Breaking analysis of major developments
- Comparative or historical context provided
- Market/economic implications discussed

### Low Quality Signals

- Single-line commentary without context
- Pure retweets without analysis
- Vague or general observations
- Promotional content
- Personal anecdotes without strategic relevance

### Red Flags (Skip/Low Priority)

- Book promotions
- Media appearance announcements
- Thank you tweets
- Non-geopolitical content
- Historical trivia without contemporary relevance

## Known Issues

### Issue 1: Thread Context
**Problem**: Analysis often spans multiple tweets requiring full thread collection  
**Workaround**: Track conversation IDs and collect all related tweets  
**Status**: Thread collection implemented

### Issue 2: Nuanced Analysis
**Problem**: Analysis may be subtle or require interpretation  
**Workaround**: Preserve full text, flag for human review when extracting specific predictions  
**Status**: Manual review workflow for high-priority assessments

### Issue 3: Mixed Content
**Problem**: Mixes breaking news with promotional content  
**Workaround**: Strong keyword filtering and engagement thresholds  
**Status**: Filters configured

## Examples

### Example 1: US-China Escalation - High Priority

**Raw Tweet:**
```
Major development: China announces large-scale military exercises around Taiwan 
following latest US arms sale announcement. Risk of miscalculation significantly 
elevated. Three things to watch:

1. Duration and scale of exercises
2. US/allied response positioning  
3. Market reaction in Asia tomorrow

This is the most dangerous moment in the Taiwan Strait since 1996. Thread 1/7
```

**Extracted World Event:**
```yaml
title: "China announces military exercises around Taiwan, risk elevated"
date: 2026-04-30T14:32:00Z
type: geopolitical-crisis
location:
  region: "Taiwan Strait"
  countries:
    - "China"
    - "Taiwan"
    - "United States"
priority: high
confidence: high
tags:
  - us-china-relations
  - taiwan-strait
  - military-exercises
  - crisis
  - political-risk
analysis:
  risk_level: "significantly elevated"
  expert_assessment: "most dangerous moment since 1996"
  watch_points:
    - "Duration and scale of exercises"
    - "US/allied response positioning"
    - "Market reaction in Asia"
  market_impact: expected
entities:
  countries: ["China", "Taiwan", "United States"]
  event_type: "military exercises"
  trigger: "US arms sale"
```

### Example 2: Political Risk Assessment - Medium Priority

**Raw Tweet:**
```
France's upcoming election poses significant political risk for EU stability. 
Far-right polling at 28%, centrists fragmenting. Key risks:

- Eurozone policy shifts
- NATO commitment questions  
- Russia sanctions reconsideration

Markets underpricing this risk. Our team forecasts 40% chance of major 
policy disruption. Full analysis coming in tomorrow's note.
```

**Extracted World Event:**
```yaml
title: "France election poses EU stability risks, far-right at 28%"
date: 2026-04-30T11:20:00Z
type: election-risk
location:
  country: "France"
  region: "Europe"
priority: medium
confidence: high
tags:
  - france
  - election
  - european-union
  - political-risk
  - far-right
analysis:
  risk_level: "significant"
  probability: "40% chance of major policy disruption"
  risk_factors:
    - "Eurozone policy shifts"
    - "NATO commitment questions"
    - "Russia sanctions reconsideration"
  market_assessment: "underpricing risk"
entities:
  country: "France"
  organizations: ["EU", "NATO", "Eurozone"]
  polling: "far-right at 28%"
```

### Example 3: Emerging Market Analysis - Medium Priority

**Raw Tweet:**
```
Nigeria's new president faces impossible choices: float the naira and face 
massive inflation, or maintain currency controls and watch foreign investment 
flee. IMF pressure building. Political stability at risk if reforms move too 
fast. Classic emerging market dilemma. Watching closely.
```

**Extracted World Event:**
```yaml
title: "Nigeria faces currency crisis, political stability at risk"
date: 2026-04-30T09:45:00Z
type: economic-crisis
location:
  country: "Nigeria"
  region: "Africa"
priority: medium
confidence: high
tags:
  - nigeria
  - currency-crisis
  - emerging-markets
  - imf
  - political-risk
analysis:
  risk_type: "economic policy dilemma"
  risk_factors:
    - "Currency float vs controls"
    - "Inflation vs investment flight"
    - "IMF pressure"
    - "Political stability at risk"
  assessment: "classic emerging market dilemma"
entities:
  country: "Nigeria"
  organizations: ["IMF"]
  economic_issues: ["currency controls", "inflation", "foreign investment"]
```

## Validation Checklist

Before marking source as active:

- [x] Twitter handle verified (@ianbremmer)
- [x] Account credibility confirmed (Eurasia Group President)
- [x] Content relevance established (geopolitical analysis)
- [x] Collection method appropriate (timeline with threads)
- [x] Filters configured (geopolitical focus)
- [x] Keywords defined for crisis/risk content
- [x] Entity extraction patterns defined
- [x] Quality indicators specific and measurable
- [x] Examples comprehensive and realistic
- [ ] Authentication configured (Twitter API access)
- [ ] Integration tested with collection system
- [ ] Thread collection verified working

## Monitoring & Maintenance

### Daily Checks
- API connectivity and tweet collection
- Thread collection completeness
- High-engagement tweets captured
- No collection gaps during major events

### Weekly Tasks
- Review analysis accuracy (compare predictions to outcomes)
- Update keyword filters based on emerging topics
- Verify risk assessments captured correctly
- Check for new thematic focus areas

### Monthly Tasks
- Audit event classification accuracy
- Review reliability score (maintain 85+)
- Track prediction accuracy over time
- Update geographic focus based on coverage
- Review Eurasia Group research alignment

### Special Monitoring
- **Crisis Events**: Increase poll frequency to 5 minutes
- **Top Risks Report**: Annual report requires special collection
- **Major Summits**: Increase monitoring during G7, G20, etc.
- **Market Events**: Track correlation with market movements

## Related Sources

Complementary sources for geopolitical intelligence:

- **@RichardHaass**: CFR President, foreign policy analysis
- **@AmbJohnBolton**: Former National Security Advisor
- **@AuroraIntel**: Geopolitical intelligence collective
- **@Conflicts**: Real-time conflict monitoring
- **GDELT**: News aggregation for geopolitical events
- **Eurasia Group Reports**: Direct research access (paid)
