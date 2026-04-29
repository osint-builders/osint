---
id: rss-world-news-feed
name: World News RSS Feed
type: rss
status: testing
description: |
  RSS feed from major news organization covering world events. Provides
  structured feed items with titles, descriptions, publication dates, and
  links to full articles. Good for automated monitoring of breaking news.
created_date: 2026-04-29
last_updated: 2026-04-29
tags:
  - world-news
  - rss-feed
  - automated-monitoring
  - breaking-news
reliability: high
confidence_score: 85
update_frequency: "10m"
priority: medium
language:
  - en
geographic_focus:
  - global
cost: free
requires_auth: false
maintainer: osint-team
alert_keywords:
  - breaking
  - urgent
  - live
  - developing
---

# RSS Source: World News Feed

## Overview

RSS/Atom feed from a reputable news organization providing structured world news updates. The feed includes headlines, summaries, publication times, and links to full articles. Updates frequently throughout the day with breaking news and major developments.

**Feed Characteristics:**
- Format: RSS 2.0 / Atom
- Update frequency: Every 5-10 minutes
- Items per fetch: ~50 recent articles
- Historical depth: Last 24-48 hours
- Media enclosures: Sometimes included
- Categories/tags: Provided

## Data Collection Criteria

### Feed Configuration

**Feed URL**: `https://example-news.com/rss/world.xml`

**Alternative URLs**:
```
https://example-news.com/world/rss
https://example-news.com/feeds/world.atom
https://example-news.com/world.rss
```

**Protocol**: HTTP/HTTPS  
**Format**: RSS 2.0 or Atom 1.0  
**Character Encoding**: UTF-8

**Polling Settings**:
- **Check Interval**: Every 10 minutes
- **Timeout**: 15 seconds
- **User-Agent**: `OSINTBot/1.0 (compatible; +http://your-site.com/bot)`
- **Follow Redirects**: Yes (max 3)
- **Verify SSL**: Yes

### Feed Structure

#### RSS 2.0 Format

```xml
<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>World News - Example News</title>
    <link>https://example-news.com/world</link>
    <description>Latest world news and international coverage</description>
    <language>en</language>
    <lastBuildDate>Tue, 29 Apr 2026 14:32:00 GMT</lastBuildDate>
    <ttl>10</ttl>
    
    <item>
      <title>Major Development in Region X</title>
      <link>https://example-news.com/world/2026/04/29/article-id</link>
      <description>Brief summary of the event...</description>
      <pubDate>Tue, 29 Apr 2026 14:30:00 GMT</pubDate>
      <guid isPermaLink="true">https://example-news.com/world/2026/04/29/article-id</guid>
      <category>World News</category>
      <category>Politics</category>
      <dc:creator>Reporter Name</dc:creator>
      <enclosure url="https://example-news.com/image.jpg" type="image/jpeg" length="12345"/>
    </item>
    
    <!-- More items... -->
  </channel>
</rss>
```

#### Atom 1.0 Format

```xml
<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>World News - Example News</title>
  <link href="https://example-news.com/world"/>
  <updated>2026-04-29T14:32:00Z</updated>
  <id>https://example-news.com/world/feed</id>
  
  <entry>
    <title>Major Development in Region X</title>
    <link href="https://example-news.com/world/2026/04/29/article-id"/>
    <id>https://example-news.com/world/2026/04/29/article-id</id>
    <updated>2026-04-29T14:30:00Z</updated>
    <published>2026-04-29T14:30:00Z</published>
    <summary>Brief summary of the event...</summary>
    <author>
      <name>Reporter Name</name>
    </author>
    <category term="World News"/>
    <category term="Politics"/>
  </entry>
  
  <!-- More entries... -->
</feed>
```

### Entry/Item Filters

**Include Criteria**:
- Published within last 24 hours
- Category includes "World", "International", "Breaking"
- Title contains event-related keywords
- Has valid link to full article
- Description is not empty

**Exclude Criteria**:
- Category includes "Opinion", "Analysis", "Editorial"
- Category includes "Sports", "Entertainment", "Lifestyle"
- Title contains "SPONSORED" or "Advertisement"
- Already processed (check GUID/link)

### Item Mapping

Map RSS/Atom fields to our data structure:

| RSS Field | Atom Field | Our Field | Notes |
|-----------|------------|-----------|-------|
| `title` | `title` | `title` | Article headline |
| `pubDate` | `published` | `date` | Publication timestamp |
| `link` | `link@href` | `url` | Article URL |
| `description` | `summary` | `summary` | Brief description |
| `guid` | `id` | `guid` | Unique identifier |
| `dc:creator` | `author/name` | `author` | Author name |
| `category` | `category@term` | `tags` | Categories/tags |
| `enclosure` | `link[@rel='enclosure']` | `media` | Images/media |

## Expected Data Format

### RSS Item Example

```xml
<item>
  <title>Earthquake Strikes Coastal Region, Magnitude 7.2</title>
  <link>https://example-news.com/world/2026/04/29/earthquake-coastal-region</link>
  <description>
    A powerful earthquake measuring 7.2 on the Richter scale struck
    the coastal region early Tuesday morning, triggering tsunami
    warnings across the area.
  </description>
  <pubDate>Tue, 29 Apr 2026 06:15:00 GMT</pubDate>
  <guid isPermaLink="true">https://example-news.com/world/2026/04/29/earthquake-coastal-region</guid>
  <category>World News</category>
  <category>Natural Disasters</category>
  <category>Breaking</category>
  <dc:creator>Sarah Thompson</dc:creator>
  <enclosure url="https://example-news.com/images/earthquake-damage.jpg" type="image/jpeg"/>
</item>
```

## Processing Instructions

### Feed Parsing

```python
import feedparser
from datetime import datetime, timedelta
import hashlib

def fetch_rss_feed(feed_url, timeout=15):
    """Fetch and parse RSS/Atom feed"""
    try:
        # feedparser handles both RSS and Atom
        feed = feedparser.parse(feed_url)
        
        if feed.bozo:
            # Feed has parsing errors
            print(f"Feed parsing error: {feed.bozo_exception}")
            # Continue anyway, may still have usable entries
        
        return feed
    except Exception as e:
        print(f"Error fetching feed: {e}")
        return None

def process_feed_entries(feed):
    """Process feed entries and extract events"""
    if not feed or not feed.entries:
        return []
    
    events = []
    cutoff_time = datetime.now() - timedelta(hours=24)
    
    for entry in feed.entries:
        # Check if already processed
        guid = entry.get('id', entry.get('link'))
        if is_already_processed(guid):
            continue
        
        # Parse publication date
        pub_date = parse_feed_date(entry)
        if pub_date < cutoff_time:
            continue  # Too old
        
        # Apply filters
        if not should_process_entry(entry):
            continue
        
        # Extract event data
        event = extract_event_from_entry(entry)
        if event:
            events.append(event)
            mark_as_processed(guid)
    
    return events

def parse_feed_date(entry):
    """Parse date from feed entry"""
    # Try various date fields
    date_fields = ['published_parsed', 'updated_parsed', 'created_parsed']
    
    for field in date_fields:
        if hasattr(entry, field) and getattr(entry, field):
            time_struct = getattr(entry, field)
            return datetime(*time_struct[:6])
    
    # Fallback to current time if no date found
    return datetime.now()

def should_process_entry(entry):
    """Apply filters to determine if entry should be processed"""
    title = entry.get('title', '').lower()
    
    # Get categories/tags
    categories = [tag.term.lower() for tag in entry.get('tags', [])]
    
    # Exclude opinion/editorial
    exclude_categories = ['opinion', 'editorial', 'analysis', 'commentary']
    if any(cat in categories for cat in exclude_categories):
        return False
    
    # Exclude non-news categories
    exclude_categories = ['sports', 'entertainment', 'lifestyle', 'weather']
    if any(cat in categories for cat in exclude_categories):
        return False
    
    # Exclude sponsored content
    if 'sponsored' in title or 'advertisement' in title:
        return False
    
    # Must have description
    if not entry.get('summary', '').strip():
        return False
    
    return True

def extract_event_from_entry(entry):
    """Extract event data from RSS/Atom entry"""
    
    # Basic fields
    event = {
        'title': entry.get('title', '').strip(),
        'date': parse_feed_date(entry),
        'url': entry.get('link', ''),
        'guid': entry.get('id', entry.get('link')),
        'summary': entry.get('summary', '').strip(),
        'author': extract_author(entry),
        'tags': extract_tags(entry),
        'media': extract_media(entry)
    }
    
    # Parse location from title/summary
    event['location'] = extract_location(event['title'], event['summary'])
    
    # Classify event type
    event['type'] = classify_from_rss(event['title'], event['summary'], event['tags'])
    
    # Determine priority
    event['priority'] = determine_priority(entry, event['tags'])
    
    return event

def extract_author(entry):
    """Extract author name from entry"""
    # Try various author fields
    if hasattr(entry, 'author_detail'):
        return entry.author_detail.get('name', '')
    elif hasattr(entry, 'author'):
        return entry.author
    elif hasattr(entry, 'dc_creator'):
        return entry.dc_creator
    return ''

def extract_tags(entry):
    """Extract categories/tags from entry"""
    tags = []
    
    # From tags field
    if hasattr(entry, 'tags'):
        tags.extend([tag.term for tag in entry.tags])
    
    # From category field
    if hasattr(entry, 'category'):
        tags.append(entry.category)
    
    return tags

def extract_media(entry):
    """Extract media enclosures from entry"""
    media = []
    
    # RSS enclosures
    if hasattr(entry, 'enclosures'):
        for enclosure in entry.enclosures:
            media.append({
                'url': enclosure.get('href', ''),
                'type': enclosure.get('type', ''),
                'length': enclosure.get('length', 0)
            })
    
    # Atom links with rel='enclosure'
    if hasattr(entry, 'links'):
        for link in entry.links:
            if link.get('rel') == 'enclosure':
                media.append({
                    'url': link.get('href', ''),
                    'type': link.get('type', '')
                })
    
    return media

def determine_priority(entry, tags):
    """Determine priority based on entry characteristics"""
    title = entry.get('title', '').lower()
    
    # High priority indicators
    high_priority_keywords = ['breaking', 'urgent', 'developing']
    if any(keyword in title for keyword in high_priority_keywords):
        return 'high'
    
    high_priority_tags = ['breaking', 'crisis', 'conflict']
    if any(tag.lower() in [t.lower() for t in tags] for tag in high_priority_tags):
        return 'high'
    
    # Low priority indicators
    low_priority_tags = ['feature', 'background', 'explainer']
    if any(tag.lower() in [t.lower() for t in tags] for tag in low_priority_tags):
        return 'low'
    
    return 'medium'
```

### Deduplication

```python
import hashlib
import json

# In-memory cache (use Redis or database in production)
processed_guids = set()

def is_already_processed(guid):
    """Check if GUID already processed"""
    guid_hash = hashlib.md5(guid.encode()).hexdigest()
    return guid_hash in processed_guids

def mark_as_processed(guid):
    """Mark GUID as processed"""
    guid_hash = hashlib.md5(guid.encode()).hexdigest()
    processed_guids.add(guid_hash)
```

### Transformation to World Event Entity

```python
def transform_rss_to_world_event(rss_event):
    """Transform RSS entry to world event entity"""
    
    return {
        'title': rss_event['title'],
        'date': rss_event['date'].isoformat(),
        'type': rss_event['type'],
        'location': rss_event.get('location'),
        'priority': rss_event['priority'],
        'confidence': 'high',  # RSS feeds from reputable sources
        'tags': rss_event['tags'],
        'source': {
            'type': 'rss',
            'url': rss_event['url'],
            'guid': rss_event['guid'],
            'author': rss_event['author'],
            'feed': 'example-news-world'
        },
        'contents': generate_markdown_from_rss(rss_event)
    }

def generate_markdown_from_rss(rss_event):
    """Generate Markdown content from RSS event"""
    md = f"# {rss_event['title']}\n\n"
    
    md += f"**Source**: Example News RSS Feed\n"
    md += f"**Published**: {rss_event['date'].isoformat()}\n"
    
    if rss_event['author']:
        md += f"**Author**: {rss_event['author']}\n"
    
    md += f"\n{rss_event['summary']}\n\n"
    
    md += f"**[Read full article]({rss_event['url']})**\n\n"
    
    if rss_event.get('media'):
        md += "## Media\n\n"
        for item in rss_event['media']:
            md += f"![Image]({item['url']})\n"
    
    if rss_event.get('tags'):
        md += f"**Tags**: {', '.join(rss_event['tags'])}\n"
    
    return md
```

## Quality Indicators

### High Quality Signals
- Feed updates regularly (< 15 min old items)
- Items have complete metadata (author, date, categories)
- Descriptions are substantive (> 100 chars)
- Links are valid and accessible
- Media enclosures present
- GUIDs are stable and unique
- No parsing errors in feed

### Low Quality Signals
- Feed last updated > 1 hour ago
- Missing publication dates
- Empty or very short descriptions
- Broken or redirect links
- No categories/tags
- Duplicate GUIDs
- Feed parsing errors

## Known Issues

### Issue 1: Duplicate Entries
**Problem**: Some feeds include duplicate items with different GUIDs  
**Workaround**: Also deduplicate by URL and title similarity  
**Status**: Additional dedup logic implemented

### Issue 2: Incomplete Descriptions
**Problem**: Some items have truncated descriptions  
**Workaround**: Fetch full article if description < 100 chars  
**Status**: Full article fetch optional

### Issue 3: Date Parsing Variations
**Problem**: Different date formats used inconsistently  
**Workaround**: feedparser normalizes most formats automatically  
**Status**: Working well

### Issue 4: Feed Downtime
**Problem**: Occasional feed unavailability  
**Workaround**: Implement retry with exponential backoff  
**Status**: Retry logic implemented

## Examples

### Example 1: Breaking News Item

**RSS Entry:**
```xml
<item>
  <title>BREAKING: Major earthquake strikes coastal region</title>
  <link>https://example-news.com/world/2026/04/29/earthquake</link>
  <description>
    A powerful 7.2 magnitude earthquake struck the coastal region at 
    06:15 local time, triggering tsunami warnings and evacuation orders.
    Emergency services are responding to reports of structural damage.
  </description>
  <pubDate>Tue, 29 Apr 2026 06:20:00 GMT</pubDate>
  <guid>https://example-news.com/world/2026/04/29/earthquake</guid>
  <category>Breaking</category>
  <category>Natural Disasters</category>
  <dc:creator>Emergency Desk</dc:creator>
</item>
```

**Transformed Event:**
```yaml
title: "BREAKING: Major earthquake strikes coastal region"
date: 2026-04-29T06:20:00Z
type: crisis
location:
  name: "coastal region"
priority: high
confidence: high
tags:
  - breaking
  - natural-disasters
  - earthquake
source:
  type: rss
  url: "https://example-news.com/world/2026/04/29/earthquake"
  guid: "https://example-news.com/world/2026/04/29/earthquake"
  author: "Emergency Desk"
  feed: "example-news-world"
```

### Example 2: Regular News Item

**RSS Entry:**
```xml
<item>
  <title>Trade negotiations continue between Country A and B</title>
  <link>https://example-news.com/world/2026/04/29/trade-talks</link>
  <description>
    Diplomatic teams from Country A and Country B met for the third day
    of trade negotiations in Capital City, with sources indicating
    progress on key sticking points.
  </description>
  <pubDate>Tue, 29 Apr 2026 14:00:00 GMT</pubDate>
  <guid>https://example-news.com/world/2026/04/29/trade-talks</guid>
  <category>World News</category>
  <category>Economics</category>
  <dc:creator>John Reporter</dc:creator>
</item>
```

**Transformed Event:**
```yaml
title: "Trade negotiations continue between Country A and B"
date: 2026-04-29T14:00:00Z
type: economic
priority: medium
confidence: high
tags:
  - world-news
  - economics
  - trade
  - diplomacy
```

## Validation Checklist

- [ ] Feed URL accessible and returns valid RSS/Atom
- [ ] Feed parser handles format correctly
- [ ] Date parsing works for all entries
- [ ] Deduplication by GUID working
- [ ] Filters correctly exclude unwanted categories
- [ ] Media extraction working if present
- [ ] Markdown generation correct
- [ ] Polling interval appropriate (not too aggressive)

## Monitoring & Maintenance

### Every Poll (10 minutes)
- Check feed accessibility
- Parse and process new entries
- Log any parsing errors
- Update last successful fetch timestamp

### Daily
- Review extraction success rate
- Check for duplicate processing
- Verify date parsing accuracy
- Monitor feed lag (last item age)

### Weekly
- Review category filters
- Check for feed format changes
- Update keyword lists
- Audit data quality

### Monthly
- Validate feed still active and maintained
- Review reliability score
- Update source documentation
- Check for alternative/better feeds
