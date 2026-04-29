#!/usr/bin/env node

/**
 * Interactive Source Creator
 *
 * Guides users through creating new OSINT sources with:
 * - Interactive prompts for metadata
 * - Type-specific configuration
 * - Example generation
 * - Validation
 * - Automatic manifest update
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  gray: '\x1b[90m',
  bold: '\x1b[1m'
};

// Source types
const SOURCE_TYPES = [
  'twitter', 'webpage', 'api', 'email', 'rss',
  'webhook', 'websocket', 'file', 'database', 'other'
];

// Interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Prompt user for input
 */
function prompt(question) {
  return new Promise(resolve => {
    rl.question(question, answer => {
      resolve(answer.trim());
    });
  });
}

/**
 * Prompt with default value
 */
async function promptWithDefault(question, defaultValue) {
  const answer = await prompt(`${question} ${colors.gray}[${defaultValue}]${colors.reset}: `);
  return answer || defaultValue;
}

/**
 * Prompt for choice from list
 */
async function promptChoice(question, choices) {
  console.log(`\n${colors.blue}${question}${colors.reset}`);
  choices.forEach((choice, index) => {
    console.log(`  ${index + 1}. ${choice}`);
  });

  while (true) {
    const answer = await prompt(`\nEnter choice (1-${choices.length}): `);
    const index = parseInt(answer) - 1;

    if (index >= 0 && index < choices.length) {
      return choices[index];
    }

    console.log(`${colors.red}Invalid choice. Please enter 1-${choices.length}${colors.reset}`);
  }
}

/**
 * Prompt yes/no
 */
async function promptYesNo(question, defaultYes = true) {
  const defaultStr = defaultYes ? 'Y/n' : 'y/N';
  const answer = await prompt(`${question} ${colors.gray}[${defaultStr}]${colors.reset}: `);

  if (!answer) return defaultYes;
  return answer.toLowerCase().startsWith('y');
}

/**
 * Generate UUID-like ID
 */
function generateId(type, name) {
  const slug = name.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return `${type}-${slug}`;
}

/**
 * Get current date in YYYY-MM-DD format
 */
function getCurrentDate() {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

/**
 * Collect basic metadata
 */
async function collectBasicMetadata() {
  console.log(`\n${colors.bold}${colors.blue}=== Source Metadata ===${colors.reset}\n`);

  const metadata = {};

  // Type
  metadata.type = await promptChoice('Select source type:', SOURCE_TYPES);

  // Name
  metadata.name = await prompt('Source name (e.g., "BBC World News RSS Feed"): ');
  while (!metadata.name) {
    console.log(`${colors.red}Name is required${colors.reset}`);
    metadata.name = await prompt('Source name: ');
  }

  // Generate ID
  metadata.id = generateId(metadata.type, metadata.name);
  console.log(`${colors.gray}Generated ID: ${metadata.id}${colors.reset}`);

  // Description
  console.log('\nEnter description (press Enter twice when done):');
  const descLines = [];
  let line;
  while ((line = await prompt('')) !== '' || descLines.length === 0) {
    if (line) descLines.push(line);
  }
  metadata.description = descLines.join('\n  ');

  // Status
  metadata.status = await promptChoice('Select initial status:', [
    'testing',
    'active',
    'inactive'
  ]);

  // Reliability
  metadata.reliability = await promptChoice('Select reliability:', [
    'high',
    'medium',
    'low',
    'unverified'
  ]);

  // Priority
  metadata.priority = await promptChoice('Select priority:', [
    'high',
    'medium',
    'low'
  ]);

  // Update frequency
  metadata.update_frequency = await promptWithDefault(
    'Update frequency (e.g., 5m, 15m, 1h, daily)',
    '15m'
  );

  // Cost
  metadata.cost = await promptChoice('Cost model:', ['free', 'paid', 'freemium']);

  // Authentication
  metadata.requires_auth = await promptYesNo('Requires authentication?', false);

  // Tags
  console.log('\nEnter tags (comma-separated):');
  const tagsInput = await promptWithDefault('Tags', 'world-events,breaking-news');
  metadata.tags = tagsInput.split(',').map(t => t.trim()).filter(t => t);

  // Geographic focus
  console.log('\nEnter geographic focus (comma-separated, e.g., global, us, europe):');
  const geoInput = await promptWithDefault('Geographic focus', 'global');
  metadata.geographic_focus = geoInput.split(',').map(g => g.trim()).filter(g => g);

  // Language
  console.log('\nEnter languages (comma-separated ISO codes, e.g., en, es, fr):');
  const langInput = await promptWithDefault('Languages', 'en');
  metadata.language = langInput.split(',').map(l => l.trim()).filter(l => l);

  // Dates
  metadata.created_date = getCurrentDate();
  metadata.last_updated = getCurrentDate();

  return metadata;
}

/**
 * Collect type-specific configuration
 */
async function collectTypeSpecificConfig(type) {
  console.log(`\n${colors.bold}${colors.blue}=== ${type.toUpperCase()} Configuration ===${colors.reset}\n`);

  const config = {};

  switch (type) {
    case 'twitter':
      config.handle = await prompt('Twitter handle (without @): ');
      config.user_id = await prompt('Twitter user ID (numeric): ');
      config.collection_method = await promptChoice('Collection method:', [
        'timeline',
        'search',
        'stream'
      ]);
      config.include_retweets = await promptYesNo('Include retweets?', false);
      config.include_replies = await promptYesNo('Include replies?', false);
      config.keywords = await prompt('Keywords to monitor (comma-separated): ');
      break;

    case 'webpage':
      config.url = await prompt('Base URL: ');
      config.selectors = await prompt('CSS selectors (comma-separated): ');
      config.crawl_depth = await promptWithDefault('Crawl depth', '2');
      config.update_frequency = await promptWithDefault('Check frequency', '15m');
      break;

    case 'api':
      config.base_url = await prompt('API base URL: ');
      config.endpoints = await prompt('Endpoints (comma-separated): ');
      config.auth_method = await promptChoice('Authentication method:', [
        'none',
        'api_key',
        'oauth',
        'bearer'
      ]);
      config.rate_limit = await prompt('Rate limit (e.g., 100/hour): ');
      break;

    case 'email':
      config.connection_type = await promptChoice('Connection type:', [
        'imap',
        'gmail_api',
        'office365'
      ]);
      config.sender_allowlist = await prompt('Allowed senders (comma-separated): ');
      config.subject_pattern = await prompt('Subject filter pattern: ');
      break;

    case 'rss':
      config.feed_url = await prompt('RSS/Atom feed URL: ');
      config.feed_format = await promptChoice('Feed format:', ['rss', 'atom']);
      config.poll_interval = await promptWithDefault('Poll interval', '10m');
      break;

    default:
      console.log(`${colors.yellow}No specific configuration for type: ${type}${colors.reset}`);
  }

  return config;
}

/**
 * Generate front matter YAML
 */
function generateFrontMatter(metadata) {
  const lines = ['---'];

  lines.push(`id: ${metadata.id}`);
  lines.push(`name: ${metadata.name}`);
  lines.push(`type: ${metadata.type}`);
  lines.push(`status: ${metadata.status}`);

  lines.push('description: |');
  metadata.description.split('\n').forEach(line => {
    lines.push(`  ${line}`);
  });

  lines.push(`created_date: ${metadata.created_date}`);
  lines.push(`last_updated: ${metadata.last_updated}`);

  if (metadata.tags && metadata.tags.length > 0) {
    lines.push('tags:');
    metadata.tags.forEach(tag => {
      lines.push(`  - ${tag}`);
    });
  }

  lines.push(`reliability: ${metadata.reliability}`);
  lines.push(`priority: ${metadata.priority}`);
  lines.push(`update_frequency: "${metadata.update_frequency}"`);

  if (metadata.language && metadata.language.length > 0) {
    lines.push('language:');
    metadata.language.forEach(lang => {
      lines.push(`  - ${lang}`);
    });
  }

  if (metadata.geographic_focus && metadata.geographic_focus.length > 0) {
    lines.push('geographic_focus:');
    metadata.geographic_focus.forEach(geo => {
      lines.push(`  - ${geo}`);
    });
  }

  lines.push(`cost: ${metadata.cost}`);
  lines.push(`requires_auth: ${metadata.requires_auth}`);

  lines.push('---');

  return lines.join('\n');
}

/**
 * Generate body template based on type
 */
function generateBodyTemplate(metadata, config) {
  const type = metadata.type;

  let body = `
# ${metadata.name}

## Overview

[Provide detailed overview of this source, its relevance to world event monitoring, and typical content types.]

## Data Collection Criteria

### ${type.charAt(0).toUpperCase() + type.slice(1)} Configuration

`;

  // Add type-specific configuration
  for (const [key, value] of Object.entries(config)) {
    body += `- **${key}**: ${value}\n`;
  }

  body += `
### Collection Details

[Describe specific collection criteria, filters, and parameters]

## Expected Data Format

[Describe the expected data structure, format, and fields]

\`\`\`json
{
  "example": "data structure"
}
\`\`\`

## Processing Instructions

### Data Extraction

1. [Step 1]
2. [Step 2]
3. [Step 3]

### Transformation

[Describe how to transform raw data to world event entity]

## Quality Indicators

### High Quality Signals
- [Signal 1]
- [Signal 2]
- [Signal 3]

### Low Quality Signals
- [Signal 1]
- [Signal 2]
- [Signal 3]

## Known Issues

### Issue 1: [Title]
**Problem**: [Description]
**Workaround**: [Solution]
**Status**: [Status]

## Examples

### Example 1: [Title]

**Raw Data:**
\`\`\`
[Example raw data]
\`\`\`

**Extracted Event:**
\`\`\`yaml
title: "[Event title]"
date: 2026-04-29T14:32:00Z
type: [type]
location:
  name: "[Location]"
priority: [priority]
\`\`\`

## Validation Checklist

- [ ] Source accessible
- [ ] Authentication working (if required)
- [ ] Data extraction working
- [ ] Quality checks passing
- [ ] Transformation working
- [ ] Examples complete

## Monitoring & Maintenance

### Daily Checks
- [Check 1]

### Weekly Tasks
- [Task 1]

### Monthly Tasks
- [Task 1]
`;

  return body;
}

/**
 * Save source file
 */
function saveSourceFile(metadata, config, content) {
  const fileName = `${metadata.type}-${metadata.id.replace(`${metadata.type}-`, '')}.md`;
  const sourcesDir = path.join(__dirname, '../../../source/sources');

  // Create sources directory if it doesn't exist
  if (!fs.existsSync(sourcesDir)) {
    fs.mkdirSync(sourcesDir, { recursive: true });
  }

  const filePath = path.join(sourcesDir, fileName);

  // Check if file already exists
  if (fs.existsSync(filePath)) {
    throw new Error(`File already exists: ${filePath}`);
  }

  fs.writeFileSync(filePath, content, 'utf-8');

  return filePath;
}

/**
 * Main creation workflow
 */
async function createSource() {
  console.log(`
${colors.bold}${colors.blue}╔═══════════════════════════════════════════╗
║   OSINT Source Creator                    ║
║   Interactive source creation wizard      ║
╚═══════════════════════════════════════════╝${colors.reset}
`);

  try {
    // Collect metadata
    const metadata = await collectBasicMetadata();

    // Collect type-specific config
    const config = await collectTypeSpecificConfig(metadata.type);

    // Generate content
    const frontMatter = generateFrontMatter(metadata);
    const body = generateBodyTemplate(metadata, config);
    const content = frontMatter + '\n' + body;

    // Preview
    console.log(`\n${colors.bold}${colors.blue}=== Preview ===${colors.reset}\n`);
    console.log(colors.gray + content.substring(0, 500) + '...' + colors.reset);

    // Confirm save
    const shouldSave = await promptYesNo('\nSave this source file?', true);

    if (!shouldSave) {
      console.log(`${colors.yellow}Cancelled. Source not saved.${colors.reset}`);
      rl.close();
      return;
    }

    // Save file
    const filePath = saveSourceFile(metadata, config, content);

    console.log(`\n${colors.green}✓ Source created successfully!${colors.reset}`);
    console.log(`${colors.gray}File: ${filePath}${colors.reset}\n`);

    // Next steps
    console.log(`${colors.bold}Next steps:${colors.reset}`);
    console.log(`  1. Edit the file to complete all sections`);
    console.log(`  2. Validate: ${colors.blue}node scripts/validate-source.js ${path.basename(filePath)}${colors.reset}`);
    console.log(`  3. Test: ${colors.blue}node scripts/test-source.js ${path.basename(filePath)}${colors.reset}`);
    console.log(`  4. Update manifest: ${colors.blue}node scripts/update-manifest.js add ${path.basename(filePath)}${colors.reset}\n`);

  } catch (err) {
    console.error(`\n${colors.red}Error: ${err.message}${colors.reset}\n`);
  }

  rl.close();
}

/**
 * CLI entry point
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help')) {
    console.log(`
${colors.blue}Interactive Source Creator${colors.reset}

Usage:
  node create-source.js              Interactive mode
  node create-source.js --help       Show this help

This script guides you through creating a new OSINT source with:
- Interactive prompts for all metadata
- Type-specific configuration
- Template generation
- Validation guidance

The generated source file will need further editing to complete
all sections with specific details.
`);
    process.exit(0);
  }

  await createSource();
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { createSource, generateFrontMatter, generateBodyTemplate };
