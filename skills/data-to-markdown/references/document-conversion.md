# Document Conversion Examples (Word, PowerPoint, PDF)

Examples for converting structured documents (.docx, .pptx, .pdf) to Markdown.

## Word Document (.docx) Conversion

### Example 1: Basic Document Structure

**Input Word Document**:
```
Heading 1: Project Overview
Normal: This project aims to deliver a comprehensive data processing system.

Heading 2: Objectives
Normal: The main objectives include:
List Bullet: Improve processing speed
List Bullet: Reduce memory usage
List Bullet: Enhance error handling

Heading 2: Timeline
Normal: The project runs from January through March 2024.
```

**Output Markdown**:
```markdown
# Project Overview

This project delivers a comprehensive data processing system.

## Objectives

The main objectives:

- Improve processing speed
- Reduce memory usage
- Enhance error handling

## Timeline

The project runs from January through March 2024.
```

### Example 2: Nested Lists

**Input Word Document**:
```
Heading 2: System Components

List Bullet: Frontend
  List Bullet 2: React application
  List Bullet 2: TypeScript
  List Bullet 2: Vite build system
List Bullet: Backend
  List Bullet 2: Node.js server
  List Bullet 2: Express framework
  List Bullet 2: PostgreSQL database
List Bullet: Infrastructure
  List Bullet 2: Docker containers
  List Bullet 2: Kubernetes orchestration
```

**Output Markdown**:
```markdown
## System Components

- **Frontend**
  - React application
  - TypeScript
  - Vite build system
- **Backend**
  - Node.js server
  - Express framework
  - PostgreSQL database
- **Infrastructure**
  - Docker containers
  - Kubernetes orchestration
```

### Example 3: Tables

**Input Word Table**:
```
| Feature        | Status    | Owner      | Due Date   |
| Data Import    | Complete  | Alice      | Jan 15     |
| Processing     | In Progress| Bob       | Feb 1      |
| Export         | Not Started| Carol     | Feb 15     |
```

**Output Markdown**:
```markdown
| Feature | Status | Owner | Due Date |
|---------|--------|-------|----------|
| Data Import | Complete | Alice | Jan 15 |
| Processing | In Progress | Bob | Feb 1 |
| Export | Not Started | Carol | Feb 15 |
```

### Example 4: Text Formatting

**Input Word Document** (with formatting):
```
Normal: The system provides **bold important features** and *italic emphasis*.
Normal: Use `monospace font` for code references like `function_name()`.
Normal: The URL is https://example.com/docs
```

**Output Markdown**:
```markdown
The system provides **important features** with emphasis where needed.
Use `monospace font` for code references like `function_name()`.

Documentation: [https://example.com/docs](https://example.com/docs)
```

### Example 5: Complex Document

**Input Word Document**:
```
Heading 1: API Documentation

Heading 2: Authentication

Normal: The API uses token-based authentication. Include the token in the request header.

Heading 3: Getting a Token

Normal: Send a POST request to /auth/token with credentials:

Code Block:
curl -X POST https://api.example.com/auth/token \
  -H "Content-Type: application/json" \
  -d '{"username":"user","password":"pass"}'

Heading 3: Using the Token

Normal: Include the token in all subsequent requests:

Code Block:
curl https://api.example.com/data \
  -H "Authorization: Bearer YOUR_TOKEN"

Heading 2: Rate Limiting

Normal: The API enforces rate limits to ensure fair usage.

Table:
| Plan       | Requests/Hour | Burst Limit |
| Free       | 100           | 10          |
| Pro        | 1000          | 50          |
| Enterprise | Unlimited     | N/A         |
```

**Output Markdown**:
```markdown
# API Documentation

## Authentication

The API uses token-based authentication. Include the token in the request header.

### Getting a Token

Send a POST request to `/auth/token` with credentials:

```bash
curl -X POST https://api.example.com/auth/token \
  -H "Content-Type: application/json" \
  -d '{"username":"user","password":"pass"}'
```

### Using the Token

Include the token in all subsequent requests:

```bash
curl https://api.example.com/data \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Rate Limiting

The API enforces rate limits for fair usage.

| Plan | Requests/Hour | Burst Limit |
|------|---------------|-------------|
| Free | 100 | 10 |
| Pro | 1,000 | 50 |
| Enterprise | Unlimited | N/A |
```

## PowerPoint (.pptx) Conversion

### Example 6: Basic Slide Deck

**Input PowerPoint**:
```
Slide 1:
Title: Quarterly Results
Subtitle: Q4 2023 Performance

Slide 2:
Title: Revenue Growth
Content:
- Q4 revenue: $10M
- Year-over-year growth: 25%
- New customers: 150

Slide 3:
Title: Key Metrics
Table:
Metric       | Q3    | Q4    | Change
Active Users | 5,000 | 6,500 | +30%
Revenue      | $8M   | $10M  | +25%
Retention    | 92%   | 94%   | +2%

Slide 4:
Title: Next Steps
Content:
1. Expand to new markets
2. Launch mobile app
3. Improve customer support
```

**Output Markdown**:
```markdown
# Quarterly Results: Q4 2023 Performance

## Revenue Growth

Q4 2023 results:

- Revenue: $10M
- Year-over-year growth: 25%
- New customers: 150

## Key Metrics

| Metric | Q3 | Q4 | Change |
|--------|----|----|--------|
| Active Users | 5,000 | 6,500 | +30% |
| Revenue | $8M | $10M | +25% |
| Retention | 92% | 94% | +2% |

## Next Steps

1. Expand to new markets
2. Launch mobile app
3. Improve customer support
```

### Example 7: Technical Presentation

**Input PowerPoint**:
```
Slide 1:
Title: System Architecture Review

Slide 2:
Title: Current Architecture
Content:
- Monolithic application
- Single database instance
- Manual deployment process
Issues:
- Scaling limitations
- Single point of failure
- Slow release cycles

Slide 3:
Title: Proposed Architecture
Content:
- Microservices design
- Distributed database
- CI/CD pipeline
Benefits:
- Horizontal scaling
- Improved resilience
- Faster deployment

Slide 4:
Title: Migration Plan
Content:
Phase 1: Infrastructure setup (2 weeks)
Phase 2: Service decomposition (6 weeks)
Phase 3: Data migration (2 weeks)
Phase 4: Cutover (1 week)

Slide 5:
Title: Timeline
Gantt chart showing phases
Notes: Budget approved, team assembled
```

**Output Markdown**:
```markdown
# System Architecture Review

## Current Architecture

**Components**:
- Monolithic application
- Single database instance
- Manual deployment process

**Issues**:
- Scaling limitations
- Single point of failure
- Slow release cycles

## Proposed Architecture

**Components**:
- Microservices design
- Distributed database
- CI/CD pipeline

**Benefits**:
- Horizontal scaling
- Improved resilience
- Faster deployment

## Migration Plan

| Phase | Task | Duration |
|-------|------|----------|
| Phase 1 | Infrastructure setup | 2 weeks |
| Phase 2 | Service decomposition | 6 weeks |
| Phase 3 | Data migration | 2 weeks |
| Phase 4 | Cutover | 1 week |

**Total Duration**: 11 weeks

**Status**: Budget approved, team assembled
```

### Example 8: Slides with Speaker Notes

**Input PowerPoint**:
```
Slide 1:
Title: Security Update
Content:
- New authentication system
- Enhanced encryption
- Audit logging

Speaker Notes: Emphasize the importance of the audit logging feature. Mention
compliance requirements (SOC 2, GDPR). Highlight that this addresses customer
feedback from Q3.

Slide 2:
Title: Implementation Status
Content:
✓ Authentication complete
✓ Encryption in testing
○ Audit logging in development

Speaker Notes: Authentication rolled out last week. No issues reported.
Encryption testing completes this Friday. Audit logging on track for next
sprint.
```

**Output Markdown**:
```markdown
# Security Update

## New Security Features

- New authentication system
- Enhanced encryption
- Audit logging

> **Context**: This addresses compliance requirements (SOC 2, GDPR) and customer feedback from Q3. Audit logging fulfills critical compliance needs.

## Implementation Status

| Feature | Status |
|---------|--------|
| Authentication | ✓ Complete (rolled out last week, no issues) |
| Encryption | ✓ In testing (completes Friday) |
| Audit logging | In development (on track for next sprint) |
```

## PDF Document Conversion

### Example 9: Technical Manual (PDF)

**Input PDF** (simplified text extraction):
```
Page 1:
INSTALLATION GUIDE
Version 2.0

This guide covers installation and configuration of the XYZ system.

Prerequisites
- Operating System: Linux (Ubuntu 20.04+) or macOS
- Memory: 8GB RAM minimum
- Storage: 50GB available space
- Network: Internet connection required

Page 2:
Installation Steps

1. Download the installer
Visit https://example.com/download and get the latest release.

2. Extract the archive
tar -xzf xyz-installer.tar.gz
cd xyz-installer

3. Run the installation script
sudo ./install.sh

4. Verify installation
xyz --version

Page 3:
Configuration

Edit the configuration file at /etc/xyz/config.yaml:

database:
  host: localhost
  port: 5432
  name: xyz_db

server:
  port: 8080
  host: 0.0.0.0

Restart the service after configuration changes:
sudo systemctl restart xyz
```

**Output Markdown**:
```markdown
# Installation Guide

**Version**: 2.0

This guide covers installation and configuration of the XYZ system.

## Prerequisites

- **Operating System**: Linux (Ubuntu 20.04+) or macOS
- **Memory**: 8GB RAM minimum
- **Storage**: 50GB available space
- **Network**: Internet connection required

## Installation Steps

### 1. Download the Installer

Visit [https://example.com/download](https://example.com/download) and download the latest release.

### 2. Extract the Archive

```bash
tar -xzf xyz-installer.tar.gz
cd xyz-installer
```

### 3. Run the Installation Script

```bash
sudo ./install.sh
```

### 4. Verify Installation

```bash
xyz --version
```

## Configuration

Edit the configuration file at `/etc/xyz/config.yaml`:

```yaml
database:
  host: localhost
  port: 5432
  name: xyz_db

server:
  port: 8080
  host: 0.0.0.0
```

Restart the service after configuration changes:

```bash
sudo systemctl restart xyz
```
```

### Example 10: Research Paper (PDF)

**Input PDF**:
```
Page 1:
Performance Optimization in Distributed Systems
Authors: Jane Smith, John Doe
Abstract: This paper presents novel approaches to optimizing performance in
distributed systems...

Page 2:
1. Introduction
Distributed systems face unique performance challenges. Network latency,
data consistency, and resource allocation all impact system performance.

2. Related Work
Previous research by Chen et al. (2020) explored latency reduction through
caching strategies. Wang and Li (2021) focused on load balancing algorithms.

3. Methodology
We conducted experiments using three different approaches:
- Approach A: Predictive caching
- Approach B: Adaptive load balancing
- Approach C: Combined optimization

Page 3:
4. Results
Our experiments showed significant improvements:

Table 1: Performance Comparison
Approach | Latency (ms) | Throughput (req/s)
Baseline | 150          | 1000
Approach A | 120        | 1200
Approach B | 130        | 1300
Approach C | 90         | 1500

5. Conclusion
The combined optimization approach (Approach C) demonstrates superior
performance across all metrics.
```

**Output Markdown**:
```markdown
# Performance Optimization in Distributed Systems

**Authors**: Jane Smith, John Doe

## Abstract

This paper presents novel approaches to optimizing performance in distributed systems.

## 1. Introduction

Distributed systems face unique performance challenges: network latency, data consistency, and resource allocation all impact system performance.

## 2. Related Work

- **Chen et al. (2020)**: Explored latency reduction through caching strategies
- **Wang and Li (2021)**: Focused on load balancing algorithms

## 3. Methodology

We conducted experiments using three approaches:

- **Approach A**: Predictive caching
- **Approach B**: Adaptive load balancing
- **Approach C**: Combined optimization

## 4. Results

Our experiments showed significant improvements:

**Table 1: Performance Comparison**

| Approach | Latency (ms) | Throughput (req/s) |
|----------|--------------|-------------------|
| Baseline | 150 | 1,000 |
| Approach A | 120 | 1,200 |
| Approach B | 130 | 1,300 |
| Approach C | 90 | 1,500 |

## 5. Conclusion

The combined optimization approach (Approach C) demonstrates superior performance across all metrics.
```

## Conversion Tools

### CLI Usage

### Dependencies for Document Conversion

**Node.js**:
```bash
npm install mammoth      # For .docx
npm install pptx2json    # For .pptx
npm install pdf-parse    # For .pdf
```

**Python**:
```bash
pip install python-docx  # For .docx
pip install python-pptx  # For .pptx
pip install PyPDF2       # For .pdf
```

## Conversion Strategies

### Word Documents
1. Parse document structure using document parser
2. Map paragraph styles to Markdown headings
3. Extract lists and maintain nesting
4. Convert tables to Markdown tables
5. Handle text formatting (bold, italic, code)
6. Extract images and reference or embed
7. Apply E-PRIME to all text

### PowerPoint Presentations
1. Treat each slide as a section (H2)
2. Use slide title as section heading
3. Convert bullet points to lists
4. Extract tables and convert to Markdown
5. Include speaker notes as blockquotes or annotations
6. Note slide numbers for reference
7. Handle charts/diagrams separately

### PDF Documents
1. Extract text while preserving structure
2. Identify heading hierarchy via font analysis
3. Recognize and extract tables
4. Detect code blocks by monospace fonts
5. Handle multi-column layouts
6. Extract images with captions
7. Maintain cross-references and citations

## Quality Checklist

After document conversion:

- [ ] All headings properly leveled
- [ ] Lists maintain original nesting
- [ ] Tables formatted correctly
- [ ] Code blocks have language tags
- [ ] Text formatting preserved (bold, italic, code)
- [ ] Links functional
- [ ] E-PRIME applied
- [ ] Structure logical and clear
- [ ] No content loss from original
- [ ] Speaker notes included (if applicable)
