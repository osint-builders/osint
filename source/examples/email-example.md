---
id: email-intel-digest
name: Intelligence Digest Newsletter
type: email
status: testing
description: |
  Daily intelligence digest newsletter providing curated world event summaries,
  geopolitical analysis, and crisis monitoring. Professional OSINT source with
  verified information and expert analysis.
created_date: 2026-04-29
last_updated: 2026-04-29
tags:
  - intelligence
  - curated-content
  - daily-digest
  - geopolitical-analysis
reliability: high
confidence_score: 90
update_frequency: "daily"
priority: medium
language:
  - en
geographic_focus:
  - global
cost: paid
requires_auth: true
maintainer: osint-team
alert_keywords:
  - urgent
  - breaking
  - critical
  - alert
  - immediate
---

# Email Source: Intelligence Digest Newsletter

## Overview

Professional intelligence newsletter delivering curated world event summaries daily. Content is researched, verified, and synthesized by intelligence analysts. Emails contain structured summaries with source attribution, confidence levels, and analysis.

**Newsletter Characteristics:**
- Delivery: Daily at 06:00 UTC
- Format: HTML email with structured sections
- Average length: 2000-3000 words
- Source quality: High (verified sources)
- Analysis depth: Medium to deep
- Subscription: Paid ($299/year)

## Data Collection Criteria

### Email Configuration

**Connection Method**: IMAP

**Server Details**:
```
Host: imap.gmail.com (or mail server)
Port: 993 (SSL)
Auth: OAuth2 or App Password
```

**Environment Variables Required**:
```bash
EMAIL_HOST=imap.gmail.com
EMAIL_PORT=993
EMAIL_USER=your-email@example.com
EMAIL_PASSWORD=app-specific-password
# or
EMAIL_OAUTH_TOKEN=oauth-token-here
```

**Monitor Configuration**:
- **Target Address**: `intel-digest@yourdomain.com`
- **Folder**: `INBOX` or dedicated folder `INBOX/Intelligence`
- **Check Frequency**: Every 30 minutes
- **Mark as Read**: After processing
- **Archive**: Move to `Processed` folder after extraction

### Sender Allowlist

Only process emails from verified senders:

```
newsletter@intel-digest.com
alerts@intel-digest.com
updates@stratfor.com
digest@janes.com
```

**Sender Validation**:
- Check SPF/DKIM/DMARC authentication
- Verify sender domain matches expected
- Check "From" address against allowlist
- Validate "Return-Path" header

### Subject Line Filters

**Include Patterns**:
```regex
^Intel Digest - \d{4}-\d{2}-\d{2}$
^Daily Brief: .*
^URGENT:.*
^Alert:.*
^Breaking Analysis:.*
```

**Exclude Patterns**:
```regex
^Unsubscribe
^Re:.*
^Fwd:.*
^Marketing:.*
^Promotional.*
```

### Content Structure

Expected email sections:

1. **Header/Summary** - Top-level overview
2. **Priority Events** - Critical/breaking items
3. **Regional Summaries** - Organized by geography
4. **Analysis** - Expert commentary
5. **Sources** - Attribution and links
6. **Metadata** - Confidence scores, classifications

## Expected Data Format

### Email Structure (HTML)

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Intel Digest - 2026-04-29</title>
</head>
<body>
  <div class="digest-header">
    <h1>Intelligence Digest</h1>
    <p class="date">April 29, 2026</p>
    <p class="classification">UNCLASSIFIED</p>
  </div>
  
  <div class="priority-section">
    <h2>Priority Items</h2>
    <div class="event" data-priority="high">
      <h3>Escalating Tensions in Region X</h3>
      <p class="location">Location: Region X, Country Y</p>
      <p class="confidence">Confidence: HIGH</p>
      <p class="content">
        Multiple sources report increased military activity...
      </p>
      <div class="sources">
        <a href="https://source1.com">Source 1</a>,
        <a href="https://source2.com">Source 2</a>
      </div>
    </div>
  </div>
  
  <div class="regional-section">
    <h2>Middle East</h2>
    <div class="event" data-priority="medium">
      <h3>Diplomatic Developments</h3>
      <p class="content">...</p>
    </div>
  </div>
  
  <div class="analysis-section">
    <h2>Analysis</h2>
    <p>Expert analysis paragraph...</p>
  </div>
  
  <div class="sources-section">
    <h2>Sources Consulted</h2>
    <ul>
      <li>Reuters</li>
      <li>BBC</li>
      <li>Local media</li>
    </ul>
  </div>
</body>
</html>
```

### Plain Text Alternative

```
INTELLIGENCE DIGEST
April 29, 2026
UNCLASSIFIED

=== PRIORITY ITEMS ===

** Escalating Tensions in Region X **
Location: Region X, Country Y
Confidence: HIGH

Multiple sources report increased military activity...

Sources:
- https://source1.com
- https://source2.com

=== MIDDLE EAST ===

** Diplomatic Developments **
Confidence: MEDIUM

Diplomatic efforts continue...

=== ANALYSIS ===

Expert analysis paragraph...
```

## Processing Instructions

### Email Retrieval

```python
import imaplib
import email
from email.header import decode_header

def connect_to_mailbox():
    # Connect via IMAP
    mail = imaplib.IMAP4_SSL(EMAIL_HOST, EMAIL_PORT)
    mail.login(EMAIL_USER, EMAIL_PASSWORD)
    mail.select('INBOX')
    return mail

def fetch_digest_emails(mail, since_date='1-Jan-2026'):
    # Search for emails from allowed senders
    sender_queries = [
        f'FROM "newsletter@intel-digest.com"',
        f'FROM "alerts@intel-digest.com"'
    ]
    
    emails = []
    for query in sender_queries:
        status, messages = mail.search(None, query, f'SINCE {since_date}')
        if status == 'OK':
            email_ids = messages[0].split()
            emails.extend(email_ids)
    
    return emails

def parse_email(mail, email_id):
    status, msg_data = mail.fetch(email_id, '(RFC822)')
    
    if status != 'OK':
        return None
    
    raw_email = msg_data[0][1]
    email_message = email.message_from_bytes(raw_email)
    
    # Extract headers
    subject = decode_header(email_message['Subject'])[0][0]
    sender = email_message['From']
    date = email_message['Date']
    
    # Extract body
    body = extract_body(email_message)
    
    return {
        'subject': subject,
        'sender': sender,
        'date': date,
        'body': body
    }
```

### Content Extraction

```python
from bs4 import BeautifulSoup
import re

def extract_body(email_message):
    """Extract HTML or plain text body"""
    body = None
    
    if email_message.is_multipart():
        for part in email_message.walk():
            content_type = part.get_content_type()
            
            if content_type == 'text/html':
                body = part.get_payload(decode=True).decode('utf-8', errors='ignore')
                break
            elif content_type == 'text/plain' and body is None:
                body = part.get_payload(decode=True).decode('utf-8', errors='ignore')
    else:
        body = email_message.get_payload(decode=True).decode('utf-8', errors='ignore')
    
    return body

def parse_digest_content(html_content):
    """Parse structured digest content"""
    soup = BeautifulSoup(html_content, 'html.parser')
    
    events = []
    
    # Find all event divs
    event_divs = soup.find_all('div', class_='event')
    
    for event_div in event_divs:
        event = {
            'title': event_div.find('h3').text.strip(),
            'priority': event_div.get('data-priority', 'medium'),
            'content': event_div.find('p', class_='content').text.strip(),
            'sources': []
        }
        
        # Extract location if present
        location_p = event_div.find('p', class_='location')
        if location_p:
            event['location'] = location_p.text.replace('Location:', '').strip()
        
        # Extract confidence if present
        confidence_p = event_div.find('p', class_='confidence')
        if confidence_p:
            event['confidence'] = confidence_p.text.replace('Confidence:', '').strip().lower()
        
        # Extract source links
        sources_div = event_div.find('div', class_='sources')
        if sources_div:
            links = sources_div.find_all('a')
            event['sources'] = [link.get('href') for link in links]
        
        events.append(event)
    
    return events

def parse_plain_text_digest(text_content):
    """Parse plain text digest format"""
    events = []
    
    # Split by section headers
    sections = re.split(r'={3,}\s*([A-Z\s]+)\s*={3,}', text_content)
    
    for i in range(1, len(sections), 2):
        section_name = sections[i].strip()
        section_content = sections[i+1].strip()
        
        # Split events within section (marked by **)
        event_blocks = re.split(r'\*\*\s*(.+?)\s*\*\*', section_content)
        
        for j in range(1, len(event_blocks), 2):
            title = event_blocks[j].strip()
            content = event_blocks[j+1].strip()
            
            # Extract metadata
            location_match = re.search(r'Location:\s*(.+)', content)
            confidence_match = re.search(r'Confidence:\s*(\w+)', content)
            
            event = {
                'title': title,
                'section': section_name,
                'content': content,
                'location': location_match.group(1) if location_match else None,
                'confidence': confidence_match.group(1).lower() if confidence_match else 'medium',
                'sources': extract_urls(content)
            }
            
            events.append(event)
    
    return events

def extract_urls(text):
    """Extract URLs from text"""
    url_pattern = r'https?://[^\s<>"\']+'
    return re.findall(url_pattern, text)
```

### Transformation to World Event Entity

```python
from datetime import datetime

def transform_digest_event(event, digest_date):
    """Transform parsed email event to world event entity"""
    
    # Map confidence levels
    confidence_map = {
        'high': 'high',
        'medium': 'medium',
        'low': 'low',
        'unverified': 'low'
    }
    
    # Map priority levels
    priority_map = {
        'high': 'high',
        'medium': 'medium',
        'low': 'low',
        'critical': 'high'
    }
    
    return {
        'title': event['title'],
        'date': digest_date,  # Use digest publication date
        'type': classify_event_type(event['title'], event['content']),
        'location': parse_location(event.get('location', '')),
        'priority': priority_map.get(event.get('priority', 'medium'), 'medium'),
        'confidence': confidence_map.get(event.get('confidence', 'medium'), 'medium'),
        'tags': extract_tags(event['content']),
        'source': {
            'type': 'email',
            'newsletter': 'intelligence-digest',
            'section': event.get('section', 'general'),
            'external_sources': event.get('sources', [])
        },
        'contents': generate_markdown(event)
    }

def parse_location(location_str):
    """Parse location string into structured format"""
    if not location_str:
        return None
    
    # Example: "Region X, Country Y"
    parts = [p.strip() for p in location_str.split(',')]
    
    location = {}
    if len(parts) >= 2:
        location['region'] = parts[0]
        location['country'] = parts[1]
    elif len(parts) == 1:
        location['name'] = parts[0]
    
    return location

def classify_event_type(title, content):
    """Classify event based on title and content"""
    text = (title + ' ' + content).lower()
    
    if any(word in text for word in ['conflict', 'military', 'war', 'combat']):
        return 'conflict'
    elif any(word in text for word in ['diplomatic', 'treaty', 'agreement', 'talks']):
        return 'diplomatic'
    elif any(word in text for word in ['crisis', 'emergency', 'disaster']):
        return 'crisis'
    elif any(word in text for word in ['economic', 'trade', 'sanctions', 'embargo']):
        return 'economic'
    elif any(word in text for word in ['political', 'government', 'election']):
        return 'political'
    else:
        return 'other'

def generate_markdown(event):
    """Generate markdown content for event"""
    md = f"# {event['title']}\n\n"
    
    if event.get('location'):
        md += f"**Location**: {event['location']}\n"
    
    if event.get('confidence'):
        md += f"**Confidence**: {event['confidence'].upper()}\n"
    
    md += f"\n{event['content']}\n\n"
    
    if event.get('sources'):
        md += "## Sources\n\n"
        for source in event['sources']:
            md += f"- {source}\n"
    
    return md
```

### Validation Rules

```python
def validate_digest_email(email_data):
    """Validate email meets criteria for processing"""
    
    # Check sender is allowed
    sender = email_data['sender']
    allowed_senders = [
        'newsletter@intel-digest.com',
        'alerts@intel-digest.com'
    ]
    if not any(allowed in sender for allowed in allowed_senders):
        return False, "Sender not in allowlist"
    
    # Check subject format
    subject = email_data['subject']
    if not re.match(r'Intel Digest - \d{4}-\d{2}-\d{2}', subject):
        return False, "Subject does not match expected format"
    
    # Check email has content
    if not email_data['body'] or len(email_data['body']) < 100:
        return False, "Email body too short or empty"
    
    # Check authentication (SPF/DKIM)
    # This would be checked during email retrieval
    
    return True, "Valid"
```

## Quality Indicators

### High Quality Signals
- From verified sender with DKIM
- Subject matches expected format
- Contains confidence ratings
- Multiple sources cited per event
- Specific locations mentioned
- Structured HTML format intact
- Expected sections present

### Low Quality Signals
- Generic sender address
- Malformed subject line
- No source attribution
- Vague locations
- Very short content
- Missing expected sections
- Plain text only (when HTML expected)

## Known Issues

### Issue 1: HTML Parsing Variations
**Problem**: Email client rendering may modify HTML structure  
**Workaround**: Support both HTML and plain text parsing  
**Status**: Dual parser implemented

### Issue 2: Delayed Delivery
**Problem**: Newsletter may arrive late due to email delays  
**Workaround**: Check for emails from previous day  
**Status**: Retrieval window set to 48 hours

### Issue 3: Attachment Handling
**Problem**: Some digests include PDF attachments  
**Workaround**: Extract and parse PDF if present  
**Status**: PDF parsing to be implemented

### Issue 4: Authentication Expiry
**Problem**: OAuth tokens expire periodically  
**Workaround**: Implement token refresh logic  
**Status**: Auto-refresh implemented

## Examples

### Example 1: HTML Email Event

**Raw HTML:**
```html
<div class="event" data-priority="high">
  <h3>Border Tensions Escalate in Eastern Europe</h3>
  <p class="location">Location: Eastern Europe, Country X</p>
  <p class="confidence">Confidence: HIGH</p>
  <p class="content">
    Multiple independent sources confirm increased military deployment
    along the border region. Satellite imagery shows convoy movements
    consistent with battalion-sized units. Diplomatic channels report
    heightened tensions following recent policy announcements.
  </p>
  <div class="sources">
    <a href="https://reuters.com/article1">Reuters</a>,
    <a href="https://bbc.com/article2">BBC</a>,
    <a href="https://local-news.com/article3">Local News</a>
  </div>
</div>
```

**Transformed Event:**
```yaml
title: "Border Tensions Escalate in Eastern Europe"
date: 2026-04-29T06:00:00Z
type: conflict
location:
  region: "Eastern Europe"
  country: "Country X"
priority: high
confidence: high
tags:
  - military
  - border-tensions
  - eastern-europe
  - diplomatic-crisis
source:
  type: email
  newsletter: intelligence-digest
  section: priority-items
  external_sources:
    - "https://reuters.com/article1"
    - "https://bbc.com/article2"
    - "https://local-news.com/article3"
```

### Example 2: Plain Text Event

**Raw Text:**
```
** Economic Sanctions Announced **
Location: Global, Multiple Countries
Confidence: MEDIUM

International coalition announces new economic measures targeting
specific sectors. Implementation expected within 30 days. Market
reaction anticipated. Details emerging.

Sources:
- https://financial-times.com/article
- https://wsj.com/article
```

**Transformed Event:**
```yaml
title: "Economic Sanctions Announced"
date: 2026-04-29T06:00:00Z
type: economic
location:
  name: "Global"
  scope: "Multiple Countries"
priority: medium
confidence: medium
tags:
  - sanctions
  - economic
  - international
  - policy
```

## Validation Checklist

- [ ] IMAP connection configured and tested
- [ ] Authentication credentials secured
- [ ] Sender allowlist configured
- [ ] Subject filters working
- [ ] HTML parser handles email format
- [ ] Plain text fallback working
- [ ] Confidence mapping correct
- [ ] Source extraction functional
- [ ] Markdown generation correct
- [ ] Email archival working

## Monitoring & Maintenance

### Daily Checks
- Email delivery received (expected 06:00 UTC)
- Parsing successful
- All events extracted
- No authentication errors

### Weekly Tasks
- Review extraction accuracy
- Check for format changes
- Verify source links valid
- Update sender allowlist if needed

### Monthly Tasks
- Audit data quality
- Review confidence accuracy
- Update classification rules
- Verify subscription active
