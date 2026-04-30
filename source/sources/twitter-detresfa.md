---
id: twitter-detresfa
name: Detresfa - Maritime Distress & Search and Rescue Monitoring
type: twitter
status: testing
description: |
  Detresfa monitors maritime distress situations, search and rescue (SAR)
  operations, and emergency response activities. Tracks DETRESFA declarations
  (distress phase), rescue coordination, aircraft and vessel incidents,
  and humanitarian maritime operations. Critical for maritime safety intelligence.
created_date: "2026-04-30"
last_updated: "2026-04-30"
tags:
  - osint
  - maritime
  - search-and-rescue
  - sar
  - distress
  - emergency-response
  - aviation-incident
  - maritime-incident
  - humanitarian
reliability: high
confidence_score: 85
update_frequency: "10m"
priority: high
language:
  - en
  - es
geographic_focus:
  - global
  - mediterranean
  - atlantic
  - pacific
cost: free
requires_auth: true
maintainer: osint-team
alert_keywords:
  - detresfa
  - mayday
  - distress
  - rescue
  - missing
  - overdue
  - crash
  - sinking
  - abandoned
---

# Detresfa - Maritime Distress & Search and Rescue Monitoring

## Overview

Detresfa (@detresfa_) specializes in monitoring maritime and aviation distress situations and search and rescue operations. The account provides:

- DETRESFA phase declarations (distress phase in SAR)
- Maritime distress situations (sinking, disabled vessels)
- Aviation emergencies over water
- Search and Rescue (SAR) operations tracking
- Rescue Coordination Center (RCC) activity
- Missing vessel and aircraft monitoring
- Medical evacuations at sea
- Migrant rescue operations
- Fisheries emergencies
- Coast Guard and SAR asset deployment
- Incident outcomes and updates

**Account Characteristics:**
- Specialized focus on SAR and distress situations
- Real-time emergency tracking
- Official source monitoring (RCC, coast guards)
- Multiple language content (Spanish/English)
- Humanitarian perspective on migrant rescues
- Professional SAR terminology usage
- Cross-references official announcements
- Active community engagement

**Intelligence Value:**
- Maritime incident awareness
- SAR capability assessment
- Regional maritime safety patterns
- Humanitarian crisis indicators
- Aviation safety over maritime areas
- Coast Guard operational tempo
- Migration route monitoring
- Emergency response effectiveness

## Data Collection Criteria

### Twitter Account Details

- **Handle**: detresfa_
- **Account Type**: Maritime safety and SAR monitoring
- **Account Focus**: Distress situations, rescue operations, maritime incidents
- **Tweet Frequency**: Multiple updates daily, increases during active SAR operations
- **Engagement**: Moderate to high within maritime community
- **Content Style**: Factual reporting with humanitarian emphasis
- **Language**: Primarily Spanish with English content

### Collection Method

- **Method**: timeline
- **Poll Interval**: Every 10 minutes (frequent updates during emergencies)
- **Include Retweets**: Selective (official RCC and coast guard announcements)
- **Include Replies**: Yes (contains updates and additional information)
- **Include Quotes**: Yes (adds context to official statements)
- **Thread Handling**: Collect entire thread (SAR operations span multiple updates)

### Content Filters

#### Include Criteria

- All original distress/SAR tweets from @detresfa_
- DETRESFA phase declarations
- Maritime distress situations
- Aviation emergencies over water
- Active SAR operations
- Missing vessel/aircraft reports
- Rescue coordination activities
- Medical evacuation at sea
- Incident outcomes and resolutions
- Official RCC/coast guard retweets with commentary
- Threads tracking ongoing operations

#### Exclude Criteria

- Pure retweets without added information
- Historical incidents without current relevance
- Tweets older than 30 days (archive separately)
- General maritime news without distress/SAR nexus
- Political commentary without operational content

### Keyword Monitoring

**High-Priority Keywords:**
- DETRESFA, ALERFA, INCERFA (SAR phases)
- Mayday, distress, emergency, SOS, PAN-PAN
- Rescue, SAR, search, missing, overdue
- Sinking, disabled, adrift, abandoned
- Coast Guard, RCC (Rescue Coordination Center)
- Helicopter, SAR aircraft, rescue vessel
- Medical evacuation, medevac, casualty
- Survivors, rescued, recovered

**Vessel/Aircraft Keywords:**
- Fishing vessel, cargo ship, tanker, yacht
- Aircraft, helicopter, plane, Cessna, Piper
- Lifeboat, life raft, EPIRB, PLB
- Ferry, passenger vessel, cruise ship
- Migrant boat, refugee vessel, dinghy

**Incident Keywords:**
- Collision, grounding, fire, flooding
- Engine failure, taking on water
- Crew overboard, man overboard (MOB)
- Capsized, listing, breaking up
- Lost contact, communication failure
- Weather-related, storm, rough seas

**Response Keywords:**
- Rescue helicopter, SAR aircraft, cutter
- Coast Guard, Navy, merchant vessel assist
- Coordinates, position, location
- Search area, search pattern, grid search
- Survivors found, all safe, casualties
- Operation suspended, called off, successful

**Geographic Keywords:**
- Mediterranean, Atlantic, Pacific, North Sea
- Strait of Gibraltar, English Channel
- Bay of Biscay, Caribbean, Gulf of Mexico
- Specific coast guard jurisdictions
- Distance from shore/port

### Entity Extraction

**Incident Information:**
- Incident type (distress, emergency, SAR operation)
- Vessel or aircraft identification
- Number of persons on board (POB)
- Incident cause (if known)
- Severity assessment

**Location Information:**
- Coordinates (lat/lon)
- Distance and bearing from land/port
- Search area description
- Jurisdictional waters (territorial, EEZ, international)
- RCC responsible

**Response Information:**
- SAR assets deployed (aircraft, vessels, personnel)
- Coordinating authority (RCC, coast guard)
- Assisting vessels
- Medical assets involved
- Timeline of response

**Outcome Information:**
- Persons rescued/recovered
- Casualties
- Vessel/aircraft status
- Operation outcome (successful, suspended, ongoing)

## Expected Data Format

### Raw Tweet Object

```json
{
  "id": "1234567890",
  "text": "🚨DETRESFA: Fishing vessel 'Mar Azul' (15m) reported taking on water 45nm SW of Gran Canaria. 4 crew on board. Salvamento Marítimo helicopter en route. Position: 27.5N 16.2W. Conditions: Force 6, 3m seas. Updates to follow.",
  "created_at": "2026-04-30T16:45:00Z",
  "author": {
    "id": "detresfa_id",
    "username": "detresfa_",
    "name": "Detresfa"
  },
  "metrics": {
    "retweet_count": 67,
    "like_count": 189,
    "reply_count": 23
  }
}
```

### Structured Data Extraction

From tweet text, extract:

```yaml
incident:
  type: "maritime distress"
  phase: "DETRESFA"
  severity: "high"

vessel:
  name: "Mar Azul"
  type: "fishing vessel"
  length: "15m"
  pob: 4
  condition: "taking on water"

location:
  coordinates: "27.5N 16.2W"
  description: "45nm SW of Gran Canaria"
  jurisdiction: "Spanish waters"

response:
  authority: "Salvamento Marítimo"
  assets:
    - type: "rescue helicopter"
      status: "en route"

conditions:
  wind: "Force 6"
  seas: "3m"

tags:
  - detresfa
  - fishing-vessel
  - distress
  - canary-islands
  - sar-operation
  - salvamento-maritimo
```

## Processing Instructions

### Data Extraction

1. **Fetch Timeline**
   ```javascript
   // Use Twitter API v2 (when available)
   const endpoint = '/2/users/{user_id}/tweets';
   const params = {
     'tweet.fields': 'created_at,public_metrics,entities',
     'max_results': 100
   };
   ```

2. **Initial Filtering**
   - Check tweet age (< 30 days for active collection)
   - Verify distress/SAR content
   - Check for emergency keywords
   - Prioritize active operations over historical accounts
   - Flag DETRESFA declarations for immediate processing

3. **Entity Extraction**
   ```javascript
   function extractSAREntities(tweetText) {
     return {
       incident_phase: extractSARPhase(tweetText),
       vessel_info: extractVesselInfo(tweetText),
       pob: extractPersonsOnBoard(tweetText),
       coordinates: extractCoordinates(tweetText),
       response_assets: extractSARAssets(tweetText),
       outcome: extractOutcome(tweetText),
       severity: assessSeverity(tweetText)
     };
   }
   
   function extractSARPhase(text) {
     // SAR phases in order of severity
     if (text.match(/DETRESFA/i)) return 'DETRESFA'; // Distress phase
     if (text.match(/ALERFA/i)) return 'ALERFA';     // Alert phase
     if (text.match(/INCERFA/i)) return 'INCERFA';   // Uncertainty phase
     if (text.match(/mayday|distress|emergency/i)) return 'EMERGENCY';
     return null;
   }
   
   function extractPersonsOnBoard(text) {
     // Match various POB formats
     const patterns = [
       /(\d+)\s*(?:crew|persons?|people|POB)/gi,
       /POB[:\s]*(\d+)/gi,
       /(\d+)\s*(?:on board|aboard)/gi
     ];
     for (let pattern of patterns) {
       const match = text.match(pattern);
       if (match) return parseInt(match[1]);
     }
     return null;
   }
   
   function assessSeverity(text) {
     const textLower = text.toLowerCase();
     // High severity indicators
     if (textLower.match(/sinking|capsized|mayday|detresfa|casualties|dead/)) {
       return 'high';
     }
     // Medium severity indicators
     if (textLower.match(/disabled|taking on water|alerfa|missing|overdue/)) {
       return 'medium';
     }
     // Low severity indicators
     if (textLower.match(/incerfa|monitoring|precaution/)) {
       return 'low';
     }
     return 'medium';
   }
   ```

4. **Context Analysis**
   - Identify operation phase (initial alert, ongoing, resolved)
   - Track operation progression through thread updates
   - Assess severity based on conditions and situation
   - Extract humanitarian context (migrant rescue, etc.)
   - Note response coordination details

5. **Significance Scoring**
   - High: DETRESFA declarations, multiple POB, casualties, humanitarian crises
   - Medium: ALERFA/INCERFA, disabled vessels, medical evacuations
   - Low: Routine SAR, resolved situations, precautionary responses

### Transformation to World Event Entity

```javascript
function transformToWorldEvent(tweet, extractedEntities) {
  const incidentType = classifySARIncident(tweet.text, extractedEntities);
  const location = extractPrimaryLocation(extractedEntities);
  const title = buildEventTitle(extractedEntities, incidentType);
  const priority = calculatePriority(extractedEntities);
  
  return {
    title: title,
    date: tweet.created_at,
    type: incidentType,
    location: location,
    priority: priority,
    confidence: 'high',
    tags: generateTags(extractedEntities, incidentType),
    source: {
      type: 'twitter',
      handle: 'detresfa_',
      tweet_id: tweet.id,
      url: `https://twitter.com/detresfa_/status/${tweet.id}`,
      engagement: {
        likes: tweet.metrics.like_count,
        retweets: tweet.metrics.retweet_count
      }
    },
    entities: extractedEntities,
    contents: generateMarkdown(tweet, extractedEntities)
  };
}

function classifySARIncident(text, entities) {
  const textLower = text.toLowerCase();
  
  if (textLower.match(/sinking|capsized/)) {
    return 'maritime-casualty';
  }
  if (textLower.match(/aircraft|plane|helicopter|crash/)) {
    return 'aviation-incident';
  }
  if (textLower.match(/migrant|refugee/)) {
    return 'humanitarian-rescue';
  }
  if (textLower.match(/medical|medevac|casualty/)) {
    return 'medical-evacuation';
  }
  if (textLower.match(/disabled|breakdown|engine failure/)) {
    return 'vessel-distress';
  }
  if (textLower.match(/missing|overdue|lost contact/)) {
    return 'missing-vessel';
  }
  
  return 'sar-operation';
}

function calculatePriority(entities) {
  // High priority for DETRESFA, high POB, or casualties
  if (entities.incident_phase === 'DETRESFA' || 
      entities.severity === 'high' ||
      (entities.pob && entities.pob > 10)) {
    return 'high';
  }
  
  // Medium priority for ALERFA or moderate situations
  if (entities.incident_phase === 'ALERFA' || 
      entities.severity === 'medium') {
    return 'medium';
  }
  
  return 'medium';
}
```

## Quality Indicators

### High Quality Signals

- **SAR Phase Specified**: DETRESFA, ALERFA, INCERFA declared
- **Coordinates Provided**: Specific lat/lon location
- **POB Information**: Number of persons on board specified
- **Response Details**: SAR assets and coordinating authority identified
- **Official Sources**: References RCC or coast guard statements
- **Condition Details**: Weather, sea state, vessel condition described
- **Updates Provided**: Thread tracking operation progression
- **Outcome Reported**: Final status of operation documented
- **Timeline Information**: Incident and response times noted
- **Vessel Identification**: Name, type, size specified

### Low Quality Signals

- **Vague Information**: "Boat in trouble" without specifics
- **No Location**: Generic area without coordinates
- **No POB**: Cannot assess scale of emergency
- **No Response Info**: SAR assets not mentioned
- **Outdated**: Historical incident without current relevance
- **Very Low Engagement**: <30 likes (unusual for active SAR)
- **No Follow-up**: Initial report without resolution

### Red Flags (Skip/Low Priority)

- Unverified rumors without official source
- Historical incidents without analytical value
- Duplicate reporting of same incident
- Political commentary without operational information
- False alarms clearly marked as resolved
- Training exercises clearly identified

## Known Issues

### Issue 1: Language Mix Spanish/English
**Problem**: Content in both Spanish and English  
**Workaround**: Implement translation for Spanish content  
**Status**: Translation capability required

### Issue 2: Update Frequency Variability
**Problem**: Multiple rapid updates during active SAR, then gaps  
**Workaround**: Thread collection ensures continuity, poll frequently  
**Status**: 10-minute polling with thread tracking

### Issue 3: Coordinate Format Variations
**Problem**: Coordinates in different formats (DMS, DD, approximate)  
**Workaround**: Parser handles multiple formats, normalize to decimal degrees  
**Status**: Multi-format parsing implemented

### Issue 4: Outcome Delays
**Problem**: Final outcomes sometimes reported hours or days later  
**Workaround**: Track incidents through resolution, maintain incident ID  
**Status**: Incident tracking with status updates

### Issue 5: Humanitarian Sensitivity
**Problem**: Migrant rescue operations require sensitive handling  
**Workaround**: Focus on operational facts, note humanitarian context  
**Status**: Guidelines for humanitarian incident reporting established

## Examples

### Example 1: Maritime Distress - High Priority

**Raw Tweet:**
```
🚨DETRESFA: Fishing vessel 'Mar Azul' (15m) reported taking on water 45nm 
SW of Gran Canaria. 4 crew on board. Salvamento Marítimo helicopter en 
route. Position: 27.5N 16.2W. Conditions: Force 6, 3m seas. Updates to follow.
```

**Extracted World Event:**
```yaml
title: "Fishing vessel Mar Azul in distress off Gran Canaria, 4 crew"
date: 2026-04-30T16:45:00Z
type: vessel-distress
location:
  coordinates: "27.5N 16.2W"
  description: "45nm SW of Gran Canaria"
  jurisdiction: "Spanish SAR region"
priority: high
confidence: high
tags:
  - detresfa
  - fishing-vessel
  - distress
  - canary-islands
  - sar-operation
  - salvamento-maritimo
entities:
  incident:
    phase: "DETRESFA"
    severity: "high"
    type: "taking on water"
  vessel:
    name: "Mar Azul"
    type: "fishing vessel"
    length: "15m"
    pob: 4
  response:
    authority: "Salvamento Marítimo"
    assets:
      - type: "rescue helicopter"
        status: "en route"
  conditions:
    wind: "Force 6"
    seas: "3m seas"
  status: "active operation"
source:
  type: twitter
  handle: detresfa_
  tweet_id: "1234567890"
```

### Example 2: Humanitarian Rescue - High Priority

**Raw Tweet:**
```
UPDATE: Spanish Coast Guard rescued 47 migrants from overcrowded dinghy 
20 miles south of Almería. All survivors safe, receiving medical attention. 
Vessel severely overloaded and taking on water when located. Operation 
coordinated by RCC Madrid.
```

**Extracted World Event:**
```yaml
title: "47 migrants rescued from overloaded dinghy off Almería"
date: 2026-04-30T14:20:00Z
type: humanitarian-rescue
location:
  description: "20 miles south of Almería"
  jurisdiction: "Spanish waters"
  country: "Spain"
priority: high
confidence: high
tags:
  - humanitarian-rescue
  - migrants
  - spanish-coast-guard
  - mediterranean
  - almeria
  - sar-success
entities:
  rescue:
    rescued: 47
    status: "all safe"
    medical: "receiving attention"
  vessel:
    type: "dinghy"
    condition: "overloaded, taking on water"
  response:
    authority: "RCC Madrid"
    responder: "Spanish Coast Guard"
  outcome:
    status: "successful"
    casualties: 0
```

### Example 3: Aviation Emergency - High Priority

**Raw Tweet:**
```
🚁 ALERFA: Small aircraft (Cessna 172) overdue, last contact 2 hours ago. 
Flight from Tenerife to Gran Canaria. 2 persons on board. SAR aircraft 
searching along flight path. Weather deteriorated with low visibility. 
Position unknown.
```

**Extracted World Event:**
```yaml
title: "Cessna 172 overdue on Canary Islands flight, 2 persons on board"
date: 2026-04-30T18:30:00Z
type: aviation-incident
location:
  route: "Tenerife to Gran Canaria"
  region: "Canary Islands"
  status: "position unknown"
priority: high
confidence: high
tags:
  - alerfa
  - aviation
  - missing-aircraft
  - cessna
  - canary-islands
  - sar-operation
entities:
  incident:
    phase: "ALERFA"
    type: "overdue aircraft"
    severity: "high"
  aircraft:
    type: "Cessna 172"
    pob: 2
    last_contact: "2 hours ago"
    route: "Tenerife - Gran Canaria"
  response:
    assets: "SAR aircraft"
    search_area: "along flight path"
  conditions:
    weather: "deteriorated"
    visibility: "low"
  status: "active search"
```

### Example 4: Medical Evacuation - Medium Priority

**Raw Tweet:**
```
Medevac: Cruise ship passenger (cardiac emergency) evacuated by Spanish 
Air Force helicopter 80nm west of Gibraltar. Patient stabilized, being 
transported to Málaga hospital. Operation successful.
```

**Extracted World Event:**
```yaml
title: "Medical evacuation from cruise ship west of Gibraltar"
date: 2026-04-30T11:15:00Z
type: medical-evacuation
location:
  description: "80nm west of Gibraltar"
  destination: "Málaga hospital"
priority: medium
confidence: high
tags:
  - medevac
  - medical-emergency
  - cruise-ship
  - spanish-air-force
  - gibraltar
  - successful
entities:
  incident:
    type: "medical emergency"
    nature: "cardiac"
    severity: "medium"
  patient:
    count: 1
    status: "stabilized"
    platform: "cruise ship"
  response:
    responder: "Spanish Air Force"
    asset: "helicopter"
    outcome: "successful"
    destination: "Málaga hospital"
```

## Validation Checklist

Before marking source as active:

- [x] Twitter handle verified (@detresfa_)
- [x] Collection method appropriate (timeline + replies + threads)
- [x] Filters configured for SAR/distress content
- [x] Entity extraction patterns defined
- [x] SAR phase detection implemented
- [x] POB and coordinate extraction tested
- [x] Severity assessment logic defined
- [x] Quality indicators specific and measurable
- [x] Priority calculation logic defined
- [x] Examples comprehensive and realistic
- [ ] Spanish language translation capability
- [ ] Authentication configured (TWITTER_API_KEY required)
- [ ] Rate limits monitored
- [ ] Integration with world-event-entities schema verified

## Monitoring & Maintenance

### Daily Checks
- API response time and success rate
- Tweet collection completeness (no gaps during active SAR)
- Entity extraction accuracy (coordinates, POB)
- Thread collection functioning
- No rate limit violations

### Weekly Tasks
- Review high-priority incidents accuracy
- Check for new terminology or patterns
- Update SAR asset identification
- Verify coordinate extraction
- Adjust severity scoring if needed
- Cross-reference with official RCC reports

### Monthly Tasks
- Audit incident classification accuracy
- Review priority assignments
- Update keyword lists
- Validate reliability score (maintain 85+)
- Review humanitarian incident handling
- Assess outcome tracking completeness
- Analyze regional SAR patterns

### Special Monitoring
- **Active SAR Operations**: Increase poll frequency to 5 minutes
- **Mass Rescue**: Priority flagging and detailed tracking
- **Humanitarian Incidents**: Sensitive information handling review
- **Cross-Validation**: Compare with official coast guard announcements

## Technical Integration

### Authentication Setup

```bash
# Required environment variables
# TWITTER_BEARER_TOKEN should be configured in .env file
```

### Rate Limits

- Twitter API v2: Standard rate limits apply
- With 10-minute polling: Well within limits
- Increase to 5 minutes during active major SAR operations
- Monitor and adjust based on emergency activity level

### Translation Support

```javascript
// Implement Spanish to English translation for content analysis
// Preserve original Spanish in raw_data field
// Many RCC and coast guard terms are Spanish (Salvamento Marítimo, etc.)
```

## Related Sources

Consider these complementary sources:

- @salvamentogob - Salvamento Marítimo (Spanish coast guard) official
- @guardiacivil - Guardia Civil maritime service
- @USCG - US Coast Guard official
- @RoyalNavy - UK maritime rescue
- JRCC (Joint Rescue Coordination Centers) - Various national RCCs
- Maritime incident databases (Lloyd's List, AMSA)
- Flight tracking platforms for aviation incidents
- Humanitarian NGO maritime operations (e.g., rescue NGOs in Mediterranean)
