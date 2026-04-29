---
id: webpage-news-site-world
name: Example News Site - World Section
type: webpage
status: testing
description: |
  Major international news website's world news section. Provides comprehensive
  coverage of global events, conflicts, political developments, and breaking news
  with professional journalism standards.
created_date: 2026-04-29
last_updated: 2026-04-29
tags:
  - world-news
  - journalism
  - breaking-news
  - verified-sources
reliability: high
confidence_score: 90
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
  - live
  - urgent
  - developing
---

# Webpage Source: Example News Site World Section

## Overview

This source targets a major news organization's world news section. The site provides professional journalism with fact-checking, multiple sources, and editorial standards. Articles are well-structured with clear headlines, dates, locations, and detailed reporting.

**Website Characteristics:**
- Established news organization (50+ years)
- Professional editorial team
- Fact-checking process
- Update frequency: Multiple times per hour
- Mobile-responsive design
- Structured data markup (Schema.org)

## Data Collection Criteria

### URL Configuration

**Base URL**: `https://example-news.com/world`

**URL Patterns to Monitor:**
```
https://example-news.com/world
https://example-news.com/world/[region]
https://example-news.com/world/[region]/[country]
https://example-news.com/world/breaking
https://example-news.com/world/live/*
```

**Crawl Settings:**
- **Crawl Depth**: 2 levels from base URL
- **Update Frequency**: Every 15 minutes
- **Timeout**: 30 seconds per page
- **User Agent**: `Mozilla/5.0 (compatible; OSINTBot/1.0)`
- **Respect robots.txt**: Yes
- **Follow redirects**: Yes (max 3)

### Include Patterns

URLs matching these patterns should be crawled:
```regex
^https://example-news\.com/world(/.*)?$
^https://example-news\.com/world/breaking/.*
^https://example-news\.com/world/live/.*
^https://example-news\.com/world/(africa|asia|europe|americas|middle-east)/.*
^https://example-news\.com/\d{4}/\d{2}/\d{2}/world/.*
```

### Exclude Patterns

Skip URLs matching these patterns:
```regex
/opinion/
/analysis/
/commentary/
/sports/
/entertainment/
/weather/
/lifestyle/
/video-only/
/gallery/
/subscribe
/newsletter
/login
/register
\.(pdf|jpg|png|gif|mp4)$
```

### Extraction Rules

#### Article Detection
Identify article pages by presence of:
- `<article>` tag OR `div.article-container`
- Headline in `<h1>` tag
- Publication date in `<time>` tag or meta tag
- Article body with minimum 200 words

#### CSS Selectors

**Primary Selectors:**
```css
/* Article container */
article.main-article
div[data-component="article"]

/* Headline */
article h1.headline
h1[data-test="article-headline"]

/* Subheadline / Summary */
article p.summary
div.article-summary

/* Publication date */
article time[datetime]
meta[property="article:published_time"]

/* Modified date */
article time[datetime][itemprop="dateModified"]
meta[property="article:modified_time"]

/* Author */
article span.author-name
a[rel="author"]
meta[name="author"]

/* Article body */
article div.article-body
div[data-component="text-block"]

/* Location/Dateline */
article span.dateline
div.article-location

/* Tags/Categories */
article div.tags a
meta[property="article:tag"]

/* Related articles (for context) */
aside.related-articles a
div[data-component="related-content"] a
```

**Fallback Selectors (if primary fails):**
```css
/* Headline */
h1:first-of-type
meta[property="og:title"]

/* Date */
meta[property="article:published_time"]
meta[name="date"]

/* Body */
div.content p
article p
```

#### XPath Alternatives

For sites with inconsistent CSS:
```xpath
// Headline
//article//h1[1]
//h1[@class='headline' or @class='article-title']

// Publication date
//article//time[@datetime]
//meta[@property='article:published_time']/@content

// Article body
//article//div[contains(@class, 'body')]//p
//div[@class='article-content']//p
```

### Data Validation Rules

**Required Fields:**
- Headline (not empty, < 500 chars)
- Publication date (valid date, not future)
- Article body (> 200 characters)
- URL (valid, not duplicate)

**Quality Checks:**
- Language is English (check with lang detection)
- Date is within last 30 days (for active collection)
- Content-to-markup ratio > 30%
- No "404" or "Page not found" in title
- Not a redirect to homepage

### JavaScript Rendering

**Rendering Required**: No (mostly server-side rendered)  
**Exception**: Live blog updates may require JavaScript

If JavaScript needed:
- Use headless browser (Puppeteer/Playwright)
- Wait for selector: `article.main-article`
- Timeout: 10 seconds
- Block unnecessary resources (ads, analytics)

## Expected Data Format

### HTML Structure
```html
<article class="main-article" data-id="article-12345">
  <header>
    <h1 class="headline">Major Event Occurs in Example Region</h1>
    <p class="summary">Brief summary of the event...</p>
    <div class="article-meta">
      <time datetime="2026-04-29T14:32:00Z">April 29, 2026</time>
      <span class="author-name">Jane Reporter</span>
      <span class="dateline">EXAMPLE CITY</span>
    </div>
  </header>
  
  <div class="article-body">
    <p>Article content paragraph 1...</p>
    <p>Article content paragraph 2...</p>
    <p>Article content paragraph 3...</p>
  </div>
  
  <footer>
    <div class="tags">
      <a href="/tags/world-news">World News</a>
      <a href="/tags/politics">Politics</a>
    </div>
  </footer>
</article>
```

### Structured Data (JSON-LD)
```json
{
  "@context": "https://schema.org",
  "@type": "NewsArticle",
  "headline": "Major Event Occurs in Example Region",
  "datePublished": "2026-04-29T14:32:00Z",
  "dateModified": "2026-04-29T15:45:00Z",
  "author": {
    "@type": "Person",
    "name": "Jane Reporter"
  },
  "publisher": {
    "@type": "Organization",
    "name": "Example News"
  },
  "articleBody": "Full article text...",
  "keywords": ["world news", "politics", "international"]
}
```

## Processing Instructions

### Data Extraction Pipeline

1. **Fetch Page**
   ```
   - Send HTTP GET request with appropriate headers
   - Follow redirects if necessary
   - Verify 200 status code
   - Check Content-Type is text/html
   ```

2. **Parse HTML**
   ```
   - Load HTML into parser (BeautifulSoup, Cheerio, etc.)
   - Validate HTML structure
   - Check for structured data (JSON-LD, microdata)
   ```

3. **Extract Metadata**
   ```
   - Title from <title> or og:title
   - Canonical URL from <link rel="canonical">
   - Language from <html lang="">
   - Published date from <time> or meta tags
   ```

4. **Extract Article Content**
   ```
   - Use primary CSS selectors
   - Fall back to XPath if needed
   - Extract headline, summary, body
   - Extract dateline/location if present
   - Extract author information
   - Extract tags/categories
   ```

5. **Clean Content**
   ```
   - Remove ads, scripts, styles
   - Strip HTML comments
   - Normalize whitespace
   - Remove tracking parameters from URLs
   - Convert relative URLs to absolute
   ```

6. **Validate Extracted Data**
   ```
   - Check required fields present
   - Validate date format
   - Check content length thresholds
   - Verify language if required
   ```

### Transformation to World Event Entity

**Title:**
- Use article headline
- Clean up HTML entities
- Remove trailing " - Example News" or similar
- Limit to 200 characters

**Date:**
- Extract from `<time datetime>` attribute
- Fall back to meta tags
- Parse to ISO 8601 format
- Use published date, not modified date (unless specified)

**Location:**
- Extract from dateline (e.g., "LONDON —")
- Parse from article body first paragraph
- Extract from breadcrumbs or category
- Geocode location names to coordinates

**Content (Markdown):**
```markdown
# [Article Headline]

**Source**: [News Organization Name]  
**Published**: [ISO timestamp]  
**Author**: [Author name]  
**Location**: [Dateline location]

[Article summary/subheadline]

---

[Article body converted to Markdown]
- Convert <p> tags to paragraphs
- Convert <ul>/<ol> to Markdown lists
- Convert <a> to Markdown links
- Convert <blockquote> to > quotes
- Convert <strong>/<em> to **bold**/*italic*

---

**Tags**: tag1, tag2, tag3

**Original URL**: [Article URL]
```

**Tags:**
- Extract from article tags/categories
- Infer from content (NLP entity extraction)
- Add source type: "news-article"
- Add organization tag: "example-news"

### Deduplication Strategy

Check for duplicates by:
1. **URL matching** - Exact URL seen before?
2. **Title similarity** - Fuzzy match > 85% similar?
3. **Published date + location** - Same day + same place?
4. **Content hash** - First 500 chars hashed, match found?

If duplicate found:
- Skip if content identical
- Update if content significantly changed
- Keep both if different perspectives on same event

## Quality Indicators

### High Quality Signals
- Professional news organization
- Byline from known journalist
- Multiple sources cited in article
- Specific dates, times, locations
- Quotes from officials/witnesses
- Update timestamps showing fact-checking
- Related articles providing context
- High word count (> 800 words)

### Low Quality Signals
- No byline or generic author
- Vague language ("reports say")
- No specific location
- Very short article (< 300 words)
- Lots of ads/low content ratio
- Clickbait headline
- No update timestamp
- Broken links or images

### Red Flags (Skip/Low Priority)
- "Page not found"
- "Content removed"
- Paywall blocking content
- "Subscribe to read more"
- Duplicate/syndicated content
- Pure opinion/editorial without facts

## Known Issues

### Issue 1: Paywall Content
**Problem**: Some articles behind paywall after free limit  
**Workaround**: Extract from RSS feed if available, or skip  
**Status**: Monitoring free article allocation

### Issue 2: Dynamic Content Loading
**Problem**: "Load more" buttons for full article  
**Workaround**: Look for full content in JSON-LD or use headless browser  
**Status**: Handled in extraction logic

### Issue 3: Breaking News Updates
**Problem**: Live blogs update continuously  
**Workaround**: Track last-modified time, re-scrape if changed  
**Status**: Implemented version tracking

### Issue 4: Regional Variations
**Problem**: Site serves different content by geo-location  
**Workaround**: Use VPN or proxy to access international version  
**Status**: Using US-based server

### Issue 5: Rate Limiting
**Problem**: Too many requests can trigger blocking  
**Workaround**: Respect crawl delay, use polite scraping (1 req/3 sec)  
**Status**: Implemented rate limiting

## Examples

### Example 1: Standard News Article

**URL**: `https://example-news.com/world/2026/04/29/major-development`

**HTML Extract:**
```html
<article>
  <h1>Major Political Development in Example Country</h1>
  <p class="summary">Government announces significant policy changes affecting international relations.</p>
  <time datetime="2026-04-29T14:32:00Z">April 29, 2026</time>
  <span class="author">John Journalist</span>
  <span class="dateline">EXAMPLE CITY</span>
  <div class="body">
    <p>EXAMPLE CITY — In a significant development, the government of Example Country announced sweeping policy changes today...</p>
    <p>The announcement, made by Prime Minister Jane Doe, includes...</p>
    <p>International observers have noted...</p>
  </div>
</article>
```

**Extracted World Event:**
```yaml
title: "Major Political Development in Example Country"
date: 2026-04-29T14:32:00Z
type: political
location:
  city: "Example City"
  country: "Example Country"
priority: high
confidence: high
tags:
  - politics
  - policy-change
  - international-relations
  - government
source:
  type: webpage
  url: "https://example-news.com/world/2026/04/29/major-development"
  organization: "Example News"
  author: "John Journalist"
```

**Markdown Content:**
```markdown
# Major Political Development in Example Country

**Source**: Example News  
**Published**: 2026-04-29T14:32:00Z  
**Author**: John Journalist  
**Location**: EXAMPLE CITY

Government announces significant policy changes affecting international relations.

---

EXAMPLE CITY — In a significant development, the government of Example Country announced sweeping policy changes today...

The announcement, made by Prime Minister Jane Doe, includes...

International observers have noted...

---

**Tags**: politics, policy-change, international-relations, government

**Original URL**: https://example-news.com/world/2026/04/29/major-development
```

### Example 2: Breaking News (Live Blog)

**URL**: `https://example-news.com/world/live/breaking-situation`

**Extraction Notes:**
- Live blog with multiple updates
- Each update has timestamp
- Updates prepended to top (newest first)
- Extract all updates or only latest?

**Strategy**: 
- Track last seen update timestamp
- Collect only new updates since last check
- Create separate events for major updates
- Link related updates together

### Example 3: Skipped Content

**URL**: `https://example-news.com/world/opinion/editorial-board`

**Reason for Skip**: URL matches exclusion pattern `/opinion/`  
**Action**: Do not crawl, do not extract

## Monitoring & Maintenance

### Health Checks (Every 15 minutes)
- [ ] Site is reachable (HTTP 200)
- [ ] Selectors still work (test on recent article)
- [ ] Extraction produces valid data
- [ ] No blocking/rate limiting detected

### Weekly Tasks
- Review extraction success rate
- Check for selector breakage
- Monitor for site redesigns
- Update exclusion patterns if needed

### Monthly Tasks
- Audit data quality scores
- Review false positives/negatives
- Update reliability rating
- Check for new sections to monitor

## Validation Checklist

Before going live:

- [ ] Test URL patterns with recent articles
- [ ] Verify all selectors extract correctly
- [ ] Check exclusion patterns work
- [ ] Test duplicate detection
- [ ] Validate markdown conversion
- [ ] Verify rate limiting respect
- [ ] Test error handling (404s, timeouts)
- [ ] Confirm robots.txt compliance

## Technical Implementation Notes

### Recommended Libraries

**Python:**
- `requests` or `httpx` for fetching
- `BeautifulSoup4` or `lxml` for parsing
- `newspaper3k` for article extraction (optional)
- `selenium` or `playwright` if JS needed

**JavaScript:**
- `axios` or `node-fetch` for fetching
- `cheerio` for parsing
- `puppeteer` or `playwright` if JS needed
- `turndown` for HTML-to-Markdown

### Error Handling

```python
try:
    response = fetch_url(url, timeout=30)
    if response.status_code != 200:
        log_error(f"HTTP {response.status_code} for {url}")
        return None
    
    article = extract_article(response.text)
    if not validate_article(article):
        log_warning(f"Invalid article data from {url}")
        return None
        
    return article
    
except Timeout:
    log_error(f"Timeout fetching {url}")
    retry_later(url)
except ConnectionError:
    log_error(f"Connection error for {url}")
    check_site_status()
except Exception as e:
    log_error(f"Unexpected error for {url}: {e}")
    alert_maintainer()
```

### Rate Limiting Implementation

```python
import time
from datetime import datetime

last_request_time = None
min_delay_seconds = 3

def fetch_with_rate_limit(url):
    global last_request_time
    
    if last_request_time:
        elapsed = (datetime.now() - last_request_time).total_seconds()
        if elapsed < min_delay_seconds:
            time.sleep(min_delay_seconds - elapsed)
    
    response = requests.get(url)
    last_request_time = datetime.now()
    
    return response
```
