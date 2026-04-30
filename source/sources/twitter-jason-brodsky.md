---
id: twitter-jason-brodsky
name: Jason Brodsky - Iran Policy Expert
type: twitter
status: active
description: |
  Jason Brodsky is Iran policy expert and Policy Director at United Against Nuclear Iran
  (UANI). Provides expert analysis on Iranian nuclear program, sanctions policy, regional
  activities, and US-Iran relations. Advocates for maximum pressure approach on Iran.
created_date: "2026-04-30"
last_updated: "2026-04-30"
tags:
  - iran
  - policy
  - nuclear
  - sanctions
  - expert
  - uani
  - osint
reliability: medium
confidence_score: 72
update_frequency: "30m"
priority: medium
language:
  - en
geographic_focus:
  - iran
  - middle-east
cost: free
requires_auth: true
maintainer: osint-team
alert_keywords:
  - iran
  - nuclear
  - sanctions
  - irgc
  - jcpoa
  - enrichment
  - policy
  - regime
---

# Jason Brodsky - Iran Policy Expert

## Overview

Jason Brodsky (@JasonMBrodsky) is a leading Iran policy expert and Policy Director at United Against Nuclear Iran (UANI). Provides analysis on:

- Iranian nuclear program developments
- US and international sanctions policy
- IRGC activities and leadership
- Iran regional proxy operations
- Nuclear negotiations (JCPOA)
- Iranian regime politics
- Counter-proliferation policy
- Sanctions enforcement and evasion
- US-Iran relations
- Congressional Iran policy

**Account Characteristics:**
- Policy expert with advocacy organization
- Strong focus on maximum pressure approach
- Detailed sanctions policy analysis
- Nuclear program monitoring
- Congressional testimony and policy papers
- Regular media commentary

**Intelligence Value:**
- Expert interpretation of Iran developments
- Sanctions policy analysis
- Nuclear program assessment
- Policy implications for US and allies
- Regime vulnerabilities analysis
- Advocacy perspective on enforcement

## Data Collection Criteria

### Twitter Account Details

- **Handle**: JasonMBrodsky
- **Account Type**: Policy expert/analyst
- **Affiliation**: United Against Nuclear Iran (UANI)
- **Expertise**: Iran policy, nuclear issues, sanctions
- **Content Type**: Analysis, policy commentary, advocacy
- **Tweet Frequency**: 15-30 tweets per day

### Collection Method

- **Method**: timeline
- **Poll Interval**: Every 30 minutes
- **Include Retweets**: Yes (shares important Iran-related sources)
- **Include Replies**: Yes (policy discussions)
- **Include Quotes**: Yes
- **Thread Handling**: Collect threads for detailed analysis

### Content Filters

#### Include Criteria

- Nuclear program developments
- Sanctions announcements and analysis
- IRGC activities and designations
- Iran regime developments
- US Iran policy
- Congressional actions on Iran
- JCPOA negotiations
- Iranian regional activities
- Sanctions evasion schemes
- Counter-proliferation measures

#### Exclude Criteria

- General Middle East content without Iran focus
- Personal opinions without policy content
- Historical analysis without current relevance

### Keyword Monitoring

**High-Priority Keywords:**
- Iran, IRGC, Quds Force, regime
- Nuclear, enrichment, uranium, centrifuge
- Sanctions, OFAC, designation, enforcement
- JCPOA, nuclear deal, negotiations
- Khamenei, Raisi, regime leaders
- Hezbollah, Hamas, proxies
- Proliferation, weapons, missile
- Congress, administration, policy

### Entity Extraction

**Policy Elements:**
- Policy proposals and recommendations
- Sanctions actions and effectiveness
- Nuclear developments and assessments
- IRGC activities and capabilities
- Regime vulnerabilities
- Enforcement actions
- Congressional activities
- Administration positions

## Expected Data Format

### Raw Tweet Object

```json
{
  "id": "1234567890",
  "text": "IMPORTANT: New OFAC designations target Iran's oil export network. 15 entities, 10 vessels sanctioned for moving 1M+ bpd to China. This is most significant sanctions action in 2 years. Shows renewed enforcement commitment. Thread on implications for Iran's economy...",
  "created_at": "2026-04-30T15:00:00Z",
  "author": {
    "username": "JasonMBrodsky",
    "name": "Jason Brodsky"
  }
}
```

### Structured Data Extraction

```yaml
content_type: policy-analysis
topic: sanctions-action
entities:
  authority: OFAC
  target: "Iran oil export network"
  scope:
    entities: 15
    vessels: 10
    volume: "1M+ bpd"
    destination: China
assessment:
  significance: "most significant action in 2 years"
  interpretation: "renewed enforcement commitment"
  follow_up: "thread on economic implications"
priority: medium-high
tags:
  - sanctions
  - iran
  - oil-exports
  - ofac
  - enforcement
  - china
```

## Quality Indicators

### High Quality Signals

- Expert policy analysis
- Sanctions detail and context
- Congressional action tracking
- Official source citations
- Strategic implications
- Enforcement effectiveness assessment

### Low Quality Signals

- Pure advocacy without analysis
- Unsubstantiated claims
- Lack of policy context

## Examples

### Example 1: Sanctions Analysis - Medium-High Priority

**Raw Tweet:**
```
IMPORTANT: New OFAC designations target Iran's oil export network. 15 
entities, 10 vessels sanctioned for moving 1M+ bpd to China. Most significant 
sanctions action in 2 years. Shows renewed enforcement commitment. Thread 
on implications for Iran's economy...
```

**Extracted World Event:**
```yaml
title: "Expert analysis: Major OFAC sanctions on Iran oil network show renewed enforcement"
date: 2026-04-30T15:00:00Z
type: policy-analysis
subtype: sanctions-assessment
priority: medium-high
confidence: medium
tags:
  - sanctions
  - iran
  - oil-exports
  - policy-analysis
  - enforcement
entities:
  sanctions_action:
    authority: "OFAC"
    target: "Iran oil export network"
    entities_designated: 15
    vessels_designated: 10
    oil_volume: "1M+ bpd"
    destination: "China"
expert_assessment:
  significance: "most significant action in 2 years"
  interpretation: "renewed US enforcement commitment"
  policy_implication: "increased pressure on Iranian economy"
source_expertise: "UANI Policy Director"
```

## Validation Checklist

- [x] Twitter handle verified (@JasonMBrodsky)
- [x] Expert credentials confirmed (UANI Policy Director)
- [x] Collection method appropriate
- [x] Keywords defined
- [ ] Authentication configured
- [ ] Integration tested

## Monitoring & Maintenance

### Weekly Tasks
- Review policy analysis accuracy
- Track sanctions action reporting
- Update Iran policy developments

## Related Sources

- **@UANI**: United Against Nuclear Iran (organization)
- **@ofacalert**: Official sanctions monitoring
- **@IranObserve0**: Iran intelligence
- **@sanctionswatch**: International sanctions
