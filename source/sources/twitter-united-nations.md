---
id: twitter-united-nations
name: United Nations - Official Account
type: twitter
status: active
description: |
  Official Twitter account for the United Nations. Provides announcements on international 
  peace and security, humanitarian crises, Security Council resolutions, peacekeeping operations, 
  diplomatic initiatives, and global governance issues. Critical source for monitoring 
  international conflicts, diplomatic responses, and multilateral cooperation on security matters.
created_date: "2026-04-30"
last_updated: "2026-04-30"
tags:
  - united-nations
  - international-security
  - peacekeeping
  - humanitarian
  - diplomacy
  - conflict-resolution
  - osint
  - official-source
  - multilateral
reliability: high
confidence_score: 96
update_frequency: "30m"
priority: high
language:
  - en
  - multiple
geographic_focus:
  - global
cost: free
requires_auth: true
maintainer: osint-team
alert_keywords:
  - Security Council
  - resolution
  - peacekeeping
  - humanitarian crisis
  - conflict
  - ceasefire
  - sanctions
  - war crimes
  - genocide
  - emergency session
  - veto
  - intervention
  - refugee crisis
---

# United Nations - Official Account

## Overview

The United Nations (@United_Nations) is the official Twitter account for the world's premier international organization responsible for maintaining international peace and security. Established in 1945, the UN serves as a platform for multilateral diplomacy and collective action. The account provides:

- UN Security Council resolutions and decisions
- Peacekeeping operation deployments and activities
- Humanitarian crisis alerts and responses
- International conflict developments and mediation efforts
- Diplomatic initiatives and peace negotiations
- Secretary-General statements and briefings
- Human rights investigations and reports
- International law enforcement and sanctions
- Global governance and cooperation initiatives
- Emergency session announcements
- Refugee and displacement crisis updates
- War crimes and atrocity prevention

**Account Characteristics:**
- Official international organization account (verified)
- Multilateral diplomatic perspective
- Authoritative on international law and resolutions
- Global humanitarian and security focus
- Professional diplomatic communication
- Multimedia content (briefings, reports, field updates)

**Intelligence Value:**
- Authoritative source on international peace and security
- Early warning of emerging conflicts and crises
- Insight into Security Council dynamics and great power politics
- Humanitarian impact assessments
- International legal frameworks and accountability
- Peacekeeping deployment patterns indicate conflict zones
- Diplomatic initiatives reveal mediation efforts
- Sanctions and enforcement measures against threat actors

## Data Collection Criteria

### Twitter Account Details

- **Handle**: United_Nations
- **Account Type**: Official international organization
- **Geographic Focus**: Global, all member states and conflict zones
- **Strategic Significance**: International peace and security, multilateral governance
- **Content Type**: Resolutions, peacekeeping updates, humanitarian alerts, diplomatic statements
- **Tweet Frequency**: Multiple times daily
- **Language**: English (primary), with multilingual content
- **Verification**: Official verified international organization account

### Collection Method

- **Method**: timeline
- **Poll Interval**: Every 30 minutes
- **Include Retweets**: Yes (often amplify UN agencies, Secretary-General, peacekeeping missions)
- **Include Replies**: Yes (diplomatic exchanges and clarifications)
- **Include Quotes**: Yes
- **Thread Handling**: Collect full threads for Security Council resolutions and major crises

### Content Filters

#### Include Criteria

- All Security Council resolutions and votes
- Peacekeeping operation deployments and mandate changes
- Humanitarian crisis declarations and emergency appeals
- International conflict developments and ceasefires
- Secretary-General statements on peace and security
- War crimes investigations and accountability measures
- International sanctions and enforcement actions
- Diplomatic mediation and peace process updates
- Refugee crises and displacement emergencies
- Emergency Security Council sessions
- Veto announcements and procedural votes
- Special envoy appointments and diplomatic missions

#### Exclude Criteria

- Routine development and sustainability content (unless security-related)
- General awareness campaigns (unless crisis-specific)
- Historical commemorations without current relevance
- Administrative and organizational announcements

### Keyword Monitoring

**High-Priority Keywords:**
- Security Council, UNSC, resolution, veto
- Peacekeeping, PKO, blue helmets, ceasefire monitors
- Humanitarian crisis, emergency, famine, displacement
- Conflict, war, ceasefire, peace agreement
- Sanctions, enforcement, compliance
- War crimes, crimes against humanity, genocide, atrocities
- Emergency session, urgent meeting
- Secretary-General, António Guterres
- Intervention, Chapter VII, mandate
- Refugees, IDPs, displaced persons
- Mediation, negotiation, peace process

**Regional Keywords:**
- Ukraine, Gaza, Syria, Yemen, Sudan, Ethiopia
- Middle East, Africa, Eastern Europe, Asia-Pacific
- Sahel, Horn of Africa, Great Lakes, Balkans
- Taiwan Strait, South China Sea, Korean Peninsula

**Agency Keywords:**
- UNHCR (refugees), UNICEF (children), WFP (food)
- OCHA (humanitarian coordination), ICRC (Red Cross)
- ICC (International Criminal Court), ICJ (International Court of Justice)
- IAEA (nuclear), OPCW (chemical weapons)

**Threat Keywords:**
- Russia, China, Iran, North Korea
- Military operation, invasion, occupation, annexation
- Chemical weapons, biological weapons, nuclear
- Terrorism, extremism, non-state armed groups
- Ethnic cleansing, mass atrocities, population transfer

**Diplomatic Keywords:**
- Resolution, vote, consensus, veto
- Mandate, authorization, Chapter VII
- Sanctions regime, arms embargo, travel ban
- Special envoy, mediator, good offices
- Peace agreement, ceasefire, truce, armistice

## Expected Data Format

### Raw Tweet Object

```json
{
  "id": "1234567890",
  "text": "BREAKING: UN Security Council passes Resolution 2678 demanding immediate ceasefire in Yemen. Vote: 13-0-2 (Russia, China abstained). Resolution authorizes expanded humanitarian access and calls for peace negotiations within 30 days. Secretary-General @antonioguterres welcomes decision, urges all parties to comply.",
  "created_at": "2026-04-30T16:45:00Z",
  "author": {
    "username": "United_Nations",
    "name": "United Nations"
  },
  "metrics": {
    "retweet_count": 12340,
    "like_count": 28900,
    "reply_count": 3456
  }
}
```

### Structured Data Extraction

```yaml
event_type: security-council-resolution
resolution_number: "2678"
subject: "Yemen ceasefire"
vote_result:
  in_favor: 13
  against: 0
  abstentions: 2
  abstaining_countries:
    - "Russia"
    - "China"
provisions:
  - "immediate ceasefire"
  - "expanded humanitarian access"
  - "peace negotiations within 30 days"
authority: "Secretary-General"
priority: critical
tags:
  - yemen
  - ceasefire
  - security-council
  - resolution
  - humanitarian-access
  - peace-negotiations
```

## Processing Instructions

### Data Extraction

1. **Fetch Timeline**
   - Use Twitter API v2 to fetch recent tweets and threads
   - Critical priority during Security Council sessions and international crises
   - Monitor for breaking resolutions and emergency meetings

2. **Content Classification**
   - Distinguish Security Council actions from other UN activities
   - Identify new conflicts vs ongoing crisis updates
   - Assess humanitarian impact and urgency
   - Extract resolution details and voting patterns

3. **Entity Extraction**
   - Resolution numbers and legal authorities
   - Countries and regions affected
   - Vote tallies and voting patterns (vetoes, abstentions)
   - Peacekeeping missions and mandates
   - Humanitarian agencies involved
   - Diplomatic actors and mediators
   - Sanctions targets and measures
   - Timeline information (ceasefire dates, negotiation deadlines)

4. **Significance Assessment**
   - Critical: Security Council resolutions, new peacekeeping deployments, humanitarian emergencies, major ceasefires
   - High: Diplomatic initiatives, emergency sessions, war crimes investigations, significant statements
   - Medium: Ongoing peacekeeping updates, humanitarian appeals, procedural votes
   - Low: Routine organizational content, awareness campaigns

### Transformation to World Event Entity

```javascript
function transformToWorldEvent(tweet, extracted) {
  const eventType = classifyUNEvent(tweet.text);
  const priority = assessInternationalSignificance(extracted);
  
  return {
    title: buildEventTitle(extracted),
    date: tweet.created_at,
    type: eventType,
    location: {
      country: extracted.country,
      region: extracted.region
    },
    priority: priority,
    confidence: 'high', // Official international organization
    tags: generateTags(extracted),
    source: {
      type: 'twitter',
      handle: 'United_Nations',
      tweet_id: tweet.id,
      url: `https://twitter.com/United_Nations/status/${tweet.id}`,
      reliability: 'high'
    },
    entities: extracted.entities,
    contents: generateMarkdown(tweet, extracted)
  };
}
```

## Quality Indicators

### High Quality Signals

- Security Council resolution numbers and voting details
- Specific peacekeeping mission names and mandates
- Secretary-General direct statements
- Precise geographic locations and conflict areas
- Humanitarian impact statistics (casualties, displaced persons)
- Timeline details (ceasefire dates, negotiation deadlines)
- Legal authorities and Chapter VII references
- Coordination with member states or regional organizations
- Links to official UN documents and reports
- Veto information and voting patterns

### Low Quality Signals

- Vague or general statements without specifics
- Lack of resolution numbers or concrete actions
- No geographic or temporal details
- Purely aspirational messaging without operational content

### Red Flags (Skip/Low Priority)

- Development and sustainability content without security nexus
- Historical commemorations
- General awareness campaigns
- Routine organizational announcements

## Known Issues

### Issue 1: Diplomatic Language
**Problem**: Official UN communications use careful diplomatic language that may obscure urgency  
**Workaround**: Cross-reference with UN agencies (@UNOCHA, @UNPeacekeeping) for operational details  
**Status**: Expected for diplomatic organization, supplement with agency-specific accounts

### Issue 2: Security Council Politics
**Problem**: Vetoes and political deadlock may limit UN action despite crisis severity  
**Workaround**: Track voting patterns and vetoes as indicators of great power interests  
**Status**: Structural UN limitation, valuable intelligence on geopolitical alignments

### Issue 3: Response Lag
**Problem**: UN responses may lag behind rapidly developing conflicts  
**Workaround**: Use UN updates as authoritative confirmation, combine with real-time sources  
**Status**: Ongoing, UN provides international legitimacy and legal framework context

## Examples

### Example 1: Security Council Resolution - Critical Priority

**Raw Tweet:**
```
BREAKING: UN Security Council unanimously adopts Resolution 2689 imposing 
comprehensive sanctions on militia leaders in Sudan responsible for ethnic 
violence. Measures include asset freezes, travel bans, and arms embargo. 
Resolution passed 15-0, reflecting international consensus on accountability. 
Secretary-General calls it "critical step toward ending atrocities."
```

**Extracted World Event:**
```yaml
title: "UN Security Council imposes sanctions on Sudan militia leaders"
date: 2026-04-30T16:45:00Z
type: security-council-resolution
resolution_number: "2689"
subject: "Sudan ethnic violence"
vote_result:
  in_favor: 15
  against: 0
  abstentions: 0
  consensus: true
measures:
  - "asset freezes"
  - "travel bans"
  - "arms embargo"
targets: "militia leaders responsible for ethnic violence"
country: "Sudan"
justification: "accountability for atrocities"
authority: "Secretary-General statement"
priority: critical
confidence: high
tags:
  - sudan
  - sanctions
  - security-council
  - ethnic-violence
  - accountability
  - unanimous-vote
  - arms-embargo
```

### Example 2: Peacekeeping Deployment - High Priority

**Raw Tweet:**
```
Security Council authorizes deployment of 5,000 UN peacekeepers to eastern 
Congo (MONUSCO expansion). Mandate includes civilian protection, humanitarian 
corridor security, and support for disarmament. Response to escalating M23 
rebel violence displacing 500,000+ people. First reinforcement in 3 years. 
Deployment within 90 days.
```

**Extracted World Event:**
```yaml
title: "UN authorizes 5,000 additional peacekeepers to eastern Congo"
date: 2026-04-30T11:20:00Z
type: peacekeeping-deployment
mission: "MONUSCO"
action: "expansion"
troop_strength: 5000
mandate:
  - "civilian protection"
  - "humanitarian corridor security"
  - "disarmament support"
location:
  country: "Democratic Republic of Congo"
  region: "eastern Congo"
trigger:
  threat: "M23 rebel violence"
  impact: "500,000+ displaced"
timeline: "deployment within 90 days"
significance: "first reinforcement in 3 years"
priority: high
confidence: high
tags:
  - drc
  - congo
  - peacekeeping
  - monusco
  - m23-rebels
  - displacement
  - civilian-protection
```

### Example 3: Humanitarian Crisis Declaration - Critical Priority

**Raw Tweet:**
```
UN declares Level 3 emergency in Gaza: worst humanitarian crisis in region's 
history. 2.3 million people facing acute food insecurity, health system 
collapsed, 1.8M displaced. Security Council meeting tomorrow on humanitarian 
ceasefire. @UNOCHA launching $800M emergency appeal. Secretary-General: 
"immediate action required to prevent catastrophe."
```

**Extracted World Event:**
```yaml
title: "UN declares Level 3 emergency in Gaza"
date: 2026-04-30T09:00:00Z
type: humanitarian-emergency
emergency_level: "Level 3" # highest UN classification
location:
  territory: "Gaza"
  region: "Middle East"
severity: "worst crisis in region's history"
impacts:
  food_insecurity: 2.3M people
  health_system: "collapsed"
  displaced: 1.8M
response:
  security_council: "meeting tomorrow on humanitarian ceasefire"
  humanitarian_appeal: "$800M"
  coordinating_agency: "UNOCHA"
authority: "Secretary-General urgent statement"
priority: critical
confidence: high
tags:
  - gaza
  - humanitarian-crisis
  - level-3-emergency
  - food-insecurity
  - displacement
  - health-collapse
  - emergency-appeal
```

## Validation Checklist

Before marking source as active:

- [x] Twitter handle verified (@United_Nations)
- [x] Official international organization account confirmed
- [x] Strategic relevance established (international peace and security)
- [x] Collection method appropriate (timeline with retweets and replies)
- [x] Filters configured (security and humanitarian content)
- [x] Keywords defined for conflicts, resolutions, and crises
- [x] Entity extraction patterns defined
- [x] Quality indicators specific and measurable
- [x] Examples comprehensive and realistic
- [ ] Account verification (confirm active and posting)
- [ ] Authentication configured (Twitter API access)
- [ ] Integration tested with collection system

## Monitoring & Maintenance

### Daily Checks
- API connectivity and tweet collection
- No collection gaps during Security Council sessions
- Real-time monitoring during international crises
- Cross-reference with UN agencies and peacekeeping missions

### Weekly Tasks
- Review classification accuracy for event types
- Update conflict zone and humanitarian crisis tracking
- Verify resolution and peacekeeping mission tracking
- Audit voting pattern and diplomatic alignment analysis

### Monthly Tasks
- Assess reliability score (should remain high for official source)
- Review crisis response patterns and effectiveness
- Update geographic focus areas based on active conflicts
- Analyze Security Council dynamics and voting trends
- Check account changes or communication policy updates

## Related Sources

Complementary sources for international security and humanitarian intelligence:

- **@antonioguterres**: UN Secretary-General personal account
- **@UNPeacekeeping**: UN peacekeeping operations
- **@UNOCHA**: UN humanitarian coordination
- **@Refugees**: UNHCR - UN refugee agency
- **@UN_PGA**: UN General Assembly President
- **@StateDept**: US State Department diplomatic perspective
- **@ICRC**: International Committee of the Red Cross
- **@IntlCrimCourt**: International Criminal Court
- **@iaeaorg**: International Atomic Energy Agency
- **@OPCW**: Organization for the Prohibition of Chemical Weapons
