---
name: create-source
description: Create new OSINT data sources for world event collection. Guide authors through source creation with templates, validation scripts, testing workflows, and quality checks. Automate source file generation, front matter validation, manifest updates, and source testing to ensure high-quality, well-documented intelligence sources.
license: MIT
compatibility: Language-agnostic. Scripts support Node.js 18+, Python 3.8+, and shell utilities.
metadata:
  author: osint-builders
  version: "1.0.0"
  source-directory: "../../source"
  examples-directory: "../../source/examples"
---

# Create Source Skill

Comprehensive framework for creating, validating, and testing new OSINT data sources. Guide authors through the complete lifecycle: planning → creation → validation → testing → deployment.

## Core Purpose

Enable AI agents and human contributors to:
- Create well-structured source files following established schemas
- Validate source metadata and configuration
- Test source connectivity and data extraction
- Ensure quality and completeness before deployment
- Maintain consistency across all sources
- Update manifest registry automatically

## Source Types Supported

| Type | Description | Example Use Cases |
|------|-------------|-------------------|
| **twitter** | Twitter/X accounts | Breaking news accounts, government officials, analysts |
| **webpage** | Web scraping targets | News sites, blogs, government portals |
| **api** | REST/GraphQL APIs | GDELT, news APIs, data aggregators |
| **email** | Email newsletters | Intel digests, alert services, mailing lists |
| **rss** | RSS/Atom feeds | News feeds, blog updates, alert feeds |
| **webhook** | Incoming webhooks | Push notifications, real-time alerts |
| **websocket** | Real-time streams | Live data feeds, market data |
| **file** | File sources | S3 buckets, SFTP, shared drives |
| **database** | Direct DB access | Intelligence databases, archives |
| **other** | Custom types | Specialized or hybrid sources |

## Quick Start

### Interactive Creation

```bash
# Run interactive source creator
node scripts/create-source.js

# Follow prompts:
# 1. Select source type
# 2. Enter basic metadata
# 3. Configure collection criteria
# 4. Add examples
# 5. Validate and save
```

### Programmatic Creation

```bash
# Create from template
node scripts/create-source.js --type twitter --template

# With configuration file
node scripts/create-source.js --config new-source.json

# Quick create (minimal prompts)
node scripts/create-source.js --quick --type api --name "My API Source"
```

### Validation Only

```bash
# Validate existing source
node scripts/validate-source.js source/sources/twitter-example.md

# Validate all sources
node scripts/validate-source.js --all

# Check specific aspects
node scripts/validate-source.js twitter-example.md --check-frontmatter
node scripts/validate-source.js twitter-example.md --check-completeness
```

### Testing Sources

```bash
# Test source connectivity
node scripts/test-source.js twitter-example.md

# Test data extraction (dry run)
node scripts/test-source.js twitter-example.md --extract

# Full validation + test
node scripts/test-source.js twitter-example.md --full
```

## Creation Workflow

### Phase 1: Planning

**Questions to Answer:**
1. What type of source? (twitter, webpage, api, etc.)
2. What intelligence does it provide?
3. How reliable is the source?
4. How often should it be checked?
5. What are the collection criteria?
6. Are there authentication requirements?
7. What is the expected data format?

**AI Helper Prompt:**
```
I need to create a new OSINT source. Help me plan:

Source type: [twitter/webpage/api/email/rss/other]
Description: [What intelligence this provides]
Reliability: [high/medium/low/unverified]
Update frequency: [how often to check]

Guide me through the planning phase and help identify:
- Required collection criteria
- Authentication needs
- Expected data structure
- Quality indicators
- Potential issues
```

### Phase 2: Creation

**Automated Creation:**

```javascript
// Create source programmatically
const { createSource } = require('./scripts/create-source.js');

const sourceConfig = {
  type: 'twitter',
  name: 'OSINT Breaking News Account',
  handle: 'osint_breaking',
  reliability: 'high',
  priority: 'high',
  updateFrequency: '5m',
  description: 'Real-time breaking news from verified OSINT collective',
  tags: ['breaking-news', 'world-events', 'osint'],
  collectionCriteria: {
    includeRetweets: false,
    includeReplies: false,
    minEngagement: 100,
    keywords: ['breaking', 'urgent', 'developing']
  }
};

await createSource(sourceConfig);
```

**Manual Creation:**

1. Copy appropriate example from `source/examples/`
2. Rename to `source/sources/{type}-{identifier}.md`
3. Update front matter with accurate metadata
4. Complete all required sections
5. Add realistic examples
6. Validate with validation script

### Phase 3: Validation

**Required Checks:**

- ✅ **Front matter complete**: All required fields present
- ✅ **Naming convention**: File name matches `{type}-{identifier}.md`
- ✅ **Type-specific requirements**: Includes type-specific criteria
- ✅ **Body sections complete**: All required sections present
- ✅ **Examples provided**: At least 1 realistic example
- ✅ **No sensitive data**: No hardcoded credentials
- ✅ **Markdown valid**: Proper Markdown formatting
- ✅ **Links valid**: All URLs accessible
- ✅ **Date format**: ISO 8601 format for dates

**Validation Script:**

```bash
# Run all validations
node scripts/validate-source.js my-new-source.md

# Output:
# ✓ Front matter valid
# ✓ Required fields present
# ✓ Type-specific requirements met
# ✓ Body sections complete
# ✓ Examples provided
# ✗ Found sensitive data: API_KEY on line 45
# ✗ Broken link: https://example.com/invalid (line 89)
#
# Status: FAILED (2 errors, 0 warnings)
```

### Phase 4: Testing

**Connectivity Tests:**

For each source type, verify:

- **Twitter**: Can authenticate, can fetch timeline
- **Webpage**: Can reach URL, can parse HTML
- **API**: Can authenticate, can query endpoints
- **Email**: Can connect to IMAP/SMTP
- **RSS**: Can fetch and parse feed

**Extraction Tests:**

- Fetch sample data
- Run extraction logic
- Verify output format
- Check data quality
- Validate transformations

**Test Script:**

```bash
# Test connectivity only
node scripts/test-source.js twitter-breaking-news.md --connectivity

# Test data extraction (dry run, no storage)
node scripts/test-source.js twitter-breaking-news.md --extract --dry-run

# Full test with quality check
node scripts/test-source.js twitter-breaking-news.md --full

# Output:
# Testing source: twitter-breaking-news
# ✓ Connectivity: SUCCESS (authenticated, rate limits OK)
# ✓ Extraction: SUCCESS (fetched 10 items)
# ✓ Quality: 8/10 items passed quality checks
# ✓ Transform: All items transformed successfully
#
# Sample output (first item):
# {
#   "title": "Breaking: Major development in Region X",
#   "date": "2026-04-29T14:32:00Z",
#   "type": "conflict",
#   "priority": "high",
#   ...
# }
#
# Status: READY FOR DEPLOYMENT
```

### Phase 5: Deployment

**Update Manifest:**

```bash
# Update manifest with all sources automatically (recommended)
python3 skills/create-source/scripts/update-manifest.py

# Manifest updated:
# - Scans all source files
# - Extracts metadata from frontmatter
# - Updates statistics
# - Validates JSON structure
# - Reports summary (total sources, by type, priority, reliability)
```

Alternative (individual source):
```bash
# Add single source to manifest (if update-manifest.js exists)
node scripts/update-manifest.js add twitter-breaking-news.md
```

**Mark as Active:**

```bash
# Change status from 'testing' to 'active'
node scripts/update-source-status.js twitter-breaking-news.md active

# Updated:
# - status: active
# - last_updated: 2026-04-29
# - manifest.json synchronized
```

**Commit Changes:**

```bash
git add source/sources/twitter-breaking-news.md
git add source/manifest.json
git commit -m "Add twitter-breaking-news source

- Type: twitter
- Reliability: high
- Priority: high
- Update frequency: 5m

Validated and tested. Ready for production."
```

## Type-Specific Guides

### Creating Twitter Sources

**Required Information:**
- Twitter handle (without @)
- User ID (numeric)
- Collection method (timeline/search/stream)
- Filters (retweets, replies, engagement threshold)
- Keywords and hashtags to monitor

**Quick Create:**
```bash
node scripts/create-source.js \
  --type twitter \
  --handle osint_breaking \
  --user-id 1234567890 \
  --method timeline \
  --priority high \
  --update-frequency 5m
```

**Validation Checklist:**
- [ ] Handle exists and is active
- [ ] User ID matches handle
- [ ] Collection method appropriate
- [ ] Filters are clear and specific
- [ ] Keywords relevant to world events
- [ ] Examples show tweet structure

### Creating Webpage Sources

**Required Information:**
- Base URL(s)
- URL patterns to crawl
- CSS selectors or XPath for extraction
- Include/exclude patterns
- Update frequency

**Quick Create:**
```bash
node scripts/create-source.js \
  --type webpage \
  --url "https://example-news.com/world" \
  --selectors "article.main-article" \
  --crawl-depth 2 \
  --update-frequency 15m
```

**Validation Checklist:**
- [ ] URLs are accessible
- [ ] Selectors extract correct elements
- [ ] Crawl patterns match expected pages
- [ ] Exclusion patterns prevent off-topic crawls
- [ ] Rate limiting configured
- [ ] Example HTML shows structure

### Creating API Sources

**Required Information:**
- Base URL
- Endpoints to query
- Authentication method
- Rate limits
- Request/response format

**Quick Create:**
```bash
node scripts/create-source.js \
  --type api \
  --base-url "https://api.example.com/v1" \
  --endpoints "/events,/search" \
  --auth-method api_key \
  --rate-limit "100/hour"
```

**Validation Checklist:**
- [ ] API is accessible
- [ ] Authentication works
- [ ] Endpoints return expected data
- [ ] Rate limits documented
- [ ] Response mapping defined
- [ ] Example API responses included

### Creating Email Sources

**Required Information:**
- Email connection details (IMAP/API)
- Sender allowlist
- Subject filters
- Content extraction rules

**Quick Create:**
```bash
node scripts/create-source.js \
  --type email \
  --connection imap \
  --sender "newsletter@intel-digest.com" \
  --subject-pattern "^Intel Digest -" \
  --folder INBOX
```

**Validation Checklist:**
- [ ] Email connection works
- [ ] Sender allowlist complete
- [ ] Subject filters match expected format
- [ ] Extraction rules handle HTML and plain text
- [ ] Example emails show structure

### Creating RSS Sources

**Required Information:**
- Feed URL
- Feed format (RSS/Atom)
- Entry filters
- Item mapping rules

**Quick Create:**
```bash
node scripts/create-source.js \
  --type rss \
  --feed-url "https://example-news.com/world/rss" \
  --format rss2.0 \
  --update-frequency 10m
```

**Validation Checklist:**
- [ ] Feed URL is valid and accessible
- [ ] Feed parses correctly
- [ ] Entry filters work as expected
- [ ] Item mapping extracts all fields
- [ ] Example feed items included

## Validation Reference

### Front Matter Validation

**Required Fields:**
```yaml
id: string (UUID or slug)
name: string
type: enum (twitter|webpage|api|email|rss|webhook|websocket|file|database|other)
status: enum (active|inactive|archived|testing)
description: string (multiline OK)
created_date: YYYY-MM-DD
last_updated: YYYY-MM-DD
```

**Common Optional Fields:**
```yaml
tags: array
reliability: enum (high|medium|low|unverified)
confidence_score: number (0-100)
update_frequency: string (e.g., "15m", "1h", "daily")
priority: enum (high|medium|low)
language: array (ISO 639-1 codes)
geographic_focus: array
cost: enum (free|paid|freemium)
requires_auth: boolean
maintainer: string
alert_keywords: array
```

### Type-Specific Validation

Each source type has additional required fields:

**Twitter:**
- `handle` (string without @)
- `user_id` (numeric)
- `collection_method` (timeline|search|stream)

**Webpage:**
- `url` (string or array)
- `selectors` (CSS or XPath)
- `crawl_depth` (number)

**API:**
- `base_url` (string)
- `endpoints` (array)
- `auth_method` (none|api_key|oauth|bearer)

**Email:**
- `email_address` or connection details
- `sender_allowlist` (array)
- `subject_filters` (array or regex)

**RSS:**
- `feed_url` (string)
- `feed_format` (rss|atom)

### Body Section Validation

Required sections in body:

1. **Overview**: Brief narrative (100+ words)
2. **Data Collection Criteria**: Type-specific requirements
3. **Expected Data Format**: Structure and examples
4. **Processing Instructions**: Extraction and transformation
5. **Quality Indicators**: High/low quality signals
6. **Known Issues**: Documented problems
7. **Examples**: At least 1 realistic example

## Testing Reference

### Test Types

**1. Connectivity Test**
- Verify source is reachable
- Check authentication if required
- Confirm rate limits
- Test basic query/fetch

**2. Extraction Test**
- Fetch sample data (5-10 items)
- Run extraction logic
- Verify field mapping
- Check data completeness

**3. Quality Test**
- Apply quality indicators
- Check required fields present
- Validate data types
- Test filters work correctly

**4. Transform Test**
- Transform to world event entity
- Verify schema compliance
- Check markdown generation
- Validate all mappings

### Test Automation

```javascript
// scripts/test-source.js usage

const { testSource } = require('./scripts/test-source.js');

// Run full test suite
const result = await testSource('twitter-breaking-news.md', {
  connectivity: true,
  extraction: true,
  quality: true,
  transform: true,
  sampleSize: 10,
  dryRun: true // Don't store results
});

console.log(result);
// {
//   connectivity: { passed: true, message: "Authenticated successfully" },
//   extraction: { passed: true, itemCount: 10, errors: [] },
//   quality: { passed: true, score: 9, failedItems: 1 },
//   transform: { passed: true, validEntities: 9 },
//   overall: "PASS",
//   recommendation: "Ready for deployment"
// }
```

## AI Helper Prompts

### Planning a New Source

```
I want to create a new OSINT source:

Type: [specify type]
Name: [source name]
Description: [what intelligence it provides]

Please help me:
1. Identify all required metadata fields
2. Determine appropriate collection criteria
3. Define quality indicators
4. Suggest testing approach
5. Identify potential issues

Ask me questions to gather needed information.
```

### Troubleshooting Source Creation

```
I'm having trouble creating a source:

Type: [type]
Issue: [describe problem]

Current state:
[paste relevant configuration or error messages]

Help me:
1. Diagnose the issue
2. Suggest solutions
3. Provide corrected configuration
4. Recommend validation steps
```

### Reviewing Existing Source

```
Review this source file for quality and completeness:

[paste source file content]

Check:
1. Front matter completeness and accuracy
2. Type-specific requirements met
3. Body sections complete and detailed
4. Examples realistic and helpful
5. Quality indicators appropriate
6. Known issues documented

Provide specific feedback and recommendations.
```

## Quality Checklist

Before marking source as "active":

### Metadata Quality
- [ ] Unique ID assigned
- [ ] Descriptive name (clear, specific)
- [ ] Accurate type selected
- [ ] Reliability rating justified
- [ ] Update frequency appropriate
- [ ] Tags relevant and complete
- [ ] Maintainer assigned

### Configuration Quality
- [ ] Collection criteria detailed and specific
- [ ] Authentication method clear
- [ ] Rate limits documented
- [ ] Filters well-defined
- [ ] Error handling considered

### Documentation Quality
- [ ] Overview provides context
- [ ] Processing instructions actionable
- [ ] Quality indicators measurable
- [ ] Examples realistic and complete
- [ ] Known issues documented with workarounds

### Technical Quality
- [ ] No hardcoded credentials
- [ ] No sensitive data exposed
- [ ] URLs valid and accessible
- [ ] Markdown properly formatted
- [ ] Code examples work correctly

### Testing Quality
- [ ] Connectivity test passed
- [ ] Extraction test passed
- [ ] Quality test passed (>80% score)
- [ ] Transform test passed
- [ ] Edge cases considered

## Common Pitfalls

### 1. Vague Collection Criteria
**Problem**: "Monitor Twitter for news"  
**Solution**: Specify handle, keywords, filters, engagement thresholds

### 2. Missing Type-Specific Requirements
**Problem**: Webpage source without selectors  
**Solution**: Review type-specific checklist, include all required fields

### 3. Unrealistic Examples
**Problem**: Generic placeholder examples  
**Solution**: Use actual data samples (anonymized if needed)

### 4. Hardcoded Credentials
**Problem**: API keys in source file  
**Solution**: Use environment variable references

### 5. Incomplete Testing
**Problem**: Marked active without testing  
**Solution**: Run full test suite before deployment

### 6. Poor Quality Indicators
**Problem**: Vague quality signals  
**Solution**: Define specific, measurable criteria

### 7. No Error Handling
**Problem**: Doesn't document failure modes  
**Solution**: Include "Known Issues" section with workarounds

### 8. Outdated Information
**Problem**: Never updated after creation  
**Solution**: Set up regular review schedule

## Maintenance

### Regular Updates

**Monthly Review:**
```bash
# Review all active sources
node scripts/review-sources.js --status active --report monthly

# Checks:
# - Last updated date (flag if > 90 days)
# - Reliability score changes
# - Collection success rate
# - Quality score trends
# - Known issues resolved/new
```

**Quarterly Audit:**
```bash
# Full audit of all sources
node scripts/audit-sources.js --comprehensive

# Reviews:
# - Source still relevant and active
# - Configuration still accurate
# - Documentation up to date
# - Examples still representative
# - Performance metrics
```

### Updating Sources

```bash
# Update existing source
node scripts/update-source.js twitter-breaking-news.md

# Interactive updates:
# - Modify metadata
# - Update collection criteria
# - Add/remove filters
# - Update examples
# - Increment last_updated date
# - Sync manifest
```

### Deprecating Sources

```bash
# Mark source as inactive
node scripts/update-source-status.js old-source.md inactive

# Archive source (move to archive folder)
node scripts/archive-source.js old-source.md --reason "Source no longer maintained"

# Remove from manifest
node scripts/update-manifest.js remove old-source.md
```

## Scripts Reference

All scripts located in `skills/create-source/scripts/`:

| Script | Purpose | Usage |
|--------|---------|-------|
| `create-source.js` | Interactive source creation | `node create-source.js` |
| `validate-source.js` | Validate source files | `node validate-source.js <file>` |
| `test-source.js` | Test source connectivity & extraction | `node test-source.js <file>` |
| `update-manifest.js` | Update manifest.json | `node update-manifest.js add <file>` |
| `update-source-status.js` | Change source status | `node update-source-status.js <file> <status>` |
| `review-sources.js` | Review multiple sources | `node review-sources.js --all` |
| `audit-sources.js` | Comprehensive audit | `node audit-sources.js` |
| `archive-source.js` | Archive deprecated source | `node archive-source.js <file>` |

## Resources

### Reference Documentation
- `source/README.md` - Complete source specification
- `source/CONTRIBUTING.md` - Contributor guide
- `source/examples/` - Example sources for each type
- `skills/world-event-entities/` - Entity schema documentation

### Related Skills
- `data-to-markdown` - Convert source data to Markdown
- `word-event-entities` - World event entity schema
- `agent-browser` - Web scraping for webpage sources

### External Resources
- [OSINT Framework](https://osintframework.com/)
- [Twitter API Documentation](https://developer.twitter.com/en/docs)
- [GDELT Project](https://www.gdeltproject.org/)
- [RSS 2.0 Specification](https://www.rssboard.org/rss-specification)

## Support

For help with source creation:
1. Review relevant example in `source/examples/`
2. Run validation script for specific feedback
3. Use AI helper prompts for guidance
4. Consult reference documentation
5. Test incrementally, validate often
