---
id: api-gdelt-events
name: GDELT Project Events API
type: api
status: testing
description: |
  Global Database of Events, Language, and Tone (GDELT) Project API for
  monitoring world events. Provides structured event data from news sources
  worldwide with geolocation, entities, and sentiment analysis.
created_date: 2026-04-29
last_updated: 2026-04-29
tags:
  - world-events
  - structured-data
  - geopolitical
  - news-aggregation
reliability: high
confidence_score: 85
update_frequency: "15m"
priority: high
language:
  - multi
geographic_focus:
  - global
cost: free
requires_auth: false
maintainer: osint-team
rate_limits:
  requests_per_hour: 100
  requests_per_day: 2000
  burst_limit: 10
  backoff_strategy: exponential
alert_keywords:
  - KILL
  - ASSAULT
  - PROTEST
  - THREATEN
  - DEMAND
---

# API Source: GDELT Project Events

## Overview

The GDELT Project monitors news media worldwide in over 100 languages, identifying events, locations, organizations, themes, and emotions. The API provides structured event data with standardized coding (CAMEO), making it excellent for automated world event detection.

**API Characteristics:**
- Coverage: 150+ countries
- Update frequency: 15-minute intervals
- Data structure: Standardized event coding
- Historical data: Available back to 1979
- Format: JSON, CSV
- Authentication: Not required
- Cost: Free (with rate limits)

## Data Collection Criteria

### API Configuration

**Base URL**: `https://api.gdeltproject.org/api/v2`

**Protocol**: REST API  
**Authentication**: None required  
**Rate Limits**:
- 100 requests per hour per IP
- 2000 requests per day per IP
- Burst: 10 requests per 10 seconds
- HTTP 429 (Too Many Requests) on limit exceeded

**Timeout Settings**:
- Connection timeout: 10 seconds
- Read timeout: 30 seconds

### Primary Endpoints

#### 1. Events API (GKG - Global Knowledge Graph)

**Endpoint**: `/doc/doc`

**Method**: GET

**Base URL**: `https://api.gdeltproject.org/api/v2/doc/doc`

**Parameters**:
```json
{
  "query": "(string) search terms or entity names",
  "mode": "artlist | timeline | timelinevolinfo",
  "maxrecords": "(int) max results, default 250, max 250",
  "format": "json | csv | html",
  "startdatetime": "(string) YYYYMMDDHHMMSS",
  "enddatetime": "(string) YYYYMMDDHHMMSS",
  "timespan": "(string) 1d | 7d | 30d",
  "sort": "DateDesc | DateAsc | ToneAsc | ToneDesc"
}
```

**Example Request**:
```
GET https://api.gdeltproject.org/api/v2/doc/doc?query=conflict%20AND%20ukraine&mode=artlist&maxrecords=250&format=json&timespan=1d
```

#### 2. GEO API (Geographic Events)

**Endpoint**: `/geo/geo`

**Parameters**:
```json
{
  "query": "(string) search terms",
  "format": "json | geojson",
  "country": "(string) ISO 3166-1 alpha-2 country code",
  "timespan": "(string) time period to search"
}
```

#### 3. Context API

**Endpoint**: `/context/context`

**Parameters**:
```json
{
  "query": "(string) context analysis query",
  "format": "json"
}
```

### Query Construction

**Event Types to Monitor**:
Based on CAMEO event codes:

```
# High-priority event codes
01 - MAKE PUBLIC STATEMENT
02 - APPEAL
03 - EXPRESS INTENT TO COOPERATE
04 - CONSULT
05 - ENGAGE IN DIPLOMATIC COOPERATION
06 - ENGAGE IN MATERIAL COOPERATION
07 - PROVIDE AID
08 - YIELD
09 - INVESTIGATE
10 - DEMAND
11 - DISAPPROVE
12 - REJECT
13 - THREATEN
14 - PROTEST
15 - EXHIBIT FORCE POSTURE
16 - REDUCE RELATIONS
17 - COERCE
18 - ASSAULT
19 - FIGHT
20 - USE UNCONVENTIONAL MASS VIOLENCE
```

**Geographic Filters**:
```
# Monitor specific regions
country:US OR country:CN OR country:RU OR country:IR
region:Middle East OR region:Eastern Europe
```

**Themes to Track**:
```
# GDELT Themes
CONFLICT
CRISIS
DISASTER
TERROR
MILITARY
GOVERNMENT
DIPLOMACY
SANCTIONS
```

### Collection Strategy

**Polling Schedule**:
- **High-priority**: Every 15 minutes
- **Medium-priority**: Every hour
- **Historical backfill**: Once daily

**Query Rotation**:
1. Conflict events (last 15 minutes)
2. Diplomatic events (last 15 minutes)
3. Crisis events (last 15 minutes)
4. Geographic hotspots (last hour)
5. Trending events (last day)

**Queries to Execute**:
```javascript
const queries = [
  // Critical events
  'conflict OR war OR attack',
  'coup OR revolution',
  'disaster OR earthquake OR tsunami',
  'terrorist OR terrorism',
  
  // Diplomatic events
  'sanctions OR embargo',
  'treaty OR agreement',
  'summit OR meeting',
  
  // Regional monitoring
  'Ukraine AND (conflict OR military)',
  'Middle East AND (crisis OR tension)',
  'Taiwan AND (China OR military)',
  
  // Economic
  'economic crisis',
  'trade war',
  'sanctions'
];
```

## Expected Data Format

### JSON Response Structure

```json
{
  "articles": [
    {
      "url": "https://example.com/article",
      "url_mobile": "https://m.example.com/article",
      "title": "Article Title Here",
      "seendate": "20260429T143000Z",
      "socialimage": "https://example.com/image.jpg",
      "domain": "example.com",
      "language": "English",
      "sourcecountry": "United States",
      "theme": "CONFLICT,MILITARY,INTERNATIONAL_RELATIONS",
      "location": [
        {
          "name": "Ukraine",
          "countrycode": "UP",
          "lat": 49.0,
          "lon": 32.0,
          "featureid": "-4537551"
        }
      ],
      "persons": [
        "John Doe",
        "Jane Smith"
      ],
      "organizations": [
        "United Nations",
        "NATO"
      ],
      "tone": -3.5,
      "cameoeventcodes": "138,1383",
      "cameoeventids": "20260429-12345",
      "sharingimage": "https://example.com/share.jpg"
    }
  ],
  "totalResults": 150,
  "queryTime": 0.45
}
```

### Key Fields Explanation

**seendate**: When GDELT first saw the article (YYYYMMDDTHHMMSSZ)  
**tone**: Sentiment score (-10 to +10, negative = bad news)  
**theme**: Comma-separated GDELT themes  
**location**: Array of geographic entities with coordinates  
**cameoeventcodes**: CAMEO event type codes  
**persons**: Named individuals mentioned  
**organizations**: Organizations mentioned

## Processing Instructions

### Data Extraction

1. **Execute Query**
   ```javascript
   async function fetchGDELTEvents(query, timespan = '15m') {
     const params = new URLSearchParams({
       query: query,
       mode: 'artlist',
       maxrecords: 250,
       format: 'json',
       timespan: timespan,
       sort: 'DateDesc'
     });
     
     const url = `https://api.gdeltproject.org/api/v2/doc/doc?${params}`;
     const response = await fetch(url);
     
     if (response.status === 429) {
       // Rate limited, implement backoff
       await exponentialBackoff();
       return fetchGDELTEvents(query, timespan);
     }
     
     return await response.json();
   }
   ```

2. **Filter Results**
   ```javascript
   function filterRelevantEvents(articles) {
     return articles.filter(article => {
       // Must have location
       if (!article.location || article.location.length === 0) {
         return false;
       }
       
       // Must have relevant themes
       const themes = article.theme?.split(',') || [];
       const relevantThemes = [
         'CONFLICT', 'CRISIS', 'DISASTER', 'TERROR',
         'MILITARY', 'DIPLOMACY', 'SANCTIONS'
       ];
       if (!themes.some(t => relevantThemes.includes(t))) {
         return false;
       }
       
       // Filter by tone (critical events are usually negative)
       if (article.tone > 0) {
         return false;  // Positive news less urgent
       }
       
       return true;
     });
   }
   ```

3. **Deduplicate**
   ```javascript
   function deduplicateEvents(articles) {
     // Group by similar title and location
     const seen = new Map();
     
     return articles.filter(article => {
       const key = `${article.title.toLowerCase()}-${article.location[0]?.name}`;
       
       if (seen.has(key)) {
         return false;  // Duplicate
       }
       
       seen.set(key, true);
       return true;
     });
   }
   ```

### Transformation to World Event Entity

```javascript
function transformToWorldEvent(article) {
  // Extract event type from CAMEO codes
  const eventType = classifyEventType(article.cameoeventcodes);
  
  // Determine priority based on tone and themes
  const priority = calculatePriority(article.tone, article.theme);
  
  return {
    title: cleanTitle(article.title),
    date: parseGDELTDate(article.seendate),
    type: eventType,
    location: {
      name: article.location[0]?.name,
      country: article.location[0]?.countrycode,
      coordinates: {
        lat: article.location[0]?.lat,
        lon: article.location[0]?.lon
      }
    },
    priority: priority,
    confidence: 'high',  // GDELT is generally reliable
    tags: extractTags(article),
    source: {
      type: 'api',
      api: 'gdelt',
      url: article.url,
      domain: article.domain,
      language: article.language,
      tone: article.tone,
      cameo_codes: article.cameoeventcodes
    },
    entities: {
      persons: article.persons || [],
      organizations: article.organizations || []
    },
    contents: generateMarkdown(article)
  };
}
```

### Event Classification

```javascript
function classifyEventType(cameoCode) {
  // CAMEO code to event type mapping
  const code = parseInt(cameoCode?.split(',')[0] || '0');
  
  if (code >= 18 && code <= 20) return 'conflict';
  if (code >= 13 && code <= 17) return 'threat';
  if (code >= 10 && code <= 12) return 'diplomatic-tension';
  if (code >= 7 && code <= 9) return 'cooperation';
  if (code >= 1 && code <= 6) return 'diplomatic';
  
  return 'other';
}
```

### Priority Calculation

```javascript
function calculatePriority(tone, themesStr) {
  const themes = themesStr?.split(',') || [];
  
  // Very negative tone = high priority
  if (tone < -5) return 'high';
  
  // Critical themes = high priority
  const criticalThemes = ['CONFLICT', 'TERROR', 'CRISIS', 'DISASTER'];
  if (themes.some(t => criticalThemes.includes(t))) {
    return 'high';
  }
  
  // Moderate negative = medium
  if (tone < -2) return 'medium';
  
  return 'low';
}
```

## Quality Indicators

### High Quality Signals
- Multiple locations identified
- Negative tone score (< -3)
- Multiple persons/organizations mentioned
- From verified news domain
- Multiple relevant themes
- Recent seendate (< 1 hour old)
- CAMEO event code present

### Low Quality Signals
- No location data
- Positive or neutral tone
- No entities mentioned
- Domain unknown or low-quality
- Single generic theme
- Old article (> 24 hours)

## Known Issues

### Issue 1: Rate Limiting
**Problem**: Free tier has strict limits (100/hour)  
**Workaround**: Implement exponential backoff, cache results, prioritize queries  
**Status**: Rate limiter implemented

### Issue 2: Duplicate Articles
**Problem**: Same event reported by multiple sources  
**Workaround**: Deduplicate by title similarity + location + date  
**Status**: Deduplication logic in place

### Issue 3: Location Ambiguity
**Problem**: Some locations are vague or incorrect  
**Workaround**: Validate coordinates, use multiple location signals  
**Status**: Validation added

### Issue 4: Delayed Updates
**Problem**: GDELT processes articles with 15-minute delay  
**Workaround**: Supplement with real-time sources (Twitter)  
**Status**: Using GDELT for confirmation/enrichment

## Examples

### Example 1: Conflict Event

**API Response:**
```json
{
  "url": "https://reuters.com/world/conflict-region-x",
  "title": "Military clashes escalate in Region X",
  "seendate": "20260429T143000Z",
  "language": "English",
  "sourcecountry": "United Kingdom",
  "theme": "CONFLICT,MILITARY,VIOLENCE",
  "location": [
    {
      "name": "Region X",
      "countrycode": "XX",
      "lat": 35.0,
      "lon": 45.0
    }
  ],
  "persons": ["General John Smith", "President Jane Doe"],
  "organizations": ["Armed Forces", "UN"],
  "tone": -7.2,
  "cameoeventcodes": "190,1901"
}
```

**Transformed Event:**
```yaml
title: "Military clashes escalate in Region X"
date: 2026-04-29T14:30:00Z
type: conflict
location:
  name: "Region X"
  country: "XX"
  coordinates:
    lat: 35.0
    lon: 45.0
priority: high
confidence: high
tags:
  - conflict
  - military
  - violence
source:
  type: api
  api: gdelt
  url: "https://reuters.com/world/conflict-region-x"
  domain: "reuters.com"
  tone: -7.2
  cameo_codes: "190,1901"
entities:
  persons:
    - "General John Smith"
    - "President Jane Doe"
  organizations:
    - "Armed Forces"
    - "UN"
```

### Example 2: Diplomatic Event

**API Response:**
```json
{
  "title": "Nations sign historic trade agreement",
  "seendate": "20260429T120000Z",
  "theme": "DIPLOMACY,TRADE,ECONOMIC",
  "tone": 3.5,
  "cameoeventcodes": "061"
}
```

**Action**: Lower priority due to positive tone and non-urgent theme

## Validation Checklist

- [ ] API endpoint reachable
- [ ] Rate limits configured correctly
- [ ] Query strings properly URL-encoded
- [ ] Response parsing handles all fields
- [ ] Deduplication working
- [ ] Event classification accurate
- [ ] Priority calculation reasonable
- [ ] Markdown generation correct

## Monitoring & Maintenance

### Daily Checks
- API response time
- Rate limit consumption
- Error rate
- Data quality score

### Weekly Tasks
- Review event classification accuracy
- Adjust query terms based on results
- Update priority calculation rules

### Monthly Tasks
- Audit source reliability
- Review and update CAMEO code mappings
- Analyze coverage gaps
