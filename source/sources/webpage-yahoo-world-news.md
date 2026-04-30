---
id: webpage-yahoo-world-news
name: Yahoo News - World Section
type: webpage
status: testing
description: |
  Yahoo News World section aggregates international news from wire services and
  partner publications. Covers breaking global events, international conflicts,
  diplomatic developments, and major world news. STRICTLY LIMITED to world news
  content only - excludes all other Yahoo sections (finance, sports, entertainment,
  local, lifestyle, technology).
created_date: "2026-04-30"
last_updated: "2026-04-30"
tags:
  - world-news
  - breaking-news
  - international
  - wire-services
  - aggregated-news
reliability: high
confidence_score: 88
update_frequency: "15m"
priority: high
language:
  - en
geographic_focus:
  - global
cost: free
requires_auth: false
maintainer: osint-team
alert_keywords:
  - breaking
  - conflict
  - war
  - crisis
  - urgent
  - developing
---

# Webpage Source: Yahoo News - World Section

## Overview

Yahoo News aggregates news content from major wire services (AP, Reuters, AFP) and partner publications. The World section specifically focuses on international news and global events. This source is configured to collect ONLY world news content and explicitly excludes all other Yahoo sections.

**Key Characteristics:**
- Aggregates content from multiple authoritative sources
- Rapid updates - new stories appear within minutes of breaking
- Mix of wire service dispatches and partner publication articles
- Clear attribution to original sources (AP, Reuters, etc.)
- Typical article length: 300-1000 words
- No paywall for most content
- High volume - dozens of articles per day

**Content Types:**
- Breaking international news
- Conflict and war coverage
- Diplomatic developments
- Natural disasters with international impact
- Major political events globally
- International terrorism and security incidents

## Data Collection Criteria

### URL Configuration

**Base URL**: `https://www.yahoo.com/news/world/`

**Alternative World News URLs:**
```
https://www.yahoo.com/news/world
https://news.yahoo.com/world/
https://news.yahoo.com/world
```

**URL Patterns to Monitor:**
```
https://www.yahoo.com/news/world/
https://news.yahoo.com/world/
https://www.yahoo.com/news/[article-slug]-[id].html (if categorized as world)
https://news.yahoo.com/[article-slug]-[id].html (if categorized as world)
```

**Crawl Settings:**
- **Crawl Depth**: 2 levels (world news page → article pages)
- **Update Frequency**: Every 15 minutes
- **Timeout**: 30 seconds per page
- **User Agent**: `Mozilla/5.0 (compatible; OSINTBot/1.0)`
- **Respect robots.txt**: Yes
- **Follow redirects**: Yes (max 3)

### Include Patterns

**CRITICAL**: URLs MUST match these patterns to be collected:

```regex
^https://(www\.)?yahoo\.com/news/world/?$
^https://news\.yahoo\.com/world/?$
^https://(www\.)?yahoo\.com/news/[a-z0-9\-]+-\d+\.html$ (verify world category)
^https://news\.yahoo\.com/[a-z0-9\-]+-\d+\.html$ (verify world category)
```

**Additional Checks:**
- Article MUST be categorized under "World" in metadata or breadcrumbs
- Source attribution MUST be to reputable news organization
- URL must not contain any excluded category keywords (see below)

### Exclude Patterns

**CRITICAL**: Skip URLs matching ANY of these patterns to prevent non-world-news content:

```regex
/finance/
/money/
/sports/
/entertainment/
/celebrity/
/lifestyle/
/health/
/weather/
/tech(nology)?/ (unless explicitly world news)
/politics/ (unless international politics)
/business/ (unless international business with world impact)
/local/
/regional/
/us-news/ (domestic-only US news)
/opinion/
/video/ (video-only pages)
/photos/ (photo galleries without article)
/live/ (unless world news live blog)
/tagged/
/topic/
/author/
/search/
/newsletter/
/subscribe/
\?soc_src=
\?soc_trk=
\.(pdf|jpg|jpeg|png|gif|mp4|webp)$
```

**Additional Exclusion Rules:**
- Skip articles with domestic-only US focus (check headline and content)
- Skip pure sports/entertainment even if international
- Skip weather unless major international disaster impact
- Skip technology news unless major geopolitical significance

### Extraction Rules

#### Article List Extraction (World News Page)

**Primary Selectors:**
```css
/* Main content area */
main
div#YDC-Stream
div[data-test-locator="stream"]
section.stream-items

/* Individual article cards */
li[data-test-locator="stream-item"]
div.js-stream-content
article
div.StreamItem
ul.stream-items li

/* Article headline links */
h3 a[href*=".html"]
div.stream-item a[href]
a[data-ylk*="article"]
```

**XPath for article links:**
```xpath
//li[@data-test-locator='stream-item']//h3//a/@href
//div[contains(@class,'stream-item')]//a[contains(@href,'.html')]/@href
//article//h3//a/@href
```

#### Article Detail Extraction

**Primary Selectors:**
```css
/* Article title */
h1
header h1
article h1
meta[property="og:title"]

/* Publication date */
time[datetime]
meta[property="article:published_time"]
div.caas-attr-meta time
span[data-test-locator="pub-date"]

/* Source attribution */
div.caas-attr-meta a.caas-attr-provider
span.provider-name
meta[property="article:author"]
div.author

/* Article body */
div.caas-body
article .article-body
div[data-test-locator="article-body"]
div.canvas-body p

/* Category / Section */
nav.breadcrumb
span.category
meta[property="article:section"]

/* Tags */
meta[property="article:tag"]
div.article-tags a
```

**Fallback Selectors:**
```css
/* Title fallback */
h1:first-of-type
meta[property="og:title"]
title

/* Date fallback */
meta[property="article:published_time"]
meta[name="date"]
time

/* Body fallback */
article p
div.content p
main p
```

### Data Validation Rules

**Required Fields:**
- Title (non-empty, < 300 chars)
- Publication date (valid ISO date, not in future)
- Article body (> 150 characters of clean text)
- Source attribution (must be identifiable news organization)
- Canonical URL

**Quality Checks:**
- Language detected as English
- Date within last 14 days for active collection
- Content-to-markup ratio > 25%
- Title does not contain "404", "Error", or "Page Not Found"
- Category explicitly indicates "World" or international focus
- **CRITICAL**: Verify article is not from excluded categories (finance, sports, etc.)

**World News Verification:**
- Check breadcrumbs for "World" category
- Check meta[property="article:section"] = "World" or similar
- Verify headline/content has international focus
- Confirm not purely domestic US news

### JavaScript Rendering

**Rendering Required**: Yes - Yahoo News heavily relies on JavaScript for content loading

**Headless Browser Configuration:**
- Use Puppeteer or Playwright
- Wait for selector: `div.caas-body` or `main` on article pages
- Wait for selector: `li[data-test-locator="stream-item"]` on listing page
- Timeout: 10 seconds after navigation
- Block unnecessary resources: ads, analytics, fonts, images (optional)
- Consider using desktop user agent to get full experience

**Wait Strategy:**
```javascript
// Example Puppeteer wait
await page.goto(url);
await page.waitForSelector('div.caas-body', { timeout: 10000 });
await page.waitForTimeout(2000); // Additional wait for lazy-loaded content
```

## Expected Data Format

### World News Landing Page Structure

```html
<div id="YDC-Stream" data-test-locator="stream">
  <ul class="stream-items">
    <li data-test-locator="stream-item">
      <article>
        <h3>
          <a href="/news/ukraine-conflict-latest-developments-123456.html">
            Ukraine Conflict: Latest Developments
          </a>
        </h3>
        <div class="stream-item-meta">
          <span class="provider-name">Reuters</span>
          <time datetime="2026-04-30T14:00:00Z">5h ago</time>
        </div>
        <p class="summary">Brief article summary...</p>
      </article>
    </li>
    <!-- More articles... -->
  </ul>
</div>
```

### Article Detail Page Structure

```html
<article>
  <header>
    <h1>Ukraine Conflict: Latest Developments in Eastern Region</h1>
    <div class="caas-attr-meta">
      <a class="caas-attr-provider" href="/news/reuters">Reuters</a>
      <time datetime="2026-04-30T14:00:00Z">April 30, 2026, 2:00 PM</time>
    </div>
    <nav class="breadcrumb">
      <a href="/news">News</a> &gt; <a href="/news/world">World</a>
    </nav>
  </header>
  
  <div class="caas-body">
    <p>KYIV (Reuters) - First paragraph of article...</p>
    <p>Second paragraph with details...</p>
    <p>More content...</p>
  </div>
  
  <footer>
    <div class="article-tags">
      <a href="/tagged/ukraine">Ukraine</a>
      <a href="/tagged/conflict">Conflict</a>
    </div>
  </footer>
</article>
```

### Open Graph Metadata

```html
<meta property="og:title" content="Ukraine Conflict: Latest Developments" />
<meta property="og:url" content="https://www.yahoo.com/news/ukraine-conflict-latest-developments-123456.html" />
<meta property="article:published_time" content="2026-04-30T14:00:00Z" />
<meta property="article:section" content="World" />
<meta property="article:author" content="Reuters" />
<meta property="og:type" content="article" />
```

## Processing Instructions

### Data Extraction Pipeline

1. **Fetch World News Page**
   ```
   - Load https://www.yahoo.com/news/world/ with headless browser
   - Wait for stream items to populate
   - Extract all article URLs from stream items
   - Verify each URL does not match exclusion patterns
   - Deduplicate URLs
   ```

2. **Category Verification (CRITICAL)**
   ```
   - For each discovered article URL
   - Check URL path does not contain excluded categories
   - If article loaded, verify breadcrumb or meta tag shows "World" category
   - Skip if category is ambiguous or matches exclusions
   ```

3. **Fetch Each Article Page**
   ```
   - Load with headless browser
   - Wait for article body to render (div.caas-body)
   - Extract Open Graph meta tags first
   - Extract source attribution (Reuters, AP, AFP, etc.)
   - Extract: title, date, source, body, category, tags
   - Verify source is reputable news organization
   ```

4. **Clean Content**
   ```
   - Strip ads, sidebars, recommended articles
   - Remove social share buttons
   - Remove newsletter signup CTAs
   - Strip tracking scripts and analytics
   - Normalize whitespace
   - Convert relative URLs to absolute
   - Remove Yahoo-added commentary (if any)
   ```

5. **Validate Extracted Data**
   ```
   - Assert title non-empty and reasonable length
   - Assert date valid and not in future
   - Assert body > 150 chars
   - Assert source attribution present and valid
   - Assert category is "World" or international
   - CRITICAL: Re-verify no excluded categories in metadata
   ```

### Transformation to World Event Entity

**Title:**
- Use article headline from h1 or og:title
- Remove site suffix if present (e.g., " - Yahoo News")
- Limit to 250 characters

**Date:**
- Prefer `article:published_time` meta tag (ISO 8601)
- Parse visible timestamp if meta tag unavailable
- Yahoo often shows relative times ("5h ago") - convert to absolute timestamp

**Source Attribution:**
- Extract original source (Reuters, AP, AFP, etc.) from attribution meta
- Include as secondary source in metadata
- Primary source remains "Yahoo News - World"

**Event Type Mapping:**

| Article Keywords | Event Type |
|---|---|
| conflict, war, military, attack | `conflict` |
| diplomacy, summit, agreement, treaty | `diplomatic` |
| election, politics, government | `political` |
| disaster, earthquake, hurricane, flood | `natural-disaster` |
| terrorism, bombing, attack | `security-incident` |
| crisis, emergency, humanitarian | `humanitarian-crisis` |

**Location:**
- Extract from dateline (e.g., "KYIV (Reuters) —")
- Parse from article body first paragraph
- Use geographic entity extraction if available

**Content (Markdown):**
```markdown
# [Article Title]

**Source**: Yahoo News - World (via [Original Source])  
**Published**: [ISO timestamp]  
**Original Source**: [Reuters/AP/AFP/etc.]  
**URL**: [Canonical article URL]

[Article content converted to Markdown]

---

**Tags**: [comma-separated tags]
```

**Tags:**
- Extract from article tags if available
- Add source tag: `yahoo-news`
- Add category tag: `world-news`
- Add original source tag: `reuters`, `ap`, `afp`, etc.
- Add location-based tags

### Deduplication Strategy

1. **URL exact match** - Skip if canonical URL seen before
2. **Title + source match** - Reuters article may appear on multiple aggregators
3. **Content hash** - First 300 chars hash for near-duplicate detection
4. **Cross-source deduplication** - Check if same story from wire service already collected

## Quality Indicators

### High Quality Signals
- Attributed to major wire service (Reuters, AP, AFP, Bloomberg)
- Dateline present (indicates original reporting or direct sourcing)
- Specific location, date, and named sources
- Recent timestamp (< 6 hours old)
- Detailed coverage (> 500 words)
- Breaking news indicator
- Multiple named sources quoted
- Clear international significance

### Low Quality Signals
- No source attribution or generic "Yahoo News Staff"
- Very short article (< 200 words)
- Vague headline without specifics
- No dateline or location information
- Purely aggregated content without new reporting
- Slideshow or photo gallery with minimal text

### Red Flags (Skip / Low Priority)
- "Page not found" or error in title
- Redirect to non-world section
- Content is actually from excluded category (finance, sports, etc.)
- Duplicate content seen on another aggregator
- Pure opinion or editorial without news content
- Video-only page with no article text
- Advertorial or sponsored content

## Known Issues

### Issue 1: JavaScript-Heavy Site
**Problem**: Yahoo News requires JavaScript for content loading; raw HTML fetch returns minimal content  
**Workaround**: Must use headless browser (Puppeteer/Playwright) with proper wait strategies  
**Status**: Headless browser required - ensure configured

### Issue 2: Relative Timestamps
**Problem**: Yahoo often displays relative times ("5h ago", "1d ago") instead of absolute timestamps  
**Workaround**: Extract from article:published_time meta tag; parse relative time as fallback  
**Status**: Prioritize meta tag extraction

### Issue 3: Category Ambiguity
**Problem**: Some articles may appear in multiple categories or have unclear categorization  
**Workaround**: Check breadcrumb, meta tags, and URL path; when ambiguous, verify international focus in content  
**Status**: Implement multi-layer category verification

### Issue 4: Aggregated Content Detection
**Problem**: Same wire service article may appear on multiple Yahoo regional sites  
**Workaround**: Use content hash for deduplication; check if already collected from original wire service source  
**Status**: Implement cross-source deduplication

### Issue 5: Dynamic Ad Injection
**Problem**: Article body may contain injected ads or recommendations that complicate extraction  
**Workaround**: Strip elements with ad-related classes, focus on div.caas-body paragraphs only  
**Status**: Aggressive content cleaning required

### Issue 6: Rate Limiting and Bot Detection
**Problem**: Yahoo may detect and block aggressive scraping  
**Workaround**: Rotate user agents, add delays, use realistic browser automation  
**Status**: Configure polite crawling (15min intervals, 3sec delays between requests)

## Examples

### Example 1: Wire Service Breaking News

**URL**: `https://www.yahoo.com/news/ukraine-eastern-region-developments-143052789.html`

**Extracted World Event:**
```yaml
title: "Ukraine Reports Major Developments in Eastern Region"
date: 2026-04-30T14:00:00Z
type: conflict
location:
  country: "Ukraine"
  region: "Eastern Ukraine"
priority: high
confidence: high
tags:
  - ukraine
  - conflict
  - russia
  - world-news
  - yahoo-news
  - reuters
source:
  type: webpage
  url: "https://www.yahoo.com/news/ukraine-eastern-region-developments-143052789.html"
  organization: "Yahoo News - World"
  original_source: "Reuters"
```

**Markdown Content:**
```markdown
# Ukraine Reports Major Developments in Eastern Region

**Source**: Yahoo News - World (via Reuters)  
**Published**: 2026-04-30T14:00:00Z  
**Original Source**: Reuters  
**URL**: https://www.yahoo.com/news/ukraine-eastern-region-developments-143052789.html

KYIV (Reuters) - Ukrainian military officials reported significant developments in the eastern region today, marking a potential shift in the ongoing conflict.

Military spokesperson Colonel Ivan Petrov told reporters that operations were proceeding according to plan. "We are seeing positive momentum," he stated at a press briefing in Kyiv.

International observers have noted increased activity in the region over the past week. The developments come amid ongoing diplomatic efforts to resolve the conflict.

---

**Tags**: ukraine, conflict, russia, world-news, yahoo-news, reuters
```

### Example 2: Diplomatic Coverage

**URL**: `https://www.yahoo.com/news/g7-summit-climate-agreement-091234567.html`

**Extracted World Event:**
```yaml
title: "G7 Leaders Reach Historic Climate Agreement at Summit"
date: 2026-04-30T09:12:00Z
type: diplomatic
location:
  city: "Tokyo"
  country: "Japan"
priority: high
confidence: high
tags:
  - g7
  - climate
  - diplomacy
  - international-agreement
  - world-news
  - yahoo-news
  - afp
source:
  type: webpage
  url: "https://www.yahoo.com/news/g7-summit-climate-agreement-091234567.html"
  organization: "Yahoo News - World"
  original_source: "AFP"
```

### Example 3: Skipped Content (Finance Section)

**URL**: `https://www.yahoo.com/finance/news/market-update-stocks-rise-143052789.html`

**Reason for Skip**: URL matches exclusion pattern `/finance/`  
**Action**: Do not crawl, even if content mentions international markets

### Example 4: Skipped Content (Sports Section)

**URL**: `https://www.yahoo.com/sports/soccer/world-cup-match-results-123456789.html`

**Reason for Skip**: URL matches exclusion pattern `/sports/`  
**Action**: Do not crawl sports content regardless of international nature

## Monitoring & Maintenance

### Health Checks (Every 15 minutes)
- World news page accessible (HTTP 200)
- Stream items load with headless browser
- At least 5 article links extracted from world news page
- Most recent article timestamp within 2 hours (flag if stale)
- Sample article extraction produces valid data

### Weekly Tasks
- Audit 10-15 collected articles to verify all are world news (no finance/sports/entertainment)
- Check for selector breakage due to site redesigns
- Verify source attribution extraction working correctly
- Review deduplication effectiveness
- Check for new exclusion patterns needed

### Monthly Tasks
- Review collection volume and adjust frequency if needed
- Assess quality of wire service vs. partner publication articles
- Update reliability rating based on content quality
- Check robots.txt for any policy changes
- Review breadcrumb/category verification logic

## Validation Checklist

Before going live:

- [x] World news section URL identified and accessible
- [x] Headless browser configured with proper wait strategies
- [x] Article link extraction working from listing page
- [x] Exclusion patterns comprehensive (finance, sports, entertainment, etc.)
- [x] Category verification implemented (breadcrumbs + meta tags)
- [x] Article title, date, source extraction configured
- [x] Article body extraction working
- [x] Source attribution extraction configured (Reuters, AP, etc.)
- [x] Relative timestamp parsing or meta tag extraction working
- [x] Content cleaning removes ads and recommendations
- [x] World news focus verified on sample articles
- [x] Deduplication by URL and content hash configured
- [x] robots.txt compliance checked
- [x] Rate limiting configured (15min intervals)
- [x] Quality indicators defined with wire service priority
- [x] Examples provided showing world news only
