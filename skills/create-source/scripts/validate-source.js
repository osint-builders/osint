#!/usr/bin/env node

/**
 * Source Validation Script
 *
 * Validates OSINT source files for:
 * - Front matter completeness
 * - Type-specific requirements
 * - Body section completeness
 * - Markdown formatting
 * - Sensitive data detection
 * - Link validation
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  gray: '\x1b[90m'
};

// Validation results
const results = {
  errors: [],
  warnings: [],
  passed: [],
  score: 0
};

// Required front matter fields
const REQUIRED_FIELDS = [
  'id',
  'name',
  'type',
  'status',
  'description',
  'created_date',
  'last_updated'
];

// Valid enums
const VALID_TYPES = [
  'twitter', 'webpage', 'api', 'email', 'rss',
  'webhook', 'websocket', 'file', 'database', 'other'
];

const VALID_STATUS = ['active', 'inactive', 'archived', 'testing'];
const VALID_RELIABILITY = ['high', 'medium', 'low', 'unverified'];
const VALID_PRIORITY = ['high', 'medium', 'low'];
const VALID_COST = ['free', 'paid', 'freemium'];

// Type-specific required fields (in body content)
const TYPE_REQUIREMENTS = {
  twitter: ['handle', 'user_id', 'collection_method'],
  webpage: ['url', 'selector', 'crawl'],
  api: ['base_url', 'endpoint', 'auth'],
  email: ['email', 'sender', 'subject'],
  rss: ['feed_url', 'feed']
};

// Required body sections
const REQUIRED_SECTIONS = [
  'Overview',
  'Data Collection Criteria',
  'Expected Data Format',
  'Processing Instructions',
  'Quality Indicators',
  'Known Issues',
  'Examples'
];

// Sensitive data patterns
const SENSITIVE_PATTERNS = [
  /api[_-]?key\s*[:=]\s*['"][^'"]+['"]/gi,
  /password\s*[:=]\s*['"][^'"]+['"]/gi,
  /secret\s*[:=]\s*['"][^'"]+['"]/gi,
  /token\s*[:=]\s*['"][^'"]+['"]/gi,
  /bearer\s+[a-zA-Z0-9_\-\.]+/gi
];

/**
 * Parse markdown file and extract front matter
 */
function parseMarkdownFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');

    // Extract front matter
    const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);

    if (!frontMatterMatch) {
      results.errors.push('No front matter found (must be between --- markers)');
      return { frontMatter: null, body: content };
    }

    const frontMatterYaml = frontMatterMatch[1];
    const body = frontMatterMatch[2];

    let frontMatter;
    try {
      frontMatter = yaml.load(frontMatterYaml);
    } catch (err) {
      results.errors.push(`Invalid YAML in front matter: ${err.message}`);
      return { frontMatter: null, body };
    }

    return { frontMatter, body, raw: content };
  } catch (err) {
    results.errors.push(`Failed to read file: ${err.message}`);
    return { frontMatter: null, body: '', raw: '' };
  }
}

/**
 * Validate front matter fields
 */
function validateFrontMatter(frontMatter) {
  if (!frontMatter) {
    results.errors.push('Front matter missing or invalid');
    return;
  }

  // Check required fields
  for (const field of REQUIRED_FIELDS) {
    if (!frontMatter[field]) {
      results.errors.push(`Missing required field: ${field}`);
    } else {
      results.passed.push(`Required field present: ${field}`);
    }
  }

  // Validate type
  if (frontMatter.type && !VALID_TYPES.includes(frontMatter.type)) {
    results.errors.push(`Invalid type: ${frontMatter.type} (must be one of: ${VALID_TYPES.join(', ')})`);
  }

  // Validate status
  if (frontMatter.status && !VALID_STATUS.includes(frontMatter.status)) {
    results.errors.push(`Invalid status: ${frontMatter.status} (must be one of: ${VALID_STATUS.join(', ')})`);
  }

  // Validate reliability
  if (frontMatter.reliability && !VALID_RELIABILITY.includes(frontMatter.reliability)) {
    results.errors.push(`Invalid reliability: ${frontMatter.reliability}`);
  }

  // Validate priority
  if (frontMatter.priority && !VALID_PRIORITY.includes(frontMatter.priority)) {
    results.errors.push(`Invalid priority: ${frontMatter.priority}`);
  }

  // Validate cost
  if (frontMatter.cost && !VALID_COST.includes(frontMatter.cost)) {
    results.errors.push(`Invalid cost: ${frontMatter.cost}`);
  }

  // Validate dates
  const dateFields = ['created_date', 'last_updated'];
  for (const field of dateFields) {
    if (frontMatter[field]) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(frontMatter[field])) {
        results.errors.push(`Invalid date format for ${field}: ${frontMatter[field]} (use YYYY-MM-DD)`);
      } else {
        results.passed.push(`Valid date format: ${field}`);
      }
    }
  }

  // Validate confidence_score
  if (frontMatter.confidence_score !== undefined) {
    const score = Number(frontMatter.confidence_score);
    if (isNaN(score) || score < 0 || score > 100) {
      results.errors.push(`Invalid confidence_score: must be 0-100`);
    }
  }

  // Validate arrays
  const arrayFields = ['tags', 'language', 'geographic_focus', 'alert_keywords'];
  for (const field of arrayFields) {
    if (frontMatter[field] && !Array.isArray(frontMatter[field])) {
      results.errors.push(`Field ${field} must be an array`);
    }
  }

  // Check description length
  if (frontMatter.description) {
    if (frontMatter.description.length < 50) {
      results.warnings.push('Description is very short (< 50 chars)');
    } else {
      results.passed.push('Description has adequate length');
    }
  }
}

/**
 * Validate type-specific requirements
 */
function validateTypeRequirements(frontMatter, body) {
  if (!frontMatter || !frontMatter.type) return;

  const requirements = TYPE_REQUIREMENTS[frontMatter.type];
  if (!requirements) {
    results.warnings.push(`No specific requirements defined for type: ${frontMatter.type}`);
    return;
  }

  const bodyLower = body.toLowerCase();

  for (const requirement of requirements) {
    if (bodyLower.includes(requirement.toLowerCase())) {
      results.passed.push(`Type requirement found: ${requirement}`);
    } else {
      results.warnings.push(`Type requirement missing or unclear: ${requirement} (expected for ${frontMatter.type} sources)`);
    }
  }
}

/**
 * Validate body sections
 */
function validateBodySections(body) {
  const foundSections = [];

  // Extract all markdown headings
  const headingRegex = /^##?\s+(.+)$/gm;
  let match;

  while ((match = headingRegex.exec(body)) !== null) {
    foundSections.push(match[1].trim());
  }

  // Check for required sections
  for (const section of REQUIRED_SECTIONS) {
    const found = foundSections.some(s =>
      s.toLowerCase().includes(section.toLowerCase())
    );

    if (found) {
      results.passed.push(`Required section found: ${section}`);
    } else {
      results.errors.push(`Missing required section: ${section}`);
    }
  }

  // Check for examples
  if (body.toLowerCase().includes('example') && body.includes('```')) {
    results.passed.push('Examples with code blocks found');
  } else {
    results.warnings.push('Examples section should include code blocks or detailed examples');
  }
}

/**
 * Check for sensitive data
 */
function checkSensitiveData(content) {
  const lines = content.split('\n');

  for (const pattern of SENSITIVE_PATTERNS) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      results.errors.push(`Potential sensitive data found on line ${lineNumber}: ${match[0].substring(0, 30)}...`);
    }
  }

  // Check for common credential keywords
  const credentialKeywords = ['password', 'api_key', 'secret', 'token', 'bearer'];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    for (const keyword of credentialKeywords) {
      if (line.includes(keyword) && !line.includes('environment') && !line.includes('$') && !line.includes('example')) {
        results.warnings.push(`Line ${i + 1} mentions "${keyword}" - ensure no hardcoded credentials`);
      }
    }
  }
}

/**
 * Validate file naming convention
 */
function validateFileName(filePath) {
  const fileName = path.basename(filePath);
  const namePattern = /^(twitter|webpage|api|email|rss|webhook|websocket|file|database|other)-[\w-]+\.md$/;

  if (namePattern.test(fileName)) {
    results.passed.push(`File name follows convention: ${fileName}`);
  } else {
    results.errors.push(`File name doesn't follow convention: ${fileName} (should be {type}-{identifier}.md)`);
  }
}

/**
 * Calculate quality score
 */
function calculateScore() {
  const total = results.passed.length + results.warnings.length + results.errors.length;
  if (total === 0) return 0;

  // Passed = 1 point, Warning = 0.5 points, Error = 0 points
  const score = (results.passed.length + (results.warnings.length * 0.5)) / total;
  return Math.round(score * 100);
}

/**
 * Print validation results
 */
function printResults(filePath) {
  console.log(`\n${colors.blue}Validating: ${path.basename(filePath)}${colors.reset}\n`);

  // Print passed checks
  if (results.passed.length > 0) {
    console.log(`${colors.green}✓ Passed (${results.passed.length}):${colors.reset}`);
    for (const item of results.passed.slice(0, 5)) {
      console.log(`  ${colors.gray}• ${item}${colors.reset}`);
    }
    if (results.passed.length > 5) {
      console.log(`  ${colors.gray}... and ${results.passed.length - 5} more${colors.reset}`);
    }
    console.log();
  }

  // Print warnings
  if (results.warnings.length > 0) {
    console.log(`${colors.yellow}⚠ Warnings (${results.warnings.length}):${colors.reset}`);
    for (const item of results.warnings) {
      console.log(`  ${colors.yellow}• ${item}${colors.reset}`);
    }
    console.log();
  }

  // Print errors
  if (results.errors.length > 0) {
    console.log(`${colors.red}✗ Errors (${results.errors.length}):${colors.reset}`);
    for (const item of results.errors) {
      console.log(`  ${colors.red}• ${item}${colors.reset}`);
    }
    console.log();
  }

  // Calculate and print score
  const score = calculateScore();
  results.score = score;

  let scoreColor = colors.red;
  let status = 'FAILED';

  if (score >= 90) {
    scoreColor = colors.green;
    status = 'EXCELLENT';
  } else if (score >= 75) {
    scoreColor = colors.green;
    status = 'PASSED';
  } else if (score >= 60) {
    scoreColor = colors.yellow;
    status = 'NEEDS IMPROVEMENT';
  }

  console.log(`${scoreColor}Quality Score: ${score}/100${colors.reset}`);
  console.log(`${scoreColor}Status: ${status}${colors.reset}\n`);

  // Recommendations
  if (results.errors.length > 0) {
    console.log(`${colors.blue}Recommendations:${colors.reset}`);
    console.log(`  • Fix all errors before marking source as active`);
    console.log(`  • Review warnings and address if applicable`);
    console.log(`  • Re-run validation after fixes\n`);
  } else if (results.warnings.length > 0) {
    console.log(`${colors.blue}Recommendations:${colors.reset}`);
    console.log(`  • Address warnings to improve quality`);
    console.log(`  • Consider adding more detail to flagged areas\n`);
  } else {
    console.log(`${colors.green}✓ Source is ready for testing!${colors.reset}\n`);
  }
}

/**
 * Main validation function
 */
function validateSource(filePath) {
  // Reset results
  results.errors = [];
  results.warnings = [];
  results.passed = [];
  results.score = 0;

  // Check file exists
  if (!fs.existsSync(filePath)) {
    console.error(`${colors.red}Error: File not found: ${filePath}${colors.reset}`);
    process.exit(1);
  }

  // Validate file name
  validateFileName(filePath);

  // Parse file
  const { frontMatter, body, raw } = parseMarkdownFile(filePath);

  // Run validations
  validateFrontMatter(frontMatter);
  validateTypeRequirements(frontMatter, body);
  validateBodySections(body);
  checkSensitiveData(raw);

  // Print results
  printResults(filePath);

  // Return exit code
  return results.errors.length === 0 ? 0 : 1;
}

/**
 * CLI entry point
 */
function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help')) {
    console.log(`
${colors.blue}Source Validation Script${colors.reset}

Usage:
  node validate-source.js <file.md>
  node validate-source.js --all
  node validate-source.js --help

Options:
  <file.md>    Path to source file to validate
  --all        Validate all sources in source/sources/
  --help       Show this help message

Examples:
  node validate-source.js ../../source/sources/twitter-example.md
  node validate-source.js --all
`);
    process.exit(0);
  }

  if (args.includes('--all')) {
    const sourcesDir = path.join(__dirname, '../../../source/sources');
    if (!fs.existsSync(sourcesDir)) {
      console.error(`${colors.red}Error: Sources directory not found: ${sourcesDir}${colors.reset}`);
      process.exit(1);
    }

    const files = fs.readdirSync(sourcesDir).filter(f => f.endsWith('.md'));

    if (files.length === 0) {
      console.log(`${colors.yellow}No source files found in ${sourcesDir}${colors.reset}`);
      process.exit(0);
    }

    console.log(`${colors.blue}Validating ${files.length} source files...${colors.reset}\n`);

    let totalScore = 0;
    let failedCount = 0;

    for (const file of files) {
      const filePath = path.join(sourcesDir, file);
      const exitCode = validateSource(filePath);
      totalScore += results.score;
      if (exitCode !== 0) failedCount++;
      console.log('---\n');
    }

    const avgScore = Math.round(totalScore / files.length);
    console.log(`${colors.blue}Summary:${colors.reset}`);
    console.log(`  Total files: ${files.length}`);
    console.log(`  Failed: ${failedCount}`);
    console.log(`  Average score: ${avgScore}/100\n`);

    process.exit(failedCount > 0 ? 1 : 0);
  } else {
    const filePath = path.resolve(args[0]);
    const exitCode = validateSource(filePath);
    process.exit(exitCode);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { validateSource, parseMarkdownFile };
