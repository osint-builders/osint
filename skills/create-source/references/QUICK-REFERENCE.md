# Create Source - Quick Reference

Fast reference for creating, validating, and testing OSINT sources.

## Quick Commands

```bash
# Create new source (interactive)
node scripts/create-source.js

# Validate source
node scripts/validate-source.js source/sources/my-source.md

# Test source
node scripts/test-source.js source/sources/my-source.md

# Validate all sources
node scripts/validate-source.js --all
```

## Front Matter Template

```yaml
---
id: string                    # type-identifier-slug
name: string                  # Human-readable name
type: enum                    # twitter|webpage|api|email|rss|webhook|websocket|file|database|other
status: enum                  # active|inactive|archived|testing
description: |
  Multi-line description of what this source provides
created_date: YYYY-MM-DD
last_updated: YYYY-MM-DD
tags:
  - tag1
  - tag2
reliability: enum             # high|medium|low|unverified
confidence_score: number      # 0-100
update_frequency: string      # 5m, 15m, 1h, daily
priority: enum                # high|medium|low
language:
  - en
geographic_focus:
  - global
cost: enum                    # free|paid|freemium
requires_auth: boolean
maintainer: string
alert_keywords:
  - keyword1
---
```

## Required Body Sections

1. **Overview** - Context and purpose
2. **Data Collection Criteria** - Type-specific requirements
3. **Expected Data Format** - Structure and examples
4. **Processing Instructions** - Extraction and transformation
5. **Quality Indicators** - High/low quality signals
6. **Known Issues** - Problems and workarounds
7. **Examples** - Realistic data samples

## Type-Specific Requirements

### Twitter
- `handle` - Twitter handle (without @)
- `user_id` - Numeric user ID
- `collection_method` - timeline|search|stream
- Keywords, hashtags, filters

### Webpage
- `url` - Base URL or patterns
- `selectors` - CSS or XPath selectors
- `crawl_depth` - How deep to follow links
- Include/exclude patterns

### API
- `base_url` - API base URL
- `endpoints` - List of endpoints
- `auth_method` - none|api_key|oauth|bearer
- Rate limits, parameters

### Email
- `email_address` - Address or connection details
- `sender_allowlist` - Trusted senders
- `subject_filters` - Subject patterns
- Extraction rules

### RSS
- `feed_url` - RSS/Atom feed URL
- `feed_format` - rss|atom
- Entry filters, item mapping

## Validation Checklist

- [ ] Front matter complete
- [ ] Type-specific requirements included
- [ ] All body sections present
- [ ] Examples provided (at least 1)
- [ ] No sensitive data (credentials)
- [ ] Valid markdown formatting
- [ ] File naming: `{type}-{identifier}.md`

## Testing Checklist

- [ ] Connectivity test passed
- [ ] Can authenticate (if required)
- [ ] Data extraction works
- [ ] Quality score > 80%
- [ ] Transformation successful
- [ ] Sample output validated

## Common Patterns

### High-Priority Breaking News Source

```yaml
type: twitter
status: active
reliability: high
priority: high
update_frequency: "5m"
alert_keywords:
  - breaking
  - urgent
  - developing
tags:
  - breaking-news
  - world-events
```

### Daily Intelligence Digest

```yaml
type: email
status: active
reliability: high
priority: medium
update_frequency: "daily"
tags:
  - intelligence
  - curated-content
  - daily-digest
```

### News Aggregation API

```yaml
type: api
status: active
reliability: high
priority: medium
update_frequency: "15m"
cost: free
requires_auth: false
tags:
  - news-aggregation
  - structured-data
```

## Quality Indicators

### High Quality
- Specific locations mentioned
- Dates/timestamps present
- Multiple sources cited
- Complete metadata
- Professional source
- High engagement (social)
- Verified accounts (social)

### Low Quality
- Vague language
- No location specified
- No date/timestamp
- Single source, unverified
- Clickbait headlines
- Very short content
- Broken links

## Troubleshooting

### Validation Fails: "Front matter missing"
**Cause**: No `---` markers or invalid YAML  
**Fix**: Ensure front matter starts and ends with `---` on own lines

### Validation Fails: "Invalid date format"
**Cause**: Dates not in YYYY-MM-DD format  
**Fix**: Use ISO date format: `2026-04-29`

### Validation Fails: "Missing required section"
**Cause**: Body missing required sections  
**Fix**: Add all 7 required sections with ## headings

### Test Fails: "Authentication not configured"
**Cause**: Missing environment variables  
**Fix**: Set required env vars (TWITTER_API_KEY, EMAIL_PASSWORD, etc.)

### Test Fails: "Extraction returned 0 items"
**Cause**: Filters too strict or source has no data  
**Fix**: Review filters, check source has recent content

## AI Helper Prompts

### Review My Source File

```
Review this source file for completeness and quality:

[paste source file]

Check:
1. Front matter complete?
2. Type-specific requirements met?
3. Body sections complete?
4. Examples realistic?
5. Quality indicators appropriate?
6. Any issues or improvements?
```

### Help Me Configure [Type]

```
I'm creating a [twitter/webpage/api/email/rss] source.

What I know:
- [describe what you know]

Help me:
1. Identify required fields
2. Configure collection criteria
3. Define quality indicators
4. Suggest testing approach
```

### Troubleshoot Validation Error

```
My source validation is failing:

Error: [paste error message]

Source type: [type]
Issue: [describe issue]

Help me fix this.
```

## File Naming Convention

```
{type}-{identifier}.md

Examples:
twitter-bbc_breaking.md
webpage-reuters-world.md
api-gdelt-events.md
email-intel-digest.md
rss-al-jazeera-feed.md
```

## Environment Variables

Sources may require these environment variables:

```bash
# Twitter
TWITTER_API_KEY=your_key
TWITTER_API_SECRET=your_secret
TWITTER_BEARER_TOKEN=your_token

# Email
EMAIL_HOST=imap.gmail.com
EMAIL_PORT=993
EMAIL_USER=your_email
EMAIL_PASSWORD=your_password

# APIs (source-specific)
GDELT_API_KEY=your_key
NEWS_API_KEY=your_key
```

## Next Steps After Creation

1. **Complete the template** - Fill in all [bracketed] sections
2. **Add realistic examples** - Use actual data samples (anonymized)
3. **Validate** - Run validation script, fix errors
4. **Test** - Run test script, verify connectivity and extraction
5. **Update manifest** - Add to manifest.json
6. **Mark active** - Change status from 'testing' to 'active'
7. **Commit** - Add to version control with descriptive message

## Resources

- **Source README**: `../../source/README.md`
- **Contributor Guide**: `../../source/CONTRIBUTING.md`
- **Examples**: `../../source/examples/`
- **Entity Schema**: `../world-event-entities/`
- **Scripts**: `./scripts/`

## Script Options

### validate-source.js
```bash
node validate-source.js <file.md>
node validate-source.js --all
```

### test-source.js
```bash
node test-source.js <file.md>
node test-source.js <file.md> --connectivity
node test-source.js <file.md> --extract
node test-source.js <file.md> --sample-size 10
node test-source.js <file.md> --show-sample
```

### create-source.js
```bash
node create-source.js              # Interactive mode
node create-source.js --help       # Show help
```

## Support

- Review example sources in `source/examples/`
- Check existing sources in `source/sources/`
- Use validation script for specific feedback
- Leverage AI helpers for guidance
