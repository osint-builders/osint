# Contributing Sources

How to add a new OSINT source to the project. The canonical schema lives here;
the top-level [README.md](../README.md) and [AGENTS.md](../AGENTS.md) cover the
overall architecture.

## Quick Start

1. **Pick the matching example** in `examples/` (`twitter`, `webpage`, `api`, `email`, `rss`).
2. **Copy** it to `sources/{type}-{identifier}.md` (kebab-case).
3. **Fill in front matter** (see schema below) and the body sections.
4. **Validate**: `node ../skills/create-source/scripts/validate-source.js sources/<your-file>.md`
5. **Register**: `node ../skills/create-source/scripts/update-manifest.py`

> **Heads-up:** As soon as the manifest entry lands on `main`, the next hourly
> run of `builder/index.ts` will include your source — even with
> `status: testing`. The orchestrator uses a deny-list (`inactive`, `archived`,
> `deprecated`), *not* an allow-list. To stage a source without collection,
> set `status: inactive` until ready.

## Front Matter Schema

### Required

| Field | Type | Notes |
|---|---|---|
| `id` | string | Unique slug or UUID |
| `name` | string | Human-readable |
| `type` | enum | `twitter` \| `webpage` \| `api` \| `email` \| `rss` \| `webhook` \| `websocket` \| `file` \| `database` \| `other` |
| `status` | enum | `active` \| `testing` \| `inactive` \| `archived` \| `deprecated` |
| `description` | string | What intel this source provides |
| `created_date` | YYYY-MM-DD | |
| `last_updated` | YYYY-MM-DD | Bump on every edit |

### Optional

| Field | Type | Notes |
|---|---|---|
| `tags` | array | Categorization (e.g., `world-events`, `breaking-news`) |
| `reliability` | enum | `high` \| `medium` \| `low` \| `unverified` |
| `confidence_score` | number | 0–100 |
| `update_frequency` | string | e.g., `15m`, `1h`, `daily` |
| `priority` | enum | `high` \| `medium` \| `low` |
| `language` | array | ISO 639-1 codes |
| `geographic_focus` | array | Regions/countries |
| `cost` | enum | `free` \| `paid` \| `freemium` |
| `rate_limits` | object | API rate limit info |
| `requires_auth` | boolean | |
| `maintainer` | string | Owner |
| `alert_keywords` | array | Triggers high-priority alerts |

## Body Sections

After the front matter, every source file should include:

1. **Overview** — narrative description, relevance, typical content.
2. **Data Collection Criteria** — type-specific (see below).
3. **Expected Data Format** — structure of raw responses.
4. **Processing Instructions** — how to transform raw data into world event entities.
5. **Quality Indicators** — signals of high-quality / on-topic data.
6. **Known Issues** — quirks, limitations, dropped fields.
7. **Examples** — 2–3 raw → processed pairs.

## Type-Specific Requirements

### Twitter

```yaml
handle: handle_name        # without @
user_id: "1234567890"
collection_method: timeline | search | stream
filters:
  include_retweets: false
  include_replies: false
  languages: [en]
  hashtags: [worldnews, breaking]
```

### Webpage

```yaml
url: https://example.com/world-news
crawl_pattern: /world-news/YYYY/MM/DD/*
crawl_depth: 2
exclusion_pattern: [/opinion/*, /sports/*]
selectors:
  article: .article-container
  title: h1.article-title
  date: time.publish-date
  body: div.article-body
```

### API

```yaml
base_url: https://api.example.com/v1
auth_method: none | api_key | oauth | bearer
endpoints:
  - path: /events
    method: GET
    params: { date: ISO8601, category: world-events, limit: 100 }
response_format: json | xml | csv
```

### Email

```yaml
email_address: intel-digest@example.com
sender_allowlist:
  - newsletter@stratfor.com
subject_filters:
  include: ["Daily Digest", "Breaking", "Alert"]
  exclude: ["Unsubscribe"]
extraction_rules:
  title: subject_or_first_h1
  content: html_body_to_text
```

### RSS

```yaml
feed_url: https://example.com/feed.xml
entry_filters:
  min_pub_date: last_24h
item_mapping:
  title: entry.title
  date: entry.published
  body: entry.content
```

## Status Semantics (deny-list rule)

The collection orchestrator (`builder/index.ts`) processes **every** source
whose `status` is **not** one of `inactive`, `archived`, or `deprecated`
(case-insensitive). That means `active`, `testing`, `unverified`, and any other
value all ride along. This is intentional: new sources surface bugs early.

The builder also embeds a sentinel list of expected source IDs in the prompt
and instructs the agent to abort if that list disagrees with the live manifest,
so a source can never be silently dropped between prompt construction and
execution.

## Validation Rules

A source file is valid when:

1. File name matches `{type}-{identifier}.md` (kebab-case).
2. All required front-matter fields are present.
3. `type` is one of the enum values above.
4. Type-specific keys (see tables) are present.
5. The file is referenced in `manifest.json`.
6. `created_date` and `last_updated` parse as ISO dates.
7. Body contains all seven required sections.

Run `node ../skills/create-source/scripts/validate-source.js <file>` to check.

## Common Pitfalls

- **Incomplete front matter** — copy from `examples/`; they have every required field.
- **Vague collection criteria** — "monitor Twitter for news" is not actionable. Specify handles, hashtags, keywords, and filters.
- **No examples** — include 2–3 realistic raw → processed pairs.
- **Hardcoded credentials** — never. Reference an env var name (e.g., `EXAMPLE_API_KEY`); secrets are configured per the top-level README.
- **Marked active without testing** — use `status: testing` until you've seen at least one clean collection cycle.

## Getting Help

- Reference implementations live in `examples/` and `sources/`.
- The output schema is [`../data/SCHEMA.md`](../data/SCHEMA.md).
- The CLI tooling lives in `../skills/create-source/scripts/` (each script has `--help`).
