#!/usr/bin/env node

/**
 * Perplexity AI Search CLI
 * 
 * Simple command-line interface for Perplexity search operations.
 * Requires PERPLEXITY_API_KEY environment variable.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Load .env if present
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const env = fs.readFileSync(envPath, 'utf-8');
  env.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && !process.env[key]) {
      process.env[key] = value.trim().replace(/^["']|["']$/g, '');
    }
  });
}

const API_KEY = process.env.PERPLEXITY_API_KEY;

if (!API_KEY) {
  console.error('Error: PERPLEXITY_API_KEY environment variable not set');
  console.error('Run: node bin/perplexity/setup.js');
  process.exit(1);
}

// Parse arguments
const args = process.argv.slice(2);

if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
  console.log(`
Perplexity AI Search CLI

Usage:
  node bin/perplexity/cli.js [mode] [query] [options]

Modes:
  --ask <query>              Quick question with AI answer (sonar)
  --search <query>           Direct web search - ranked results (no AI)
  --research <query>         AI-synthesized research (sonar-pro)
  --reason <query>           Chain-of-thought reasoning (sonar-reasoning-pro)
  --deep <query>             Deep comprehensive research (sonar-deep-research)

Options:
  --max-results N            Number of results (1-20, default: 10)
  --recency [day|week|month|year]  Filter by recency
  --domains [domain1,domain2] Limit to specific domains
  --json                     Output as JSON
  --help, -h                 Show this help message

Examples:
  node bin/perplexity/cli.js --ask "What is the latest version of Python?"
  node bin/perplexity/cli.js --search "AI agents" --max-results 5
  node bin/perplexity/cli.js --research "FastAPI vs Django"
  node bin/perplexity/cli.js --reason "Neo4j vs SQLite for graphs"
  node bin/perplexity/cli.js --deep "state of AI observability 2025"
`);
  process.exit(0);
}

// Determine mode and query
let mode = 'sonar';
let query = '';
let maxResults = 10;
let recency = null;
let domains = null;
let outputJson = false;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--ask') {
    mode = 'sonar';
    query = args[++i];
  } else if (args[i] === '--search') {
    mode = 'search';
    query = args[++i];
  } else if (args[i] === '--research') {
    mode = 'sonar-pro';
    query = args[++i];
  } else if (args[i] === '--reason') {
    mode = 'sonar-reasoning-pro';
    query = args[++i];
  } else if (args[i] === '--deep') {
    mode = 'sonar-deep-research';
    query = args[++i];
  } else if (args[i] === '--max-results') {
    maxResults = parseInt(args[++i], 10);
  } else if (args[i] === '--recency') {
    recency = args[++i];
  } else if (args[i] === '--domains') {
    domains = args[++i];
  } else if (args[i] === '--json') {
    outputJson = true;
  }
}

if (!query) {
  console.error('Error: No query provided');
  process.exit(1);
}

// Build request payload
const payload = {
  model: mode,
  messages: [{ role: 'user', content: query }],
  max_tokens: 2048,
};

// Add search options if in search mode
if (mode === 'search') {
  payload.search_recency_filter = recency || undefined;
  if (domains) {
    payload.search_domain_filter = domains.split(',').map(d => d.trim());
  }
}

// Make request to Perplexity API
const options = {
  hostname: 'api.perplexity.ai',
  path: '/chat/completions',
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
  },
};

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);

      if (res.statusCode !== 200) {
        console.error('Error:', response.error?.message || 'Unknown error');
        process.exit(1);
      }

      if (outputJson) {
        console.log(JSON.stringify(response, null, 2));
      } else {
        const content = response.choices?.[0]?.message?.content || '';
        console.log(content);

        // Show citations if available
        if (response.citations && response.citations.length > 0) {
          console.log('\n--- Sources ---');
          response.citations.forEach((citation, i) => {
            console.log(`${i + 1}. ${citation}`);
          });
        }
      }
    } catch (err) {
      console.error('Error parsing response:', err.message);
      process.exit(1);
    }
  });
});

req.on('error', (err) => {
  console.error('Request error:', err.message);
  process.exit(1);
});

req.write(JSON.stringify(payload));
req.end();
