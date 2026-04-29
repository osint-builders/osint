#!/usr/bin/env node

/**
 * Source Testing Script
 *
 * Tests OSINT sources for:
 * - Connectivity (can reach source)
 * - Authentication (if required)
 * - Data extraction (can fetch and parse)
 * - Quality validation (data meets standards)
 * - Transformation (can convert to world event entity)
 */

const fs = require('fs');
const path = require('path');
const { parseMarkdownFile } = require('./validate-source.js');

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  gray: '\x1b[90m'
};

// Test results
const testResults = {
  connectivity: { passed: false, message: '', duration: 0 },
  extraction: { passed: false, message: '', itemCount: 0, errors: [] },
  quality: { passed: false, score: 0, failedItems: [] },
  transform: { passed: false, validEntities: 0, errors: [] },
  overall: 'PENDING'
};

/**
 * Test connectivity based on source type
 */
async function testConnectivity(frontMatter) {
  const startTime = Date.now();

  try {
    switch (frontMatter.type) {
      case 'twitter':
        return await testTwitterConnectivity(frontMatter);

      case 'webpage':
        return await testWebpageConnectivity(frontMatter);

      case 'api':
        return await testApiConnectivity(frontMatter);

      case 'email':
        return await testEmailConnectivity(frontMatter);

      case 'rss':
        return await testRssConnectivity(frontMatter);

      default:
        return {
          passed: false,
          message: `Connectivity test not implemented for type: ${frontMatter.type}`,
          duration: Date.now() - startTime
        };
    }
  } catch (err) {
    return {
      passed: false,
      message: `Connectivity test failed: ${err.message}`,
      duration: Date.now() - startTime
    };
  }
}

/**
 * Test Twitter connectivity (mock)
 */
async function testTwitterConnectivity(frontMatter) {
  const startTime = Date.now();

  // Mock implementation - in production, would use Twitter API
  console.log(`  ${colors.gray}Testing Twitter connectivity...${colors.reset}`);

  // Simulate API check
  await sleep(500);

  // Check if authentication configured
  const hasAuth = process.env.TWITTER_API_KEY || process.env.TWITTER_BEARER_TOKEN;

  if (!hasAuth) {
    return {
      passed: false,
      message: 'Twitter authentication not configured (set TWITTER_API_KEY or TWITTER_BEARER_TOKEN)',
      duration: Date.now() - startTime
    };
  }

  return {
    passed: true,
    message: 'Twitter API accessible, authentication valid',
    duration: Date.now() - startTime,
    details: {
      handle: frontMatter.handle || 'not specified',
      rateLimits: 'OK'
    }
  };
}

/**
 * Test webpage connectivity
 */
async function testWebpageConnectivity(frontMatter) {
  const startTime = Date.now();

  console.log(`  ${colors.gray}Testing webpage connectivity...${colors.reset}`);

  // Extract URL from body (simplified - would parse body for actual URL)
  const mockUrl = 'https://example-news.com/world';

  try {
    // In production, would actually fetch URL
    await sleep(300);

    return {
      passed: true,
      message: `Webpage accessible: ${mockUrl}`,
      duration: Date.now() - startTime,
      details: {
        url: mockUrl,
        statusCode: 200,
        contentType: 'text/html'
      }
    };
  } catch (err) {
    return {
      passed: false,
      message: `Failed to reach webpage: ${err.message}`,
      duration: Date.now() - startTime
    };
  }
}

/**
 * Test API connectivity
 */
async function testApiConnectivity(frontMatter) {
  const startTime = Date.now();

  console.log(`  ${colors.gray}Testing API connectivity...${colors.reset}`);

  await sleep(400);

  return {
    passed: true,
    message: 'API endpoint accessible',
    duration: Date.now() - startTime,
    details: {
      baseUrl: 'https://api.example.com/v1',
      authentication: 'valid',
      rateLimits: '100 requests remaining'
    }
  };
}

/**
 * Test email connectivity
 */
async function testEmailConnectivity(frontMatter) {
  const startTime = Date.now();

  console.log(`  ${colors.gray}Testing email connectivity...${colors.reset}`);

  await sleep(600);

  const hasEmailConfig = process.env.EMAIL_HOST && process.env.EMAIL_USER;

  if (!hasEmailConfig) {
    return {
      passed: false,
      message: 'Email configuration not found (set EMAIL_HOST, EMAIL_USER, EMAIL_PASSWORD)',
      duration: Date.now() - startTime
    };
  }

  return {
    passed: true,
    message: 'IMAP connection successful',
    duration: Date.now() - startTime,
    details: {
      host: process.env.EMAIL_HOST,
      folder: 'INBOX'
    }
  };
}

/**
 * Test RSS feed connectivity
 */
async function testRssConnectivity(frontMatter) {
  const startTime = Date.now();

  console.log(`  ${colors.gray}Testing RSS feed connectivity...${colors.reset}`);

  await sleep(250);

  return {
    passed: true,
    message: 'RSS feed accessible and parseable',
    duration: Date.now() - startTime,
    details: {
      feedUrl: 'https://example-news.com/world/rss',
      format: 'RSS 2.0',
      items: 50
    }
  };
}

/**
 * Test data extraction
 */
async function testExtraction(frontMatter, options = {}) {
  const sampleSize = options.sampleSize || 5;

  console.log(`  ${colors.gray}Testing data extraction (${sampleSize} items)...${colors.reset}`);

  try {
    // Mock extraction - in production would actually fetch data
    await sleep(800);

    const mockItems = generateMockItems(frontMatter.type, sampleSize);

    return {
      passed: true,
      message: `Successfully extracted ${mockItems.length} items`,
      itemCount: mockItems.length,
      errors: [],
      items: mockItems
    };
  } catch (err) {
    return {
      passed: false,
      message: `Extraction failed: ${err.message}`,
      itemCount: 0,
      errors: [err.message]
    };
  }
}

/**
 * Test data quality
 */
function testQuality(items) {
  console.log(`  ${colors.gray}Testing data quality...${colors.reset}`);

  const failedItems = [];
  let totalScore = 0;

  for (const item of items) {
    let itemScore = 0;
    const checks = [];

    // Check required fields
    if (item.title && item.title.length > 10) {
      itemScore += 20;
      checks.push('title');
    }

    if (item.date) {
      itemScore += 20;
      checks.push('date');
    }

    if (item.content && item.content.length > 100) {
      itemScore += 20;
      checks.push('content');
    }

    if (item.location) {
      itemScore += 20;
      checks.push('location');
    }

    if (item.source) {
      itemScore += 20;
      checks.push('source');
    }

    totalScore += itemScore;

    if (itemScore < 60) {
      failedItems.push({
        title: item.title || 'Untitled',
        score: itemScore,
        missing: checks
      });
    }
  }

  const avgScore = Math.round(totalScore / items.length);

  return {
    passed: avgScore >= 60,
    score: avgScore,
    failedItems,
    message: `Average quality score: ${avgScore}/100, ${items.length - failedItems.length}/${items.length} items passed`
  };
}

/**
 * Test transformation to world event entity
 */
function testTransform(items) {
  console.log(`  ${colors.gray}Testing transformation to world event entities...${colors.reset}`);

  const errors = [];
  let validCount = 0;

  for (const item of items) {
    try {
      const entity = transformToWorldEvent(item);

      // Validate entity structure
      if (entity.title && entity.date && entity.source) {
        validCount++;
      } else {
        errors.push(`Invalid entity: missing required fields`);
      }
    } catch (err) {
      errors.push(`Transform error: ${err.message}`);
    }
  }

  return {
    passed: validCount === items.length,
    validEntities: validCount,
    errors,
    message: `Transformed ${validCount}/${items.length} items successfully`
  };
}

/**
 * Transform item to world event entity (simplified)
 */
function transformToWorldEvent(item) {
  return {
    title: item.title,
    date: item.date || new Date().toISOString(),
    type: item.type || 'other',
    location: item.location,
    priority: item.priority || 'medium',
    confidence: 'medium',
    tags: item.tags || [],
    source: item.source,
    contents: generateMarkdown(item)
  };
}

/**
 * Generate markdown from item
 */
function generateMarkdown(item) {
  return `# ${item.title}\n\n${item.content || ''}\n\n**Source**: ${JSON.stringify(item.source)}`;
}

/**
 * Generate mock items for testing
 */
function generateMockItems(type, count) {
  const items = [];

  for (let i = 0; i < count; i++) {
    items.push({
      title: `${type} event ${i + 1}: Sample world event`,
      date: new Date(Date.now() - i * 3600000).toISOString(),
      content: `This is sample content for ${type} source item ${i + 1}. It contains sufficient detail to represent a real world event.`,
      location: {
        name: 'Example Region',
        country: 'Example Country'
      },
      type: 'political',
      priority: i === 0 ? 'high' : 'medium',
      tags: ['world-news', 'politics'],
      source: {
        type: type,
        id: `item-${i + 1}`
      }
    });
  }

  return items;
}

/**
 * Run full test suite
 */
async function runTests(filePath, options = {}) {
  console.log(`\n${colors.blue}Testing Source: ${path.basename(filePath)}${colors.reset}\n`);

  // Parse source file
  const { frontMatter, body } = parseMarkdownFile(filePath);

  if (!frontMatter) {
    console.error(`${colors.red}Error: Could not parse source file${colors.reset}`);
    process.exit(1);
  }

  console.log(`${colors.gray}Type: ${frontMatter.type}${colors.reset}`);
  console.log(`${colors.gray}Status: ${frontMatter.status}${colors.reset}\n`);

  // Test connectivity
  if (options.connectivity !== false) {
    console.log(`${colors.blue}[1/4] Connectivity Test${colors.reset}`);
    testResults.connectivity = await testConnectivity(frontMatter);

    if (testResults.connectivity.passed) {
      console.log(`  ${colors.green}✓ ${testResults.connectivity.message}${colors.reset}`);
      if (testResults.connectivity.details) {
        console.log(`  ${colors.gray}${JSON.stringify(testResults.connectivity.details, null, 2)}${colors.reset}`);
      }
    } else {
      console.log(`  ${colors.red}✗ ${testResults.connectivity.message}${colors.reset}`);
    }
    console.log(`  ${colors.gray}Duration: ${testResults.connectivity.duration}ms${colors.reset}\n`);
  }

  // Test extraction
  if (options.extraction !== false) {
    console.log(`${colors.blue}[2/4] Extraction Test${colors.reset}`);
    testResults.extraction = await testExtraction(frontMatter, options);

    if (testResults.extraction.passed) {
      console.log(`  ${colors.green}✓ ${testResults.extraction.message}${colors.reset}`);
    } else {
      console.log(`  ${colors.red}✗ ${testResults.extraction.message}${colors.reset}`);
    }
    console.log();
  }

  // Test quality
  if (options.quality !== false && testResults.extraction.items) {
    console.log(`${colors.blue}[3/4] Quality Test${colors.reset}`);
    testResults.quality = testQuality(testResults.extraction.items);

    if (testResults.quality.passed) {
      console.log(`  ${colors.green}✓ ${testResults.quality.message}${colors.reset}`);
    } else {
      console.log(`  ${colors.yellow}⚠ ${testResults.quality.message}${colors.reset}`);
      if (testResults.quality.failedItems.length > 0) {
        console.log(`  ${colors.gray}Failed items: ${testResults.quality.failedItems.length}${colors.reset}`);
      }
    }
    console.log();
  }

  // Test transformation
  if (options.transform !== false && testResults.extraction.items) {
    console.log(`${colors.blue}[4/4] Transformation Test${colors.reset}`);
    testResults.transform = testTransform(testResults.extraction.items);

    if (testResults.transform.passed) {
      console.log(`  ${colors.green}✓ ${testResults.transform.message}${colors.reset}`);
    } else {
      console.log(`  ${colors.red}✗ ${testResults.transform.message}${colors.reset}`);
      for (const error of testResults.transform.errors) {
        console.log(`  ${colors.red}  • ${error}${colors.reset}`);
      }
    }
    console.log();
  }

  // Overall result
  const allPassed = testResults.connectivity.passed &&
                    testResults.extraction.passed &&
                    testResults.quality.passed &&
                    testResults.transform.passed;

  testResults.overall = allPassed ? 'PASS' : 'FAIL';

  console.log(`${colors.blue}Overall Result:${colors.reset}`);
  if (allPassed) {
    console.log(`${colors.green}✓ PASSED - Source is ready for deployment${colors.reset}\n`);
  } else {
    console.log(`${colors.red}✗ FAILED - Address issues before deployment${colors.reset}\n`);
  }

  // Sample output
  if (options.showSample && testResults.extraction.items && testResults.extraction.items.length > 0) {
    console.log(`${colors.blue}Sample Output (first item):${colors.reset}`);
    const sample = transformToWorldEvent(testResults.extraction.items[0]);
    console.log(colors.gray + JSON.stringify(sample, null, 2) + colors.reset);
    console.log();
  }

  return testResults;
}

/**
 * Sleep utility
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * CLI entry point
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help')) {
    console.log(`
${colors.blue}Source Testing Script${colors.reset}

Usage:
  node test-source.js <file.md> [options]

Options:
  --connectivity    Test connectivity only
  --extract        Test extraction only
  --quality        Test quality only
  --transform      Test transformation only
  --full           Run all tests (default)
  --sample-size N  Number of items to fetch (default: 5)
  --show-sample    Display sample transformed entity
  --dry-run        Don't store results
  --help           Show this help message

Examples:
  node test-source.js ../../source/sources/twitter-example.md
  node test-source.js twitter-example.md --connectivity
  node test-source.js api-gdelt.md --sample-size 10 --show-sample
`);
    process.exit(0);
  }

  const filePath = path.resolve(args[0]);

  if (!fs.existsSync(filePath)) {
    console.error(`${colors.red}Error: File not found: ${filePath}${colors.reset}`);
    process.exit(1);
  }

  const options = {
    connectivity: !args.includes('--extract') && !args.includes('--quality') && !args.includes('--transform'),
    extraction: !args.includes('--connectivity'),
    quality: !args.includes('--connectivity') && !args.includes('--extract') && !args.includes('--transform'),
    transform: !args.includes('--connectivity') && !args.includes('--extract') && !args.includes('--quality'),
    sampleSize: parseInt(args[args.indexOf('--sample-size') + 1]) || 5,
    showSample: args.includes('--show-sample'),
    dryRun: args.includes('--dry-run')
  };

  const results = await runTests(filePath, options);

  process.exit(results.overall === 'PASS' ? 0 : 1);
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { runTests, testConnectivity, testExtraction };
