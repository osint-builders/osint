---
id: twitter-iran-spectrum
name: Iran Spectrum - Technical Iran Analysis & Intelligence
type: twitter
status: testing
description: |
  Iran Spectrum provides technical analysis of Iranian nuclear program, military
  capabilities, IRGC operations, and regional activities. Focuses on detailed technical
  assessments, satellite imagery analysis, weapons systems, and strategic capabilities.
  Expert-level intelligence for Iran military and nuclear monitoring.
created_date: "2026-04-30"
last_updated: "2026-04-30"
tags:
  - iran
  - nuclear-program
  - irgc
  - military-analysis
  - satellite-imagery
  - technical-intelligence
  - osint
  - middle-east
reliability: high
confidence_score: 87
update_frequency: "20m"
priority: high
language:
  - en
geographic_focus:
  - iran
  - middle-east
cost: free
requires_auth: true
maintainer: osint-team
alert_keywords:
  - nuclear
  - enrichment
  - missile
  - irgc
  - centrifuge
  - uranium
  - satellite
  - facility
---

# Iran Spectrum - Technical Iran Analysis & Intelligence

## Overview

Iran Spectrum (@IranSpec) is a specialized technical intelligence account providing in-depth analysis of Iranian military, nuclear, and strategic capabilities. The account focuses on:

- Iranian nuclear program technical developments
- Satellite imagery analysis of nuclear and military facilities
- Missile and drone program assessments
- IRGC force structure and capabilities
- Regional military deployments and operations
- Naval capabilities and maritime operations
- Cyber warfare and electronic warfare capabilities
- Defense industrial base analysis
- Air defense systems and aviation
- Chemical and biological capabilities assessment
- Underground and hardened facility analysis
- Technology procurement networks

**Account Characteristics:**
- High technical expertise in nuclear and military analysis
- Detailed satellite imagery interpretation
- Quantitative assessments of capabilities
- Open-source intelligence methodology
- Cross-referencing with official reports (IAEA, UN)
- Academic rigor in analysis

**Intelligence Value:**
- Technical assessment of nuclear breakout timelines
- Military capability evaluations for strategic planning
- Proliferation warning indicators
- Facility identification and characterization
- Weapons system performance analysis
- Technology acquisition patterns
- Strategic vulnerability assessments

## Data Collection Criteria

### Twitter Account Details

- **Handle**: IranSpec
- **Account Type**: Technical analysis and intelligence
- **Expertise**: Nuclear engineering, military systems, satellite imagery
- **Content Type**: Technical reports, imagery analysis, capability assessments
- **Tweet Frequency**: 5-15 tweets per day
- **Analysis Depth**: High - detailed technical content

### Collection Method

- **Method**: timeline
- **Poll Interval**: Every 20 minutes
- **Include Retweets**: Yes (shares expert analysis and official reports)
- **Include Replies**: Yes (technical clarifications and discussions)
- **Include Quotes**: Yes
- **Thread Handling**: Collect entire thread (technical analysis often multi-tweet)

### Content Filters

#### Include Criteria

- Nuclear facility analysis and satellite imagery
- Enrichment capacity and technical assessments
- Missile test analysis and capability evaluations
- IRGC force deployments and operations
- Military facility construction and modifications
- Weapons system introductions and specifications
- Technology procurement and proliferation
- Naval vessel tracking and capabilities
- Air defense system deployments
- Underground facility developments

#### Exclude Criteria

- General political commentary without technical content
- Historical analysis without current relevance
- Pure opinion without data
- Off-topic Middle East content

### Keyword Monitoring

**Nuclear Program Keywords:**
- Nuclear, enrichment, uranium, centrifuge
- Natanz, Fordow, Arak, Isfahan, Parchin
- IR-1, IR-2, IR-4, IR-6 (centrifuge models)
- UF6, yellowcake, LEU, HEU
- IAEA, safeguards, inspections
- Plutonium, heavy water, reactor
- Breakout, weapons-grade, stockpile

**Missile/Drone Keywords:**
- Ballistic missile, cruise missile, ICBM, IRBM
- Shahab, Sejjil, Khorramshahr, Emad
- Drone, UAV, Shahed, Mohajer, Ababil
- Test launch, range, payload, CEP (circular error probable)
- Solid fuel, liquid fuel, re-entry vehicle

**Military Facility Keywords:**
- Satellite imagery, construction, expansion
- Underground facility, tunnel, hardened site
- Air defense, S-300, Bavar-373, radar
- Naval base, shipyard, submarine
- Ammunition depot, weapons production
- Training camp, military base

**IRGC/Force Structure Keywords:**
- IRGC, Quds Force, IRGC Navy, IRGC Aerospace
- Brigade, division, battalion, unit
- Deployment, exercise, operation
- Proxy forces, advisors, trainers

### Entity Extraction

**Facilities:**
- Nuclear sites (name, coordinates, type)
- Military bases and installations
- Production facilities (missiles, drones, munitions)
- R&D centers and laboratories
- Storage depots
- Underground facilities

**Technical Specifications:**
- Enrichment levels and capacities
- Centrifuge quantities and models
- Missile ranges and payloads
- Weapons system specifications
- Facility dimensions and features

**Organizations:**
- AEOI (Atomic Energy Organization of Iran)
- IRGC units and subdivisions
- Defense industrial companies
- Research institutes
- Procurement networks

**Imagery Analysis:**
- Satellite provider (commercial, government)
- Acquisition date
- Visible changes or developments
- Measurements and calculations
- Comparison with previous imagery

## Expected Data Format

### Raw Tweet Object

```json
{
  "id": "1234567890",
  "text": "ANALYSIS: New satellite imagery (2026-04-28) shows continued expansion at Natanz Fuel Enrichment Plant. 4 new buildings constructed in south sector (coordinates 33.7238°N, 51.7293°E). Likely additional centrifuge halls based on dimensions (47m x 22m each). THREAD 1/6",
  "created_at": "2026-04-30T13:15:00Z",
  "author": {
    "username": "IranSpec",
    "name": "Iran Spectrum"
  },
  "metrics": {
    "retweet_count": 178,
    "like_count": 412,
    "reply_count": 56
  },
  "attachments": {
    "media": [
      {
        "type": "photo",
        "url": "https://pbs.twimg.com/media/...",
        "alt_text": "Satellite imagery of Natanz facility"
      }
    ]
  }
}
```

### Structured Data Extraction

```yaml
analysis_type: facility-expansion
facility:
  name: "Natanz Fuel Enrichment Plant"
  location:
    coordinates: "33.7238°N, 51.7293°E"
    region: "south sector"
  country: "Iran"
imagery:
  date: "2026-04-28"
  provider: "commercial satellite"
developments:
  - type: "new construction"
    count: 4
    structure_type: "buildings"
    assessment: "likely centrifuge halls"
    dimensions: "47m x 22m each"
significance: "enrichment capacity expansion"
priority: critical
tags:
  - nuclear-facility
  - natanz
  - enrichment
  - expansion
  - satellite-imagery
```

## Processing Instructions

### Data Extraction

1. **Fetch Timeline**
   - Use Twitter API v2 for recent tweets
   - Capture threads for complete analysis
   - Download attached imagery when present
   - Monitor replies for technical discussions

2. **Content Classification**
   - Nuclear facility analysis (critical priority)
   - Missile/drone developments (high priority)
   - IRGC operations (high priority)
   - Military capability assessments (high priority)
   - Technology procurement (medium-high priority)
   - Historical comparisons (medium priority)

3. **Technical Entity Extraction**
   - Facility names and coordinates
   - Technical specifications and measurements
   - Centrifuge models and quantities
   - Missile designations and capabilities
   - Satellite imagery dates and sources
   - Calculations and quantitative assessments
   - Equipment and technology types

4. **Imagery Processing**
   - Download satellite imagery
   - Extract metadata (date, provider, resolution)
   - Extract annotations and measurements
   - Compare with previous imagery if referenced
   - Store imagery with structured metadata

### Transformation to World Event Entity

```javascript
function transformToWorldEvent(tweet, extracted) {
  const analysisType = classifyTechnicalAnalysis(tweet.text, extracted);
  
  return {
    title: buildTechnicalTitle(extracted, analysisType),
    date: tweet.created_at,
    type: 'iran-technical-intelligence',
    location: extractFacilityLocation(extracted),
    priority: calculatePriority(analysisType, extracted),
    confidence: 'high',
    tags: generateTags(extracted, analysisType),
    source: {
      type: 'twitter',
      handle: 'IranSpec',
      tweet_id: tweet.id,
      url: `https://twitter.com/IranSpec/status/${tweet.id}`,
      analysis_type: 'technical'
    },
    entities: extracted.entities,
    imagery: extracted.imagery,
    contents: generateMarkdown(tweet, extracted)
  };
}

function classifyTechnicalAnalysis(text, entities) {
  const textLower = text.toLowerCase();
  
  if (textLower.match(/nuclear|enrichment|centrifuge|uranium/)) {
    return 'nuclear-development';
  }
  if (textLower.match(/satellite.*imag|facility.*construction|expansion/)) {
    return 'facility-analysis';
  }
  if (textLower.match(/missile|ballistic|launch|test/)) {
    return 'missile-analysis';
  }
  if (textLower.match(/drone|uav|shahed|mohajer/)) {
    return 'uav-analysis';
  }
  if (textLower.match(/irgc|deployment|operation|military/)) {
    return 'military-operation';
  }
  if (textLower.match(/capability|assessment|evaluation/)) {
    return 'capability-assessment';
  }
  
  return 'technical-intelligence';
}

function calculatePriority(analysisType, entities) {
  // Critical: Nuclear breakout indicators, WMD developments
  if (analysisType === 'nuclear-development' && 
      (entities.weapons_grade_indicator || entities.major_expansion)) {
    return 'critical';
  }
  
  // High: Facility expansions, missile tests, IRGC deployments
  if (analysisType === 'facility-analysis' || 
      analysisType === 'missile-analysis' ||
      (analysisType === 'military-operation' && entities.regional_deployment)) {
    return 'high';
  }
  
  // Medium: Capability assessments, procurement, routine monitoring
  return 'medium';
}
```

## Quality Indicators

### High Quality Signals

- Satellite imagery with date and source
- Precise coordinates (lat/lon)
- Specific measurements and dimensions
- Quantitative assessments (enrichment levels, quantities)
- Technical specifications cited
- Cross-reference with official reports (IAEA, UN)
- Mathematical calculations shown
- Comparison with previous imagery/data
- Expert methodology explained
- Citations to primary sources
- Timeline reconstructions
- Multi-source corroboration

### Low Quality Signals

- Vague or imprecise locations
- Lack of quantitative data
- Missing imagery dates
- Speculation without supporting data
- Unclear methodology
- No technical details

### Red Flags (Skip/Low Priority)

- Pure speculation without evidence
- Political commentary without technical content
- Outdated analysis without current relevance
- Unverifiable claims
- Duplicate analysis from other sources

## Known Issues

### Issue 1: Commercial Satellite Imagery Availability
**Problem**: Imagery may not always be current or available for key facilities  
**Workaround**: Note imagery date; assess based on available data  
**Status**: Timestamp all imagery analysis

### Issue 2: Technical Jargon and Acronyms
**Problem**: High technical content requires domain knowledge  
**Workaround**: Maintain glossary; extract terms for context  
**Status**: Technical term extraction implemented

### Issue 3: Uncertainty Quantification
**Problem**: Assessments involve uncertainty that must be conveyed  
**Workaround**: Preserve confidence qualifiers ("likely," "possibly," "confirmed")  
**Status**: Confidence scoring in extraction

### Issue 4: Thread Context Essential
**Problem**: Technical analysis often spans 5-10 tweets with cumulative detail  
**Workaround**: Always collect complete thread; summarize findings  
**Status**: Thread collection implemented

## Examples

### Example 1: Nuclear Facility Expansion - Critical Priority

**Raw Tweet Thread:**
```
1/7 ANALYSIS: Satellite imagery (2026-04-27 via Planet Labs) confirms 
major expansion at Natanz Pilot Fuel Enrichment Plant (PFEP).

New underground centrifuge hall under construction at 33.7245°N, 51.7298°E. 
Excavation ~120m x 80m x 30m deep. Estimated completion Q3 2026.

2/7 Building dimensions suggest capacity for 5,000-7,000 IR-6 centrifuges 
(Iran's most advanced model). At 90% capacity, this hall could produce 
~4kg/month of 90% HEU - sufficient for 1 nuclear weapon per quarter.

3/7 Construction timeline:
- June 2025: Initial excavation
- Dec 2025: Main tunnel completed
- Feb 2026: Hall excavation begins
- April 2026: Concrete reinforcement visible
- Current: Ventilation and utilities installation

[Imagery attached showing progression]

4/7 This represents Iran's 3rd major underground enrichment facility after 
Natanz FEP and Fordow. Underground construction at 30m depth significantly 
complicates military strike options.

5/7 IAEA last inspected site in January 2026, before current construction. 
Iran has not declared this facility to IAEA, violating safeguards agreement. 
Expect IAEA Board of Governors emergency session.

6/7 Combined with existing facilities, Iran's total potential enrichment 
capacity will reach ~120kg HEU/year - sufficient for 6-8 nuclear weapons 
annually at maximum production.

7/7 ASSESSMENT: This is most significant Iranian nuclear development since 
Fordow discovery in 2009. Breakout timeline shrinking to <3 months once 
facility operational. CRITICAL #Iran #Nuclear
```

**Extracted World Event:**
```yaml
title: "Iran constructs major underground enrichment hall at Natanz, breakout timeline shrinking"
date: 2026-04-30T13:15:00Z
type: iran-technical-intelligence
subtype: nuclear-development
location:
  facility: "Natanz Pilot Fuel Enrichment Plant (PFEP)"
  coordinates: "33.7245°N, 51.7298°E"
  country: "Iran"
priority: critical
confidence: high
tags:
  - nuclear-program
  - natanz
  - enrichment
  - underground-facility
  - iaea-violation
  - weapons-grade
  - breakout-timeline
imagery:
  date: "2026-04-27"
  provider: "Planet Labs"
  type: "commercial satellite"
facility_details:
  structure: "underground centrifuge hall"
  dimensions: "120m x 80m x 30m deep"
  depth: "30m underground"
  completion: "Q3 2026 (estimated)"
capability_assessment:
  centrifuge_capacity: "5,000-7,000 IR-6"
  production_capacity: "~4kg/month 90% HEU at 90% capacity"
  weapon_production_rate: "1 nuclear weapon per quarter"
construction_timeline:
  - "June 2025: initial excavation"
  - "Dec 2025: main tunnel completed"
  - "Feb 2026: hall excavation begins"
  - "April 2026: concrete reinforcement"
  - "Current: ventilation/utilities installation"
strategic_implications:
  - "3rd major underground enrichment facility"
  - "underground construction complicates military strikes"
  - "not declared to IAEA (safeguards violation)"
  - "combined capacity: 120kg HEU/year (6-8 weapons)"
  - "breakout timeline: <3 months once operational"
iaea_status:
  last_inspection: "January 2026"
  declared: false
  violation: "safeguards agreement"
  expected_action: "Board of Governors emergency session"
historical_context: "Most significant development since Fordow discovery (2009)"
significance: "CRITICAL - major proliferation concern"
```

### Example 2: Missile Test Analysis - High Priority

**Raw Tweet:**
```
BREAKING: Iran tested Khorramshahr-4 MRBM from Shahroud test site early 
this morning (video released by IRGC Aerospace). Analysis:

Range: ~2,000km (sufficient for Israel, US bases in region)
Payload: ~1,500kg (nuclear-capable)
Propulsion: Liquid fuel, 2-stage
CEP: Estimated <50m (improved accuracy)
Re-entry vehicle: New aerodynamic design

This is 4th Khorramshahr variant test in 18 months. Rapid development 
cycle suggests foreign technical assistance (likely North Korea). System 
approaching operational status. #Iran #Missiles
```

**Extracted World Event:**
```yaml
title: "Iran tests Khorramshahr-4 MRBM, nuclear-capable with 2,000km range"
date: 2026-04-30T08:30:00Z
type: iran-technical-intelligence
subtype: missile-analysis
location:
  test_site: "Shahroud"
  country: "Iran"
priority: high
confidence: high
tags:
  - iran
  - ballistic-missile
  - khorramshahr
  - irgc-aerospace
  - nuclear-capable
  - north-korea
entities:
  organization: "IRGC Aerospace Force"
  missile_system: "Khorramshahr-4 MRBM"
technical_specifications:
  range: "~2,000km"
  payload: "~1,500kg"
  nuclear_capable: true
  propulsion: "liquid fuel, 2-stage"
  accuracy: "CEP <50m (estimated)"
  re_entry_vehicle: "new aerodynamic design"
strategic_range:
  - "Israel"
  - "US bases in region"
development_context:
  variant: "4th Khorramshahr variant"
  test_period: "18 months"
  development_pace: "rapid"
  suspected_assistance: "North Korea"
  status: "approaching operational"
significance: "Enhanced Iranian strike capability against regional targets"
```

### Example 3: IRGC Naval Deployment - High Priority

**Raw Tweet:**
```
IRGC Navy deployed 3 Ghadir-class midget submarines to Strait of Hormuz 
area based on satellite imagery (2026-04-29). Vessels spotted at:

- Bandar Abbas naval base: 2 submarines
- Abu Musa Island: 1 submarine  

Ghadir specs: 120 tons, 2x 533mm torpedoes, ~200nm range. Designed for 
strait/littoral ops, not blue water. Deployment coincides with US carrier 
presence in region. Potential harassment/interdiction capability. #IRGC
```

**Extracted World Event:**
```yaml
title: "IRGC deploys 3 midget submarines to Strait of Hormuz"
date: 2026-04-30T16:20:00Z
type: iran-technical-intelligence
subtype: military-operation
location:
  waterway: "Strait of Hormuz"
  bases:
    - "Bandar Abbas naval base"
    - "Abu Musa Island"
  country: "Iran"
priority: high
confidence: medium-high
tags:
  - irgc-navy
  - submarines
  - strait-of-hormuz
  - naval-deployment
entities:
  organization: "IRGC Navy"
  asset_type: "Ghadir-class midget submarine"
  count: 3
deployment_locations:
  - location: "Bandar Abbas naval base"
    count: 2
  - location: "Abu Musa Island"
    count: 1
vessel_specifications:
  class: "Ghadir"
  displacement: "120 tons"
  armament: "2x 533mm torpedoes"
  range: "~200nm"
  operational_environment: "strait/littoral operations"
context:
  trigger: "US carrier presence in region"
  capabilities: "harassment/interdiction"
imagery:
  date: "2026-04-29"
  type: "satellite imagery"
significance: "Potential threat to maritime traffic in Strait of Hormuz"
```

## Validation Checklist

Before marking source as active:

- [x] Twitter handle verified (@IranSpec)
- [x] Technical focus confirmed (nuclear, military analysis)
- [x] Collection method appropriate (timeline with threads)
- [x] Keywords defined for technical intelligence
- [x] Entity extraction patterns defined for technical data
- [x] Imagery handling capabilities confirmed
- [x] Quality indicators specific for technical content
- [x] Priority levels aligned with proliferation/threat assessment
- [x] Examples comprehensive across analysis types
- [ ] Authentication configured (Twitter API access)
- [ ] Integration tested with collection system
- [ ] Imagery download and storage verified

## Monitoring & Maintenance

### Daily Checks
- API connectivity and collection completeness
- Imagery attachment downloads successful
- Thread collection working
- Technical terminology extraction accuracy

### Weekly Tasks
- Review nuclear facility analysis accuracy
- Verify missile specification extractions
- Update facility coordinates database
- Cross-reference with IAEA reports
- Track technical terminology and acronyms

### Monthly Tasks
- Audit analysis classification accuracy
- Review reliability score against verifiable events
- Update technical specifications database
- Validate imagery metadata extraction
- Compare assessments with official intelligence releases

### Special Monitoring
- **Nuclear Developments**: Immediate escalation to critical
- **Facility Construction**: Track over time for completion estimates
- **Missile Tests**: Correlate with official announcements
- **IRGC Deployments**: Map patterns and intentions

## Related Sources

Complementary sources for Iran technical intelligence:

- **@IranObserve0**: General Iran intelligence and analysis
- **@ofacalert**: Sanctions on Iranian entities and programs
- **IAEA Reports**: Official nuclear program monitoring
- **Institute for Science and International Security (ISIS)**: Independent nuclear analysis
- **James Martin Center for Nonproliferation Studies**: Academic analysis
- **TankerTrackers**: Maritime sanctions evasion
- **Planet Labs**: Commercial satellite imagery provider
- **NTI (Nuclear Threat Initiative)**: WMD proliferation tracking
