#!/usr/bin/env node
/**
 * Example HTML to Markdown Conversion
 *
 * Demonstrates converting HTML content to clean, semantic Markdown
 * with E-PRIME principles applied.
 */

const htmlInput = `
<!DOCTYPE html>
<html>
<head>
    <title>API Documentation</title>
</head>
<body>
    <h1>API Documentation</h1>

    <h2>Overview</h2>
    <p>This API is designed for developers who need to integrate with our platform.
    It is RESTful and uses JSON for data exchange.</p>

    <h2>Authentication</h2>
    <p>The API uses token-based authentication. Your token <strong>must be included</strong>
    in all requests.</p>

    <h3>Getting a Token</h3>
    <p>To get a token, send a POST request to <code>/auth/token</code>:</p>
    <pre><code class="language-bash">curl -X POST https://api.example.com/auth/token \
  -H "Content-Type: application/json" \
  -d '{"username": "user", "password": "pass"}'
</code></pre>

    <h2>Endpoints</h2>
    <table>
        <thead>
            <tr>
                <th>Method</th>
                <th>Endpoint</th>
                <th>Description</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>GET</td>
                <td>/users</td>
                <td>Retrieve all users</td>
            </tr>
            <tr>
                <td>POST</td>
                <td>/users</td>
                <td>Create a new user</td>
            </tr>
            <tr>
                <td>GET</td>
                <td>/users/:id</td>
                <td>Get user by ID</td>
            </tr>
        </tbody>
    </table>

    <h2>Rate Limiting</h2>
    <p>Rate limits are enforced to ensure fair usage:</p>
    <ul>
        <li>Free tier: 100 requests per hour</li>
        <li>Pro tier: 1,000 requests per hour</li>
        <li>Enterprise: Unlimited requests</li>
    </ul>

    <blockquote>
        <p><strong>Note:</strong> Rate limit headers are included in all responses.</p>
    </blockquote>
</body>
</html>
`;

/**
 * Simple HTML to Markdown converter
 * This is a demonstration - production use should leverage proper libraries
 */
function convertHTMLToMarkdown(html) {
    let markdown = html;

    // Remove HTML comments
    markdown = markdown.replace(/<!--[\s\S]*?-->/g, '');

    // Convert headings
    markdown = markdown.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1');
    markdown = markdown.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '\n## $1\n');
    markdown = markdown.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '\n### $3\n');
    markdown = markdown.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '\n#### $1\n');

    // Convert bold and italic
    markdown = markdown.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
    markdown = markdown.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');
    markdown = markdown.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
    markdown = markdown.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');

    // Convert code
    markdown = markdown.replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`');

    // Convert pre+code blocks (preserve language)
    markdown = markdown.replace(
        /<pre><code class="language-(\w+)">([\s\S]*?)<\/code><\/pre>/gi,
        '\n```$1\n$2\n```\n'
    );
    markdown = markdown.replace(/<pre><code>([\s\S]*?)<\/code><\/pre>/gi, '\n```\n$1\n```\n');

    // Convert links
    markdown = markdown.replace(/<a\s+href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)');

    // Convert lists
    markdown = markdown.replace(/<ul[^>]*>/gi, '\n');
    markdown = markdown.replace(/<\/ul>/gi, '\n');
    markdown = markdown.replace(/<ol[^>]*>/gi, '\n');
    markdown = markdown.replace(/<\/ol>/gi, '\n');
    markdown = markdown.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1');

    // Convert blockquotes
    markdown = markdown.replace(/<blockquote[^>]*>/gi, '\n> ');
    markdown = markdown.replace(/<\/blockquote>/gi, '\n');

    // Convert paragraphs
    markdown = markdown.replace(/<p[^>]*>/gi, '\n');
    markdown = markdown.replace(/<\/p>/gi, '\n');

    // Remove remaining HTML tags
    markdown = markdown.replace(/<[^>]+>/g, '');

    // Clean up whitespace
    markdown = markdown.replace(/\n\s*\n\s*\n/g, '\n\n');
    markdown = markdown.trim();

    return markdown;
}

/**
 * Apply E-PRIME principles
 */
function applyEPrime(text) {
    // This is a simplified example - real implementation needs NLP
    const replacements = [
        // "is/are" + adjective
        { pattern: /is designed for/gi, replacement: 'serves' },
        { pattern: /is RESTful/gi, replacement: 'follows REST principles' },
        { pattern: /are enforced/gi, replacement: 'enforce fair usage' },
        { pattern: /are included/gi, replacement: 'appear' },

        // "must be" constructions
        { pattern: /must be included/gi, replacement: 'must appear' },

        // General "is" patterns
        { pattern: /This API is/gi, replacement: 'This API' },
    ];

    let result = text;
    for (const { pattern, replacement } of replacements) {
        result = result.replace(pattern, replacement);
    }

    return result;
}

// Convert and display
console.log('=== Original HTML ===\n');
console.log(htmlInput);

console.log('\n\n=== Converted Markdown ===\n');
let markdown = convertHTMLToMarkdown(htmlInput);
console.log(markdown);

console.log('\n\n=== With E-PRIME Applied ===\n');
const eprimeMarkdown = applyEPrime(markdown);
console.log(eprimeMarkdown);

console.log('\n\n=== Final Output ===\n');
// Manual refinement for demonstration
const finalMarkdown = `# API Documentation

## Overview

This API serves developers who integrate with our platform. The API follows REST principles and uses JSON for data exchange.

## Authentication

The API uses token-based authentication. Your token must appear in all requests.

### Getting a Token

To get a token, send a POST request to \`/auth/token\`:

\`\`\`bash
curl -X POST https://api.example.com/auth/token \\
  -H "Content-Type: application/json" \\
  -d '{"username": "user", "password": "pass"}'
\`\`\`

## Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | \`/users\` | Retrieve all users |
| POST | \`/users\` | Create a new user |
| GET | \`/users/:id\` | Get user by ID |

## Rate Limiting

Rate limits enforce fair usage:

- **Free tier**: 100 requests per hour
- **Pro tier**: 1,000 requests per hour
- **Enterprise**: Unlimited requests

> **Note**: Rate limit headers appear in all responses.
`;

console.log(finalMarkdown);
