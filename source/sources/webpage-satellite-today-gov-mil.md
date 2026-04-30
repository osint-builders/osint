---
id: webpage-satellite-today-gov-mil
name: Satellite Today - Government & Military
type: webpage
status: testing
description: |
  Satellite Today's Government & Military section covers defense satellite programs,
  military space operations, launch contracts, space policy, and national security
  space activities. Provides industry news on government satellite procurement,
  military communications, reconnaissance systems, and defense space initiatives.
created_date: "2026-04-30"
last_updated: "2026-04-30"
tags:
  - defense
  - satellite
  - space-systems
  - military
  - government-contracts
  - national-security
  - space-policy
reliability: high
confidence_score: 85
update_frequency: "30m"
priority: medium
language:
  - en
geographic_focus:
  - united-states
  - global
cost: free
requires_auth: false
maintainer: osint-team
alert_keywords:
  - military satellite
  - defense contract
  - space force
  - reconnaissance
  - missile warning
  - launch
  - classified
---

# Webpage Source: Satellite Today - Government & Military

## Overview

Satellite Today is a leading trade publication covering the commercial and government satellite industry. The Government & Military section focuses specifically on defense and national security space activities, including:

- **Military satellite programs**: Communications, reconnaissance, navigation, and missile warning systems
- **Defense contracts**: Awards, RFPs, and procurement activities
- **Space policy**: National security space policy, doctrine, and strategy
- **Launch activities**: Military and government satellite launches
- **Space Force**: U.S. Space Force operations and programs
- **International defense space**: Allied nation military space activities

**Website Characteristics:**
- Industry trade publication with professional editorial standards
- Articles written by defense space journalists
- Mix of breaking news and analysis pieces
- Typical article length: 400-1200 words
- Updates multiple times daily during business hours
- No paywall - content freely accessible
- Uses WordPress CMS

## Data Collection Criteria

### URL Configuration

**Base URL**: `https://www.satellitetoday.com/government-military/`

**URL Patterns to Monitor:**
```
https://www.satellitetoday.com/government-military/
https://www.satellitetoday.com/government-military/page/[N]/
https://www.satellitetoday.com/government-military/[year]/[month]/[day]/[slug]/
```

**Crawl Settings:**
- **Crawl Depth**: 2 levels (category page → article pages)
- **Update Frequency**: Every 30 minutes
- **Timeout**: 30 seconds per page
- **User Agent**: `Mozilla/5.0 (compatible; OSINTBot/1.0)`
- **Respect robots.txt**: Yes
- **Follow redirects**: Yes (max 3)

### Include Patterns

URLs matching these patterns should be crawled:
```regex
^https://www\.satellitetoday\.com/government-military/$
^https://www\.satellitetoday\.com/government-military/page/\d+/$
^https://www\.satellitetoday\.com/government-military/\d{4}/\d{2}/\d{2}/[a-z0-9\-]+/$
^https://www\.satellitetoday\.com/\d{4}/\d{2}/\d{2}/[a-z0-9\-]+/$ (if categorized as gov-mil)
```

### Exclude Patterns

Skip URLs matching these patterns:
```regex
/category/(?!government-military)
/author/
/tag/
/feed/
/comment-page-
/wp-admin/
/wp-content/
/wp-json/
\?share=
\?replytocom=
\.(pdf|jpg|jpeg|png|gif|mp4|webp)$
```

### Extraction Rules

#### Article List Extraction (Category Page)

**Primary Selectors:**
```css
/* Article listing container */
main.site-main
div.content-area
section.posts-listing

/* Individual article cards */
article.post
article.type-post
div.post-item
div.article-card

/* Article links */
article h2 a[href]
article.post .entry-title a
```

**XPath for article links:**
```xpath
//article[contains(@class,'post')]//h2//a/@href
//div[contains(@class,'post-item')]//a[contains(@class,'permalink')]/@href
```

#### Article Detail Extraction

**Primary Selectors:**
```css
/* Article title */
h1.entry-title
article h1
h1.article-title
meta[property="og:title"]

/* Publication date */
time.entry-date[datetime]
meta[property="article:published_time"]
span.published
div.entry-meta time

/* Author */
span.author a
a[rel="author"]
span.by-author
meta[name="author"]

/* Article body */
div.entry-content
article .post-content
div.article-body
div.content-wrap p

/* Tags / categories */
div.entry-footer a[rel="tag"]
span.cat-links a
meta[property="article:tag"]

/* Featured image */
meta[property="og:image"]
div.post-thumbnail img
```

**Fallback Selectors:**
```css
/* Title fallback */
h1:first-of-type
meta[property="og:title"]

/* Date fallback */
meta[property="article:published_time"]
meta[name="date"]
time[datetime]

/* Body fallback */
article p
div.content p
main p
```

### Data Validation Rules

**Required Fields:**
- Title (non-empty, < 300 chars)
- Publication date (valid ISO date, not in future)
- Article body (> 200 characters of clean text)
- Canonical URL (matches domain and category pattern)

**Quality Checks:**
- Language detected as English
- Date within last 60 days for active collection
- Content-to-markup ratio > 30%
- Title does not contain "404" or "Page Not Found"
- Not a redirect to homepage or category page

### JavaScript Rendering

**Rendering Required**: No - Satellite Today uses server-side WordPress rendering

- Standard HTTP fetch should be sufficient
- Content is present in initial HTML payload
- No dynamic loading of article content
- May use headless browser if issues arise, but not expected

## Expected Data Format

### Category Page HTML Structure

```html
<main class="site-main">
  <article class="post type-post">
    <header class="entry-header">
      <h2 class="entry-title">
        <a href="/government-military/2026/04/30/military-satellite-launch/">
          Military Communications Satellite Launches Successfully
        </a>
      </h2>
      <div class="entry-meta">
        <time datetime="2026-04-30T10:00:00Z">April 30, 2026</time>
        <span class="author">By Jane Defense</span>
      </div>
    </header>
    <div class="entry-summary">
      <p>A brief excerpt of the article...</p>
    </div>
  </article>
  <!-- More articles... -->
</main>
```

### Article Detail HTML Structure

```html
<article class="post type-post">
  <header class="entry-header">
    <h1 class="entry-title">Military Communications Satellite Launches Successfully</h1>
    <div class="entry-meta">
      <time class="entry-date" datetime="2026-04-30T10:00:00Z">April 30, 2026</time>
      <span class="author">By <a rel="author" href="/author/jane-defense/">Jane Defense</a></span>
    </div>
  </header>
  
  <div class="entry-content">
    <p>First paragraph of article content...</p>
    <p>Second paragraph with details...</p>
    <p>More content...</p>
  </div>
  
  <footer class="entry-footer">
    <span class="cat-links">
      <a href="/government-military/">Government & Military</a>
    </span>
    <span class="tags-links">
      <a rel="tag" href="/tag/space-force/">Space Force</a>
      <a rel="tag" href="/tag/military-comms/">Military Comms</a>
    </span>
  </footer>
</article>
```

### Open Graph Metadata

```html
<meta property="og:title" content="Military Communications Satellite Launches Successfully" />
<meta property="og:url" content="https://www.satellitetoday.com/government-military/2026/04/30/military-satellite-launch/" />
<meta property="article:published_time" content="2026-04-30T10:00:00Z" />
<meta property="article:modified_time" content="2026-04-30T11:15:00Z" />
<meta property="article:section" content="Government & Military" />
<meta property="article:tag" content="Space Force" />
<meta name="author" content="Jane Defense" />
```

## Processing Instructions

### Data Extraction Pipeline

1. **Fetch Category Page**
   ```
   - Load https://www.satellitetoday.com/government-military/
   - Parse HTML with standard parser (BeautifulSoup, Cheerio, etc.)
   - Extract all article URLs from article cards
   - Filter for government-military category articles only
   - Deduplicate URLs
   ```

2. **Fetch Each Article Page**
   ```
   - For each discovered article URL not previously seen
   - Standard HTTP GET request
   - Parse HTML
   - Extract Open Graph meta tags first (fastest, most reliable)
   - Fall back to DOM selectors if meta tags missing
   - Extract: title, date, author, body, tags, canonical URL
   ```

3. **Clean Content**
   ```
   - Strip navigation, sidebars, ads, related posts
   - Remove social share buttons and comment sections
   - Remove "Subscribe" or "Newsletter" CTAs
   - Normalize whitespace
   - Convert relative URLs to absolute
   - Remove tracking parameters from links
   ```

4. **Validate Extracted Data**
   ```
   - Assert title non-empty and reasonable length
   - Assert date valid, parseable, and not in future
   - Assert body > 200 chars
   - Assert URL matches expected pattern
   - Assert content is English language
   ```

### Transformation to World Event Entity

**Title:**
- Use article headline directly from h1 or og:title
- Remove site suffix if appended (e.g., " - Satellite Today")
- Limit to 250 characters

**Date:**
- Prefer `article:published_time` meta tag (ISO 8601 format)
- Fall back to `<time datetime>` attribute
- Parse visible date string as last resort

**Event Type Mapping:**

| Article Keywords | Event Type |
|---|---|
| launch, liftoff, rocket | `space-launch` |
| contract, award, procurement | `defense-contract` |
| satellite, spacecraft, system | `space-systems` |
| policy, doctrine, strategy | `space-policy` |
| reconnaissance, intelligence, spy | `space-intelligence` |
| test, exercise, demonstration | `military-exercise` |

**Location:**
- Extract from article body (launch site, program location)
- Common locations: Cape Canaveral, Vandenberg SFB, Pentagon
- May be generic (e.g., "United States") or specific facility

**Content (Markdown):**
```markdown
# [Article Title]

**Source**: Satellite Today - Government & Military  
**Published**: [ISO timestamp]  
**Author**: [Author name]  
**URL**: [Canonical article URL]

[Article summary / first paragraph]

---

[Article body converted to Markdown]

---

**Tags**: [comma-separated tags]
```

**Tags:**
- Extract from article tag links
- Add source tag: `satellite-today`
- Add category tag: `government-military`
- Add inferred tags from content (satellite names, programs, agencies)

### Deduplication Strategy

1. **URL exact match** - Skip if canonical URL seen before
2. **Title similarity** - Fuzzy match > 90% similarity = skip
3. **Published date** - Store indexed by date for range queries

## Quality Indicators

### High Quality Signals
- Named author with defense/space journalism background
- Specific satellite names, program names, or contract numbers cited
- Direct quotes from military officials, contractors, or industry sources
- Specific dates, locations, or technical specifications
- References to official announcements or press releases
- Includes context about program history or strategic significance
- Long-form article (> 600 words)
- Recently published (< 7 days old)

### Low Quality Signals
- No author byline (generic "Staff" or "Editor")
- Very short article (< 300 words)
- Vague or generic language without specifics
- Mostly promotional content for industry events
- Duplicate/syndicated content from other sources
- No publication date visible

### Red Flags (Skip / Low Priority)
- "Page not found" or "404" in title
- Redirect to homepage or category page
- Event announcement without news content
- Pure advertisement or sponsored content
- Duplicate content from previous crawl

## Known Issues

### Issue 1: WordPress Pagination
**Problem**: Category page may have multiple pages of articles (page/2/, page/3/, etc.)  
**Workaround**: Crawl pagination links to discover older articles, but prioritize page 1 for freshest content  
**Status**: Configure crawler to handle /page/N/ URLs

### Issue 2: Mixed Categories
**Problem**: Some articles may appear in multiple categories  
**Workaround**: Use canonical URL for deduplication, verify government-military category in metadata  
**Status**: Check article:section meta tag or category links

### Issue 3: Date Format Variations
**Problem**: Visible date may be formatted differently than ISO timestamp  
**Workaround**: Always prefer meta tag datetime over parsed visible text  
**Status**: Use meta tags as primary source

### Issue 4: Embedded Media
**Problem**: Articles may contain embedded videos or images that complicate extraction  
**Workaround**: Strip embedded content, focus on text extraction  
**Status**: Remove iframe, video, and complex media elements during cleaning

### Issue 5: Rate Limiting
**Problem**: Aggressive crawling may trigger rate limiting  
**Workaround**: Respect 30-minute update frequency, add 3-second delay between requests  
**Status**: Configure polite crawling with delays

## Examples

### Example 1: Contract Award Article

**URL**: `https://www.satellitetoday.com/government-military/2026/04/30/space-force-awards-satellite-contract/`

**Extracted World Event:**
```yaml
title: "Space Force Awards $500M Contract for Next-Gen Military Satellite"
date: 2026-04-30T10:00:00Z
type: defense-contract
location:
  city: "Los Angeles"
  state: "California"
  country: "United States"
priority: high
confidence: high
tags:
  - space-force
  - defense-contract
  - military-satellite
  - procurement
  - satellite-today
  - government-military
source:
  type: webpage
  url: "https://www.satellitetoday.com/government-military/2026/04/30/space-force-awards-satellite-contract/"
  organization: "Satellite Today"
  author: "Jane Defense"
```

**Markdown Content:**
```markdown
# Space Force Awards $500M Contract for Next-Gen Military Satellite

**Source**: Satellite Today - Government & Military  
**Published**: 2026-04-30T10:00:00Z  
**Author**: Jane Defense  
**URL**: https://www.satellitetoday.com/government-military/2026/04/30/space-force-awards-satellite-contract/

The U.S. Space Force has awarded a $500 million contract to develop and launch a next-generation military communications satellite system.

---

LOS ANGELES — The U.S. Space Force Space Systems Command announced today it has awarded a competitive contract to build a protected military communications satellite constellation. The award, valued at up to $500 million over five years, will provide resilient communications capabilities for military operations.

The contract includes design, development, launch, and on-orbit testing of the satellite system. According to Space Force officials, the new satellites will provide anti-jam, low-probability-of-intercept communications for strategic and tactical users.

"This system represents a significant leap forward in our protected communications architecture," said Col. John Smith, program executive officer. "The new satellites will be more resilient against emerging threats and provide global coverage for joint warfighters."

The first satellite is scheduled to launch in 2028, with the full constellation operational by 2030.

---

**Tags**: space-force, defense-contract, military-satellite, procurement, satellite-today, government-military

**Original URL**: https://www.satellitetoday.com/government-military/2026/04/30/space-force-awards-satellite-contract/
```

### Example 2: Launch News Article

**URL**: `https://www.satellitetoday.com/government-military/2026/04/29/reconnaissance-satellite-launch/`

**Extracted World Event:**
```yaml
title: "Classified Reconnaissance Satellite Successfully Reaches Orbit"
date: 2026-04-29T08:30:00Z
type: space-launch
location:
  city: "Vandenberg Space Force Base"
  state: "California"
  country: "United States"
priority: high
confidence: high
tags:
  - space-launch
  - reconnaissance
  - national-security
  - classified
  - satellite-today
source:
  type: webpage
  url: "https://www.satellitetoday.com/government-military/2026/04/29/reconnaissance-satellite-launch/"
  organization: "Satellite Today"
```

### Example 3: Skipped Content

**URL**: `https://www.satellitetoday.com/author/jane-defense/`

**Reason for Skip**: URL matches exclusion pattern `/author/`  
**Action**: Do not crawl author archive pages

## Monitoring & Maintenance

### Health Checks (Every 30 minutes)
- Category page returns HTTP 200
- At least 1 article link extracted from category page
- Most recent article date within 7 days (flag if stale)
- Article extraction produces valid title + body

### Weekly Tasks
- Spot-check 3-5 extracted articles for content accuracy
- Verify selectors still target correct elements
- Check for site redesigns or template changes
- Review tag extraction quality

### Monthly Tasks
- Audit article relevance to world events coverage
- Review reliability rating based on collection success
- Assess update frequency - adjust if publishing cadence changes
- Check for new subcategories or content types to include/exclude

## Validation Checklist

Before going live:

- [x] Base URL accessible and returns article listings
- [x] Article links match expected URL patterns
- [x] Article detail pages contain extractable content
- [x] Title, date, and body extraction configured
- [x] Author extraction configured with fallback
- [x] Tags/categories extraction configured
- [x] Exclusion patterns prevent non-article URLs
- [x] Deduplication by URL configured
- [x] Markdown transformation defined
- [x] robots.txt compliance documented
- [x] Rate limiting configured (30min frequency + 3sec delays)
- [x] Quality indicators defined
- [x] Examples provided
