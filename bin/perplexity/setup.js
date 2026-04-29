#!/usr/bin/env node

/**
 * Perplexity API Setup
 * 
 * Verifies Perplexity API key configuration and provides setup guidance.
 */

const fs = require('fs');
const path = require('path');

console.log('Setting up Perplexity AI Search...\n');

// Check for API key
const apiKey = process.env.PERPLEXITY_API_KEY || '';

if (apiKey) {
  console.log('✓ PERPLEXITY_API_KEY is set');
  console.log(`  Key length: ${apiKey.length} characters`);
  console.log(`  Key preview: ${apiKey.substring(0, 10)}...`);
} else {
  console.log('✗ PERPLEXITY_API_KEY not found\n');
  console.log('Setup steps:\n');
  console.log('1. Get API key:');
  console.log('   - Visit: https://www.perplexity.ai/');
  console.log('   - Create account or sign in');
  console.log('   - Go to API dashboard: https://www.perplexity.ai/api');
  console.log('   - Generate new API key\n');
  
  console.log('2. Set environment variable:\n');
  console.log('   Option A: Shell (temporary)');
  console.log('   export PERPLEXITY_API_KEY="<your_api_key_here>"\n');
  
  console.log('   Option B: .env file (persistent)');
  console.log('   Create or edit .env file in project root:');
  console.log('   PERPLEXITY_API_KEY="<your_api_key_here>"\n');
  
  console.log('   Option C: .bashrc / .zshrc (permanent)');
  console.log('   Add to ~/.bashrc or ~/.zshrc:');
  console.log('   export PERPLEXITY_API_KEY="<your_api_key_here>"\n');
}

// Show available models
console.log('\nAvailable Models:\n');
console.log('  sonar                - Lightweight search with grounding');
console.log('  sonar-pro            - Advanced search for complex queries');
console.log('  sonar-reasoning-pro  - Chain of thought reasoning');
console.log('  sonar-deep-research  - Expert-level exhaustive research\n');

// Show quick start
console.log('Quick Start:\n');
console.log('  # Quick question with AI answer');
console.log('  node bin/perplexity/cli.js --ask "What is Python?"\n');
console.log('  # Web search with ranked results');
console.log('  node bin/perplexity/cli.js --search "AI agents" --max-results 5\n');
console.log('  # AI-synthesized research');
console.log('  node bin/perplexity/cli.js --research "FastAPI vs Django"\n');
console.log('  # Chain-of-thought reasoning');
console.log('  node bin/perplexity/cli.js --reason "Neo4j vs SQLite for graphs"\n');
console.log('  # Deep comprehensive research');
console.log('  node bin/perplexity/cli.js --deep "AI agent observability 2025"\n');

console.log('Documentation: ../../skills/perplexity-search/SKILL.md');
