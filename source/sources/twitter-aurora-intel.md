---
id: twitter-aurora-intel
name: Aurora Intel - Geopolitical Intelligence and Security Analysis
type: twitter
status: active
description: |
  Aurora Intel provides comprehensive geopolitical intelligence, security analysis,
  and conflict monitoring. Collaborative OSINT collective covering global conflicts,
  military operations, geopolitical developments, and strategic intelligence.
  Known for rapid, verified reporting and detailed analytical threads.
created_date: "2026-04-30"
last_updated: "2026-04-30"
tags:
  - geopolitical-intelligence
  - security-analysis
  - conflict-monitoring
  - osint
  - strategic-intelligence
  - military-operations
  - global-affairs
reliability: high
confidence_score: 80
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
  - breaking
  - confirmed
  - developing
  - crisis
  - conflict
  - military action
  - attack
  - operation
  - coup
  - sanctions
---

# Aurora Intel - Geopolitical Intelligence and Security Analysis

## Overview

Aurora Intel (@AuroraIntel) is a collaborative OSINT collective providing comprehensive geopolitical and security intelligence:

- Real-time conflict monitoring
- Geopolitical crisis analysis
- Military operations tracking
- Strategic intelligence assessments
- Verified breaking news
- Collaborative investigations
- Multi-source verification
- Global security developments
- Political risk analysis

**Account Characteristics:**
- Collaborative OSINT collective
- Rapid, verified reporting
- Multiple geographic focus areas
- High-quality analytical threads
- Strong verification standards
- 24/7 monitoring capability
- Large follower base (100K+)
- Community-recognized authority
- Cross-references multiple sources
- Regular situational updates

**Intelligence Value:**
- High-confidence breaking news
- Comprehensive situational awareness
- Multi-source verified intelligence
- Strategic analysis and context
- Crisis monitoring and alerts
- Conflict zone coverage
- Political developments tracking
- Security threat assessments

## Data Collection Criteria

### Twitter Account Details

- **Handle**: AuroraIntel
- **Account Type**: OSINT collective
- **Verification**: Community-recognized authority
- **Follower Count**: ~100,000+
- **Tweet Frequency**: 15-30 tweets per day
- **Content Type**: Breaking news, analysis, situational updates, investigations

### Collection Method

- **Method**: timeline
- **Poll Interval**: Every 15 minutes
- **Include Retweets**: Yes (shares critical updates)
- **Include Replies**: Yes (provides context and updates)
- **Include Quotes**: Yes
- **Thread Handling**: Collect full analytical and situational threads

### Content Filters

#### Include Criteria

- Breaking geopolitical developments
- Verified conflict updates
- Military operations reports
- Political crises
- Security incidents
- Strategic analysis threads
- Coup attempts and regime changes
- Major diplomatic developments
- Sanctions announcements
- Territory control changes
- High-priority intelligence

#### Exclude Criteria

- Unverified rumors
- Promotional content
- Off-topic discussions

### Keyword Monitoring

**High-Priority Keywords:**
- Breaking, developing, urgent
- Confirmed, verified, multiple sources
- Crisis, emergency, critical
- Conflict, war, combat, battle
- Military action, operation, strike
- Coup, overthrow, regime change
- Attack, assault, offensive
- Sanctions, embargo, restrictions
- Negotiations, talks, diplomacy
- Escalation, de-escalation

**Geographic Keywords:**
- Ukraine, Russia, Taiwan, China
- Middle East (Iran, Israel, Syria, etc.)
- Africa (Sudan, Ethiopia, Sahel, etc.)
- Latin America (Venezuela, etc.)
- North Korea, Korean Peninsula
- South China Sea, Taiwan Strait

**Event Keywords:**
- Deployment, movement, positioning
- Casualties, losses, deaths
- Capture, liberation, control
- Treaty, agreement, accord
- Summit, meeting, conference

## Expected Data Format

### Raw Tweet Object

```json
{
  "id": "1234567890",
  "text": "BREAKING: Multiple sources confirm military coup underway in [Country]. Army units have seized control of presidential palace and state TV. President's whereabouts unknown. International airport closed. Developing situation - thread with updates 1/",
  "created_at": "2026-04-30T12:15:00Z",
  "author": {
    "username": "AuroraIntel",
    "name": "Aurora Intel"
  },
  "metrics": {
    "retweet_count": 3456,
    "like_count": 8901,
    "reply_count": 567
  }
}
```

### Structured Data Extraction

```yaml
event_type: coup-attempt
verification: "multiple sources confirmed"
location:
  country: "[Country]"
activity:
  actors: "Army units"
  targets:
    - "presidential palace"
    - "state TV"
  status:
    - "control seized"
    - "president whereabouts unknown"
    - "airport closed"
status: "developing"
priority: high
tags:
  - coup
  - military-action
  - political-crisis
  - breaking
```

## Processing Instructions

### Data Extraction

1. **Fetch Timeline**
   - Collect breaking developments
   - Capture analytical threads
   - Track situational updates
   - Note verification levels

2. **Content Classification**
   - Identify event type
   - Extract verification status
   - Determine priority level
   - Assess strategic significance

3. **Entity Extraction**
   - Countries and regions
   - Military units and forces
   - Political actors
   - Organizations involved
   - Locations and facilities
   - Timeline of events
   - Verification sources

### Transformation to World Event Entity

```javascript
function transformToWorldEvent(tweet, extracted) {
  return {
    title: buildIntelligenceTitle(extracted),
    date: tweet.created_at,
    type: classifyIntelligenceEvent(extracted),
    location: extracted.location,
    priority: 'high',
    confidence: extracted.verification === 'confirmed' ? 'high' : 'medium',
    tags: generateTags(extracted),
    source: {
      type: 'twitter',
      handle: 'AuroraIntel',
      tweet_id: tweet.id,
      url: `https://twitter.com/AuroraIntel/status/${tweet.id}`,
      credibility: 'high',
      verification: extracted.verification,
      engagement: {
        likes: tweet.metrics.like_count,
        retweets: tweet.metrics.retweet_count
      }
    },
    intelligence: {
      event_type: extracted.event_type,
      actors: extracted.activity.actors,
      targets: extracted.activity.targets,
      status: extracted.status,
      assessment: extracted.assessment
    },
    entities: extracted.entities,
    contents: generateMarkdown(tweet, extracted)
  };
}
```

## Quality Indicators

### High Quality Signals

- "Confirmed" or "verified" explicitly stated
- Multiple source citations
- Breaking major developments
- Detailed situational updates
- Geographic specificity
- Timeline information
- Strategic context provided
- Thread with progressive updates
- Cross-referenced with other sources
- High engagement from intelligence community
- Official source confirmations
- Visual evidence when available

### Low Quality Signals

- Single unverified source
- Vague descriptions
- Lack of context
- Unclear timeline

### Red Flags

- Contradicts multiple reliable sources
- Sensationalized without substance
- No verification methodology

## Known Issues

### Issue 1: Breaking News Corrections
**Problem**: Initial reports may require corrections as situation develops  
**Workaround**: Track thread updates, note corrections in timeline  
**Status**: Update tracking system implemented

### Issue 2: High Volume During Crises
**Problem**: Rapid tweet rate during major events  
**Workaround**: Increase poll frequency, prioritize breaking tags  
**Status**: Dynamic polling based on activity

## Examples

### Example 1: Military Crisis - High Priority

**Raw Tweet:**
```
🚨 BREAKING: Major escalation in Taiwan Strait

CONFIRMED via multiple sources:
- PLA launches largest military exercise to date (100+ aircraft, 20+ vessels)
- Taiwan raises combat readiness to highest level
- US 7th Fleet moving assets to area
- Japan Self-Defense Forces on alert

This is the most serious crisis since 1996. Monitoring closely. 
Live thread with updates follows 1/
```

**Extracted World Event:**
```yaml
title: "Major Taiwan Strait crisis: Largest PLA exercise, regional forces on alert"
date: 2026-04-30T12:15:00Z
type: geopolitical-crisis
location:
  region: "Taiwan Strait"
  countries: ["China", "Taiwan", "United States", "Japan"]
priority: high
confidence: high
verification: "confirmed via multiple sources"
military_activity:
  pla_forces:
    aircraft: "100+"
    vessels: "20+"
    description: "largest military exercise to date"
  taiwan_response: "combat readiness to highest level"
  us_response: "7th Fleet moving assets"
  japan_response: "Self-Defense Forces on alert"
assessment: "most serious crisis since 1996"
status: "monitoring closely"
tags:
  - taiwan-strait
  - crisis
  - pla
  - us-military
  - japan
  - escalation
  - breaking
```

## Validation Checklist

- [x] Twitter handle verified (@AuroraIntel)
- [x] Collective credibility confirmed
- [x] Content focus established
- [x] Collection method appropriate
- [x] Filters configured
- [x] Keywords defined
- [x] Examples provided
- [ ] Authentication configured
- [ ] High-frequency polling during crises tested

## Monitoring & Maintenance

### Daily Checks
- Collection completeness for breaking events
- Thread tracking working
- Verification status captured
- High-priority alerts functioning

### Weekly Tasks
- Review accuracy of breaking reports
- Track correction patterns
- Update verification standards
- Monitor source reputation

### Monthly Tasks
- Audit intelligence accuracy
- Review reliability score (maintain 80+)
- Analyze crisis response performance
- Update geographic focus based on coverage

### Special Monitoring
- **Breaking Crises**: Increase poll to 5 minutes
- **Developing Situations**: Enhanced thread tracking
- **Major Events**: Priority collection and alerting

## Related Sources

- **@Conflicts**: Real-time conflict monitoring
- **@IntelDoge**: Intelligence analysis
- **@ianbremmer**: Political risk context
- **@WarMonitors**: Conflict updates
- **GDELT**: News aggregation for verification
- **Official government sources**: Cross-verification
