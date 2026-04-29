#!/usr/bin/env node
/**
 * Example Plain Text to Markdown Conversion
 *
 * Demonstrates detecting structure in plain text and converting
 * to well-formatted Markdown with E-PRIME principles.
 */

const plainTextInput = `
SYSTEM REQUIREMENTS

The system is built for modern hardware. It needs a multi-core processor. The
processor should be from the last 5 years. Memory requirements are 8GB minimum,
16GB recommended. Storage needs are 100GB for the application and data.

INSTALLATION PROCESS

The installation is straightforward. First, download the installer from the
website. Second, extract the downloaded archive. Third, run the installation
script. Fourth, verify that the installation was successful.

KEY FEATURES

The system has several important features. It provides real-time data processing.
Data validation is automatic. There are built-in monitoring capabilities. Export
functionality is included. The system is scalable and performant.

SUPPORTED PLATFORMS

Operating Systems:
- Linux (Ubuntu 20.04 or later)
- macOS (11.0 or later)
- Windows 10/11

The system is compatible with both x86_64 and ARM64 architectures.

CONFIGURATION

After installation, configuration is necessary. Edit the config file located at
/etc/app/config.yaml. The database connection string should be set. The API port
number needs to be configured (default is 8080). Logging level can be adjusted
(options are: debug, info, warn, error).

Example configuration:

database:
  url: postgresql://localhost/mydb
  pool_size: 10

server:
  port: 8080
  host: 0.0.0.0

logging:
  level: info

TROUBLESHOOTING

If the system is not starting, check the logs. The logs are located in /var/log/app/.
Common issues are:
- Database connection failure
- Port already in use
- Insufficient permissions

For additional help, contact support@example.com
`;

/**
 * Detect and convert structure
 */
function convertPlainTextToMarkdown(text) {
    let lines = text.trim().split('\n');
    let markdown = [];
    let inCodeBlock = false;
    let codeBlockLines = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        // Skip empty lines (will add them back strategically)
        if (!trimmed) {
            if (!inCodeBlock) {
                markdown.push('');
            }
            continue;
        }

        // Detect code blocks (indented YAML/JSON-like content)
        if (line.match(/^[a-z_]+:\s*$/) || line.match(/^  [a-z_]+:/)) {
            if (!inCodeBlock) {
                inCodeBlock = true;
                codeBlockLines = [];
            }
            codeBlockLines.push(line);
            continue;
        } else if (inCodeBlock) {
            // End code block
            markdown.push('\n```yaml');
            markdown.push(codeBlockLines.join('\n'));
            markdown.push('```\n');
            inCodeBlock = false;
            codeBlockLines = [];
        }

        // ALL CAPS = H2 heading
        if (trimmed === trimmed.toUpperCase() && trimmed.length > 3 && !trimmed.match(/^[0-9-]/)) {
            markdown.push(`\n## ${toTitleCase(trimmed)}\n`);
            continue;
        }

        // Lines starting with dash = list item
        if (trimmed.match(/^[-*•]\s+/)) {
            markdown.push(trimmed);
            continue;
        }

        // Numbered lists
        if (trimmed.match(/^\d+\.\s+/)) {
            markdown.push(trimmed);
            continue;
        }

        // Regular paragraph
        markdown.push(trimmed);
    }

    // Close any remaining code block
    if (inCodeBlock) {
        markdown.push('\n```yaml');
        markdown.push(codeBlockLines.join('\n'));
        markdown.push('```\n');
    }

    return markdown.join('\n');
}

/**
 * Convert ALL CAPS to Title Case
 */
function toTitleCase(str) {
    return str
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

/**
 * Apply E-PRIME and improve clarity
 */
function refineMarkdown(markdown) {
    // Convert "is/are" statements to more precise language
    let refined = markdown
        // Remove "is/are" + built/designed/located
        .replace(/is built for/gi, 'requires')
        .replace(/is straightforward/gi, 'follows simple steps')
        .replace(/is necessary/gi, 'must occur')
        .replace(/is not starting/gi, 'fails to start')
        .replace(/are located/gi, 'reside')
        .replace(/are:/gi, ':')

        // Replace "It/The system is" with stronger verbs
        .replace(/It provides/gi, 'The system provides')
        .replace(/It needs/gi, 'Requirements include')
        .replace(/The system has/gi, 'The system provides')
        .replace(/There are/gi, 'The system includes')

        // Convert passive "should be" to active
        .replace(/should be set/gi, 'requires configuration')
        .replace(/needs to be configured/gi, 'requires configuration')
        .replace(/can be adjusted/gi, 'supports adjustment')

        // Improve list introductions
        .replace(/The system has several important features\./gi, 'Key features:')
        .replace(/Common issues are:/gi, 'Common issues:')

        // More specific language
        .replace(/The installation is straightforward\./gi, 'Installation follows four steps:')
        .replace(/is compatible with/gi, 'supports')
        .replace(/is scalable and performant/gi, 'scales horizontally and performs efficiently');

    return refined;
}

// Convert and display
console.log('=== Original Plain Text ===\n');
console.log(plainTextInput);

console.log('\n\n=== Initial Markdown Conversion ===\n');
const markdown = convertPlainTextToMarkdown(plainTextInput);
console.log(markdown);

console.log('\n\n=== Refined with E-PRIME ===\n');
const refined = refineMarkdown(markdown);
console.log(refined);

console.log('\n\n=== Final Hand-Polished Version ===\n');
const finalMarkdown = `# System Requirements

The system requires modern hardware:

- **Processor**: Multi-core CPU from last 5 years
- **Memory**: 8GB minimum, 16GB recommended
- **Storage**: 100GB for application and data

## Installation Process

Installation follows four steps:

1. Download the installer from the website
2. Extract the downloaded archive
3. Run the installation script
4. Verify installation success

## Key Features

- Real-time data processing
- Automatic data validation
- Built-in monitoring capabilities
- Export functionality
- Horizontal scaling with efficient performance

## Supported Platforms

**Operating Systems**:
- Linux (Ubuntu 20.04 or later)
- macOS (11.0 or later)
- Windows 10/11

**Architectures**: x86_64, ARM64

## Configuration

After installation, edit the configuration file at \`/etc/app/config.yaml\`:

\`\`\`yaml
database:
  url: postgresql://localhost/mydb
  pool_size: 10

server:
  port: 8080
  host: 0.0.0.0

logging:
  level: info
\`\`\`

**Required settings**:
- Database connection string
- API port number (default: 8080)
- Logging level (debug, info, warn, error)

## Troubleshooting

If the system fails to start, check logs at \`/var/log/app/\`.

**Common issues**:
- Database connection failure
- Port already in use
- Insufficient permissions

**Support**: contact support@example.com
`;

console.log(finalMarkdown);
