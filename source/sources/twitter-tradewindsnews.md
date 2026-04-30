---
id: twitter-tradewindsnews
name: TradeWinds News - Shipping Trade Intelligence
type: twitter
status: active
description: |
  Leading shipping industry news publication covering commercial maritime trade, vessel
  transactions, charter markets, sanctions enforcement, and shipping finance. Essential
  for understanding commercial shipping intelligence, market trends, fleet developments,
  and sanctions impact on maritime trade. Professional shipping journalism with industry
  insider access and breaking commercial maritime news.
created_date: "2026-04-30"
last_updated: "2026-04-30"
tags:
  - shipping-news
  - maritime-trade
  - vessel-sales
  - charter-markets
  - sanctions
  - shipping-finance
  - osint
  - commercial-shipping
reliability: high
confidence_score: 85
update_frequency: "2h"
priority: medium
language:
  - en
geographic_focus:
  - global
  - shipping-worldwide
cost: free
requires_auth: true
maintainer: osint-team
alert_keywords:
  - sanctions
  - russia
  - iran
  - vessel
  - tanker
  - sale
  - seized
  - detained
  - charter
  - shipping
---

# TradeWinds News - Shipping Trade Intelligence

## Overview

TradeWinds News (@tradewindsnews) is the leading shipping industry trade publication providing commercial maritime intelligence. The account delivers:

- Vessel sales and acquisitions
- Charter market rates and trends
- Fleet ordering and newbuilding
- Sanctions enforcement and compliance
- Vessel detention and seizures
- Shipping company transactions
- Maritime finance and investment
- Tanker, bulk carrier, container ship markets
- Offshore vessel markets
- Shipyard and construction news
- Flag state enforcement actions
- Insurance and classification developments
- Maritime casualties with commercial impact
- Regulatory changes affecting shipping

**Account Characteristics:**
- Professional shipping journalism
- Industry insider access and sources
- Breaking commercial shipping news
- Market analysis and trends
- Subscription content previews on Twitter
- Authoritative on shipping business intelligence

**Intelligence Value:**
- Sanctions enforcement tracking
- Commercial shipping market trends
- Fleet ownership and control changes
- Corporate structure and beneficial ownership
- Financial distress indicators
- Strategic commodity flow intelligence
- Flag state compliance patterns
- Insurance market risk assessment
- Shadow fleet identification
- Vessel repurposing and strategic redeployment
- Economic warfare impact on shipping

## Data Collection Criteria

### Twitter Account Details

- **Handle**: tradewindsnews
- **Account Type**: Professional shipping trade publication
- **Geographic Focus**: Global commercial shipping
- **Strategic Significance**: Sanctions intelligence, commercial maritime trends
- **Content Type**: Breaking news, market analysis, vessel transactions
- **Tweet Frequency**: Multiple times daily
- **Language**: English

### Collection Method

- **Method**: timeline
- **Poll Interval**: Every 2 hours
- **Include Retweets**: Yes (industry sources and breaking news)
- **Include Replies**: No (focus on main news posts)
- **Include Quotes**: Yes
- **Thread Handling**: Collect full threads for developing stories

### Content Filters

#### Include Criteria

- Sanctions enforcement and vessel seizures
- Russian, Iranian, North Korean vessel activity
- Vessel sales and ownership changes
- Charter market unusual activity
- Tanker market developments
- Shadow fleet reporting
- Shipping company financial distress
- Major vessel casualties with commercial impact
- Flag state enforcement actions
- Insurance and compliance issues
- Strategic commodity shipping (oil, gas, grain)

#### Exclude Criteria

- General market commentary without specific intelligence
- Personnel announcements
- Conference promotions
- Routine vessel deliveries without strategic relevance
- Technical shipping details without intelligence value

### Keyword Monitoring

**High-Priority Keywords:**
- sanctions, OFAC, designated, blacklisted
- Russia, Iran, North Korea, Venezuela
- seized, detained, arrested, impounded
- tanker, VLCC, Aframax, Suezmax
- sale, sold, acquired, purchased
- ownership, beneficial owner, shell company
- shadow fleet, dark fleet, grey fleet
- charter, freight rate, unusual
- crude oil, LNG, petroleum products

**Activity Keywords:**
- sanctioned, designated, listed
- seized, detained, released
- sold, acquired, transferred
- renamed, reflagged, registered
- chartered, fixed, booked
- detained, arrested, impounded

**Location Keywords:**
- Russia, Novorossiysk, Primorsk
- Iran, Kharg Island, Bandar Abbas
- Venezuela, Fujairah, Singapore
- Greece, Norway, Dubai, Hong Kong

## Expected Data Format

### Raw Tweet Object

```json
{
  "id": "1234567890",
  "text": "BREAKING: US Treasury sanctions 6 tankers in expanded crackdown on Russian oil exports. Aframax tankers moved combined 30M barrels Russian crude to India/China in 2025. Vessels registered under flags of convenience. Owners using Dubai shell companies. #Sanctions #Russia",
  "created_at": "2026-04-30T12:15:00Z",
  "author": {
    "username": "tradewindsnews",
    "name": "TradeWinds News"
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
event_type: sanctions-enforcement-shipping
action: "US Treasury sanctions"
vessels:
  count: 6
  type: "Aframax tankers"
  cargo: "Russian crude oil"
  volume: "30 million barrels combined in 2025"
  destinations:
    - "India"
    - "China"
  registration: "flags of convenience"
  ownership: "Dubai shell companies"
context: "Expanded crackdown on Russian oil exports"
priority: high
tags:
  - sanctions
  - russia
  - crude-oil
  - us-treasury
  - aframax
  - shell-companies
  - india
  - china
```

## Processing Instructions

### Data Extraction

1. **Fetch Timeline**
   - Use Twitter API v2 to fetch recent tweets
   - Filter for sanctions and strategic shipping intelligence
   - Prioritize enforcement actions and major transactions

2. **Content Classification**
   - Identify news type (sanctions, sale, casualty, market)
   - Extract vessel details and commercial context
   - Determine strategic significance
   - Assess market and geopolitical impact

3. **Entity Extraction**
   - Vessel names, types, and counts
   - Shipping companies and owners
   - Countries and sanctions authorities
   - Financial amounts and volumes
   - Flag states and registries
   - Ports and trade routes
   - Cargo types and quantities
   - Corporate structures

4. **Significance Assessment**
   - High: Sanctions actions, major vessel seizures, shadow fleet exposure
   - Medium: Significant vessel sales, market disruptions, compliance issues
   - Low: Routine vessel transactions, general market news

### Transformation to World Event Entity

```javascript
function transformToWorldEvent(tweet, extracted) {
  const eventType = classifyShippingNews(tweet.text);
  
  return {
    title: buildEventTitle(extracted),
    date: tweet.created_at,
    type: eventType,
    location: extracted.locations,
    priority: calculatePriority(eventType, extracted),
    confidence: 'high',
    tags: generateTags(extracted),
    source: {
      type: 'twitter',
      handle: 'tradewindsnews',
      tweet_id: tweet.id,
      url: `https://twitter.com/tradewindsnews/status/${tweet.id}`,
      article_url: extracted.article_link
    },
    entities: extracted.entities,
    contents: generateMarkdown(tweet, extracted)
  };
}
```

## Quality Indicators

### High Quality Signals

- Specific vessel names and IMO numbers
- Financial details and transaction values
- Company names and ownership details
- Regulatory authority citations
- Volume and quantity data
- Timeline and date specifics
- Multiple source verification indicated
- Link to full article with details
- Market impact analysis

### Low Quality Signals

- Vague vessel descriptions
- Unconfirmed rumors
- Lack of company identification
- Missing financial details
- General market commentary

### Red Flags (Skip/Low Priority)

- Opinion pieces without news
- Conference announcements
- Personnel moves
- General market analysis without specific intelligence
- Promotional content

## Known Issues

### Issue 1: Subscription Content
**Problem**: Full details often behind paywall in articles  
**Workaround**: Extract maximum information from tweets, note article URL for reference  
**Status**: Tweet content extraction optimized

### Issue 2: Commercial vs Intelligence Focus
**Problem**: Trade publication focus may not align with strategic intelligence priorities  
**Workaround**: Filter for sanctions, enforcement, and strategic shipping only  
**Status**: Keyword filtering configured

### Issue 3: Market Jargon
**Problem**: Heavy use of shipping industry terminology  
**Workaround**: Maintain glossary of shipping terms and market indicators  
**Status**: Terminology database in progress

## Examples

### Example 1: Sanctions Enforcement - High Priority

**Raw Tweet:**
```
EXCLUSIVE: Greek shipping company fronting for Iranian oil trades faces 
US sanctions. TradeWinds investigation reveals 12 tankers operated through 
network of UAE and Malaysia shell companies. Vessels moved 80M barrels 
Iranian crude to Asia since 2023. OFAC action expected within days. 
Full story: [link]
```

**Extracted World Event:**
```yaml
title: "Greek shipper facing US sanctions for Iranian oil trades via shell network"
date: 2026-04-30T11:00:00Z
type: sanctions-investigation-shipping
target:
  type: "Greek shipping company"
  role: "fronting for Iranian oil trades"
network:
  vessels: 12
  vehicle: "UAE and Malaysia shell companies"
  cargo: "Iranian crude oil"
  volume: "80 million barrels since 2023"
  destination: "Asia"
action:
  authority: "OFAC"
  status: "action expected within days"
source_quality: "exclusive investigation"
priority: high
confidence: high
tags:
  - sanctions
  - iran
  - crude-oil
  - shell-companies
  - us-ofac
  - greece
  - sanctions-evasion
```

### Example 2: Vessel Transaction Intelligence - Medium Priority

**Raw Tweet:**
```
Russian shipping giant SCF sells 4 elderly Aframax tankers to mystery 
Dubai buyer for scrapping prices. Vessels averaged 22 years old. Industry 
sources suggest buyer may reactivate for shadow fleet operations. Names 
already changed, new flags pending. Tracking the vessels.
```

**Extracted World Event:**
```yaml
title: "Russian SCF sells 4 elderly Aframax tankers to Dubai buyer"
date: 2026-04-30T15:30:00Z
type: vessel-transaction-suspicious
seller: "SCF (Russian shipping company)"
vessels:
  count: 4
  type: "Aframax tankers"
  age: "averaged 22 years"
  price: "scrapping prices"
buyer:
  description: "mystery Dubai buyer"
  location: "Dubai"
analysis:
  suspicion: "may reactivate for shadow fleet operations"
  evidence: "names already changed, new flags pending"
context: "potential shadow fleet expansion"
status: "tracking vessels"
priority: high
confidence: medium
tags:
  - russia
  - vessel-sale
  - shadow-fleet
  - dubai
  - aframax
  - suspicious-transaction
```

## Validation Checklist

Before marking source as active:

- [x] Twitter handle verified (@tradewindsnews)
- [x] Content focus confirmed (shipping trade intelligence)
- [x] Strategic relevance established (sanctions, commercial maritime intelligence)
- [x] Collection method appropriate (timeline, 2-hour polling)
- [x] Filters configured (sanctions and strategic shipping focus)
- [x] Keywords defined for maritime trade intelligence
- [x] Entity extraction patterns defined
- [x] Quality indicators specific and measurable
- [x] Examples comprehensive and realistic
- [ ] Account verification (confirm active and posting)
- [ ] Authentication configured (Twitter API access)
- [ ] Integration tested with collection system

## Monitoring & Maintenance

### Daily Checks
- API connectivity and news collection
- Sanctions enforcement tracking
- Major vessel transaction monitoring

### Weekly Tasks
- Review sanctions action accuracy
- Update shipping company ownership databases
- Verify vessel sale intelligence
- Cross-reference with official sanctions lists

### Monthly Tasks
- Audit event classification accuracy
- Review reliability score (consistently high)
- Update shipping market terminology
- Assess shadow fleet expansion trends
- Track sanctions evasion patterns

## Related Sources

Complementary sources for shipping intelligence:

- **@TheRealShipDude**: Vessel identification and analysis
- **@pizzainwatch**: AIS vessel tracking
- **@gCaptain**: Maritime news and incidents
- **@OilCfd**: Oil shipping and commodities
- **@ShipNews**: Alternative shipping news
- **Lloyd's List**: Competitor shipping publication
- **OFAC**: Official sanctions designations
- **Clarksons**: Shipping market data
