# Plain Text to Markdown Conversion Examples

Examples for converting unstructured or semi-structured plain text into clean, semantic Markdown.

## Basic Text Conversion

### Example 1: Simple Document

**Input Text**:
```
GETTING STARTED

This document explains how to get started with the system. The system is
designed for developers who need to process data efficiently.

INSTALLATION

First, clone the repository. Next, install the dependencies. Finally, configure
the environment variables.

REQUIREMENTS

You need Node.js version 18 or higher. You also need PostgreSQL 14+. Redis 6.0+
is required as well.
```

**Output Markdown**:
```markdown
# Getting Started

This document explains how developers efficiently process data using the system.

## Installation

1. Clone the repository
2. Install dependencies
3. Configure environment variables

## Requirements

- Node.js 18 or higher
- PostgreSQL 14+
- Redis 6.0+
```

### Example 2: Paragraph Detection

**Input Text**:
```
The system processes data in three stages. First, it validates input against
predefined schemas. This ensures data quality and consistency.

Next, it transforms the data using configured mappings. The transformation
engine supports custom JavaScript functions. This provides flexibility for
complex data transformations.

Finally, it outputs results to specified destinations. Supported outputs include
databases, files, and API endpoints.
```

**Output Markdown**:
```markdown
The system processes data in three stages:

1. **Validation**: Validates input against predefined schemas, ensuring data quality and consistency
2. **Transformation**: Transforms data using configured mappings (supports custom JavaScript functions for complex transformations)
3. **Output**: Outputs results to databases, files, or API endpoints
```

## List Detection and Conversion

### Example 3: Detecting Bullet Lists

**Input Text**:
```
The system provides several key features:
- Real-time data processing
- Automatic error handling
- Configurable data pipelines
- Built-in monitoring and logging
- Support for multiple data sources
```

**Output Markdown**:
```markdown
The system provides key features:

- Real-time data processing
- Automatic error handling
- Configurable data pipelines
- Built-in monitoring and logging
- Support for multiple data sources
```

### Example 4: Detecting Numbered Lists

**Input Text**:
```
Follow these steps to deploy:
1. Build the application
2. Run tests to verify functionality
3. Create a Docker image
4. Push the image to the registry
5. Deploy to production
6. Verify deployment success
```

**Output Markdown**:
```markdown
## Deployment Steps

1. Build the application
2. Run tests to verify functionality
3. Create a Docker image
4. Push the image to the registry
5. Deploy to production
6. Verify deployment success
```

### Example 5: Implicit Lists (Prose to List)

**Input Text**:
```
The API supports three authentication methods. You can use API keys for simple
authentication. OAuth 2.0 is available for third-party applications. JWT tokens
are supported for stateless authentication.
```

**Output Markdown**:
```markdown
The API supports three authentication methods:

- **API Keys**: Simple authentication for direct access
- **OAuth 2.0**: Third-party application authentication
- **JWT Tokens**: Stateless authentication with encoded claims
```

## Heading Detection

### Example 6: ALL CAPS Headings

**Input Text**:
```
SYSTEM ARCHITECTURE

The system follows a microservices architecture. Each service handles a specific
domain of functionality.

CORE SERVICES

Authentication Service - Handles user authentication and authorization
Data Service - Manages data storage and retrieval
Processing Service - Executes data transformation pipelines

INFRASTRUCTURE

The infrastructure runs on AWS using ECS for container orchestration.
```

**Output Markdown**:
```markdown
# System Architecture

The system follows a microservices architecture. Each service handles a specific domain.

## Core Services

- **Authentication Service**: Handles user authentication and authorization
- **Data Service**: Manages data storage and retrieval
- **Processing Service**: Executes data transformation pipelines

## Infrastructure

The infrastructure runs on AWS using ECS for container orchestration.
```

### Example 7: Title Case Headings

**Input Text**:
```
Configuration Guide

This guide explains how to configure the system for your environment.

Database Configuration

Set the following environment variables:
DATABASE_URL - PostgreSQL connection string
DATABASE_POOL_SIZE - Connection pool size (default: 10)
DATABASE_TIMEOUT - Query timeout in seconds (default: 30)

Redis Configuration

Configure Redis for caching:
REDIS_URL - Redis connection string
REDIS_TTL - Cache TTL in seconds (default: 3600)
```

**Output Markdown**:
```markdown
# Configuration Guide

This guide explains system configuration for your environment.

## Database Configuration

Set these environment variables:

- `DATABASE_URL`: PostgreSQL connection string
- `DATABASE_POOL_SIZE`: Connection pool size (default: 10)
- `DATABASE_TIMEOUT`: Query timeout in seconds (default: 30)

## Redis Configuration

Configure Redis for caching:

- `REDIS_URL`: Redis connection string
- `REDIS_TTL`: Cache TTL in seconds (default: 3600)
```

## Code Block Detection

### Example 8: Indented Code

**Input Text**:
```
To start the server, run:

    npm start

To run tests:

    npm test

To build for production:

    npm run build
```

**Output Markdown**:
```markdown
## Running the Application

Start the server:

```bash
npm start
```

Run tests:

```bash
npm test
```

Build for production:

```bash
npm run build
```
```

### Example 9: Fenced Code (Preserve)

**Input Text**:
```
Configure the database connection:

```javascript
const config = {
  host: 'localhost',
  port: 5432,
  database: 'myapp'
};
```

This configuration object connects to the local PostgreSQL instance.
```

**Output Markdown**:
```markdown
## Database Configuration

Configure the database connection:

```javascript
const config = {
  host: 'localhost',
  port: 5432,
  database: 'myapp'
};
```

This configuration connects to the local PostgreSQL instance.
```

## E-PRIME Conversion

### Example 10: Converting "To Be" Forms

**Input Text**:
```
The system is fast and reliable. It is designed for high throughput. The
architecture is scalable. Performance is excellent under load. The system is
built on modern technologies.
```

**Output Markdown**:
```markdown
The system delivers fast, reliable performance. Designed for high throughput,
the architecture scales horizontally. Performance remains excellent under load.
Modern technologies power the system.
```

### Example 11: Passive to Active Voice

**Input Text**:
```
The data is processed by the transformation engine. Errors are logged by the
monitoring system. Alerts are sent by the notification service. The database
is updated by the sync process.
```

**Output Markdown**:
```markdown
The transformation engine processes data. The monitoring system logs errors.
The notification service sends alerts. The sync process updates the database.
```

### Example 12: Vague to Specific

**Input Text**:
```
The system is very fast. It is highly scalable. The performance is really good.
The architecture is quite complex but it is well designed.
```

**Output Markdown**:
```markdown
The system processes 10,000 requests per second. Horizontal scaling supports
1M+ concurrent users. Average response time: 50ms (p95: 120ms). The multi-tier
architecture balances complexity with maintainability.
```

## Table Detection

### Example 13: Tabular Data in Text

**Input Text**:
```
PRODUCT PRICING

Product A - $10/month - 100 API calls/day
Product B - $25/month - 1000 API calls/day
Product C - $100/month - Unlimited API calls

All plans include email support. Enterprise plans include phone support.
```

**Output Markdown**:
```markdown
## Product Pricing

| Product | Price | API Calls |
|---------|-------|-----------|
| Product A | $10/month | 100/day |
| Product B | $25/month | 1,000/day |
| Product C | $100/month | Unlimited |

All plans include email support. Enterprise plans include phone support.
```

### Example 14: Key-Value Pairs

**Input Text**:
```
System Information:

Operating System: Ubuntu 22.04 LTS
Kernel Version: 5.15.0
CPU: Intel Xeon E5-2680 v4
Memory: 64GB DDR4
Storage: 2TB NVMe SSD
```

**Output Markdown**:
```markdown
## System Information

| Component | Details |
|-----------|---------|
| Operating System | Ubuntu 22.04 LTS |
| Kernel Version | 5.15.0 |
| CPU | Intel Xeon E5-2680 v4 |
| Memory | 64GB DDR4 |
| Storage | 2TB NVMe SSD |
```

## Quote Detection

### Example 15: Quoted Text

**Input Text**:
```
As the documentation states: "Always validate input before processing. Never
trust user-provided data."

This principle guides our security approach.
```

**Output Markdown**:
```markdown
> Always validate input before processing. Never trust user-provided data.

This principle guides our security approach.
```

## Complex Conversion

### Example 16: Mixed Content

**Input Text**:
```
API REFERENCE

Authentication

The API uses Bearer token authentication. Include the token in the Authorization
header:

Authorization: Bearer YOUR_TOKEN_HERE

Endpoints

GET /users - Retrieve all users
POST /users - Create a new user
GET /users/:id - Get user by ID
PUT /users/:id - Update user
DELETE /users/:id - Delete user

Response Format

All responses are in JSON format. Successful responses include a data field.
Errors include an error field with details.

Example success response:
{
  "data": {
    "id": 123,
    "name": "John Doe"
  }
}

Example error response:
{
  "error": {
    "code": "NOT_FOUND",
    "message": "User not found"
  }
}
```

**Output Markdown**:
```markdown
# API Reference

## Authentication

The API uses Bearer token authentication. Include the token in the Authorization header:

```
Authorization: Bearer YOUR_TOKEN_HERE
```

## Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users` | Retrieve all users |
| POST | `/users` | Create a new user |
| GET | `/users/:id` | Get user by ID |
| PUT | `/users/:id` | Update user |
| DELETE | `/users/:id` | Delete user |

## Response Format

All responses use JSON format. Successful responses include a `data` field. Errors include an `error` field with details.

**Success Response**:
```json
{
  "data": {
    "id": 123,
    "name": "John Doe"
  }
}
```

**Error Response**:
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "User not found"
  }
}
```
```

## Conversion Tools

### CLI Usage

### Programmatic Usage

```javascript
const { convertText } = require('data-to-markdown');

const text = `TITLE\n\nContent here...`;
const markdown = convertText(text, {
  detectLists: true,
  detectTables: true,
  applyEPrime: true
});
```

## Conversion Strategies

### Strategy 1: Section Detection
1. Identify all-caps lines as potential headings
2. Detect title-case lines followed by content
3. Recognize whitespace patterns separating sections
4. Build heading hierarchy based on content flow

### Strategy 2: List Detection
1. Recognize lines starting with `-`, `*`, `•`
2. Detect numbered lists (`1.`, `2.`, etc.)
3. Identify prose containing "first, second, third"
4. Convert to appropriate Markdown list format

### Strategy 3: Code Detection
1. Identify indented blocks (4+ spaces)
2. Recognize common code patterns (brackets, semicolons)
3. Detect language-specific keywords
4. Apply appropriate code fence with language tag

### Strategy 4: Table Detection
1. Identify columnar data (aligned spacing)
2. Recognize key-value pairs
3. Detect repeated structure patterns
4. Convert to Markdown table format

## Quality Checklist

- [ ] Headings properly detected and leveled
- [ ] Lists formatted correctly
- [ ] Code blocks have language tags
- [ ] Tables properly structured
- [ ] E-PRIME applied
- [ ] Text flows logically
- [ ] No redundant content
- [ ] Clear and concise language
