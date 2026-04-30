---
id: webpage-breaking-defense-global
name: Breaking Defense - Global Coverage
type: webpage
status: testing
description: |
  Breaking Defense's Global section covers international defense and military news,
  focusing on global security issues, international defense programs, geopolitical
  analysis, and military developments worldwide. Provides expert coverage of defense
  industry, military technology, and international security policy from experienced
  defense journalists.
created_date: "2026-04-30"
last_updated: "2026-04-30"
tags:
  - defense
  - military
  - global-security
  - defense-industry
  - geopolitics
  - international-security
  - defense-technology
reliability: high
confidence_score: 88
update_frequency: "30m"
priority: high
language:
  - en
geographic_focus:
  - global
cost: free
requires_auth: false
maintainer: osint-team
alert_keywords:
  - conflict
  - military
  - defense
  - weapon
  - security
  - international
  - crisis
---

# Webpage Source: Breaking Defense - Global Coverage

## Overview

Breaking Defense is a premier defense industry publication providing authoritative coverage of military affairs, defense policy, and national security. The Global section specifically focuses on international defense developments, including:

- **International conflicts**: Military operations and combat worldwide
- **Global defense programs**: International weapons systems and military modernization
- **Geopolitical analysis**: Strategic competition, alliances, and security relationships
- **Defense industry**: International defense contracts, exports, and cooperation
- **Military technology**: Emerging capabilities and international tech competition
- **Security policy**: International defense strategy and policy developments

**Website Characteristics:**
- Professional defense journalism with deep industry expertise
- Articles written by experienced defense reporters and analysts
- Mix of breaking news, analysis, and exclusive reporting
- Typical article length: 600-1500 words
- Multiple daily updates during business hours
- Some premium content, but much is freely accessible
- Strong emphasis on expert sources and official statements

## Data Collection Criteria

### URL Configuration

**Base URL**: `https://breakingdefense.com/category/global/`

**URL Patterns to Monitor:**
```
https://breakingdefense.com/category/global/
https://breakingdefense.com/category/global/page/[N]/
https://breakingdefense.com/[year]/[month]/[slug]/
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
^https://breakingdefense\.com/category/global/?$
^https://breakingdefense\.com/category/global/page/\d+/?$
^https://breakingdefense\.com/\d{4}/\d{2}/[a-z0-9\-]+/?$
```

### Exclude Patterns

Skip URLs matching these patterns:
```regex
/category/(?!global) (other categories unless verified as global content)
/author/
/tag/
/topic/
/opinion/ (unless explicitly global security opinion)
/sponsored/
/webinar/
/event/
/newsletter/
/subscribe/
/login/
/register/
\?share=
\?utm_
\.(pdf|jpg|jpeg|png|gif|mp4|webp)$
```

### Extraction Rules

#### Article List Extraction (Category Page)

**Primary Selectors:**
```css
/* Main content area */
main
div.container
section.articles
div.category-content

/* Individual article cards */
article
article.post
div.post
div.article-item
div.story-card

/* Article links */
article h2 a
article h3 a
a.article-link
div.entry-title a
```

**XPath for article links:**
```xpath
//article//h2//a/@href
//article//h3//a/@href
//div[contains(@class,'post')]//a[contains(@href,'breakingdefense.com')]/@href
```

#### Article Detail Extraction

**Primary Selectors:**
```css
/* Article title */
h1.entry-title
article h1
h1.article-title
header h1
meta[property="og:title"]

/* Publication date */
time.entry-date[datetime]
time.published[datetime]
meta[property="article:published_time"]
span.date
div.article-meta time

/* Author */
span.author a
a[rel="author"]
div.author-name
meta[name="author"]

/* Article body */
div.entry-content
article .article-content
div.post-content
div.content-area

/* Category / Section */
span.category
div.categories a
meta[property="article:section"]

/* Tags */
div.tags a
span.tag-links a
meta[property="article:tag"]

/* Featured image */
meta[property="og:image"]
div.featured-image img
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
- Article body (> 250 characters of clean text)
- Canonical URL
- Author attribution

**Quality Checks:**
- Language detected as English
- Date within last 30 days for active collection
- Content-to-markup ratio > 30%
- Title does not contain "404" or "Page Not Found"
- Category verified as "Global" or international focus
- Not a pure event/webinar announcement

### JavaScript Rendering

**Rendering Required**: Possibly - modern WordPress or custom CMS may use JavaScript

**Testing Approach:**
- Try standard HTTP fetch first
- If content missing or incomplete, use headless browser
- Wait for selector: `article` or `div.entry-content`
- Timeout: 10 seconds
- Block ads and analytics for faster loading

## Expected Data Format

### Category Page HTML Structure

```html
<main class="container">
  <section class="articles">
    <article class="post">
      <header>
        <h2 class="entry-title">
          <a href="/2026/04/ukraine-defense-aid-package/">
            NATO Announces New Defense Aid Package for Ukraine
          </a>
        </h2>
        <div class="article-meta">
          <time datetime="2026-04-30T10:00:00Z">April 30, 2026</time>
          <span class="author">By Sarah Defense</span>
          <span class="category">Global</span>
        </div>
      </header>
      <div class="excerpt">
        <p>NATO member states have agreed to a new defense assistance package...</p>
      </div>
    </article>
    <!-- More articles... -->
  </section>
</main>
```

### Article Detail HTML Structure

```html
<article class="post">
  <header class="entry-header">
    <h1 class="entry-title">NATO Announces New Defense Aid Package for Ukraine</h1>
    <div class="article-meta">
      <time class="entry-date" datetime="2026-04-30T10:00:00Z">April 30, 2026</time>
      <span class="author">
        By <a rel="author" href="/author/sarah-defense/">Sarah Defense</a>
      </span>
      <span class="category"><a href="/category/global/">Global</a></span>
    </div>
  </header>
  
  <div class="entry-content">
    <p>BRUSSELS — NATO defense ministers meeting in Brussels today announced...</p>
    <p>The package includes air defense systems, artillery ammunition, and...</p>
    <p>According to NATO Secretary General statement...</p>
  </div>
  
  <footer class="entry-footer">
    <div class="categories">
      <a href="/category/global/">Global</a>
    </div>
    <div class="tags">
      <a rel="tag" href="/tag/nato/">NATO</a>
      <a rel="tag" href="/tag/ukraine/">Ukraine</a>
      <a rel="tag" href="/tag/defense-aid/">Defense Aid</a>
    </div>
  </footer>
</article>
```

### Open Graph Metadata

```html
<meta property="og:title" content="NATO Announces New Defense Aid Package for Ukraine" />
<meta property="og:url" content="https://breakingdefense.com/2026/04/ukraine-defense-aid-package/" />
<meta property="article:published_time" content="2026-04-30T10:00:00Z" />
<meta property="article:modified_time" content="2026-04-30T11:30:00Z" />
<meta property="article:section" content="Global" />
<meta property="article:tag" content="NATO" />
<meta property="article:tag" content="Ukraine" />
<meta name="author" content="Sarah Defense" />
```

## Processing Instructions

### Data Extraction Pipeline

1. **Fetch Global Category Page**
   ```
   - Load https://breakingdefense.com/category/global/
   - Standard HTTP fetch (or headless browser if needed)
   - Parse HTML with standard parser
   - Extract all article URLs from article cards
   - Verify articles are in global category
   - Deduplicate URLs
   ```

2. **Fetch Each Article Page**
   ```
   - For each discovered article URL not previously seen
   - Standard HTTP GET (use headless browser if needed)
   - Parse HTML
   - Extract Open Graph meta tags first (most reliable)
   - Fall back to DOM selectors if meta missing
   - Extract: title, date, author, body, category, tags, canonical URL
   ```

3. **Clean Content**
   ```
   - Strip navigation, sidebars, related articles
   - Remove social share buttons and newsletter CTAs
   - Remove "Subscribe" or "Become a Member" prompts
   - Strip ads and sponsored content blocks
   - Normalize whitespace
   - Convert relative URLs to absolute
   - Remove tracking parameters from links
   ```

4. **Validate Extracted Data**
   ```
   - Assert title non-empty and reasonable length
   - Assert date valid, parseable, not in future
   - Assert body > 250 chars (Breaking Defense has substantive articles)
   - Assert author attribution present
   - Assert URL matches expected pattern
   - Verify category is "Global" or international focus
   ```

### Transformation to World Event Entity

**Title:**
- Use article headline from h1 or og:title
- Remove site suffix if present (e.g., " - Breaking Defense")
- Limit to 250 characters

**Date:**
- Prefer `article:published_time` meta tag (ISO 8601 format)
- Fall back to `<time datetime>` attribute
- Parse visible date string as last resort

**Event Type Mapping:**

| Article Keywords | Event Type |
|---|---|
| conflict, combat, war, battle | `military-conflict` |
| exercise, drill, training | `military-exercise` |
| contract, procurement, acquisition | `defense-contract` |
| weapon, missile, aircraft, ship | `defense-technology` |
| policy, strategy, doctrine | `defense-policy` |
| alliance, NATO, partnership | `defense-cooperation` |
| cyber, attack, breach | `cyber-warfare` |

**Location:**
- Extract from dateline (e.g., "BRUSSELS —")
- Parse from article body first paragraph
- Extract from country/region mentions
- Common locations: Brussels, Pentagon, major capitals

**Content (Markdown):**
```markdown
# [Article Title]

**Source**: Breaking Defense - Global  
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
- Add source tag: `breaking-defense`
- Add category tag: `global`, `defense`
- Add topic tags from content (countries, systems, programs)

### Deduplication Strategy

1. **URL exact match** - Skip if canonical URL seen before
2. **Title similarity** - Fuzzy match > 90% similarity = skip
3. **Published date** - Store indexed by date for range queries

## Quality Indicators

### High Quality Signals
- Named author with defense journalism credentials
- Dateline indicating original reporting location
- Direct quotes from defense officials, military leaders, or industry executives
- Specific weapon system names, program details, or contract values
- References to official statements, documents, or press releases
- Expert analysis from named defense analysts
- Detailed technical or policy information
- Recent publication (< 3 days)
- Long-form reporting (> 800 words)
- Multiple authoritative sources cited

### Low Quality Signals
- No author byline or generic "Staff"
- Very short article (< 400 words)
- Vague or generic language without specifics
- No direct quotes or sourcing
- Purely aggregated content without original reporting
- Event announcement without substantive analysis

### Red Flags (Skip / Low Priority)
- "Page not found" or "404" in title
- Redirect to homepage or category page
- Pure webinar/event announcement without news content
- Sponsored or advertorial content
- Duplicate content from previous crawl
- Paywall blocking all content (skip if inaccessible)

## Known Issues

### Issue 1: Potential Paywall Content
**Problem**: Breaking Defense has some premium/subscriber-only content  
**Workaround**: Attempt extraction; if paywall detected, skip article or extract available preview  
**Status**: Monitor for paywall indicators; document if becomes widespread

### Issue 2: Category Overlap
**Problem**: Some articles may appear in both "Global" and other categories (e.g., "Air Warfare")  
**Workaround**: Use canonical URL for deduplication; verify global/international focus  
**Status**: Deduplication handles cross-category articles

### Issue 3: Breaking News Updates
**Problem**: Major stories may be updated continuously with new information  
**Workaround**: Track last-modified timestamp; re-extract if significantly updated  
**Status**: Consider implementing update detection for major stories

### Issue 4: Author Expertise Varies
**Problem**: Mix of expert defense correspondents and general assignment reporters  
**Workaround**: Prioritize articles from known defense journalists (can track by author)  
**Status**: Quality indicators favor detailed, sourced reporting

### Issue 5: Pagination on Category Page
**Problem**: Global category has multiple pages of articles  
**Workaround**: Crawl page/2/, page/3/, etc., but prioritize page 1 for freshest content  
**Status**: Configure crawler to handle pagination URLs

## Examples

### Example 1: Defense Cooperation Article

**URL**: `https://breakingdefense.com/2026/04/nato-defense-aid-ukraine/`

**Extracted World Event:**
```yaml
title: "NATO Announces $5B Defense Aid Package for Ukraine"
date: 2026-04-30T10:00:00Z
type: defense-cooperation
location:
  city: "Brussels"
  country: "Belgium"
priority: high
confidence: high
tags:
  - nato
  - ukraine
  - defense-aid
  - international-security
  - breaking-defense
  - global
source:
  type: webpage
  url: "https://breakingdefense.com/2026/04/nato-defense-aid-ukraine/"
  organization: "Breaking Defense"
  author: "Sarah Defense"
```

**Markdown Content:**
```markdown
# NATO Announces $5B Defense Aid Package for Ukraine

**Source**: Breaking Defense - Global  
**Published**: 2026-04-30T10:00:00Z  
**Author**: Sarah Defense  
**URL**: https://breakingdefense.com/2026/04/nato-defense-aid-ukraine/

BRUSSELS — NATO defense ministers meeting in Brussels today announced a new $5 billion defense assistance package for Ukraine, marking the alliance's largest single commitment since the conflict began.

---

The package includes advanced air defense systems, artillery ammunition, and armored vehicles, according to a statement from NATO Secretary General Jens Stoltenberg.

"This represents our strongest signal yet of unwavering support for Ukraine's defense," Stoltenberg said at a press conference following the ministerial meeting. "The package will help Ukraine defend its territory and civilian population."

US Defense Secretary Lloyd Austin confirmed American contribution will include Patriot missile batteries and HIMARS ammunition. European allies committed tanks, infantry fighting vehicles, and 155mm artillery shells.

The announcement comes amid continued Russian military operations in eastern Ukraine. Ukrainian Defense Minister Oleksiy Reznikov welcomed the aid package, stating it will "significantly enhance our defensive capabilities."

NATO officials said deliveries will begin within 30 days, with full package deployment expected by end of year.

---

**Tags**: nato, ukraine, defense-aid, international-security, breaking-defense, global
```

### Example 2: Defense Technology Article

**URL**: `https://breakingdefense.com/2026/04/hypersonic-missile-development-asia/`

**Extracted World Event:**
```yaml
title: "Asian Nations Accelerate Hypersonic Missile Development Programs"
date: 2026-04-29T15:00:00Z
type: defense-technology
location:
  region: "Asia-Pacific"
priority: high
confidence: high
tags:
  - hypersonic
  - missiles
  - asia-pacific
  - defense-technology
  - arms-race
  - breaking-defense
source:
  type: webpage
  url: "https://breakingdefense.com/2026/04/hypersonic-missile-development-asia/"
  organization: "Breaking Defense"
  author: "John Analyst"
```

### Example 3: Skipped Content (Event Announcement)

**URL**: `https://breakingdefense.com/event/defense-summit-2026/`

**Reason for Skip**: URL matches exclusion pattern `/event/`  
**Action**: Do not crawl event pages without substantive news content

## Monitoring & Maintenance

### Health Checks (Every 30 minutes)
- Global category page accessible (HTTP 200)
- At least 3 article links extracted from category page
- Most recent article date within 24 hours (flag if stale)
- Sample article extraction produces valid data with author

### Weekly Tasks
- Spot-check 5-7 extracted articles for content quality
- Verify selectors still targeting correct elements
- Check for site redesigns or template changes
- Review author attribution extraction accuracy
- Assess paywall impact on content accessibility

### Monthly Tasks
- Audit article relevance to international/global focus
- Review reliability rating based on content quality
- Adjust update frequency if publishing cadence changes
- Check for new subcategories to include
- Review quality indicators based on collected content

## Validation Checklist

Before going live:

- [x] Global category URL accessible
- [x] Article link extraction working from category page
- [x] Article detail page extraction configured
- [x] Title, date, author, body extraction working
- [x] Author attribution required and extracted
- [x] Category verification implemented
- [x] Exclusion patterns prevent non-global content
- [x] Content cleaning removes ads and CTAs
- [x] Deduplication by URL configured
- [x] Quality indicators prioritize expert reporting
- [x] Event type mapping configured
- [x] Markdown transformation defined
- [x] robots.txt compliance verified
- [x] Rate limiting configured (30min intervals)
- [x] Paywall detection documented
- [x] Examples provided with detailed metadata
