#!/usr/bin/env node

/**
 * Agent Browser CLI
 * 
 * Command-line interface for agent-browser automation via Browserbase.
 * Usage: node bin/agent-browser/cli.js [command] [options]
 */

const Browserbase = require('./index.js');

const args = process.argv.slice(2);
const command = args[0];

async function main() {
  if (!command || command === '--help' || command === '-h') {
    console.log(`
Agent Browser CLI

Usage:
  node bin/agent-browser/cli.js <command> [options]

Commands:
  navigate <url>              Navigate to URL and capture screenshot
  screenshot <url>            Take screenshot of URL
  extract-text <url>          Extract text from URL
  extract-links <url>         Extract all links from URL
  help                        Show this help message

Environment Variables:
  BROWSERBASE_API_KEY         Required: Your Browserbase API key

Examples:
  node bin/agent-browser/cli.js navigate https://example.com
  node bin/agent-browser/cli.js screenshot https://example.com
  node bin/agent-browser/cli.js extract-links https://example.com
    `);
    process.exit(0);
  }

  if (!process.env.BROWSERBASE_API_KEY) {
    console.error('Error: BROWSERBASE_API_KEY environment variable not set');
    process.exit(1);
  }

  try {
    const { Browserbase } = require('./index.js');
    const client = new Browserbase({
      apiKey: process.env.BROWSERBASE_API_KEY,
    });

    switch (command) {
      case 'help':
        console.log('Help command');
        break;
      default:
        console.error(`Unknown command: ${command}`);
        console.log('Run with --help for usage information');
        process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
