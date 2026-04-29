# Create Source Examples

Real-world examples of creating, validating, and testing OSINT sources.

## Example 1: Twitter Breaking News Source

### Planning

```
AI: I want to create a new OSINT source.

Type: twitter
Description: Major news organization's breaking news account. Tweets breaking world events, crises, and major developments. Verified account with high reliability.

Help me plan this source.

---

AI Response: Let me gather some information:

1. What's the Twitter handle?
2. How frequently does this account tweet?
3. What's the account's track record for accuracy?
4. Should we include retweets?
5. Any specific keywords or hashtags to prioritize?
6. What geographic regions does it cover?

Based on your answers, I'll recommend:
- Appropriate priority and reliability ratings
- Update frequency
- Filtering configuration
- Quality indicators
```

### Creation

```bash
# Run interactive creator
cd skills/create-source/scripts
node create-source.js

# Interactive prompts:
# Type: twitter (option 1)
# Name: BBC Breaking News Twitter
# Description: BBC News breaking news account. Verified source for world events...
# Status: testing
# Reliability: high
# Priority: high
# Update frequency: 5m
# Cost: free
# Auth required: yes
# Tags: breaking-news, world-events, verified
# Geographic: global
# Language: en
#
# Twitter Configuration:
# Handle: BBCBreaking
# User ID: 5402612
# Collection method: timeline
# Include retweets: no
# Include replies: no
# Keywords: breaking, developing, live
```

### Generated File

```markdown
---
id: twitter-bbc-breaking-news
name: BBC Breaking News Twitter
type: twitter
status: testing
description: |
  BBC News breaking news account. Verified source for world events,
  crises, and major international developments. High accuracy and
  rapid reporting.
created_date: 2026-04-29
last_updated: 2026-04-29
tags:
  - breaking-news
  - world-events
  - verified
reliability: high
priority: high
update_frequency: "5m"
language:
  - en
geographic_focus:
  - global
cost: free
requires_auth: true
---

# BBC Breaking News Twitter

## Overview

[Complete this section with details about BBC Breaking News...]

## Data Collection Criteria

### Twitter Configuration

- **handle**: BBCBreaking
- **user_id**: 5402612
- **collection_method**: timeline
- **include_retweets**: no
- **include_replies**: no
- **keywords**: breaking, developing, live

### Collection Details

[Complete with specific criteria...]
```

### Validation

```bash
node validate-source.js ../../source/sources/twitter-bbc-breaking-news.md

# Output:
# Validating: twitter-bbc-breaking-news.md
#
# ✓ Passed (12):
#   • Required field present: id
#   • Required field present: name
#   • Required field present: type
#   • File name follows convention
#   • Valid date format: created_date
#   ... and 7 more
#
# ⚠ Warnings (3):
#   • Type requirement missing: collection_method detail
#   • Examples section should include code blocks
#   • Consider adding alert_keywords
#
# ✗ Errors (1):
#   • Missing required section: Examples
#
# Quality Score: 78/100
# Status: NEEDS IMPROVEMENT
#
# Recommendations:
#   • Fix all errors before marking source as active
#   • Add Examples section with realistic tweet examples
```

### After Completing Sections

```bash
node validate-source.js twitter-bbc-breaking-news.md

# Output:
# Validating: twitter-bbc-breaking-news.md
#
# ✓ Passed (18):
#   • All required fields present
#   • Type-specific requirements met
#   • All body sections complete
#   • Examples with code blocks found
#   ... and 14 more
#
# ⚠ Warnings (0)
# ✗ Errors (0)
#
# Quality Score: 95/100
# Status: EXCELLENT
#
# ✓ Source is ready for testing!
```

### Testing

```bash
node test-source.js twitter-bbc-breaking-news.md

# Output:
# Testing Source: twitter-bbc-breaking-news.md
#
# Type: twitter
# Status: testing
#
# [1/4] Connectivity Test
#   Testing Twitter connectivity...
#   ✓ Twitter API accessible, authentication valid
#   {
#     "handle": "BBCBreaking",
#     "rateLimits": "OK"
#   }
#   Duration: 523ms
#
# [2/4] Extraction Test
#   Testing data extraction (5 items)...
#   ✓ Successfully extracted 5 items
#
# [3/4] Quality Test
#   Testing data quality...
#   ✓ Average quality score: 92/100, 5/5 items passed
#
# [4/4] Transformation Test
#   Testing transformation to world event entities...
#   ✓ Transformed 5/5 items successfully
#
# Overall Result:
# ✓ PASSED - Source is ready for deployment
```

### Deployment

```bash
# Mark as active
node update-source-status.js twitter-bbc-breaking-news.md active

# Add to manifest
node update-manifest.js add twitter-bbc-breaking-news.md

# Commit
git add source/sources/twitter-bbc-breaking-news.md
git add source/manifest.json
git commit -m "Add BBC Breaking News Twitter source

- Type: twitter
- Reliability: high
- Priority: high
- Update frequency: 5m
- Validation score: 95/100

Tested and verified. Ready for production."
```

## Example 2: News Website RSS Feed

### Quick Creation

```bash
node create-source.js

# Prompts:
# Type: rss (option 5)
# Name: Reuters World News RSS Feed
# Description: Reuters international news RSS feed...
# Status: testing
# Reliability: high
# Priority: medium
# Update frequency: 15m
# Cost: free
# Auth: no
# Tags: world-news, rss, news-agency
# Geographic: global
# Language: en
#
# RSS Configuration:
# Feed URL: https://www.reuters.com/world/rss
# Feed format: rss (option 1)
# Poll interval: 15m
```

### Validation & Testing

```bash
# Validate
node validate-source.js rss-reuters-world-news.md
# Score: 82/100 - PASSED

# Test
node test-source.js rss-reuters-world-news.md
# Result: PASSED - Ready for deployment

# Deploy
node update-source-status.js rss-reuters-world-news.md active
node update-manifest.js add rss-reuters-world-news.md
```

## Example 3: GDELT API Source

### AI-Assisted Creation

```
AI: Help me create a GDELT API source.

I want to monitor:
- Conflict events globally
- Crisis situations
- Political developments

GDELT docs: https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/

Guide me through configuration.

---

AI Response: GDELT API Source Configuration

1. Basic Metadata:
   - Type: api
   - Name: GDELT Events API
   - Reliability: high (GDELT is well-established)
   - Priority: medium (good for enrichment)
   - Update frequency: 15m (GDELT updates every 15 min)
   - Cost: free
   - Auth: not required

2. API Configuration:
   - Base URL: https://api.gdeltproject.org/api/v2
   - Primary endpoint: /doc/doc
   - Query parameters:
     * query: "conflict OR crisis OR political"
     * mode: artlist
     * format: json
     * timespan: 15m
     * maxrecords: 250

3. Queries to Monitor:
   - "conflict OR war"
   - "crisis OR emergency"
   - "coup OR revolution"
   - "sanctions OR embargo"

4. Response Fields to Extract:
   - articles[].url
   - articles[].title
   - articles[].seendate
   - articles[].location[]
   - articles[].tone
   - articles[].theme

5. Quality Indicators:
   High quality:
   - tone < -3 (negative events)
   - location data present
   - themes include CONFLICT, CRISIS, TERROR
   
   Low quality:
   - tone > 0 (positive events)
   - no location
   - generic themes

Would you like me to generate the complete source file?
```

### Creation with Config

```javascript
// Using AI suggestions, create config file
const sourceConfig = {
  type: 'api',
  name: 'GDELT Events API',
  description: 'Global Database of Events, Language, and Tone...',
  reliability: 'high',
  priority: 'medium',
  update_frequency: '15m',
  cost: 'free',
  requires_auth: false,
  api: {
    base_url: 'https://api.gdeltproject.org/api/v2',
    endpoints: ['/doc/doc'],
    queries: [
      'conflict OR war',
      'crisis OR emergency',
      'coup OR revolution'
    ],
    rate_limit: '100/hour'
  }
};

// Save config
fs.writeFileSync('gdelt-config.json', JSON.stringify(sourceConfig, null, 2));

// Create source
node create-source.js --config gdelt-config.json
```

### AI-Assisted Review

```
AI: Review this source file:

[paste complete source file]

Check for:
1. Completeness
2. Accuracy of API configuration
3. Quality indicators appropriate for GDELT data
4. Examples realistic

---

AI Response: Review of GDELT Events API Source

✓ Front Matter:
- All required fields present
- Appropriate reliability (high) for GDELT
- Good update frequency (15m matches GDELT)

✓ API Configuration:
- Correct base URL
- Valid endpoint
- Good query selection (covers major event types)
- Rate limit documented

⚠ Suggestions:
1. Add CAMEO event code mapping in Processing section
2. Include example of tone score interpretation
3. Add deduplication strategy (GDELT has many duplicates)
4. Document geographic filters

✓ Quality Indicators:
- Good use of tone scores
- Location presence check appropriate
- Theme filtering sensible

✓ Examples:
- Realistic API responses
- Good coverage of different event types

Improvements needed:
1. Add section on CAMEO code classification
2. Show deduplication logic
3. Add geographic filtering examples

Overall: 88/100 - Very good, minor improvements needed
```

## Example 4: Troubleshooting Failed Validation

### Initial Validation

```bash
node validate-source.js email-intel-digest.md

# Output:
# Validating: email-intel-digest.md
#
# ✗ Errors (5):
#   • Invalid date format for created_date: 29-04-2026 (use YYYY-MM-DD)
#   • Missing required field: description
#   • Missing required section: Examples
#   • Potential sensitive data on line 45: password="..."
#   • File name doesn't follow convention (should be email-intel-digest.md)
#
# ⚠ Warnings (3):
#   • Description is very short (< 50 chars)
#   • Type requirement missing: sender
#   • Examples section should include code blocks
#
# Quality Score: 42/100
# Status: FAILED
```

### AI-Assisted Fixing

```
AI: Fix these validation errors:

[paste validation output]

Current file excerpt:
---
id: intel-digest
name: Intelligence Digest Newsletter
type: email
status: testing
created_date: 29-04-2026
last_updated: 29-04-2026
tags:
  - intelligence
---

Also at line 45:
password="my_secret_password"

Help me fix all errors.

---

AI Response: Here are the fixes:

1. Date Format:
Change:
  created_date: 29-04-2026
  last_updated: 29-04-2026
To:
  created_date: 2026-04-29
  last_updated: 2026-04-29

2. Add Description:
description: |
  Daily intelligence digest newsletter providing curated world event
  summaries, geopolitical analysis, and crisis monitoring from verified
  OSINT sources.

3. Remove Sensitive Data (line 45):
Change:
  password="my_secret_password"
To:
  # Authentication via environment variable: EMAIL_PASSWORD
  # Set in .env file or system environment

4. Add Examples Section:
## Examples

### Example 1: Daily Digest Email

**Raw Email:**
```
Subject: Intel Digest - 2026-04-29
From: newsletter@intel-digest.com

=== PRIORITY ITEMS ===
...
```

5. Add Sender Info:
In Data Collection Criteria section, add:
### Sender Allowlist
- newsletter@intel-digest.com
- alerts@intel-digest.com
```

### After Fixes

```bash
node validate-source.js email-intel-digest.md

# Output:
# Quality Score: 91/100
# Status: EXCELLENT
# ✓ Source is ready for testing!
```

## Example 5: Batch Validation

### Validate Multiple Sources

```bash
node validate-source.js --all

# Output:
# Validating 8 source files...
#
# Validating: twitter-bbc-breaking.md
# Quality Score: 95/100
# Status: EXCELLENT
# ---
#
# Validating: rss-reuters-world.md
# Quality Score: 88/100
# Status: PASSED
# ---
#
# Validating: api-gdelt-events.md
# Quality Score: 92/100
# Status: EXCELLENT
# ---
#
# Validating: email-intel-digest.md
# Quality Score: 91/100
# Status: EXCELLENT
# ---
#
# Validating: webpage-aljazeera-world.md
# ⚠ Warnings (3)
# Quality Score: 76/100
# Status: PASSED
# ---
#
# Validating: twitter-old-source.md
# ✗ Errors (2)
# Quality Score: 58/100
# Status: NEEDS IMPROVEMENT
# ---
#
# Summary:
#   Total files: 8
#   Failed: 1
#   Average score: 84/100
```

## Best Practices from Examples

### 1. Start with Planning
- Use AI helper to clarify requirements
- Research source reliability before creation
- Understand data format and structure

### 2. Use Interactive Creator
- Faster than manual file creation
- Ensures all required fields included
- Generates proper template structure

### 3. Iterate with Validation
- Validate early and often
- Fix errors before moving to testing
- Aim for >85% quality score

### 4. Leverage AI for Review
- Get AI feedback on complete files
- Ask for specific improvement suggestions
- Use AI to generate examples

### 5. Test Thoroughly
- Test connectivity first
- Verify extraction logic
- Check quality thresholds
- Validate transformation

### 6. Document Issues
- Note known problems in source file
- Provide workarounds
- Track resolution status

### 7. Maintain Regularly
- Review monthly for accuracy
- Update configurations as sources change
- Deprecate inactive sources

## Common Workflows

### Quick Source Creation
```bash
create → validate → fix errors → test → deploy
Total time: 15-30 minutes
```

### Comprehensive Source Creation
```bash
plan (AI) → create → validate → improve → re-validate →
test connectivity → test extraction → test quality →
review (AI) → final fixes → deploy
Total time: 1-2 hours
```

### Source Maintenance
```bash
review performance → update configuration → validate →
test → update documentation → commit changes
Total time: 15-30 minutes per source
```

## Tips for Success

1. **Copy Examples**: Start with similar example, modify
2. **Validate Often**: Catch issues early
3. **Use AI Helpers**: Get guidance when stuck
4. **Test with Real Data**: Mock data hides issues
5. **Document Everything**: Future you will thank you
6. **Review Regularly**: Sources change over time
7. **Share Learnings**: Document for team
