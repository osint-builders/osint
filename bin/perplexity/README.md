# Perplexity AI Search

Perplexity AI search integration and CLI for web search with AI-powered answers and research.

## Setup

### 1. Get API Key

- Visit: https://www.perplexity.ai/
- Create account or sign in
- Go to API dashboard: https://www.perplexity.ai/api
- Generate new API key

### 2. Configure Environment

Create `.env` file in project root:

```bash
PERPLEXITY_API_KEY="your_api_key_here"
```

Or set environment variable:

```bash
export PERPLEXITY_API_KEY="your_api_key_here"
```

### 3. Verify Setup

```bash
cd bin/perplexity
node setup.js
```

## Usage

From project root:

```bash
# Quick question with AI answer
node bin/perplexity/cli.js --ask "What is Python?"

# Web search with ranked results
node bin/perplexity/cli.js --search "AI agents" --max-results 5

# AI-synthesized research
node bin/perplexity/cli.js --research "FastAPI vs Django"

# Chain-of-thought reasoning
node bin/perplexity/cli.js --reason "Neo4j vs SQLite for graphs"

# Deep comprehensive research
node bin/perplexity/cli.js --deep "state of AI observability 2025"
```

## Models

| Model | Purpose |
|-------|---------|
| `sonar` | Lightweight search with grounding |
| `sonar-pro` | Advanced search for complex queries |
| `sonar-reasoning-pro` | Chain of thought reasoning |
| `sonar-deep-research` | Expert-level exhaustive research |

## Modes

### --ask (Quick Question)
Fast AI answer to a question.

```bash
node bin/perplexity/cli.js --ask "What is the latest Python version?"
```

### --search (Web Search)
Direct web search with ranked results, no AI synthesis.

```bash
node bin/perplexity/cli.js --search "SQLite graph patterns" --max-results 5
```

### --research (AI Research)
AI-synthesized research from multiple sources.

```bash
node bin/perplexity/cli.js --research "compare FastAPI vs Django for microservices"
```

### --reason (Chain-of-Thought)
Complex reasoning with chain-of-thought analysis.

```bash
node bin/perplexity/cli.js --reason "should I use Neo4j or SQLite for small graphs?"
```

### --deep (Deep Research)
Expert-level exhaustive research on topic.

```bash
node bin/perplexity/cli.js --deep "state of AI agent observability 2025"
```

## Options

```bash
--max-results N         Number of results (1-20, default: 10)
--recency [time]        Filter by recency: day, week, month, year
--domains [domains]     Comma-separated domains to search
--json                  Output as JSON
```

## Examples

```bash
# Search with recency filter
node bin/perplexity/cli.js --search "OpenTelemetry" --recency month --max-results 5

# Research with specific domains
node bin/perplexity/cli.js --research "AI best practices" --domains github.com,arxiv.org

# JSON output
node bin/perplexity/cli.js --ask "latest Node.js version" --json
```

## Error Handling

### API Key Not Found
```
Error: PERPLEXITY_API_KEY environment variable not set
Run: node bin/perplexity/setup.js
```

Solution: Set `PERPLEXITY_API_KEY` environment variable or create `.env` file

### Rate Limiting
Perplexity API has rate limits. Check documentation for current limits.

### Invalid Model
Ensure model name matches available options (sonar, sonar-pro, sonar-reasoning-pro, sonar-deep-research).

## Documentation

- Perplexity API: https://www.perplexity.ai/api
- Skill: `../../skills/perplexity-search/SKILL.md`
