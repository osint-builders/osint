---
id: twitter-us-treasury
name: US Department of Treasury - Official Account
type: twitter
status: testing
description: |
  Official Twitter account for the US Department of Treasury. Provides authoritative announcements 
  on economic sanctions, foreign asset controls, financial regulations, terrorist financing 
  designations, and international financial policy. Critical source for monitoring US economic 
  statecraft, sanctions regimes, and financial intelligence related to national security threats.
created_date: "2026-04-30"
last_updated: "2026-04-30"
tags:
  - us-government
  - treasury
  - sanctions
  - ofac
  - economic-security
  - financial-intelligence
  - osint
  - official-source
reliability: high
confidence_score: 98
update_frequency: "30m"
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
  - sanctions
  - OFAC
  - designated
  - terrorist financing
  - money laundering
  - asset freeze
  - export controls
  - Russia
  - China
  - Iran
  - North Korea
  - cybercrime
  - ransomware
  - cryptocurrency
---

# US Department of Treasury - Official Account

## Overview

The US Department of Treasury (@USTreasury) is the official Twitter account for the federal executive department responsible for promoting economic prosperity and ensuring financial security. The account provides:

- Official sanctions announcements and designations
- Office of Foreign Assets Control (OFAC) actions
- Financial intelligence and threat assessments
- Economic policy statements affecting national security
- International financial cooperation initiatives
- Terrorist financing and money laundering enforcement
- Cybercrime and cryptocurrency enforcement actions
- Export control policy announcements
- Treasury Secretary statements and policy directives

**Account Characteristics:**
- Official US government cabinet department account (verified)
- High-level policy and enforcement announcements
- Focus on economic security and financial intelligence
- Regular updates on sanctions and designations
- Professional government communication style
- Multimedia content (infographics, policy documents)

**Intelligence Value:**
- Highest reliability for US sanctions policy and enforcement
- Early warning of economic countermeasures
- Identification of designated threat actors and networks
- Insight into US economic statecraft priorities
- Financial intelligence on illicit networks
- Policy signals on adversary relations

## Data Collection Criteria

### Twitter Account Details

- **Handle**: USTreasury
- **Account Type**: Official US cabinet department
- **Geographic Focus**: Global, with emphasis on adversary nations
- **Strategic Significance**: Economic security, sanctions enforcement, financial intelligence
- **Content Type**: Policy announcements, sanctions designations, enforcement actions
- **Tweet Frequency**: Multiple times daily
- **Language**: English
- **Verification**: Official verified government account

### Collection Method

- **Method**: timeline
- **Poll Interval**: Every 30 minutes
- **Include Retweets**: Yes (often amplify OFAC, FinCEN, other bureaus)
- **Include Replies**: Yes (context on policy questions)
- **Include Quotes**: Yes
- **Thread Handling**: Collect full threads for major sanctions announcements

### Content Filters

#### Include Criteria

- All sanctions announcements and designations
- OFAC actions and entity listings
- Terrorist financing enforcement actions
- Money laundering and illicit finance enforcement
- Cybercrime and ransomware-related actions
- Export control policy changes
- International financial cooperation initiatives
- Treasury Secretary statements on national security
- Financial intelligence assessments
- Cryptocurrency and digital asset enforcement

#### Exclude Criteria

- Routine economic statistics (unless security-related)
- Domestic tax policy (unless related to enforcement)
- General economic commentary without security relevance
- Historical commemorations

### Keyword Monitoring

**High-Priority Keywords:**
- Sanctions, OFAC, designated, designation
- Terrorist financing, money laundering, illicit finance
- Russia, China, Iran, North Korea, DPRK
- Cybercrime, ransomware, cyber-enabled
- Asset freeze, blocked property, SDN list
- Export controls, dual-use technology
- Cryptocurrency, virtual currency, digital assets
- Proliferation financing, WMD financing
- Foreign interference, election security
- Oligarch, kleptocracy, corruption

**Entity Keywords:**
- Office of Foreign Assets Control, OFAC
- Financial Crimes Enforcement Network, FinCEN
- Treasury Secretary
- Office of Terrorism and Financial Intelligence, TFI
- Office of Foreign Assets Control, OFAC
- Specially Designated Nationals, SDN

**Threat Actor Keywords:**
- Russian, Kremlin, Putin, oligarch
- Chinese, CCP, PRC, PLA
- Iranian, IRGC, Quds Force
- North Korean, DPRK, Kim regime
- Hezbollah, Hamas, Taliban, ISIS
- Cartel, transnational criminal organization
- Hacker group, APT, advanced persistent threat

**Activity Keywords:**
- Designation, sanctions, enforcement action
- Asset freeze, property blocked, accounts frozen
- Investigation, prosecution, penalty
- Compliance, violation, evasion
- General license, authorization, exemption
- Removal, delisting, undesignation

## Expected Data Format

### Raw Tweet Object

```json
{
  "id": "1234567890",
  "text": "BREAKING: Treasury sanctions Russian military intelligence officers and cyber actors for attempted interference in U.S. critical infrastructure. OFAC designates 12 individuals and 3 entities involved in cyber operations targeting energy sector. Full details: treasury.gov/sanctions",
  "created_at": "2026-04-30T14:30:00Z",
  "author": {
    "username": "USTreasury",
    "name": "U.S. Department of the Treasury"
  },
  "metrics": {
    "retweet_count": 3450,
    "like_count": 8920,
    "reply_count": 672
  }
}
```

### Structured Data Extraction

```yaml
event_type: sanctions-designation
action: "sanctions announced"
target:
  individuals: 12
  entities: 3
  nationality: "Russian"
  affiliation: "military intelligence"
sector: "cyber operations"
threat: "critical infrastructure targeting"
target_sector: "energy sector"
priority: critical
tags:
  - russia
  - sanctions
  - cyber
  - critical-infrastructure
  - energy-security
  - ofac
```

## Processing Instructions

### Data Extraction

1. **Fetch Timeline**
   - Use Twitter API v2 to fetch recent tweets and threads
   - High priority for sanctions announcements during geopolitical crises
   - Monitor for breaking designations and enforcement actions

2. **Content Classification**
   - Distinguish routine policy updates from significant enforcement actions
   - Identify new sanctions vs amendments to existing regimes
   - Assess strategic significance of targeted actors
   - Extract designation details and justifications

3. **Entity Extraction**
   - Designated individuals and entities
   - Sanctioning authorities (OFAC, specific executive orders)
   - Targeted countries and regions
   - Sanctioned activities and sectors
   - Legal authorities cited
   - Effective dates and compliance deadlines

4. **Significance Assessment**
   - Critical: Major new sanctions regimes, senior official designations, sectoral sanctions
   - High: Individual/entity designations, enforcement actions, policy changes
   - Medium: Amendments to existing sanctions, general licenses, guidance
   - Low: Routine compliance reminders, educational content

### Transformation to World Event Entity

```javascript
function transformToWorldEvent(tweet, extracted) {
  const eventType = classifySanctionsEvent(tweet.text);
  const priority = assessStrategicSignificance(extracted);
  
  return {
    title: buildEventTitle(extracted),
    date: tweet.created_at,
    type: eventType,
    location: {
      country: extracted.target_country,
      region: extracted.region
    },
    priority: priority,
    confidence: 'high', // Official source
    tags: generateTags(extracted),
    source: {
      type: 'twitter',
      handle: 'USTreasury',
      tweet_id: tweet.id,
      url: `https://twitter.com/USTreasury/status/${tweet.id}`,
      reliability: 'high'
    },
    entities: extracted.entities,
    contents: generateMarkdown(tweet, extracted)
  };
}
```

## Quality Indicators

### High Quality Signals

- Official designation or enforcement announcement
- Specific individual or entity names
- Legal authorities and executive order numbers cited
- Detailed description of sanctioned activities
- OFAC SDN list references
- Treasury press release links
- Coordination with international partners mentioned
- Effective dates and compliance requirements specified

### Low Quality Signals

- Vague or general policy statements
- Lack of specific targets or actions
- No legal authority cited
- Purely aspirational messaging

### Red Flags (Skip/Low Priority)

- Routine economic data releases
- Domestic tax policy without enforcement component
- Historical content without current policy relevance
- General departmental news

## Known Issues

### Issue 1: Delayed Public Disclosure
**Problem**: Designations may be publicly announced after enforcement actions begin  
**Workaround**: Monitor OFAC website and Federal Register for contemporaneous listings  
**Status**: Expected for operational security, cross-reference with primary sources

### Issue 2: Technical Legal Language
**Problem**: Heavy use of legal terminology and citation format  
**Workaround**: Maintain glossary of sanctions authorities and legal terms  
**Status**: Ongoing, enhance entity extraction for legal references

### Issue 3: Limited Operational Details
**Problem**: Designation announcements often lack detailed intelligence justification  
**Workaround**: Cross-reference with State Department, intelligence community statements  
**Status**: Expected for classification reasons, use multi-source analysis

## Examples

### Example 1: Major Sanctions Announcement - Critical Priority

**Raw Tweet:**
```
BREAKING: Treasury sanctions 15 Russian defense industry executives and 8 
entities supporting Russia's military-industrial complex. OFAC targets supply 
chains for advanced weapons systems used in Ukraine. Coordinated action with 
EU, UK, and G7 partners. These designations cut off critical technology and 
financing for Putin's war machine. Full SDN list: treasury.gov/ofac
```

**Extracted World Event:**
```yaml
title: "Treasury sanctions Russian defense industry supporting Ukraine war"
date: 2026-04-30T14:30:00Z
type: sanctions-designation
action: "OFAC sanctions"
targets:
  individuals: 15
  entities: 8
  nationality: "Russian"
  sector: "defense industry"
justification: "support for military operations in Ukraine"
scope: "weapons systems supply chains"
coordination:
  - "European Union"
  - "United Kingdom"
  - "G7 partners"
priority: critical
confidence: high
tags:
  - russia
  - ukraine-war
  - sanctions
  - defense-industry
  - ofac
  - weapons-systems
  - international-coordination
strategic_impact: "Disrupts Russian military supply chains"
```

### Example 2: Cybercrime Enforcement - High Priority

**Raw Tweet:**
```
Treasury designates North Korean state-sponsored cyber actors for ransomware 
attacks targeting U.S. hospitals and critical infrastructure. OFAC sanctions 
3 DPRK hackers and 2 front companies used to launder cryptocurrency proceeds. 
Part of whole-of-government response to DPRK malicious cyber activities. 
@FBI @CISAgov @NSACyber
```

**Extracted World Event:**
```yaml
title: "Treasury sanctions North Korean hackers for ransomware attacks"
date: 2026-04-30T11:15:00Z
type: sanctions-designation
action: "OFAC cybercrime sanctions"
targets:
  individuals: 3
  entities: 2
  nationality: "North Korean"
  affiliation: "state-sponsored"
threat_type: "ransomware"
targets_attacked:
  - "US hospitals"
  - "critical infrastructure"
activities:
  - "cryptocurrency laundering"
  - "front company operations"
coordination:
  - "FBI"
  - "CISA"
  - "NSA Cybersecurity"
priority: high
confidence: high
tags:
  - north-korea
  - dprk
  - cybercrime
  - ransomware
  - cryptocurrency
  - sanctions
  - critical-infrastructure
  - healthcare
```

### Example 3: Terrorist Financing - High Priority

**Raw Tweet:**
```
OFAC designates financial facilitator network supporting Hezbollah operations. 
Treasury sanctions 6 individuals and 4 entities involved in moving millions 
of dollars through Middle East and Latin America. Network provided critical 
funding for weapons procurement and operational support. Action taken in 
coordination with @StateDept.
```

**Extracted World Event:**
```yaml
title: "Treasury disrupts Hezbollah financial network"
date: 2026-04-30T16:45:00Z
type: sanctions-designation
action: "OFAC terrorist financing sanctions"
targets:
  individuals: 6
  entities: 4
  organization: "Hezbollah"
activities:
  - "financial facilitation"
  - "weapons procurement funding"
scale: "millions of dollars"
regions:
  - "Middle East"
  - "Latin America"
coordination:
  - "US State Department"
priority: high
confidence: high
tags:
  - hezbollah
  - terrorist-financing
  - sanctions
  - ofac
  - middle-east
  - latin-america
  - weapons-procurement
```

## Validation Checklist

Before marking source as active:

- [x] Twitter handle verified (@USTreasury)
- [x] Official government account confirmed (cabinet department)
- [x] Strategic relevance established (economic security, sanctions)
- [x] Collection method appropriate (timeline with retweets and replies)
- [x] Filters configured (all sanctions and enforcement content)
- [x] Keywords defined for designations and threat actors
- [x] Entity extraction patterns defined
- [x] Quality indicators specific and measurable
- [x] Examples comprehensive and realistic
- [ ] Account verification (confirm active and posting)
- [ ] Authentication configured (Twitter API access)
- [ ] Integration tested with collection system

## Monitoring & Maintenance

### Daily Checks
- API connectivity and tweet collection
- No collection gaps during major sanctions announcements
- Real-time monitoring during geopolitical crises
- Cross-reference with OFAC website and Federal Register

### Weekly Tasks
- Review classification accuracy for designation types
- Update threat actor terminology based on current designations
- Verify cross-references with State Department and OFAC
- Audit sanctions regime coverage

### Monthly Tasks
- Assess reliability score (should remain high for official source)
- Review designation patterns and trends
- Update geographic and threat actor focus areas
- Analyze strategic messaging patterns
- Check account changes or communication policy updates

## Related Sources

Complementary sources for US economic security intelligence:

- **@StateDept**: Diplomatic context for sanctions
- **@FBI**: Criminal enforcement and cyber threat intelligence
- **@TheJusticeDept**: Prosecutions and legal actions
- **@CISAgov**: Critical infrastructure protection
- **@NSACyber**: Cyber threat intelligence
- **@FinCEN**: Financial intelligence and reporting
- **OFAC Website**: Primary source for SDN list updates
- **Federal Register**: Official legal notices and designations
