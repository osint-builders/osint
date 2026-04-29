# Contributing Sources

This guide explains how to add new sources to the OSINT project.

## Quick Start

1. **Choose the appropriate example** from `examples/` that matches your source type
2. **Copy the example** to `sources/` with a descriptive name
3. **Fill in the front matter** with accurate metadata
4. **Complete all required sections** in the body
5. **Add to manifest.json** to register the source
6. **Test the source** before marking as active
7. **Submit for review** (if working in a team)

## Step-by-Step Guide

### Step 1: Identify Source Type

Determine which type best describes your source:

- **twitter** - For Twitter/X accounts to monitor
- **webpage** - For websites requiring scraping
- **api** - For REST, GraphQL, or other APIs
- **email** - For newsletters or email-based intel
- **rss** - For RSS/Atom feeds
- **webhook** - For incoming webhook data
- **websocket** - For real-time streams
- **file** - For file-based sources
- **database** - For direct DB connections
- **other** - For anything else

### Step 2: Copy Relevant Example

```bash
# Example: Adding a Twitter source
cp examples/twitter-example.md sources/twitter-your-source-name.md
```

### Step 3: Generate Unique ID

Generate a unique identifier for your source:

```bash
# Option 1: Use UUID
uuidgen | tr '[:upper:]' '[:lower:]'

# Option 2: Use slug format
# twitter-osint-updates
# webpage-reuters-world
```

### Step 4: Fill in Front Matter

Edit your new source file and complete all required fields:

```yaml
---
id: your-unique-id
name: Human Readable Name
type: twitter  # Match your source type
status: testing  # Start with testing, promote to active after validation
description: |
  Brief description of what intelligence this source provides.
  Include relevance to world events and expected content types.
created_date: 2026-04-29  # Today's date
last_updated: 2026-04-29  # Today's date
---
```

#### Optional Fields to Consider

```yaml
tags:
  - world-events
  - breaking-news
  - [add relevant tags]
reliability: medium  # Start conservative, upgrade after observation
confidence_score: 70  # 0-100, based on historical accuracy
update_frequency: "15m"  # How often to check
priority: medium  # high | medium | low
language:
  - en
geographic_focus:
  - global
  - [specific regions if applicable]
cost: free  # free | paid | freemium
requires_auth: false  # true if authentication needed
maintainer: your-name  # Who owns this source
alert_keywords:
  - breaking
  - urgent
  - [keywords that indicate critical events]
```

### Step 5: Complete Type-Specific Requirements

#### For Twitter Sources

```markdown
## Data Collection Criteria

### Twitter Account Details
- **Handle**: @handle_name (without @)
- **User ID**: 1234567890
- **Account Type**: News agency | Government | Analyst | Aggregator
- **Follower Count**: ~XXX,XXX
- **Verification**: Verified | Unverified

### Collection Method
- **Method**: timeline | search | stream
- **Include Retweets**: yes | no
- **Include Replies**: yes | no
- **Include Quotes**: yes | no

### Filters
- **Language**: en, es, fr, etc.
- **Minimum Engagement**: XXX likes or XXX retweets
- **Hashtags**: #worldnews, #breaking, etc.
- **Keywords**: keyword1, keyword2, etc.
```

#### For Webpage Sources

```markdown
## Data Collection Criteria

### URL Configuration
- **Base URL**: https://example.com/world-news
- **URL Pattern**: https://example.com/world-news/YYYY/MM/DD/*
- **Crawl Depth**: 2 (follow links up to 2 levels)
- **Update Frequency**: Every 30 minutes

### Extraction Rules
- **Article Selector**: `.article-container`
- **Title Selector**: `h1.article-title`
- **Date Selector**: `time.publish-date`
- **Content Selector**: `div.article-body`
- **Author Selector**: `span.author-name`

### Include Patterns
- `/world-news/*`
- `/international/*`
- `/breaking/*`

### Exclude Patterns
- `/opinion/*`
- `/sports/*`
- `/entertainment/*`
```

#### For Email Sources

```markdown
## Data Collection Criteria

### Email Configuration
- **Monitor Address**: intel-digest@example.com
- **IMAP/API**: IMAP | Gmail API | Office365
- **Folder**: INBOX

### Sender Allowlist
- `newsletter@stratfor.com`
- `updates@janes.com`
- `alerts@osintinsider.com`

### Subject Filters
- Contains: "Daily Digest", "Breaking", "Alert"
- Excludes: "Unsubscribe", "Spam"

### Extraction Rules
- **Title Extraction**: Subject line or first H1 in body
- **Content Extraction**: Parse HTML body, extract plain text
- **Date Extraction**: Sent date or date mentioned in subject
- **Link Extraction**: Extract and follow links matching pattern
```

#### For API Sources

```markdown
## Data Collection Criteria

### API Configuration
- **Base URL**: https://api.example.com/v1
- **Protocol**: REST | GraphQL | SOAP
- **Auth Method**: api_key | oauth2 | bearer_token
- **Rate Limit**: 1000 requests/hour

### Endpoints
1. **Events Endpoint**
   - Path: `/events`
   - Method: GET
   - Parameters:
     - `date`: ISO 8601 date
     - `category`: world-events
     - `limit`: 100
   - Response Format: JSON

2. **Search Endpoint**
   - Path: `/search`
   - Method: POST
   - Body:
     ```json
     {
       "query": "world events",
       "filters": {
         "date_range": "last_24h",
         "region": "global"
       }
     }
     ```

### Response Mapping
Map API response fields to world event entity fields:
- `api.event.title` → `entity.title`
- `api.event.timestamp` → `entity.date`
- `api.event.location` → `entity.location`
```

### Step 6: Document Processing Instructions

Explain how to transform raw data into world event entities:

```markdown
## Processing Instructions

### Data Extraction
1. Parse raw data from source
2. Extract key fields: title, date, location, content
3. Identify event type: conflict, disaster, political, economic, etc.

### Validation
- Verify date is within acceptable range (not future, not too old)
- Confirm location is valid geographic entity
- Check content meets minimum quality threshold

### Transformation
Convert to world event entity schema:
- Title: Extract concise event description
- Date: ISO 8601 format
- Location: Standardized location object
- Contents: Convert to Markdown format
- Tags: Extract or infer relevant tags
- Source reference: Link back to original

### Deduplication
Check against existing events:
- Compare titles (fuzzy match)
- Compare dates (within time window)
- Compare locations (same or nearby)
```

### Step 7: Add Examples

Include sample data to illustrate what you expect:

```markdown
## Examples

### Example 1: Breaking News Tweet

**Raw Data:**
```
Tweet from @BBCBreaking:
"BREAKING: Major earthquake strikes coastal region, 
magnitude 7.2 - emergency services responding"
Posted: 2026-04-29T14:32:00Z
```

**Extracted Event:**
- **Title**: Major earthquake strikes coastal region (magnitude 7.2)
- **Date**: 2026-04-29T14:32:00Z
- **Type**: Natural Disaster
- **Location**: [To be geocoded from context]
- **Source**: Twitter @BBCBreaking
```

### Step 8: Update manifest.json

Add your source to the manifest:

```json
{
  "id": "your-unique-id",
  "name": "Your Source Name",
  "type": "twitter",
  "status": "testing",
  "file": "sources/twitter-your-source-name.md",
  "added_date": "2026-04-29"
}
```

Update statistics:
```json
{
  "statistics": {
    "total_sources": X,
    "active_sources": Y,
    "by_type": {
      "twitter": N,
      ...
    }
  }
}
```

### Step 9: Test Your Source

Before marking as active:

1. **Verify connectivity** - Can you reach the source?
2. **Test authentication** - If required, confirm it works
3. **Sample collection** - Fetch sample data
4. **Validate extraction** - Confirm data extraction works
5. **Check quality** - Review if data meets requirements
6. **Test filters** - Verify filters work as expected
7. **Monitor for errors** - Watch for issues over 24-48 hours

### Step 10: Mark as Active

Once validated:

1. Update `status: active` in front matter
2. Update `last_updated` date
3. Update status in manifest.json
4. Document any issues found in "Known Issues" section

## Quality Checklist

Before submitting, verify:

- [ ] File name follows convention: `{type}-{identifier}.md`
- [ ] All required front matter fields completed
- [ ] Type-specific requirements included
- [ ] Processing instructions are clear and actionable
- [ ] Examples provided
- [ ] Source tested and works
- [ ] manifest.json updated
- [ ] No sensitive credentials in file (use environment variables)

## Common Pitfalls

### 1. Incomplete Front Matter
**Problem**: Missing required fields  
**Solution**: Copy from examples, they have all required fields

### 2. Vague Collection Criteria
**Problem**: "Monitor Twitter for news"  
**Solution**: Be specific - handles, hashtags, keywords, filters

### 3. No Examples
**Problem**: Unclear what data looks like  
**Solution**: Include 2-3 realistic examples with raw and processed data

### 4. Hardcoded Credentials
**Problem**: API keys in source file  
**Solution**: Reference environment variables or config

### 5. Untested Sources
**Problem**: Source marked active but never tested  
**Solution**: Always test in "testing" status first

## Getting Help

- Review `examples/` directory for reference implementations
- Read `README.md` for detailed schema documentation
- Check existing sources in `sources/` for patterns
- Test with "testing" status before going active

## Advanced Topics

### Custom Source Types

If none of the standard types fit:
1. Use `type: other`
2. Add custom fields to front matter
3. Document thoroughly in body
4. Consider proposing new standard type

### Rate Limiting

For APIs with rate limits:
```yaml
rate_limits:
  requests_per_hour: 1000
  requests_per_day: 10000
  burst_limit: 50
  backoff_strategy: exponential
```

### Authentication

Never store credentials in source files. Instead:
```markdown
## Authentication

This source requires API key authentication.

**Environment Variable**: `EXAMPLE_API_KEY`  
**Header Format**: `Authorization: Bearer ${EXAMPLE_API_KEY}`

Obtain credentials from: https://example.com/api/keys
```

### Multi-Step Collection

For complex sources requiring multiple steps:
```markdown
## Data Collection Criteria

### Step 1: List Recent Articles
- Endpoint: `/api/articles/recent`
- Extract article IDs

### Step 2: Fetch Full Content
- Endpoint: `/api/articles/{id}`
- For each ID from Step 1

### Step 3: Extract Entities
- Parse article content
- Extract events, dates, locations
```

## Maintenance

Sources require ongoing maintenance:

- **Weekly**: Review active sources for issues
- **Monthly**: Update reliability scores based on performance
- **Quarterly**: Audit for deprecated sources
- **Annually**: Review all sources for relevance

Update `last_updated` field whenever you make changes.
