---
id: twitter-uani
name: United Against Nuclear Iran - Iran Policy & Advocacy
type: twitter
status: active
description: |
  United Against Nuclear Iran (UANI) is a non-partisan advocacy organization focused
  on preventing Iran from acquiring nuclear weapons. Provides research, sanctions
  monitoring, corporate engagement, and policy advocacy on Iran nuclear program,
  regional activities, sanctions compliance, and counter-proliferation efforts.
created_date: "2026-04-30"
last_updated: "2026-04-30"
tags:
  - iran
  - nuclear
  - sanctions
  - advocacy
  - policy
  - compliance
  - osint
reliability: high
confidence_score: 80
update_frequency: "30m"
priority: medium-high
language:
  - en
geographic_focus:
  - iran
  - middle-east
cost: free
requires_auth: true
maintainer: osint-team
alert_keywords:
  - iran
  - nuclear
  - sanctions
  - irgc
  - enrichment
  - compliance
  - designation
  - proliferation
---

# United Against Nuclear Iran - Iran Policy & Advocacy

## Overview

United Against Nuclear Iran (UANI) (@UANI) is a non-partisan, not-for-profit advocacy organization focused on preventing Iran from obtaining nuclear weapons capability. The organization provides:

- Iran nuclear program monitoring and analysis
- Sanctions compliance research and advocacy
- Corporate engagement on Iran business risks
- Policy recommendations to governments
- Sanctions evasion network exposure
- IRGC activities tracking
- Regional proxy operations monitoring
- Counter-proliferation intelligence
- Economic pressure campaign advocacy
- Congressional testimony and briefings

**Account Characteristics:**
- Research-backed advocacy organization
- Sanctions compliance focus
- Corporate engagement campaigns
- Policy influence with US and allied governments
- Regular reports and investigations
- Expert staff and advisory board
- Maximum pressure approach advocacy

**Intelligence Value:**
- Comprehensive Iran sanctions intelligence
- Corporate compliance risk assessment
- Evasion network exposure
- Nuclear program monitoring
- Policy advocacy intelligence
- Enforcement effectiveness tracking
- Economic pressure impact analysis

## Data Collection Criteria

### Twitter Account Details

- **Handle**: UANI
- **Account Type**: Advocacy organization
- **Mission**: Prevent Iranian nuclear weapons capability
- **Expertise**: Nuclear policy, sanctions, compliance, proliferation
- **Content Type**: Research, advocacy, policy recommendations, sanctions alerts
- **Tweet Frequency**: 10-25 tweets per day

### Collection Method

- **Method**: timeline
- **Poll Interval**: Every 30 minutes
- **Include Retweets**: Yes (shares policy and sanctions developments)
- **Include Replies**: No (focus on primary content)
- **Include Quotes**: Yes
- **Thread Handling**: Collect threads for detailed reports

### Content Filters

#### Include Criteria

- Nuclear program developments and analysis
- Sanctions announcements and compliance
- Evasion network exposures
- IRGC activities and designations
- Corporate compliance alerts
- Policy recommendations
- Research reports and investigations
- Congressional testimony
- Enforcement actions
- Regional proxy activities with sanctions implications

#### Exclude Criteria

- General advocacy without intelligence value
- Fundraising appeals
- Event announcements without content
- Pure opinion without research basis

### Keyword Monitoring

**High-Priority Keywords:**
- Nuclear, enrichment, uranium, centrifuge, IAEA
- Sanctions, OFAC, designation, compliance, enforcement
- IRGC, Quds Force, regime
- Evasion, circumvention, front company, shell company
- Proliferation, weapons, missile, WMD
- Oil, export, tanker, shipping
- China, Russia, Syria, Hezbollah
- Corporate, business, trade, investment

**Compliance Keywords:**
- Due diligence, risk, exposure, liability
- Designation, SDN, blocked, prohibited
- Secondary sanctions, extraterritorial
- License, authorization, exemption

**Research Keywords:**
- Report, investigation, exposes, reveals
- Network, scheme, front, beneficial owner
- Analysis, assessment, findings

### Entity Extraction

**Research & Intelligence:**
- Sanctions evasion networks and participants
- Corporate entities with Iran exposure
- Nuclear facilities and developments
- IRGC front companies and operations
- Shipping and logistics networks
- Financial facilitators
- Technology procurement networks

**Policy & Advocacy:**
- Policy recommendations
- Congressional actions
- Administration positions
- International coordination
- Enforcement effectiveness

## Expected Data Format

### Raw Tweet Object

```json
{
  "id": "1234567890",
  "text": "NEW REPORT: UANI exposes Chinese semiconductor firm supplying Iranian military with advanced chips for drone production. Company falsified end-user certificates, evaded export controls. $50M+ in transactions 2023-2024. Details at uani.com/report. Calling for designation. #Iran #Sanctions",
  "created_at": "2026-04-30T14:00:00Z",
  "author": {
    "username": "UANI",
    "name": "United Against Nuclear Iran"
  }
}
```

### Structured Data Extraction

```yaml
content_type: research-report
topic: sanctions-evasion
entities:
  violator:
    type: "Chinese semiconductor firm"
    activity: "supplying Iranian military"
    commodity: "advanced chips for drone production"
  evasion_method:
    - "falsified end-user certificates"
    - "evaded export controls"
  transaction_value: "$50M+"
  period: "2023-2024"
  report_link: "uani.com/report"
uani_action: "calling for designation"
priority: high
tags:
  - sanctions-evasion
  - iran
  - china
  - drones
  - export-controls
  - semiconductors
```

## Quality Indicators

### High Quality Signals

- Original research and investigations
- Documented evasion networks
- Corporate entity identifications
- Transaction details and evidence
- Policy recommendations with rationale
- Official source citations
- Report publications
- Congressional testimony
- Enforcement action tracking

### Low Quality Signals

- Generic advocacy without specifics
- Unsubstantiated claims
- Pure opinion without research
- Incomplete network information

## Examples

### Example 1: Evasion Network Exposure - High Priority

**Raw Tweet:**
```
NEW REPORT: UANI exposes Chinese semiconductor firm supplying Iranian 
military with advanced chips for drone production. Company falsified 
end-user certificates, evaded export controls. $50M+ in transactions 
2023-2024. Full report at uani.com/report. Calling for designation. 
#Iran #Sanctions
```

**Extracted World Event:**
```yaml
title: "UANI report exposes Chinese firm supplying Iran military with semiconductors"
date: 2026-04-30T14:00:00Z
type: sanctions-intelligence
subtype: evasion-network-exposure
priority: high
confidence: high
tags:
  - sanctions-evasion
  - iran
  - china
  - semiconductors
  - military-support
  - export-controls
research_findings:
  violator:
    type: "Chinese semiconductor firm"
    name: "[specified in full report]"
    location: "China"
  illicit_activity:
    supply: "advanced chips"
    beneficiary: "Iranian military"
    end_use: "drone production"
  evasion_methods:
    - "falsified end-user certificates"
    - "evaded export controls"
  scale:
    transaction_value: "$50M+"
    period: "2023-2024"
uani_action:
  recommendation: "designation"
  report: "uani.com/report"
source_credibility: "UANI research report"
significance: "Major sanctions evasion enabling Iranian military capabilities"
```

## Validation Checklist

- [x] Twitter handle verified (@UANI)
- [x] Organization credibility confirmed
- [x] Mission focus appropriate (Iran nuclear/sanctions)
- [x] Collection method configured
- [x] Keywords defined
- [ ] Authentication configured
- [ ] Integration tested
- [ ] Report link extraction verified

## Monitoring & Maintenance

### Daily Checks
- API connectivity
- Report publication capture
- Sanctions alert collection

### Weekly Tasks
- Review research report accuracy
- Track policy recommendations
- Update evasion network database
- Verify compliance alert effectiveness

### Monthly Tasks
- Audit reliability score
- Review advocacy vs intelligence balance
- Update corporate entity tracking
- Validate against official sanctions actions

## Related Sources

- **@JasonMBrodsky**: UANI Policy Director
- **@ofacalert**: Official sanctions monitoring
- **@sanctionswatch**: International sanctions
- **@IranObserve0**: Iran intelligence
- **US Treasury OFAC**: Official sanctions authority
