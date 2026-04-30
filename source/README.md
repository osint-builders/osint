# Sources Directory

## Purpose

The `source` directory contains metadata and collection criteria for all OSINT data sources used in this project. Sources represent locations on the internet or data endpoints where world event information is collected and aggregated.

A **source** can be:
- Social media accounts (Twitter, LinkedIn, etc.)
- Web pages (news sites, blogs, forums)
- Email connectors (newsletters, mailing lists)
- APIs (REST, GraphQL, webhooks)
- RSS/Atom feeds
- Data streams (webhooks, websockets)
- File repositories (S3 buckets, shared drives)

## Directory Structure

```
source/
├── README.md              # This file
├── CONTRIBUTING.md        # Guide for adding new sources
├── manifest.json          # Master registry of all sources
├── examples/              # Example source files for each type
│   ├── twitter-example.md
│   ├── webpage-example.md
│   ├── email-example.md
│   ├── api-example.md
│   └── rss-example.md
└── sources/               # Individual source markdown files
    └── ...
```

## Source File Naming Convention

Source files should be named using kebab-case with the format:

```
{type}-{identifier}.md
```

Examples:
- `twitter-osint_updates.md`
- `webpage-bbc-world-news.md`
- `api-gdelt-project.md`
- `email-intel-digest.md`

## Front Matter Schema

Every source file MUST include YAML front matter with the following fields:

### Required Fields

```yaml
---
id: string                    # Unique identifier (UUID or slug)
name: string                  # Human-readable name
type: enum                    # Source type (see types below)
status: enum                  # active | inactive | archived | testing
description: string           # Brief description of what this source provides
created_date: YYYY-MM-DD     # When source was added
last_updated: YYYY-MM-DD     # Last modification date
---
```

### Optional Fields

```yaml
tags: array                   # Categorization tags
  - world-events
  - breaking-news
  - geopolitical
reliability: enum             # high | medium | low | unverified
confidence_score: number      # 0-100 reliability rating
update_frequency: string      # How often to check (e.g., "15m", "1h", "daily")
priority: enum                # high | medium | low
language: array               # Languages covered (ISO 639-1 codes)
geographic_focus: array       # Regions/countries covered
cost: enum                    # free | paid | freemium
rate_limits: object           # API rate limiting info
requires_auth: boolean        # Whether authentication is needed
maintainer: string            # Person/team responsible
alert_keywords: array         # Keywords that trigger high-priority alerts
```

### Source Types

Valid values for the `type` field:

- `twitter` - Twitter/X accounts
- `webpage` - Web pages requiring scraping
- `api` - REST, GraphQL, or other APIs
- `email` - Email newsletters or connectors
- `rss` - RSS or Atom feeds
- `webhook` - Incoming webhook endpoints
- `websocket` - Real-time data streams
- `file` - File-based sources (S3, SFTP, etc.)
- `database` - Direct database connections
- `other` - Other source types

## Body Content Structure

After the front matter, each source file should contain:

### 1. Overview
Brief narrative description of the source, its relevance, and typical content.

### 2. Data Collection Criteria
**This section is type-specific.** See examples for each type.

Common elements:
- Connection details (URLs, endpoints, handles)
- Authentication requirements
- What to fetch/scrape/monitor
- Include/exclude filters
- Data extraction rules

### 3. Expected Data Format
Description of the data structure returned by this source.

### 4. Processing Instructions
How to transform raw data into world event entities.

### 5. Quality Indicators
What signals indicate high-quality or relevant data from this source.

### 6. Known Issues
Documented problems, quirks, or limitations.

### 7. Examples
Sample data or outputs from this source.

## Type-Specific Requirements

### Twitter Sources
Must include:
- `handle`: Twitter handle (without @)
- `user_id`: Numeric Twitter user ID
- `collection_method`: timeline | search | stream
- `filters`: Tweet filters (retweets, replies, etc.)

### Webpage Sources
Must include:
- `url`: Base URL or URL pattern
- `selectors`: CSS/XPath selectors for data extraction
- `crawl_depth`: How deep to follow links
- `crawl_pattern`: URL patterns to follow
- `exclusion_pattern`: URL patterns to skip

### Email Sources
Must include:
- `email_address`: Address or pattern to monitor
- `subject_filters`: Subject line filters
- `sender_allowlist`: Trusted senders
- `extraction_rules`: How to parse email content

### API Sources
Must include:
- `base_url`: API base URL
- `endpoints`: List of endpoints to query
- `auth_method`: none | api_key | oauth | bearer
- `parameters`: Query parameters to use
- `response_format`: json | xml | csv

### RSS Sources
Must include:
- `feed_url`: RSS/Atom feed URL
- `entry_filters`: Filters for entries
- `item_mapping`: How feed items map to events

## Manifest File

The `manifest.json` file maintains a registry of all sources:

```json
{
  "version": "1.0.0",
  "last_updated": "2026-04-29",
  "sources": [
    {
      "id": "source-id",
      "name": "Source Name",
      "type": "twitter",
      "status": "active",
      "file": "sources/twitter-example.md"
    }
  ],
  "statistics": {
    "total_sources": 0,
    "active_sources": 0,
    "by_type": {}
  }
}
```

### Status Semantics for Collection Runs

The collection orchestrator (`builder/index.ts`) uses a **deny-list**, not an
allow-list, when picking which sources to send to the cloud agent. The rule is:

> A source is included in every collection run **unless** its `status` is one of
> `inactive`, `archived`, or `deprecated` (case-insensitive).

That means `active`, `testing`, `unverified`, and any other status value all
result in the source being processed. This is intentional: when you add a new
source, the default `status: testing` lets it ride along on the next run
immediately so you find collection bugs early, rather than silently dropping it.

If you genuinely want a source skipped, set its status to `inactive`,
`archived`, or `deprecated`.

The builder also embeds a sentinel list of expected source IDs in the prompt
and instructs the agent to abort if that list disagrees with the live manifest,
so a source can never be silently dropped between prompt construction and
execution.

## Validation Rules

Source files are considered valid when:

1. File name follows naming convention
2. All required front matter fields are present
3. `type` field matches valid types
4. Type-specific requirements are included
5. File is referenced in `manifest.json`
6. `created_date` and `last_updated` are valid dates
7. Body contains all required sections

## Usage by AI Systems

When evaluating or processing a source:

1. **Read the source file** to understand collection criteria
2. **Check the status** - process every source whose status is NOT `inactive`,
   `archived`, or `deprecated` (see "Status Semantics for Collection Runs"
   above). `testing` sources are in scope.
3. **Cross-check the worklist** - if you receive a pre-built collection prompt,
   diff its source list against `source/manifest.json` and abort on mismatch.
4. **Review priority** - process high-priority sources first
5. **Follow type-specific instructions** in the body
6. **Apply filters and extraction rules** as specified
7. **Transform data** according to processing instructions
8. **Validate quality** using quality indicators
9. **Update last_updated** when source is modified

## Best Practices

1. **Be specific** - Provide detailed, actionable collection criteria
2. **Include examples** - Show what good data looks like
3. **Document edge cases** - Note unusual situations or exceptions
4. **Keep current** - Update last_updated when making changes
5. **Test thoroughly** - Verify source works before marking active
6. **Monitor reliability** - Track and update confidence scores
7. **Document failures** - Note known issues and limitations

## Related Documentation

- See `CONTRIBUTING.md` for step-by-step guide to adding sources
- See `examples/` for reference implementations
- See `../skills/world-event-entities/` for entity schema
