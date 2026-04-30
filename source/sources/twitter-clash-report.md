---
id: twitter-clash-report
name: Clash Report - Middle East Conflict & Security Reporting
type: twitter
status: testing
description: |
  Clash Report provides real-time monitoring of military conflicts, security incidents,
  and armed clashes across the Middle East and North Africa. Aggregates frontline reports,
  military operations, militant activities, and security developments. Focuses on Syria,
  Iraq, Yemen, Libya, and regional conflicts with rapid incident reporting.
created_date: "2026-04-30"
last_updated: "2026-04-30"
tags:
  - middle-east
  - conflicts
  - military
  - security
  - osint
  - syria
  - iraq
  - yemen
  - real-time
reliability: medium
confidence_score: 72
update_frequency: "10m"
priority: high
language:
  - en
  - ar
geographic_focus:
  - middle-east
  - north-africa
cost: free
requires_auth: true
maintainer: osint-team
alert_keywords:
  - airstrike
  - explosion
  - clash
  - attack
  - killed
  - irgc
  - hezbollah
  - isis
  - missile
---

# Clash Report - Middle East Conflict & Security Reporting

## Overview

Clash Report (@ClashReport) is a rapid-response conflict monitoring account specializing in real-time reporting of military and security incidents across the Middle East and North Africa. The account aggregates information from:

- Active combat zones and conflict areas
- Military operations and airstrikes
- Militant group activities (ISIS, Al-Qaeda, etc.)
- Iranian proxy operations (Hezbollah, PMF, Houthis)
- Israeli military operations
- Terrorist attacks and security incidents
- Cross-border strikes and raids
- Drone and missile attacks
- Insurgent activities
- Protests and civil unrest with security implications

**Account Characteristics:**
- Rapid incident reporting (often within minutes)
- Aggregates Arabic and English sources
- Focus on military/security developments
- Updates as situations evolve
- Geolocated incident reporting
- Casualty and damage assessments
- Multi-country coverage across MENA region

**Intelligence Value:**
- Early warning of escalating conflicts
- Real-time battlefield awareness
- Iranian proxy activity tracking
- Terrorist group operations monitoring
- Regional instability indicators
- Cross-border conflict patterns
- Attack attribution and analysis

## Data Collection Criteria

### Twitter Account Details

- **Handle**: ClashReport
- **Account Type**: Conflict and security monitoring/aggregation
- **Geographic Coverage**: Middle East and North Africa (MENA)
- **Content Type**: Incident reports, military operations, breaking security news
- **Tweet Frequency**: 20-50 tweets per day (varies with conflict intensity)
- **Response Time**: Often within minutes of incidents
- **Language Coverage**: English and Arabic sources

### Collection Method

- **Method**: timeline
- **Poll Interval**: Every 10 minutes (high frequency for real-time incidents)
- **Include Retweets**: Yes (shares ground sources and official accounts)
- **Include Replies**: Yes (updates and clarifications on developing situations)
- **Include Quotes**: Yes
- **Thread Handling**: Collect entire thread (developing situations updated in threads)

### Content Filters

#### Include Criteria

- Military operations and airstrikes
- Armed clashes and firefights
- Explosions and IED attacks
- Missile and drone strikes
- Cross-border incidents
- Terrorist attacks
- Militant group operations
- Israeli operations in region
- Iranian proxy activities
- Base attacks and rocket fire
- Assassination and targeted killings
- Security force operations
- Major protests with security implications

#### Exclude Criteria

- General political commentary without security incidents
- Historical analysis without current relevance
- Unverified rumors (unless clearly marked)
- Non-security social issues
- Pure propaganda without factual incident

### Keyword Monitoring

**High-Priority Keywords:**
- Airstrike, bombing, explosion, blast
- Attack, assault, raid, operation
- Clash, firefight, combat, battle
- Killed, casualties, wounded, dead
- Missile, rocket, drone, UAV
- IRGC, Hezbollah, PMF, Houthis
- ISIS, ISIL, Daesh, Al-Qaeda
- IDF, Israeli, Israel
- Syrian, Iraq, Yemen, Libya

**Incident Keywords:**
- Explosion, blast, IED, VBIED
- Suicide bomber, car bomb
- Shelling, artillery, mortar
- Sniper, ambush, raid
- Kidnapping, hostage, abduction

**Location Keywords:**
- Syria: Damascus, Aleppo, Idlib, Deir ez-Zor
- Iraq: Baghdad, Mosul, Basra, Kirkuk, Anbar
- Yemen: Sanaa, Aden, Hodeidah, Marib
- Lebanon: Beirut, South Lebanon, Bekaa Valley
- Gaza, West Bank, Golan Heights
- Libya: Tripoli, Benghazi, Sirte

**Actor Keywords:**
- IRGC, Quds Force, Iranian militias
- Hezbollah, Amal
- Hamas, Islamic Jihad
- PMF, Hashd al-Shaabi, Kata'ib Hezbollah
- Houthis, Ansar Allah
- ISIS, Al-Qaeda, HTS (Hayat Tahrir al-Sham)
- IDF, Israeli forces
- US forces, coalition

### Entity Extraction

**Incident Details:**
- Incident type (airstrike, explosion, clash, etc.)
- Location (city, neighborhood, coordinates if available)
- Date and time
- Casualties (killed, wounded)
- Damage assessment

**Actors:**
- Attacking force/group
- Target (military, militia, civilian)
- Responsibility claims
- Attribution assessment

**Assets:**
- Weapons used (missiles, drones, IEDs)
- Facilities targeted (bases, depots, infrastructure)
- Equipment destroyed or damaged

**Context:**
- Ongoing operation or isolated incident
- Retaliation or provocation
- Part of larger conflict pattern
- Strategic significance

## Expected Data Format

### Raw Tweet Object

```json
{
  "id": "1234567890",
  "text": "BREAKING: Multiple airstrikes reported in eastern Damascus, targeting Iranian militia positions near Damascus International Airport. At least 4 explosions heard. Initial reports of casualties among IRGC advisors. Likely Israeli strike. Developing...",
  "created_at": "2026-04-30T22:15:00Z",
  "author": {
    "username": "ClashReport",
    "name": "Clash Report"
  },
  "metrics": {
    "retweet_count": 234,
    "like_count": 456,
    "reply_count": 67
  }
}
```

### Structured Data Extraction

```yaml
incident_type: airstrike
location:
  city: "Damascus"
  area: "eastern Damascus"
  specific: "near Damascus International Airport"
  country: "Syria"
date_time: "2026-04-30T22:15:00Z"
target:
  type: "Iranian militia positions"
  specific: "IRGC advisors"
attack_details:
  method: "airstrikes"
  count: "multiple (at least 4 explosions)"
casualties:
  status: "initial reports"
  affected: "IRGC advisors"
attribution:
  assessment: "likely Israeli strike"
  confidence: "medium"
status: "developing"
priority: high
tags:
  - airstrike
  - syria
  - damascus
  - irgc
  - israel
  - iranian-militias
```

## Processing Instructions

### Data Extraction

1. **Fetch Timeline**
   - Use Twitter API v2 for recent tweets
   - High-frequency polling (10 minutes) for breaking incidents
   - Monitor replies for updates on developing situations
   - Track threads as incidents evolve

2. **Incident Classification**
   - Airstrike/bombing (high priority)
   - Armed clash/firefight (medium-high priority)
   - Explosion/IED attack (high priority)
   - Missile/drone strike (high priority)
   - Assassination/targeted killing (high priority)
   - Terrorist attack (high priority)
   - Security operation (medium priority)
   - Protest with violence (medium priority)

3. **Entity Extraction**
   - Parse location information (city, neighborhood, landmark)
   - Extract casualty figures (killed, wounded)
   - Identify actors (attackers, targets, groups)
   - Capture weapons/methods used
   - Extract attribution (who conducted attack)
   - Note confidence level of information

4. **Verification Assessment**
   - Note if "unconfirmed," "reports," "alleged"
   - Track updates and confirmations
   - Flag conflicting information
   - Assess source credibility indicators

### Transformation to World Event Entity

```javascript
function transformToWorldEvent(tweet, extracted) {
  const incidentType = classifyIncident(tweet.text);
  
  return {
    title: buildIncidentTitle(extracted, incidentType),
    date: tweet.created_at,
    type: 'military-incident',
    location: extractIncidentLocation(extracted),
    priority: calculatePriority(incidentType, extracted),
    confidence: assessConfidence(tweet.text, extracted),
    tags: generateTags(extracted, incidentType),
    source: {
      type: 'twitter',
      handle: 'ClashReport',
      tweet_id: tweet.id,
      url: `https://twitter.com/ClashReport/status/${tweet.id}`,
      verification_status: extracted.verification_status
    },
    entities: extracted.entities,
    contents: generateMarkdown(tweet, extracted)
  };
}

function classifyIncident(text) {
  const textLower = text.toLowerCase();
  
  if (textLower.match(/airstrike|air strike|bombing|bombed/)) {
    return 'airstrike';
  }
  if (textLower.match(/explosion|blast|ied|vbied/)) {
    return 'explosion';
  }
  if (textLower.match(/clash|firefight|combat|battle/)) {
    return 'armed-clash';
  }
  if (textLower.match(/missile|rocket.*attack|drone.*strike/)) {
    return 'missile-drone-attack';
  }
  if (textLower.match(/assassin|targeted.*kill|eliminate/)) {
    return 'targeted-killing';
  }
  if (textLower.match(/suicide.*bomb|terrorist.*attack/)) {
    return 'terrorist-attack';
  }
  
  return 'security-incident';
}

function assessConfidence(text, entities) {
  const textLower = text.toLowerCase();
  
  if (textLower.match(/confirmed|verified/)) {
    return 'high';
  }
  if (textLower.match(/reports|allegedly|likely|appears/)) {
    return 'medium';
  }
  if (textLower.match(/unconfirmed|rumor|developing/)) {
    return 'low-medium';
  }
  
  return 'medium';
}

function calculatePriority(incidentType, entities) {
  // Critical: Major attacks, high casualties, escalation risks
  if (entities.casualties_high || entities.israeli_iran_conflict || entities.major_facility) {
    return 'critical';
  }
  
  // High: Airstrikes, cross-border attacks, proxy operations
  if (incidentType === 'airstrike' || 
      incidentType === 'missile-drone-attack' ||
      entities.cross_border || entities.irgc_hezbollah) {
    return 'high';
  }
  
  // Medium: Armed clashes, local incidents, limited scope
  if (incidentType === 'armed-clash' || incidentType === 'security-incident') {
    return 'medium';
  }
  
  return 'medium';
}
```

## Quality Indicators

### High Quality Signals

- Specific location details (street, neighborhood, landmark)
- Casualty figures provided
- Multiple source corroboration mentioned
- Attribution with reasoning
- Visual evidence referenced (photos, videos)
- Timeline of events
- Official confirmation or statement
- Updates with corrections/confirmations
- Geolocation coordinates
- Weapon/method identification

### Low Quality Signals

- Vague location ("northern Syria")
- No casualty information
- Single unverified source
- No attribution or context
- Delayed reporting without explanation
- Contradictory information not addressed

### Red Flags (Skip/Low Priority)

- Pure speculation without factual basis
- Propaganda without incident details
- Unverifiable rumors
- Old incidents presented as new
- Duplicate reporting without updates

## Known Issues

### Issue 1: Rapid Reporting vs. Verification
**Problem**: Speed prioritized over complete verification in breaking situations  
**Workaround**: Track updates and confirmations; note confidence levels  
**Status**: Confidence scoring implemented

### Issue 2: Casualty Figure Reliability
**Problem**: Initial casualty reports often inaccurate or incomplete  
**Workaround**: Mark as "initial reports"; track updates  
**Status**: Casualty data marked with verification status

### Issue 3: Attribution Challenges
**Problem**: Difficult to immediately confirm who conducted attack  
**Workaround**: Extract assessment language ("likely," "appears," "allegedly")  
**Status**: Attribution confidence scoring

### Issue 4: Multiple Conflicting Sources
**Problem**: Arabic and English sources may provide conflicting information  
**Workaround**: Note conflicts; track which information confirmed  
**Status**: Conflict flagging in extraction

### Issue 5: Geolocation Precision
**Problem**: Exact coordinates not always available  
**Workaround**: Extract best available (landmark, neighborhood, city)  
**Status**: Hierarchical location extraction

## Examples

### Example 1: Israeli Airstrike on Iranian Targets - Critical Priority

**Raw Tweet Thread:**
```
1/ BREAKING: Large-scale Israeli airstrikes targeting Iranian and Hezbollah 
positions in Damascus and Homs provinces, Syria. Multiple waves of strikes 
ongoing.

2/ Targets include:
- Damascus Airport area: IRGC logistics hub
- Al-Qusayr, Homs: Hezbollah weapons depot
- T4 Airbase area: Iranian drone facility

At least 8 explosions reported so far. Syrian air defenses activated.

3/ UPDATE: Syrian sources report at least 7 IRGC members and 4 Hezbollah 
fighters killed. Several warehouses destroyed. Large secondary explosions 
suggest ammunition/weapons storage hit.

4/ This appears to be retaliation for rocket attack on Israeli positions 
in Golan Heights yesterday. Largest Israeli operation in Syria in 6 months. 
#Syria #Israel #Iran
```

**Extracted World Event:**
```yaml
title: "Israeli airstrikes target Iranian and Hezbollah positions across Syria"
date: 2026-04-30T22:15:00Z
type: military-incident
subtype: airstrike
location:
  country: "Syria"
  provinces:
    - "Damascus"
    - "Homs"
priority: critical
confidence: medium-high
tags:
  - airstrike
  - syria
  - israel
  - irgc
  - hezbollah
  - retaliation
attack_details:
  type: "airstrike"
  scale: "large-scale, multiple waves"
  attacker: "Israel (IDF)"
  explosions: "at least 8"
  air_defense: "Syrian air defenses activated"
targets:
  - location: "Damascus Airport area"
    target: "IRGC logistics hub"
  - location: "Al-Qusayr, Homs"
    target: "Hezbollah weapons depot"
  - location: "T4 Airbase area"
    target: "Iranian drone facility"
casualties:
  irgc: "at least 7 killed"
  hezbollah: "4 fighters killed"
  verification: "Syrian sources"
damage:
  - "several warehouses destroyed"
  - "large secondary explosions (ammunition/weapons)"
context:
  trigger: "retaliation for rocket attack on Golan Heights"
  significance: "largest Israeli operation in Syria in 6 months"
verification_status: "developing, multiple sources"
```

### Example 2: ISIS Attack in Iraq - High Priority

**Raw Tweet:**
```
BREAKING: ISIS militants attacked Iraqi Army checkpoint near Kirkuk, 
northern Iraq. Heavy fighting ongoing. Initial reports of 4 soldiers killed, 
3 wounded. ISIS claimed responsibility via Telegram.

Attack occurred at dawn during shift change. Militants used light weapons 
and RPGs. Iraqi reinforcements en route. #Iraq #ISIS
```

**Extracted World Event:**
```yaml
title: "ISIS attacks Iraqi Army checkpoint near Kirkuk, 4 soldiers killed"
date: 2026-04-30T05:30:00Z
type: military-incident
subtype: terrorist-attack
location:
  city: "Kirkuk"
  region: "northern Iraq"
  country: "Iraq"
  specific: "army checkpoint"
priority: high
confidence: medium
tags:
  - isis
  - iraq
  - terrorist-attack
  - kirkuk
  - iraqi-army
attack_details:
  attacker: "ISIS militants"
  target: "Iraqi Army checkpoint"
  status: "heavy fighting ongoing"
  timing: "dawn during shift change"
  weapons: "light weapons and RPGs"
  responsibility: "claimed via Telegram"
casualties:
  iraqi_army:
    killed: 4
    wounded: 3
  status: "initial reports"
response:
  - "Iraqi reinforcements en route"
significance: "ISIS remains active in northern Iraq"
```

### Example 3: Houthi Missile Attack - High Priority

**Raw Tweet:**
```
BREAKING: Houthi forces in Yemen fired ballistic missile toward Saudi 
Arabia. Target: Abha International Airport. Saudi air defenses intercepted 
missile. No casualties reported.

Houthis claim attack in retaliation for Saudi airstrikes on Sanaa yesterday. 
Escalation in Yemen conflict. #Yemen #Saudi
```

**Extracted World Event:**
```yaml
title: "Houthis fire ballistic missile at Saudi airport, intercepted"
date: 2026-04-30T14:45:00Z
type: military-incident
subtype: missile-attack
location:
  attacker_location: "Yemen"
  target_location: "Abha, Saudi Arabia"
  target: "Abha International Airport"
priority: high
confidence: high
tags:
  - houthis
  - yemen
  - saudi-arabia
  - ballistic-missile
  - air-defense
attack_details:
  attacker: "Houthi forces"
  weapon: "ballistic missile"
  target: "Abha International Airport"
  result: "intercepted by Saudi air defenses"
  casualties: "none reported"
houthi_claim:
  responsibility: "claimed"
  justification: "retaliation for Saudi airstrikes on Sanaa"
context: "escalation in Yemen conflict"
significance: "Cross-border attack targeting civilian infrastructure"
```

### Example 4: Hezbollah-IDF Border Clash - High Priority

**Raw Tweet:**
```
Clash at Lebanon-Israel border. Hezbollah fired anti-tank missiles at 
Israeli military position near Metula. IDF responded with artillery fire 
into southern Lebanon.

No casualties reported on either side. Tensions high following recent 
Israeli operations in Syria. #Lebanon #Israel #Hezbollah
```

**Extracted World Event:**
```yaml
title: "Hezbollah fires anti-tank missiles at Israeli position, IDF responds with artillery"
date: 2026-04-30T11:20:00Z
type: military-incident
subtype: armed-clash
location:
  border: "Lebanon-Israel"
  israeli_side: "near Metula"
  lebanese_side: "southern Lebanon"
priority: high
confidence: medium-high
tags:
  - hezbollah
  - israel
  - lebanon
  - border-clash
  - escalation
incident_details:
  hezbollah_action:
    weapon: "anti-tank missiles"
    target: "Israeli military position near Metula"
  idf_response:
    weapon: "artillery fire"
    target: "southern Lebanon"
  casualties: "none reported on either side"
context:
  - "tensions high following Israeli operations in Syria"
  - "potential escalation risk"
significance: "Direct engagement between Hezbollah and IDF"
```

## Validation Checklist

Before marking source as active:

- [x] Twitter handle verified (@ClashReport)
- [x] Geographic focus confirmed (MENA region)
- [x] Collection method appropriate (timeline, 10min high-frequency)
- [x] Keywords defined for incident types
- [x] Entity extraction patterns defined
- [x] Confidence assessment methodology established
- [x] Quality indicators specific for conflict reporting
- [x] Priority levels aligned with threat assessment
- [x] Examples comprehensive across incident types
- [ ] Authentication configured (Twitter API access)
- [ ] Integration tested with collection system
- [ ] Update tracking mechanism for developing incidents

## Monitoring & Maintenance

### Daily Checks
- API connectivity and collection completeness
- High-priority incident capture
- Thread collection for developing situations
- Update correlation for initial vs. confirmed reports

### Weekly Tasks
- Review incident classification accuracy
- Verify casualty report reliability
- Update actor/group naming patterns
- Track attribution accuracy
- Assess confidence scoring calibration

### Monthly Tasks
- Audit reliability score against confirmed incidents
- Review priority assignments
- Update geographic keyword coverage
- Validate against other conflict monitoring sources
- Check for account bias patterns

### Special Monitoring
- **Major Escalations**: Immediate priority review
- **Cross-Border Incidents**: Track for regional implications
- **High-Casualty Events**: Verify and track updates
- **Israeli-Iran Shadow War**: Pattern analysis

## Related Sources

Complementary sources for Middle East conflict monitoring:

- **@Syria_Rebel_Obs**: Syria conflict monitoring
- **@IraqiSecurity**: Iraq security developments
- **@YemeniObserv**: Yemen conflict tracking
- **@IranObserve0**: Iranian activities in region
- **@IntelliTimes**: Middle East intelligence
- **@Natsecjeff**: Regional security analysis
- **Local Language Sources**: Arabic-language conflict monitors
- **ACLED**: Armed Conflict Location & Event Data
- **UCDP**: Uppsala Conflict Data Program
