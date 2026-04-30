---
id: twitter-jaime-ocon
name: Jaime Ocon - GIS Analyst & Geospatial Intelligence Practitioner
type: twitter
status: active
description: |
  Independent GIS analyst and geospatial intelligence professional sharing practical
  mapping techniques, spatial analysis methods, and real-world OSINT applications.
  Provides hands-on tutorials, code snippets, and intelligence-focused GIS workflows
  for maritime tracking, crisis mapping, and open-source geospatial analysis.
created_date: "2026-04-30"
last_updated: "2026-04-30"
tags:
  - gis
  - geoint
  - osint
  - spatial-analysis
  - mapping
  - analyst
  - tutorials
  - maritime
reliability: medium
confidence_score: 75
update_frequency: "12h"
priority: medium
language:
  - en
geographic_focus:
  - global
  - practical-techniques
cost: free
requires_auth: true
maintainer: osint-team
alert_keywords:
  - gis
  - mapping
  - osint
  - analysis
  - tutorial
  - python
  - arcgis
  - qgis
  - geospatial
  - intelligence
---

# Jaime Ocon - GIS Analyst & Geospatial Intelligence Practitioner

## Overview

Jaime Ocon (@JaimeOcon) is an independent GIS analyst and geospatial intelligence professional who shares practical, hands-on mapping and analysis techniques. Content focuses on:

- Practical GIS analysis workflows
- OSINT and open-source geospatial techniques
- Maritime vessel tracking and analysis
- Python scripting for GIS automation
- Crisis mapping and emergency response
- ArcGIS and QGIS tutorials
- Spatial data visualization
- Remote sensing and imagery analysis
- Location intelligence methods
- Intelligence-applicable mapping techniques
- Real-world case studies and examples
- Code snippets and automation scripts

**Account Characteristics:**
- Individual practitioner perspective
- Hands-on technical content
- Code sharing and tutorials
- Real-world problem-solving
- OSINT community engagement
- Practical intelligence applications
- Open-source tool advocacy
- Regular technical tips and tricks

**Intelligence Value:**
- Practical OSINT mapping techniques
- Operational workflow examples
- Code and automation scripts
- Multi-tool integration approaches
- Real-world intelligence applications
- Problem-solving methodologies
- Open-source intelligence methods

## Data Collection Criteria

### Twitter Account Details

- **Handle**: JaimeOcon
- **Account Type**: Individual GIS analyst/practitioner
- **Geographic Focus**: Global techniques and methodologies
- **Strategic Significance**: Practical OSINT techniques, maritime analysis
- **Content Type**: Tutorials, code snippets, tips, case studies
- **Tweet Frequency**: Several times per week
- **Language**: English

### Collection Method

- **Method**: timeline
- **Poll Interval**: Every 12 hours
- **Include Retweets**: Yes (relevant GIS/OSINT community content)
- **Include Replies**: Yes (often contains additional technical details)
- **Include Quotes**: Yes
- **Thread Handling**: Collect full threads for tutorial series

### Content Filters

#### Include Criteria

- OSINT and intelligence-applicable techniques
- Maritime tracking and vessel analysis
- Python GIS automation scripts
- Crisis mapping methods
- Spatial analysis tutorials
- Multi-source data integration
- Code snippets and workflows
- Real-world case studies
- Tool comparisons and recommendations
- Open-source intelligence methods
- Pattern detection techniques
- Geospatial data processing

#### Exclude Criteria

- Personal opinions without technical content
- General GIS community discussions
- Non-intelligence related mapping
- Pure social/personal posts

### Keyword Monitoring

**High-Priority Keywords:**
- OSINT, open source intelligence
- maritime, vessel, ship, AIS
- tracking, monitoring, detection
- Python, script, code, automation
- analysis, workflow, tutorial
- intelligence, geoint, spatial
- crisis, emergency, disaster
- imagery, satellite, remote sensing
- pattern, detection, identification
- GIS, ArcGIS, QGIS, mapping

**Technique Keywords:**
- how to, tutorial, guide
- workflow, process, method
- script, code, tool
- visualization, map, dashboard
- integration, fusion, combination
- automation, batch, processing

**Application Keywords:**
- vessel tracking, maritime surveillance
- dark vessel, AIS off
- conflict mapping, crisis response
- border monitoring, territory
- infrastructure analysis
- movement tracking, pattern of life

## Expected Data Format

### Raw Tweet Object

```json
{
  "id": "1234567890",
  "text": "Quick tutorial: Python script to download AIS vessel data and visualize dark vessels (AIS off for >24hrs) in QGIS. Detects potential IUU fishing in your AOI. Code on GitHub: [link] #OSINT #MaritimeIntelligence #Python #GIS",
  "created_at": "2026-04-30T15:20:00Z",
  "author": {
    "username": "JaimeOcon",
    "name": "Jaime Ocon"
  },
  "metrics": {
    "retweet_count": 56,
    "like_count": 178,
    "reply_count": 23
  },
  "entities": {
    "urls": ["https://github.com/..."]
  }
}
```

### Structured Data Extraction

```yaml
event_type: gis-osint-technique
format: "tutorial"
topic: "Python script for dark vessel detection"
tools:
  - Python
  - QGIS
data_source: "AIS vessel data"
technique: "dark vessel detection (AIS off >24hrs)"
application: "IUU fishing detection"
code_available: true
priority: high
tags:
  - osint
  - maritime-intelligence
  - python
  - gis
  - dark-vessel-detection
  - iuu-fishing
  - tutorial
```

## Processing Instructions

### Data Extraction

1. **Fetch Timeline**
   - Use Twitter API v2 to fetch recent tweets and threads
   - Include replies for technical discussions
   - Filter for intelligence and OSINT content
   - Prioritize code sharing and tutorials

2. **Content Classification**
   - Identify technique or methodology shared
   - Extract tools and platforms used
   - Determine intelligence application
   - Assess technical complexity and value

3. **Entity Extraction**
   - Tools and software mentioned
   - Programming languages and libraries
   - Data sources referenced
   - Analysis techniques described
   - Intelligence applications
   - Code repository links
   - Tutorial resources

4. **Significance Assessment**
   - High: OSINT techniques with code, maritime intelligence, dark vessel detection
   - Medium: Spatial analysis methods, automation scripts, crisis mapping
   - Low: General GIS tips, tool discussions without intelligence context

### Transformation to World Event Entity

```javascript
function transformToWorldEvent(tweet, extracted) {
  const eventType = classifyOSINTTechnique(tweet.text);
  
  return {
    title: buildEventTitle(extracted),
    date: tweet.created_at,
    type: eventType,
    priority: calculatePriority(eventType, extracted),
    confidence: 'medium',  // Individual analyst, not official source
    tags: generateTags(extracted),
    source: {
      type: 'twitter',
      handle: 'JaimeOcon',
      tweet_id: tweet.id,
      url: `https://twitter.com/JaimeOcon/status/${tweet.id}`
    },
    entities: extracted.entities,
    contents: generateMarkdown(tweet, extracted)
  };
}
```

## Quality Indicators

### High Quality Signals

- Code snippets or GitHub links
- Step-by-step tutorials
- Real-world OSINT applications
- Maritime intelligence techniques
- Python automation scripts
- Multi-tool workflows
- Specific problem-solving examples
- Intelligence use case descriptions
- Reproducible methods
- Open-source tools and data

### Low Quality Signals

- Vague technique descriptions
- No code or specific methods
- General discussions without substance
- Opinions without practical content

### Red Flags (Skip/Low Priority)

- Personal opinions on GIS industry
- Non-technical social posts
- General community discussions
- Tool debates without practical examples

## Known Issues

### Issue 1: Individual vs. Organization Reliability
**Problem**: Individual analyst may have less verification than organizations  
**Workaround**: Set reliability to medium, verify techniques independently  
**Status**: Cross-check with other sources when possible

### Issue 2: Code Quality Variance
**Problem**: Shared code may be proof-of-concept vs. production-ready  
**Workaround**: Note code maturity, test before operational use  
**Status**: Document code quality in extraction

### Issue 3: Variable Tweet Frequency
**Problem**: Individual accounts may have irregular posting schedules  
**Workaround**: Longer polling interval (12h) acceptable for this source  
**Status**: Monitor activity patterns

## Examples

### Example 1: Maritime OSINT Python Script - High Priority

**Raw Tweet:**
```
🐍 New Python script: Automated dark vessel detection

Downloads AIS data → Identifies vessels with AIS off >24hrs → 
Geocodes last known positions → Flags in high-risk zones → 
Exports to GeoJSON for QGIS/ArcGIS

Perfect for IUU fishing monitoring. Code: [GitHub link]

#OSINT #Maritime #Python 🧵1/3
```

**Extracted World Event:**
```yaml
title: "Python script for automated dark vessel detection via AIS analysis"
date: 2026-04-30T16:10:00Z
type: osint-technique-sharing
format: "Python script"
technique: "automated dark vessel detection"
workflow:
  - "download AIS data"
  - "identify vessels with AIS off >24hrs"
  - "geocode last known positions"
  - "flag vessels in high-risk zones"
  - "export to GeoJSON"
tools:
  - Python
  - QGIS
  - ArcGIS
application: "IUU fishing monitoring"
code_available: true
code_location: "GitHub"
priority: high
confidence: medium
tags:
  - osint
  - maritime-intelligence
  - python
  - dark-vessel-detection
  - ais-analysis
  - iuu-fishing
  - automation
  - code-sharing
```

### Example 2: Crisis Mapping Workflow - High Priority

**Raw Tweet:**
```
Crisis mapping workflow I used for [recent event]:

1. Scrape social media for geotagged posts (Python + APIs)
2. Validate locations with satellite imagery (Sentinel-2)
3. Cluster incident reports (DBSCAN)
4. Create heat maps in QGIS
5. Export operational dashboards

Thread with code snippets below 👇
```

**Extracted World Event:**
```yaml
title: "Crisis mapping workflow with social media scraping and satellite validation"
date: 2026-04-30T12:45:00Z
type: osint-crisis-mapping-workflow
workflow_steps:
  - "scrape social media for geotagged posts"
  - "validate locations with satellite imagery"
  - "cluster incident reports"
  - "create heat maps"
  - "export operational dashboards"
tools:
  - Python
  - social media APIs
  - Sentinel-2 satellite imagery
  - DBSCAN clustering
  - QGIS
output: "operational dashboards"
application: "crisis mapping"
code_snippets: true
priority: high
confidence: medium
tags:
  - osint
  - crisis-mapping
  - social-media-scraping
  - satellite-validation
  - python
  - qgis
  - clustering
  - operational-intelligence
```

### Example 3: GIS Analysis Tip - Medium Priority

**Raw Tweet:**
```
Pro tip: When analyzing vessel movements, use space-time cubes in ArcGIS 
Pro to identify recurring patterns. Detected a fishing vessel that visited 
the same coordinates every 3 days for 2 months - turned out to be 
transshipment activity. #GEOINT #SpatialAnalysis
```

**Extracted World Event:**
```yaml
title: "Space-time cube analysis for detecting recurring vessel patterns"
date: 2026-04-30T09:30:00Z
type: gis-analysis-tip
technique: "space-time cube analysis"
tool: "ArcGIS Pro"
application: "vessel movement analysis"
use_case: "detected recurring transshipment activity"
pattern: "vessel visiting same coordinates every 3 days"
duration: "2 months"
outcome: "identified transshipment activity"
priority: medium
confidence: medium
tags:
  - geoint
  - spatial-analysis
  - vessel-movement
  - pattern-detection
  - transshipment
  - arcgis-pro
  - maritime-intelligence
```

## Validation Checklist

Before marking source as active:

- [x] Twitter handle verified (@JaimeOcon)
- [x] Content focus confirmed (practical GIS, OSINT techniques)
- [x] Strategic relevance established (OSINT methods, maritime analysis)
- [x] Collection method appropriate (timeline with replies)
- [x] Filters configured (intelligence and OSINT focus)
- [x] Keywords defined for OSINT and GIS techniques
- [x] Entity extraction patterns defined
- [x] Quality indicators specific and measurable
- [x] Examples comprehensive and realistic
- [ ] Account verification (confirm active and posting)
- [ ] Authentication configured (Twitter API access)
- [ ] Integration tested with collection system

## Monitoring & Maintenance

### Daily Checks
- API connectivity and tweet collection
- Monitor for new code/tutorial releases
- No collection gaps

### Weekly Tasks
- Review new techniques for intelligence applicability
- Collect shared code repositories
- Verify technical accuracy of methods
- Update technique catalog

### Monthly Tasks
- Audit event classification accuracy
- Assess reliability based on technique verification
- Update code repository list
- Review maritime intelligence techniques shared

## Related Sources

Complementary sources for practical GIS and OSINT techniques:

- **@EsriTraining**: Formal GIS training
- **@Esri**: GIS platform updates
- **@bellingcat**: OSINT investigations
- **@OSINT_Tactical**: Tactical OSINT techniques
- **@sector035**: OSINT practitioner
- **@IntelTechniques**: OSINT tools and methods
- **GIS Stack Exchange**: Technical Q&A
- **GitHub**: Code repositories for geospatial OSINT
