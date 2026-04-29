# HTML to Markdown Conversion Examples

Complete examples for converting HTML documents to clean, semantic Markdown.

## Basic HTML Conversion

### Example 1: Simple Document

**Input HTML**:
```html
<!DOCTYPE html>
<html>
<head>
    <title>Getting Started</title>
</head>
<body>
    <h1>Getting Started</h1>
    <p>This is an <strong>introduction</strong> to the system.</p>
    <p>The system <em>requires</em> basic configuration.</p>
</body>
</html>
```

**Output Markdown**:
```markdown
# Getting Started

An **introduction** to the system.

The system *requires* basic configuration.
```

### Example 2: Lists

**Input HTML**:
```html
<h2>Requirements</h2>
<ul>
    <li>Node.js 18 or higher</li>
    <li>PostgreSQL 14+</li>
    <li>Redis 6.0+</li>
</ul>

<h2>Installation Steps</h2>
<ol>
    <li>Clone the repository</li>
    <li>Install dependencies</li>
    <li>Configure environment</li>
    <li>Run the application</li>
</ol>
```

**Output Markdown**:
```markdown
## Requirements

- Node.js 18 or higher
- PostgreSQL 14+
- Redis 6.0+

## Installation Steps

1. Clone the repository
2. Install dependencies
3. Configure environment
4. Run the application
```

### Example 3: Code Blocks

**Input HTML**:
```html
<h2>Configuration</h2>
<p>Set the <code>DATABASE_URL</code> environment variable:</p>
<pre><code class="language-bash">export DATABASE_URL="postgresql://localhost/mydb"
export REDIS_URL="redis://localhost:6379"
</code></pre>
```

**Output Markdown**:
```markdown
## Configuration

Set the `DATABASE_URL` environment variable:

```bash
export DATABASE_URL="postgresql://localhost/mydb"
export REDIS_URL="redis://localhost:6379"
```
```

### Example 4: Tables

**Input HTML**:
```html
<table>
    <thead>
        <tr>
            <th>Parameter</th>
            <th>Type</th>
            <th>Required</th>
            <th>Description</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>name</td>
            <td>string</td>
            <td>Yes</td>
            <td>User's full name</td>
        </tr>
        <tr>
            <td>email</td>
            <td>string</td>
            <td>Yes</td>
            <td>Email address</td>
        </tr>
        <tr>
            <td>age</td>
            <td>number</td>
            <td>No</td>
            <td>User's age</td>
        </tr>
    </tbody>
</table>
```

**Output Markdown**:
```markdown
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| name | string | Yes | User's full name |
| email | string | Yes | Email address |
| age | number | No | User's age |
```

### Example 5: Links and Images

**Input HTML**:
```html
<h2>Documentation</h2>
<p>See the <a href="https://docs.example.com">official documentation</a> for details.</p>
<p>Download the <a href="/files/manual.pdf">user manual</a>.</p>

<h2>Architecture Diagram</h2>
<img src="/images/architecture.png" alt="System Architecture">
```

**Output Markdown**:
```markdown
## Documentation

See the [official documentation](https://docs.example.com) for details.

Download the [user manual](/files/manual.pdf).

## Architecture Diagram

![System Architecture](/images/architecture.png)
```

### Example 6: Blockquotes

**Input HTML**:
```html
<h2>Design Philosophy</h2>
<blockquote>
    <p>Simplicity is the ultimate sophistication.</p>
    <p>The best code is no code at all.</p>
</blockquote>
<p>This principle guides our development approach.</p>
```

**Output Markdown**:
```markdown
## Design Philosophy

> Simplicity is the ultimate sophistication.
>
> The best code is no code at all.

This principle guides our development approach.
```

## Complex HTML Conversion

### Example 7: Nested Structures

**Input HTML**:
```html
<h1>API Reference</h1>

<h2>Authentication</h2>
<p>The API uses token-based authentication.</p>

<h3>Getting a Token</h3>
<p>Send a POST request to <code>/auth/token</code>:</p>
<pre><code class="language-bash">curl -X POST https://api.example.com/auth/token \
  -H "Content-Type: application/json" \
  -d '{"username": "user", "password": "pass"}'
</code></pre>

<h3>Using the Token</h3>
<p>Include the token in the <code>Authorization</code> header:</p>
<pre><code class="language-bash">curl https://api.example.com/data \
  -H "Authorization: Bearer YOUR_TOKEN"
</code></pre>

<h2>Endpoints</h2>

<h3>GET /users</h3>
<p>Retrieve all users.</p>

<h4>Parameters</h4>
<ul>
    <li><code>page</code> - Page number (default: 1)</li>
    <li><code>limit</code> - Results per page (default: 20)</li>
</ul>

<h4>Response</h4>
<pre><code class="language-json">{
  "users": [...],
  "total": 100,
  "page": 1
}
</code></pre>
```

**Output Markdown**:
```markdown
# API Reference

## Authentication

The API uses token-based authentication.

### Getting a Token

Send a POST request to `/auth/token`:

```bash
curl -X POST https://api.example.com/auth/token \
  -H "Content-Type: application/json" \
  -d '{"username": "user", "password": "pass"}'
```

### Using the Token

Include the token in the `Authorization` header:

```bash
curl https://api.example.com/data \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Endpoints

### GET /users

Retrieve all users.

#### Parameters

- `page` - Page number (default: 1)
- `limit` - Results per page (default: 20)

#### Response

```json
{
  "users": [...],
  "total": 100,
  "page": 1
}
```
```

### Example 8: Definition Lists

**Input HTML**:
```html
<h2>Glossary</h2>
<dl>
    <dt>API</dt>
    <dd>Application Programming Interface - a set of protocols for building software</dd>
    
    <dt>REST</dt>
    <dd>Representational State Transfer - an architectural style for web services</dd>
    
    <dt>JWT</dt>
    <dd>JSON Web Token - a compact token format for secure data transmission</dd>
</dl>
```

**Output Markdown**:
```markdown
## Glossary

**API**  
Application Programming Interface - a set of protocols for building software

**REST**  
Representational State Transfer - an architectural style for web services

**JWT**  
JSON Web Token - a compact token format for secure data transmission
```

## E-PRIME Conversion During HTML Processing

### Example 9: Converting "To Be" Forms

**Input HTML**:
```html
<h2>System Status</h2>
<p>The system is operational. All services are running normally.</p>
<p>The database is healthy. No issues were detected.</p>
<p>The API response time is excellent.</p>
```

**Output Markdown (with E-PRIME)**:
```markdown
## System Status

The system operates normally. All services run without issues.

The database performs well. Testing detected no issues.

The API responds in under 50ms.
```

### Example 10: Active Voice Conversion

**Input HTML**:
```html
<h2>Recent Changes</h2>
<p>The authentication module was updated yesterday.</p>
<p>New features were added to the dashboard.</p>
<p>Performance improvements were implemented.</p>
```

**Output Markdown (with E-PRIME)**:
```markdown
## Recent Changes

The team updated the authentication module yesterday.

Developers added new features to the dashboard.

Engineers implemented performance improvements.
```

## Handling Special Cases

### Example 11: Inline Styles (Remove)

**Input HTML**:
```html
<p style="color: red; font-size: 18px;">This is important text.</p>
<div style="background: yellow;">
    <h3>Warning</h3>
    <p>Proceed with caution.</p>
</div>
```

**Output Markdown**:
```markdown
**This is important text.**

### Warning

Proceed with caution.
```

### Example 12: Class and ID Attributes (Remove)

**Input HTML**:
```html
<div id="content" class="main-section">
    <h2 class="section-title">Overview</h2>
    <p class="description">This section provides an overview.</p>
</div>
```

**Output Markdown**:
```markdown
## Overview

This section provides an overview.
```

### Example 13: Comments (Remove)

**Input HTML**:
```html
<!-- This is a comment -->
<h2>Features</h2>
<!-- TODO: Add more features -->
<ul>
    <li>Real-time updates</li>
    <!-- <li>Deprecated feature</li> -->
    <li>Data export</li>
</ul>
```

**Output Markdown**:
```markdown
## Features

- Real-time updates
- Data export
```

### Example 14: HTML Entities

**Input HTML**:
```html
<p>Use &lt;code&gt; tags for code snippets.</p>
<p>Price: $100 &amp; up</p>
<p>Copyright &copy; 2024</p>
```

**Output Markdown**:
```markdown
Use `<code>` tags for code snippets.

Price: $100 & up

Copyright © 2024
```

## Conversion Tools

### CLI Usage

```bash
# Convert HTML file
node bin/data-to-markdown/cli.js convert input.html output.md

# Convert with E-PRIME validation
node bin/data-to-markdown/cli.js convert input.html output.md --validate-eprime

# Preview without saving
node bin/data-to-markdown/cli.js preview input.html
```

### Programmatic Usage

```javascript
const { convertHTML } = require('data-to-markdown');

const html = '<h1>Title</h1><p>Content here.</p>';
const markdown = convertHTML(html, {
  applyEPrime: true,
  preserveComments: false,
  removeStyles: true
});

console.log(markdown);
```

## Quality Checklist

After HTML conversion:

- [ ] All HTML tags converted to Markdown
- [ ] Heading hierarchy preserved
- [ ] Lists properly formatted
- [ ] Code blocks have language specifications
- [ ] Tables properly structured
- [ ] Links working and descriptive
- [ ] Images have alt text
- [ ] No inline styles remain
- [ ] No HTML comments remain
- [ ] E-PRIME applied (if enabled)
- [ ] Text is clear and concise
