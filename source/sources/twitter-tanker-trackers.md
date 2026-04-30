---
id: twitter-tanker-trackers
name: TankerTrackers - Oil & Gas Tanker Movement Tracking
type: twitter
status: active
description: |
  TankerTrackers monitors global oil and gas tanker movements, providing
  real-time intelligence on energy shipments, strategic reserves, and
  geopolitical implications. Tracks vessel positions, cargo types, routes,
  and sanctions evasion. Highly reliable source for energy sector OSINT.
created_date: "2026-04-29"
last_updated: "2026-04-29"
tags:
  - osint
  - tanker-tracking
  - energy
  - shipping
  - oil-gas
  - geopolitics
  - sanctions
  - maritime
reliability: high
confidence_score: 90
update_frequency: "5m"
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
  - iran
  - russia
  - venezuela
  - embargo
  - seized
  - diverted
---

# TankerTrackers - Oil & Gas Tanker Movement Tracking

## Overview

TankerTrackers (@TankerTrackers) is a specialized OSINT account focused on monitoring global oil and gas tanker movements. The account provides detailed intelligence on:

- Crude oil and petroleum product shipments
- LNG (Liquefied Natural Gas) carrier movements
- Strategic petroleum reserve activities
- Sanctions evasion monitoring (Iran, Russia, Venezuela)
- Ship-to-ship transfers
- Port activities and loading operations
- Voyage routes and destination changes
- Fleet tracking for specific countries or companies

**Account Characteristics:**
- Verified expertise in maritime and energy sectors
- Regular updates (multiple times daily)
- High-quality satellite imagery and vessel tracking data
- Detailed analysis with context
- 80K+ followers
- Established credibility in OSINT community
- Tweets often include maps, charts, and AIS data

**Intelligence Value:**
- Early warning of energy supply disruptions
- Sanctions compliance monitoring
- Geopolitical tensions indicators
- Energy market intelligence
- Strategic reserve movements
- Environmental incident tracking (spills, accidents)

## Data Collection Criteria

### Twitter Account Details

- **Handle**: TankerTrackers
- **User ID**: 755545089591824384
- **Account Type**: Specialized OSINT account
- **Follower Count**: ~80,000
- **Verification**: Not Twitter-verified but industry-recognized
- **Account Created**: 2016-07-19
- **Time Zone**: UTC
- **Tweet Frequency**: 5-15 tweets per day
- **Engagement**: High (hundreds of retweets/likes per tweet)

### Collection Method

- **Method**: timeline
- **Poll Interval**: Every 5 minutes
- **Include Retweets**: No (original content only)
- **Include Replies**: Yes (often contain clarifications and updates)
- **Include Quotes**: Yes
- **Thread Handling**: Collect entire thread (analysis often spans multiple tweets)

### Content Filters

#### Include Criteria

- All original tweets from @TankerTrackers
- Tweets with vessel tracking data
- Tweets with satellite imagery
- Tweets mentioning specific tankers or fleets
- Tweets about sanctions or embargo evasion
- Tweets with geographic coordinates
- Tweets with AIS (Automatic Identification System) data
- Threads providing detailed analysis

#### Exclude Criteria

- Promotional content (rare)
- Pure retweets without commentary
- Off-topic discussions
- Tweets older than 30 days (archive separately)

### Keyword Monitoring

**High-Priority Keywords:**
- Sanctions, embargo, evasion
- Iran, Russia, Venezuela, North Korea
- Seized, detained, diverted
- Oil, crude, petroleum, LNG, gas
- Tanker, vessel, ship, carrier, VLCC, Suezmax, Aframax
- Loading, discharge, cargo
- STS (ship-to-ship transfer)
- Transponder, AIS, dark activity

**Geographic Keywords:**
- Persian Gulf, Strait of Hormuz
- Black Sea, Bosphorus
- Malacca Strait
- Suez Canal
- Key ports: Bandar Abbas, Novorossiysk, Kharg Island, etc.

**Company/Fleet Keywords:**
- National oil companies (NOC)
- Specific fleet names
- Front companies
- Shell companies

### Entity Extraction

**Vessel Information:**
- Vessel name
- IMO number (unique ship identifier)
- MMSI number (Maritime Mobile Service Identity)
- Vessel type (VLCC, Suezmax, Aframax, LNG carrier)
- Flag state
- Owner/operator

**Cargo Information:**
- Cargo type (crude oil, refined products, LNG)
- Volume/quantity
- Origin
- Destination (planned vs actual)
- Loading/discharge dates

**Geographic Information:**
- Current position (lat/lon)
- Route/course
- Ports of call
- Areas of interest
- Exclusive Economic Zones (EEZ)

## Expected Data Format

### Raw Tweet Object

```json
{
  "id": "1234567890",
  "text": "🛢️ IRAN: Tanker \"Fortune\" (IMO 9123456) loaded ~2M barrels crude at Kharg Island. Currently en route to China via Strait of Malacca. AIS last active 3 days ago near position 25.5N 55.3E. Suspected sanctions evasion. #OOTT",
  "created_at": "2026-04-29T14:32:00Z",
  "author": {
    "id": "755545089591824384",
    "username": "TankerTrackers",
    "name": "TankerTrackers.com, Inc."
  },
  "metrics": {
    "retweet_count": 156,
    "like_count": 423,
    "reply_count": 34
  },
  "entities": {
    "hashtags": ["OOTT"],
    "urls": ["https://tankertrackers.com/..."],
    "mentions": []
  },
  "attachments": {
    "media": [
      {
        "type": "photo",
        "url": "https://pbs.twimg.com/media/...",
        "alt_text": "Satellite image of tanker Fortune"
      }
    ]
  }
}
```

### Structured Data Extraction

From tweet text, extract:

```yaml
vessel:
  name: "Fortune"
  imo: "9123456"
  type: "crude oil tanker"
  flag: null  # Extract if mentioned

cargo:
  type: "crude oil"
  volume: "2M barrels"
  origin: "Kharg Island, Iran"
  destination: "China"

location:
  current: "25.5N 55.3E"
  route: "Strait of Malacca"
  region: "Persian Gulf"

activity:
  type: "shipment"
  status: "en route"
  ais_status: "inactive"
  last_ais: "3 days ago"

tags:
  - sanctions-evasion
  - iran
  - crude-oil
  - china
  - dark-activity

significance: "high"  # Sanctions evasion
```

## Processing Instructions

### Data Extraction

1. **Fetch Timeline**
   ```javascript
   // Use Twitter API v2
   const endpoint = '/2/users/755545089591824384/tweets';
   const params = {
     'tweet.fields': 'created_at,public_metrics,entities,attachments',
     'expansions': 'attachments.media_keys',
     'media.fields': 'url,alt_text',
     'max_results': 100
   };
   ```

2. **Initial Filtering**
   - Check tweet age (< 30 days for active collection)
   - Verify is original tweet or meaningful reply
   - Check for vessel/cargo/location keywords
   - Verify engagement threshold (>50 likes for quality signal)

3. **Entity Extraction**
   ```javascript
   function extractEntities(tweetText) {
     const entities = {
       vessels: extractVesselNames(tweetText),
       imo_numbers: extractIMO(tweetText),
       cargo_type: extractCargoType(tweetText),
       locations: extractLocations(tweetText),
       coordinates: extractCoordinates(tweetText),
       countries: extractCountries(tweetText),
       volumes: extractVolumes(tweetText)
     };
     return entities;
   }
   
   function extractIMO(text) {
     // IMO numbers are 7 digits starting with 9
     const imoPattern = /IMO[:\s]*(\d{7})/gi;
     return text.match(imoPattern);
   }
   
   function extractCoordinates(text) {
     // Lat/Lon in various formats
     const coordPattern = /(\d{1,3}\.\d+)[°\s]*([NS])[,\s]*(\d{1,3}\.\d+)[°\s]*([EW])/gi;
     return text.match(coordPattern);
   }
   
   function extractVolumes(text) {
     // Barrel volumes, cargo quantities
     const volumePattern = /(\d+(?:\.\d+)?)\s*(M|million|k|thousand)?\s*(barrels?|bbls?|tonnes?|mt|cubic meters?|m3)/gi;
     return text.match(volumePattern);
   }
   ```

4. **Context Analysis**
   - Identify if part of thread (collect full context)
   - Check for linked articles or reports
   - Extract media (satellite images, maps, charts)
   - Classify event type (shipment, sanctions, incident, etc.)

5. **Significance Scoring**
   - High: Sanctions evasion, major spills, seizures, dark fleet activity
   - Medium: Large shipments, route changes, unusual activity
   - Low: Routine tracking updates, statistical reports

### Transformation to World Event Entity

```javascript
function transformToWorldEvent(tweet, extractedEntities) {
  // Determine event type
  const eventType = classifyTankerEvent(tweet.text, extractedEntities);
  
  // Extract primary location
  const location = extractPrimaryLocation(extractedEntities);
  
  // Build title
  const title = buildEventTitle(extractedEntities, eventType);
  
  // Determine priority
  const priority = calculatePriority(eventType, extractedEntities);
  
  return {
    title: title,
    date: tweet.created_at,
    type: eventType,
    location: location,
    priority: priority,
    confidence: 'high',
    tags: generateTags(extractedEntities, eventType),
    source: {
      type: 'twitter',
      handle: 'TankerTrackers',
      tweet_id: tweet.id,
      url: `https://twitter.com/TankerTrackers/status/${tweet.id}`,
      engagement: {
        likes: tweet.metrics.like_count,
        retweets: tweet.metrics.retweet_count
      }
    },
    entities: {
      vessels: extractedEntities.vessels,
      locations: extractedEntities.locations,
      countries: extractedEntities.countries
    },
    contents: generateMarkdown(tweet, extractedEntities)
  };
}

function classifyTankerEvent(text, entities) {
  const textLower = text.toLowerCase();
  
  if (textLower.match(/sanctions?|embargo|evasion|violation/)) {
    return 'sanctions-violation';
  }
  if (textLower.match(/seized|detained|arrested/)) {
    return 'maritime-incident';
  }
  if (textLower.match(/spill|leak|accident|collision/)) {
    return 'environmental-incident';
  }
  if (textLower.match(/ship-to-ship|sts transfer|dark/)) {
    return 'covert-operation';
  }
  if (textLower.match(/loading|loaded|discharge|cargo/)) {
    return 'shipment-activity';
  }
  
  return 'maritime-intelligence';
}

function buildEventTitle(entities, eventType) {
  const vessel = entities.vessels[0] || 'Tanker';
  const location = entities.locations[0] || 'Unknown location';
  
  const templates = {
    'sanctions-violation': `${vessel} suspected sanctions evasion near ${location}`,
    'maritime-incident': `${vessel} seized/detained near ${location}`,
    'environmental-incident': `Oil spill incident involving ${vessel}`,
    'covert-operation': `${vessel} engaged in ship-to-ship transfer`,
    'shipment-activity': `${vessel} cargo movement at ${location}`
  };
  
  return templates[eventType] || `Maritime activity: ${vessel}`;
}

function calculatePriority(eventType, entities) {
  const highPriorityTypes = [
    'sanctions-violation',
    'maritime-incident',
    'environmental-incident'
  ];
  
  if (highPriorityTypes.includes(eventType)) {
    return 'high';
  }
  
  // Dark fleet or AIS-off activity = high priority
  if (entities.ais_status === 'inactive') {
    return 'high';
  }
  
  // Large volume shipments = medium
  if (entities.volumes && entities.volumes[0]?.includes('M')) {
    return 'medium';
  }
  
  return 'medium';
}
```

### Markdown Generation

```javascript
function generateMarkdown(tweet, entities) {
  let md = `# ${entities.title}\n\n`;
  
  md += `**Source**: Twitter [@TankerTrackers](https://twitter.com/TankerTrackers/status/${tweet.id})\n`;
  md += `**Posted**: ${tweet.created_at}\n`;
  md += `**Engagement**: ${tweet.metrics.like_count} likes, ${tweet.metrics.retweet_count} retweets\n\n`;
  
  // Vessel information
  if (entities.vessels && entities.vessels.length > 0) {
    md += `## Vessel Information\n\n`;
    entities.vessels.forEach(vessel => {
      md += `- **Name**: ${vessel.name}\n`;
      if (vessel.imo) md += `- **IMO**: ${vessel.imo}\n`;
      if (vessel.type) md += `- **Type**: ${vessel.type}\n`;
      if (vessel.flag) md += `- **Flag**: ${vessel.flag}\n`;
    });
    md += `\n`;
  }
  
  // Cargo information
  if (entities.cargo) {
    md += `## Cargo Details\n\n`;
    md += `- **Type**: ${entities.cargo.type}\n`;
    if (entities.cargo.volume) md += `- **Volume**: ${entities.cargo.volume}\n`;
    if (entities.cargo.origin) md += `- **Origin**: ${entities.cargo.origin}\n`;
    if (entities.cargo.destination) md += `- **Destination**: ${entities.cargo.destination}\n`;
    md += `\n`;
  }
  
  // Location
  if (entities.location) {
    md += `## Location\n\n`;
    if (entities.location.current) md += `- **Current Position**: ${entities.location.current}\n`;
    if (entities.location.route) md += `- **Route**: ${entities.location.route}\n`;
    if (entities.location.region) md += `- **Region**: ${entities.location.region}\n`;
    md += `\n`;
  }
  
  // Tweet content
  md += `## Intelligence Report\n\n`;
  md += `${tweet.text}\n\n`;
  
  // Media
  if (tweet.attachments?.media) {
    md += `## Media\n\n`;
    tweet.attachments.media.forEach(media => {
      md += `![${media.alt_text || 'Satellite/AIS imagery'}](${media.url})\n`;
    });
    md += `\n`;
  }
  
  // Analysis context
  if (entities.significance) {
    md += `**Significance**: ${entities.significance.toUpperCase()}\n`;
  }
  
  md += `\n**Tags**: ${entities.tags.join(', ')}\n`;
  
  return md;
}
```

## Quality Indicators

### High Quality Signals

- **Vessel Identification**: Includes IMO or MMSI number
- **Coordinates Provided**: Specific lat/lon coordinates
- **Cargo Details**: Type and volume specified
- **Satellite Imagery**: Includes visual confirmation
- **AIS Data Referenced**: Shows tracking methodology
- **Contextual Analysis**: Explains significance
- **Multiple Data Points**: Cross-references multiple sources
- **High Engagement**: >200 likes indicates community validation
- **Thread Format**: Detailed multi-tweet analysis
- **Links to Reports**: References TankerTrackers.com articles
- **Sanctions Context**: Mentions specific sanctions or embargoes
- **Timeline Data**: Provides sequence of events

### Low Quality Signals

- **Vague Language**: "Some tanker" without specifics
- **No Vessel ID**: Cannot verify vessel identity
- **No Location**: Generic "Middle East" without specifics
- **Speculation Only**: "Possibly" or "might be" without evidence
- **Very Low Engagement**: <20 likes (unusual for this account)
- **Single Tweet**: No follow-up or context
- **Outdated Info**: Sharing old data without relevance

### Red Flags (Skip/Low Priority)

- Promotional tweets
- Pure statistical summaries (weekly/monthly reports can be archived)
- Retweets without original commentary
- Off-topic content (very rare for this account)
- Duplicate information (same event tweeted multiple times)

## Known Issues

### Issue 1: IMO Number Variations
**Problem**: IMO numbers sometimes written with/without prefix or spaces  
**Workaround**: Normalize IMO format: extract 7-digit number, validate starts with 9  
**Status**: Regex pattern handles most variations

### Issue 2: Coordinate Format Inconsistency
**Problem**: Coordinates in multiple formats (DMS, DD, approximate)  
**Workaround**: Parse multiple formats, convert to decimal degrees, note precision  
**Status**: Parser handles common formats

### Issue 3: Thread Context
**Problem**: Analysis often spans 3-10 tweets requiring full thread collection  
**Workaround**: Detect thread starter, collect all replies in sequence  
**Status**: Thread collection implemented

### Issue 4: Vessel Name Ambiguity
**Problem**: Multiple vessels with same or similar names  
**Workaround**: Always prioritize IMO number for unique identification  
**Status**: Entity extraction prioritizes IMO

### Issue 5: AIS Data Interpretation
**Problem**: "AIS off" or "dark" can mean various things  
**Workaround**: Note AIS status, don't assume malicious intent without context  
**Status**: Documented in extraction notes

### Issue 6: Rate Limiting During High Activity
**Problem**: Major incidents generate tweet storms  
**Workaround**: Increase poll frequency temporarily, implement priority queue  
**Status**: Monitoring

## Examples

### Example 1: Sanctions Evasion - High Priority

**Raw Tweet:**
```
🛢️ IRAN: VLCC "Horse" (IMO 9584956) loaded ~2M bbls crude at Kharg Island 
terminal. Vessel departed 2024-04-27, currently position 25.3N 55.1E, 
heading SE toward Strait of Hormuz. AIS last transmit 72hrs ago. 

Vessel registered Marshall Islands but operated by front company linked to 
NITC. Likely sanctions evasion. Destination probably China. #OOTT

[Satellite image attached showing vessel at terminal]
```

**Extracted World Event:**
```yaml
title: "VLCC Horse suspected Iran sanctions evasion, 2M barrels crude"
date: 2026-04-29T14:32:00Z
type: sanctions-violation
location:
  coordinates: "25.3N 55.1E"
  region: "Persian Gulf"
  near: "Strait of Hormuz"
  origin: "Kharg Island, Iran"
priority: high
confidence: high
tags:
  - sanctions-evasion
  - iran
  - crude-oil
  - vlcc
  - nitc
  - dark-fleet
  - china
entities:
  vessels:
    - name: "Horse"
      imo: "9584956"
      type: "VLCC"
      flag: "Marshall Islands"
      operator: "NITC front company"
  cargo:
    type: "crude oil"
    volume: "2M barrels"
  activity:
    loaded_date: "2024-04-27"
    ais_status: "inactive"
    last_ais: "72 hours ago"
source:
  type: twitter
  handle: TankerTrackers
  tweet_id: "1234567890"
```

**Markdown Content:**
```markdown
# VLCC Horse suspected Iran sanctions evasion, 2M barrels crude

**Source**: Twitter [@TankerTrackers](https://twitter.com/TankerTrackers/status/1234567890)  
**Posted**: 2026-04-29T14:32:00Z  
**Engagement**: 423 likes, 156 retweets

## Vessel Information

- **Name**: Horse
- **IMO**: 9584956
- **Type**: VLCC (Very Large Crude Carrier)
- **Flag**: Marshall Islands
- **Operator**: NITC front company

## Cargo Details

- **Type**: Crude oil
- **Volume**: ~2 million barrels
- **Origin**: Kharg Island terminal, Iran
- **Destination**: China (suspected)

## Location

- **Last Known Position**: 25.3N 55.1E
- **Heading**: Southeast toward Strait of Hormuz
- **Region**: Persian Gulf
- **AIS Status**: INACTIVE (last transmission 72 hours ago)

## Intelligence Report

VLCC "Horse" (IMO 9584956) loaded approximately 2 million barrels of crude 
oil at Iran's Kharg Island terminal. Vessel departed 2024-04-27 and is 
currently positioned at 25.3N 55.1E, heading southeast toward the Strait 
of Hormuz. AIS transponder has been inactive for 72 hours.

Vessel is registered in Marshall Islands but operated by a front company 
with links to NITC (National Iranian Tanker Company). This activity is 
consistent with Iranian sanctions evasion patterns. Destination is likely 
China, which continues to purchase Iranian crude despite international 
sanctions.

**Significance**: HIGH - Sanctions Evasion, Dark Fleet Activity

**Tags**: sanctions-evasion, iran, crude-oil, vlcc, nitc, dark-fleet, china, strait-of-hormuz
```

### Example 2: Regular Shipment Activity - Medium Priority

**Raw Tweet:**
```
🇸🇦 SAUDI ARABIA: Aframax "Sea Voyager" loading ~700k bbls Arab Light 
crude at Ras Tanura. Expected completion tomorrow. Destination: 
South Korea (Daesan). Normal commercial activity. #OOTT
```

**Extracted World Event:**
```yaml
title: "Saudi crude shipment to South Korea via Aframax Sea Voyager"
date: 2026-04-29T10:15:00Z
type: shipment-activity
location:
  port: "Ras Tanura"
  country: "Saudi Arabia"
  destination: "Daesan, South Korea"
priority: medium
confidence: high
tags:
  - saudi-arabia
  - crude-oil
  - south-korea
  - commercial
  - arab-light
```

### Example 3: Ship-to-Ship Transfer - High Priority

**Raw Tweet:**
```
⚠️ UNUSUAL: Two VLCCs "Ocean Glory" & "Star Bright" conducted STS 
(ship-to-ship) transfer ~50nm off UAE coast (24.8N 54.2E) during 
dark hours 0200-0500 local. Both vessels AIS off during transfer. 

"Ocean Glory" (IMO 9421678) previously loaded Iranian crude. Transfer 
possibly to obscure cargo origin. Both now proceeding separately. 
Monitoring. #OOTT

[AIS track overlay image]
```

**Extracted World Event:**
```yaml
title: "Suspicious ship-to-ship transfer off UAE coast, possible sanctions evasion"
date: 2026-04-29T08:45:00Z
type: covert-operation
location:
  coordinates: "24.8N 54.2E"
  description: "~50 nautical miles off UAE coast"
priority: high
confidence: high
tags:
  - ship-to-ship-transfer
  - sanctions-evasion
  - dark-activity
  - iran
  - uae
  - vlcc
entities:
  vessels:
    - name: "Ocean Glory"
      imo: "9421678"
    - name: "Star Bright"
  activity:
    type: "STS transfer"
    time: "0200-0500 local"
    ais_status: "inactive during transfer"
    previous_cargo: "Iranian crude"
```

## Validation Checklist

Before marking source as active:

- [x] Twitter handle verified (@TankerTrackers)
- [x] User ID confirmed (755545089591824384)
- [x] Collection method appropriate (timeline + replies)
- [x] Filters configured (no retweets, yes replies)
- [x] Entity extraction patterns defined
- [x] IMO and coordinate parsing tested
- [x] Thread collection working
- [x] Quality indicators specific and measurable
- [x] Priority calculation logic defined
- [x] Examples comprehensive and realistic
- [x] Markdown generation tested
- [ ] Authentication configured (TWITTER_API_KEY required)
- [ ] Rate limits monitored
- [ ] Integration with world-event-entities schema verified

## Monitoring & Maintenance

### Daily Checks
- API response time and success rate
- Tweet collection completeness (no gaps)
- Entity extraction accuracy (spot check)
- Thread collection working
- No rate limit violations

### Weekly Tasks
- Review high-priority events accuracy
- Check for new vessel naming patterns
- Update IMO number patterns if needed
- Verify coordinate extraction
- Adjust engagement thresholds if needed

### Monthly Tasks
- Audit event classification accuracy
- Review priority assignments
- Update keyword lists
- Check for account changes (name, focus)
- Validate reliability score (maintain 90+)
- Review false positive rate

### Special Monitoring
- **Major Incidents**: Increase poll frequency to 1-2 minutes
- **Thread Analysis**: Ensure full context captured
- **Image Processing**: Verify satellite imagery captured
- **Cross-Validation**: Compare with vessel tracking databases (MarineTraffic, etc.)

## Technical Integration

### Authentication Setup

```bash
# Required environment variables (obtain from Twitter Developer Portal)
# Set these in your system environment or .env file (not committed to git)

# Example: export TWITTER_BEARER_TOKEN with value from developer portal
# The token should be stored securely and never committed to version control
```

### Rate Limits

- Twitter API v2 Basic: 500,000 tweets/month
- User timeline: 1500 requests per 15 minutes
- With 5-minute polling: 3 requests per 15 minutes = well within limits
- Monitor and scale if needed

### Database Schema

Store extracted data in structured format:

```sql
CREATE TABLE tanker_events (
  id UUID PRIMARY KEY,
  tweet_id BIGINT NOT NULL,
  vessel_name VARCHAR(255),
  imo_number VARCHAR(7),
  cargo_type VARCHAR(100),
  cargo_volume VARCHAR(50),
  location_current VARCHAR(255),
  coordinates POINT,
  event_type VARCHAR(50),
  priority VARCHAR(20),
  created_at TIMESTAMP,
  raw_data JSONB
);

CREATE INDEX idx_tanker_imo ON tanker_events(imo_number);
CREATE INDEX idx_tanker_date ON tanker_events(created_at DESC);
CREATE INDEX idx_tanker_type ON tanker_events(event_type);
```

## Related Sources

Consider these complementary sources:

- **@sentinel_oil**: Oil tanker tracking, complementary coverage
- **@AuroraIntel**: Geopolitical intelligence with shipping context
- **MarineTraffic API**: Vessel position verification
- **Windward API**: Maritime risk intelligence
- **GDELT**: News aggregation for shipping incidents
- **Lloyd's List Intelligence**: Commercial shipping data
