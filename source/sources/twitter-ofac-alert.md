---
id: twitter-ofac-alert
name: OFAC Alert - US Treasury Sanctions Announcements
type: twitter
status: active
description: |
  Official and curated alerts for US Treasury Office of Foreign Assets Control (OFAC)
  sanctions designations, enforcement actions, and compliance updates. Tracks sanctions
  against Iran, Russia, North Korea, terrorism financing, and other national security
  threats. Critical source for sanctions compliance and geopolitical intelligence.
created_date: "2026-04-30"
last_updated: "2026-04-30"
tags:
  - sanctions
  - ofac
  - treasury
  - compliance
  - iran
  - russia
  - terrorism
  - osint
reliability: high
confidence_score: 95
update_frequency: "10m"
priority: high
language:
  - en
geographic_focus:
  - global
cost: free
requires_auth: true
maintainer: osint-team
alert_keywords:
  - sanctions
  - designated
  - ofac
  - iran
  - russia
  - terrorism
  - enforcement
  - blocked
---

# OFAC Alert - US Treasury Sanctions Announcements

## Overview

OFAC Alert (@ofacalert) provides real-time monitoring and alerts for US Treasury Office of Foreign Assets Control (OFAC) sanctions actions. This is a critical compliance and intelligence source covering:

- Specially Designated Nationals (SDN) list additions
- Sectoral sanctions designations
- General licenses and authorizations
- Enforcement actions and civil penalties
- Sanctions program updates (Iran, Russia, North Korea, etc.)
- Executive orders implementing new sanctions
- OFAC guidance and FAQ updates
- Removal from sanctions lists (de-designations)
- Compliance advisories and alerts
- Global Magnitsky Act designations

**Account Characteristics:**
- Real-time OFAC monitoring and aggregation
- Official Treasury Department announcements
- Technical compliance details
- Legal citations and regulatory references
- High reliability and accuracy
- Immediate notification of new designations

**Intelligence Value:**
- Early warning of sanctions enforcement actions
- Network analysis of designated entities
- Geopolitical signaling through sanctions policy
- Compliance risk assessment
- Financial intelligence on illicit networks
- Counter-proliferation intelligence
- Terrorism financing tracking
- Strategic competitor monitoring (Iran, Russia, China, North Korea)

## Data Collection Criteria

### Twitter Account Details

- **Handle**: ofacalert
- **Account Type**: Curated sanctions monitoring/alerting
- **Authority**: Aggregates official US Treasury OFAC announcements
- **Content Type**: Sanctions designations, enforcement, compliance
- **Tweet Frequency**: 5-20 tweets per day (varies with OFAC activity)
- **Timeliness**: Near real-time with OFAC announcements

### Collection Method

- **Method**: timeline
- **Poll Interval**: Every 10 minutes (high priority for timely sanctions intel)
- **Include Retweets**: Yes (may share official Treasury content)
- **Include Replies**: No (focus on primary alerts)
- **Include Quotes**: Yes
- **Thread Handling**: Collect entire thread (details often span multiple tweets)

### Content Filters

#### Include Criteria

- All OFAC designation announcements
- Enforcement action notifications
- Sanctions program updates
- General license issuances
- De-designation announcements
- Executive orders implementing sanctions
- Compliance advisories
- OFAC guidance updates
- Civil monetary penalties

#### Exclude Criteria

- General commentary without new sanctions actions
- Historical analysis without current relevance
- Promotional content (rare)
- Duplicate notifications

### Keyword Monitoring

**High-Priority Keywords:**
- Designated, SDN, sanctions, blocked
- OFAC, Treasury, enforcement
- Iran, IRGC, Hezbollah, Hamas
- Russia, Putin, oligarch, Ukraine
- North Korea, DPRK, WMD
- Terrorism, terrorist, Al-Qaeda, ISIS
- Proliferation, nuclear, missile
- General license, authorization

**Action Keywords:**
- Added, designated, sanctioned, blocked
- Removed, de-designated, delisted
- Enforcement, penalty, violation
- Updated, amended, modified

**Program Keywords:**
- Iran sanctions (IFSR, ISA, CISADA)
- Russia sanctions (Ukraine-related, CBW, election interference)
- CAATSA (Countering America's Adversaries Through Sanctions Act)
- North Korea sanctions
- Syria sanctions
- Venezuela sanctions
- Counter-terrorism sanctions
- Global Magnitsky sanctions

**Entity Keywords:**
- Individual, entity, vessel, aircraft
- Front company, alias, shell company
- Procurement network, financial facilitator
- Government official, military, intelligence

### Entity Extraction

**Designated Parties:**
- Individual names (including aliases)
- Company names and variations
- Government agencies and ministries
- Vessel names and IMO numbers
- Aircraft tail numbers
- Digital currency addresses

**Designation Details:**
- SDN list vs. sectoral sanctions
- Sanctions program (e.g., IRAN, UKRAINE-EO13662)
- Legal authority (Executive Order, statute)
- Designation date
- Identifying information (DOB, passport, address, registration)

**Prohibited Activities:**
- Asset freeze (blocking)
- Transaction prohibitions
- Secondary sanctions exposure
- 50% rule implications

**Geographic Information:**
- Country of citizenship/incorporation
- Operating locations
- Address information

## Expected Data Format

### Raw Tweet Object

```json
{
  "id": "1234567890",
  "text": "NEW: OFAC designates Iranian UAV manufacturer Qods Aviation Industries and 3 executives under E.O. 13382 (WMD proliferation). All property blocked, US persons prohibited from transactions. Secondary sanctions apply. Entities supplied drones to IRGC-QF and Russia. #Sanctions",
  "created_at": "2026-04-30T14:30:00Z",
  "author": {
    "username": "ofacalert",
    "name": "OFAC Alert"
  },
  "metrics": {
    "retweet_count": 89,
    "like_count": 156,
    "reply_count": 23
  },
  "entities": {
    "hashtags": ["Sanctions"],
    "urls": ["https://home.treasury.gov/..."]
  }
}
```

### Structured Data Extraction

```yaml
designation_type: new_designation
sanctions_program: WMD_Proliferation
legal_authority: "Executive Order 13382"
designated_entities:
  - type: company
    name: "Qods Aviation Industries"
    country: "Iran"
    reason: "UAV manufacturing for IRGC-QF and Russia"
  - type: individuals
    count: 3
    role: "executives"
prohibited_activities:
  - "asset blocking"
  - "transaction prohibition (US persons)"
  - "secondary sanctions"
strategic_context:
  suppliers_to:
    - "IRGC-QF"
    - "Russia"
  sector: "UAV/drone production"
priority: high
tags:
  - ofac
  - iran
  - wmd-proliferation
  - uav
  - russia
  - secondary-sanctions
```

## Processing Instructions

### Data Extraction

1. **Fetch Timeline**
   - Use Twitter API v2 for recent tweets
   - High-frequency polling (10 minutes) for timely intelligence
   - Monitor official Treasury links
   - Track threads for comprehensive designation details

2. **Content Classification**
   - New designations (highest priority)
   - Enforcement actions (high priority)
   - General licenses (medium-high priority)
   - De-designations (medium priority)
   - Guidance updates (medium priority)
   - Program amendments (medium priority)

3. **Entity Extraction**
   - Parse designated entity names and aliases
   - Extract identifying information (DOB, passport, address)
   - Capture sanctions program codes
   - Extract legal authority citations
   - Identify linked entities and networks
   - Extract vessel/aircraft identifiers

4. **Sanctions Analysis**
   - Determine sanctions type (SDN, sectoral, secondary)
   - Identify prohibited activities
   - Assess secondary sanctions risk
   - Map entity relationships and networks
   - Evaluate geopolitical significance

### Transformation to World Event Entity

```javascript
function transformToWorldEvent(tweet, extracted) {
  const sanctionsType = classifySanctionsAction(tweet.text);
  
  return {
    title: buildSanctionsTitle(extracted, sanctionsType),
    date: tweet.created_at,
    type: 'sanctions-action',
    location: extractTargetCountries(extracted),
    priority: calculatePriority(sanctionsType, extracted),
    confidence: 'high',
    tags: generateTags(extracted, sanctionsType),
    source: {
      type: 'twitter',
      handle: 'ofacalert',
      tweet_id: tweet.id,
      url: `https://twitter.com/ofacalert/status/${tweet.id}`,
      official_link: extracted.treasury_link
    },
    entities: extracted.entities,
    contents: generateMarkdown(tweet, extracted)
  };
}

function classifySanctionsAction(text) {
  const textLower = text.toLowerCase();
  
  if (textLower.match(/designate|added to sdn|sanctioned|blocked/)) {
    return 'new-designation';
  }
  if (textLower.match(/enforcement|penalty|violation|settlement/)) {
    return 'enforcement-action';
  }
  if (textLower.match(/general license|authorization|gl/)) {
    return 'general-license';
  }
  if (textLower.match(/removed|delisted|de-designated/)) {
    return 'de-designation';
  }
  if (textLower.match(/amended|updated|modified/)) {
    return 'program-update';
  }
  
  return 'sanctions-alert';
}

function calculatePriority(sanctionsType, entities) {
  // Critical: Major designations, WMD proliferation, state actors
  if (entities.wmd_related || entities.state_actor || entities.major_bank) {
    return 'critical';
  }
  
  // High: Terrorism financing, sanctions evasion networks, oligarchs
  if (sanctionsType === 'new-designation' && 
      (entities.terrorism_related || entities.network_designation)) {
    return 'high';
  }
  
  // Medium: General licenses, enforcement, updates
  if (sanctionsType === 'general-license' || sanctionsType === 'enforcement-action') {
    return 'medium';
  }
  
  return 'medium';
}
```

## Quality Indicators

### High Quality Signals

- Direct link to Treasury.gov announcement
- Specific SDN list numbers
- Legal authority cited (E.O., statute)
- Identifying information provided
- Sanctions program code specified
- Date of designation included
- Reason for designation stated
- Network connections identified
- Secondary sanctions implications noted

### Low Quality Signals

- Vague or incomplete information
- Missing legal citations
- No link to official source
- Unclear designation status
- Missing entity identifiers

### Red Flags (Skip/Low Priority)

- Speculation or rumors
- Outdated historical sanctions
- Unofficial or unconfirmed reports
- Duplicate announcements

## Known Issues

### Issue 1: Name Variations and Aliases
**Problem**: Designated entities may have multiple names, transliterations, aliases  
**Workaround**: Extract all aliases mentioned; normalize names for tracking  
**Status**: Entity extraction includes alias detection

### Issue 2: Complex Ownership Structures
**Problem**: 50% rule and ownership networks can be complex  
**Workaround**: Document ownership relationships; track parent entities  
**Status**: Network mapping in entity extraction

### Issue 3: Retroactive Designation Dates
**Problem**: Some designations have effective dates in past  
**Workaround**: Capture both announcement date and effective date  
**Status**: Timestamp handling implemented

### Issue 4: Secondary Sanctions Implications
**Problem**: Secondary sanctions affect non-US parties, complex to determine exposure  
**Workaround**: Flag secondary sanctions provisions; link to OFAC guidance  
**Status**: Classification includes sanctions type

## Examples

### Example 1: Iranian Entity Designation - Critical Priority

**Raw Tweet:**
```
BREAKING: OFAC designates Iran's Ministry of Defense and Armed Forces 
Logistics (MODAFL) and 8 senior officials under E.O. 13382 (WMD 
proliferation) and CAATSA. All assets blocked. Non-US persons engaging in 
significant transactions face secondary sanctions.

Officials include Defense Minister Gen. Mohammad Reza Ashtiani. Designation 
targets Iran's ballistic missile and nuclear programs. Full details: 
treasury.gov/... #Iran #Sanctions
```

**Extracted World Event:**
```yaml
title: "OFAC designates Iran's Ministry of Defense and 8 officials for WMD proliferation"
date: 2026-04-30T14:30:00Z
type: sanctions-action
subtype: new-designation
location:
  country: "Iran"
priority: critical
confidence: high
tags:
  - ofac
  - iran
  - wmd-proliferation
  - ballistic-missiles
  - nuclear-program
  - secondary-sanctions
  - caatsa
entities:
  organizations:
    - name: "Ministry of Defense and Armed Forces Logistics (MODAFL)"
      country: "Iran"
      designation_basis: "WMD proliferation"
  individuals:
    count: 8
    notable:
      - name: "Gen. Mohammad Reza Ashtiani"
        title: "Defense Minister"
  legal_authorities:
    - "Executive Order 13382"
    - "CAATSA"
  sanctions_details:
    asset_blocking: true
    transaction_prohibition: true
    secondary_sanctions: true
    target: "ballistic missile and nuclear programs"
significance: "Major designation of Iranian defense ministry and leadership"
compliance_impact: "High - secondary sanctions apply to foreign transactions"
```

### Example 2: Russia Oligarch Designation - High Priority

**Raw Tweet:**
```
NEW: OFAC adds 5 Russian oligarchs and 12 entities to SDN list under 
Ukraine-related sanctions (E.O. 14024). Combined net worth ~$30B.

Includes Viktor Vekselberg's yacht & private jets, Alisher Usmanov's 
holding companies. All property blocked, visa restrictions. Secondary 
sanctions for material support. Part of coordinated action with EU, UK.
```

**Extracted World Event:**
```yaml
title: "OFAC sanctions 5 Russian oligarchs and 12 entities over Ukraine invasion"
date: 2026-04-30T16:45:00Z
type: sanctions-action
subtype: new-designation
location:
  country: "Russia"
  context: "Ukraine conflict"
priority: high
confidence: high
tags:
  - ofac
  - russia
  - ukraine
  - oligarchs
  - coordinated-sanctions
entities:
  individuals:
    count: 5
    net_worth: "$30 billion combined"
    notable:
      - "Viktor Vekselberg"
      - "Alisher Usmanov"
  entities:
    count: 12
    types:
      - "yachts"
      - "private jets"
      - "holding companies"
  legal_authority: "Executive Order 14024"
  sanctions_program: "Ukraine-related"
  sanctions_details:
    asset_blocking: true
    visa_restrictions: true
    secondary_sanctions: "material support"
  international_coordination:
    - "European Union"
    - "United Kingdom"
significance: "High-value targets in coordinated Western sanctions campaign"
```

### Example 3: Hezbollah Network Designation - High Priority

**Raw Tweet:**
```
OFAC designates Lebanon-based money exchange network for laundering funds 
for Hezbollah. 6 individuals, 4 exchange houses added to SDN list under 
terrorism sanctions (E.O. 13224).

Network moved millions through Lebanese, Syrian, and Gulf exchanges to 
evade sanctions. Assets frozen, criminal referral to DOJ. Secondary 
sanctions warning for financial institutions. #Hezbollah #Terrorism
```

**Extracted World Event:**
```yaml
title: "OFAC sanctions Lebanon money exchange network laundering Hezbollah funds"
date: 2026-04-30T11:20:00Z
type: sanctions-action
subtype: new-designation
location:
  primary: "Lebanon"
  network_locations:
    - "Syria"
    - "Gulf states"
priority: high
confidence: high
tags:
  - ofac
  - hezbollah
  - terrorism-financing
  - money-laundering
  - lebanon
entities:
  individuals: 6
  entities: 4
  entity_types: "money exchange houses"
  legal_authority: "Executive Order 13224"
  sanctions_program: "terrorism"
  illicit_activity:
    type: "sanctions evasion money laundering"
    beneficiary: "Hezbollah"
    volume: "millions of dollars"
    methods: "Lebanese, Syrian, Gulf exchanges"
  enforcement:
    asset_freeze: true
    criminal_referral: "DOJ"
    secondary_sanctions_warning: true
significance: "Disruption of Hezbollah financial network"
```

### Example 4: General License Update - Medium Priority

**Raw Tweet:**
```
OFAC issues General License 54 authorizing certain transactions related to 
humanitarian assistance in Syria. License permits NGOs to provide food, 
medicine, medical supplies despite Syria sanctions.

Excludes transactions with designated entities. Expires March 2027. Full 
text: treasury.gov/... #Syria #Sanctions
```

**Extracted World Event:**
```yaml
title: "OFAC issues general license for humanitarian aid in Syria"
date: 2026-04-30T13:00:00Z
type: sanctions-action
subtype: general-license
location:
  country: "Syria"
priority: medium
confidence: high
tags:
  - ofac
  - syria
  - general-license
  - humanitarian-aid
entities:
  license_number: "General License 54"
  authorized_activities:
    - "food provision"
    - "medicine provision"
    - "medical supplies"
  authorized_parties: "NGOs"
  exclusions: "no transactions with designated entities"
  expiration: "March 2027"
significance: "Humanitarian carve-out from Syria sanctions regime"
compliance_impact: "Medium - enables NGO operations in Syria"
```

### Example 5: Enforcement Action - High Priority

**Raw Tweet:**
```
OFAC announces $2.3M civil penalty against UK financial institution for 
apparent violations of Iran sanctions. Bank processed 127 transactions 
totaling $8.4M for IRISL-related entities 2020-2023.

Voluntary self-disclosure, cooperation resulted in reduced penalty. First 
major UK bank penalty since 2019. #Compliance #Sanctions
```

**Extracted World Event:**
```yaml
title: "OFAC fines UK bank $2.3M for Iran sanctions violations"
date: 2026-04-30T15:30:00Z
type: sanctions-action
subtype: enforcement-action
location:
  violator: "United Kingdom"
  sanctions_target: "Iran"
priority: high
confidence: high
tags:
  - ofac
  - enforcement
  - iran-sanctions
  - civil-penalty
  - compliance
entities:
  violator_type: "financial institution"
  violator_country: "United Kingdom"
  penalty_amount: "$2.3 million"
  violations:
    count: 127
    total_value: "$8.4 million"
    period: "2020-2023"
    beneficiary: "IRISL-related entities"
  mitigating_factors:
    - "voluntary self-disclosure"
    - "cooperation"
  historical_context: "First major UK bank penalty since 2019"
significance: "Demonstrates extraterritorial sanctions enforcement"
compliance_impact: "High - signals continued Iran sanctions enforcement"
```

## Validation Checklist

Before marking source as active:

- [x] Twitter handle verified (@ofacalert)
- [x] Focus confirmed (OFAC sanctions monitoring)
- [x] Collection method appropriate (timeline, 10min poll)
- [x] Keywords defined for sanctions actions
- [x] Entity extraction patterns defined
- [x] Quality indicators specific and measurable
- [x] Priority levels aligned with compliance/intelligence value
- [x] Examples comprehensive across sanction types
- [ ] Authentication configured (Twitter API access)
- [ ] Integration tested with collection system
- [ ] Treasury.gov link validation implemented

## Monitoring & Maintenance

### Daily Checks
- API connectivity and collection completeness
- Treasury.gov link accessibility
- Breaking sanctions announcements captured
- Thread collection working

### Weekly Tasks
- Review designation accuracy and completeness
- Verify entity name extraction
- Update sanctions program codes
- Cross-reference with official SDN list
- Track enforcement actions

### Monthly Tasks
- Audit classification accuracy
- Review priority assignments
- Update legal authority references
- Validate reliability score (maintain 95+)
- Check for OFAC website changes affecting links

### Special Monitoring
- **Major Designations**: Immediate priority escalation
- **Executive Orders**: Track new sanctions programs
- **Coordinated Actions**: Link with EU, UK, UN sanctions
- **Network Designations**: Map entity relationships

## Related Sources

Complementary sources for sanctions intelligence:

- **US Treasury OFAC Website**: Official source (treasury.gov/ofac)
- **@sanctionswatch**: International sanctions monitoring
- **@IranObserve0**: Iran-focused intelligence
- **@UANI**: United Against Nuclear Iran advocacy
- **UN Security Council**: UN sanctions regimes
- **EU Sanctions Map**: European Union sanctions
- **UK OFSI**: UK Office of Financial Sanctions Implementation
- **Financial Action Task Force (FATF)**: AML/CFT standards
