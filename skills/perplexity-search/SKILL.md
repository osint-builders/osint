---
name: perplexity-search
description: Perplexity AI search for web search with AI-powered answers, deep research, and chain-of-thought reasoning. Perform direct web searches, get AI-synthesized research, conduct complex reasoning, and generate comprehensive reports. Use for fact-checking, research, decision-making, and finding current information with citations.
license: MIT
compatibility: Requires PERPLEXITY_API_KEY environment variable. Works on macOS, Linux, Windows with Node.js 16+.
metadata:
  author: osint-builders
  version: "1.0.0"
  provider: perplexity-ai
  cli-location: "../../bin/perplexity"
  upstream: "https://www.perplexity.ai/api"
---

# Perplexity AI Search Skill

Web search with AI-powered answers, deep research, chain-of-thought reasoning, and comprehensive reporting. Query the web with multiple search models ranging from lightweight to expert-level exhaustive research.

## Key Capabilities

### Search Modes
- **Quick Question** — Fast AI answers with grounding
- **Web Search** — Direct ranked results without AI synthesis
- **AI Research** — Synthesized answers from multiple sources
- **Reasoning** — Chain-of-thought analysis for complex decisions
- **Deep Research** — Expert-level exhaustive multi-source investigation

### Models (2025)

| Model | Use Case | Strength |
|-------|----------|----------|
| `sonar` | Quick facts and questions | Lightweight, fast, grounded |
| `sonar-pro` | Complex research topics | Advanced synthesis |
| `sonar-reasoning-pro` | Decision making | Chain-of-thought analysis |
| `sonar-deep-research` | Comprehensive reports | Exhaustive multi-source |

### Advanced Features
- Citation tracking and source attribution
- Recency filtering (day, week, month, year)
- Domain-specific search filtering
- Custom result counts (1-20)
- Structured JSON output
- Batch search operations

## Installation

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

## Quick Start Examples

### Quick Question
```bash
node bin/perplexity/cli.js --ask "What is the latest version of Python?"
```

Output: AI-generated answer with sources

### Web Search
```bash
node bin/perplexity/cli.js --search "SQLite graph patterns" --max-results 5
```

Output: Ranked search results without AI synthesis

### AI Research
```bash
node bin/perplexity/cli.js --research "compare FastAPI vs Django for microservices"
```

Output: Synthesized comparison from multiple sources

### Chain-of-Thought Reasoning
```bash
node bin/perplexity/cli.js --reason "should I use Neo4j or SQLite for small graphs under 10k nodes?"
```

Output: Structured reasoning analysis

### Deep Comprehensive Research
```bash
node bin/perplexity/cli.js --deep "state of AI agent observability 2025"
```

Output: Exhaustive report from expert sources

## Core Commands

### Modes

#### --ask (Quick Question)
Fast AI answer with grounding.

```bash
node bin/perplexity/cli.js --ask "What is Python?"
```

**Model**: sonar
**Best for**: Quick facts, straightforward questions

#### --search (Web Search)
Direct web search with ranked results, no AI synthesis.

```bash
node bin/perplexity/cli.js --search "AI agent frameworks"
```

**Model**: Direct search
**Best for**: Raw results, current information

#### --research (AI Research)
AI-synthesized research from multiple sources.

```bash
node bin/perplexity/cli.js --research "best practices for microservices"
```

**Model**: sonar-pro
**Best for**: Complex topics, synthesized answers

#### --reason (Chain-of-Thought)
Complex reasoning with step-by-step analysis.

```bash
node bin/perplexity/cli.js --reason "monolith vs microservices for startup MVP?"
```

**Model**: sonar-reasoning-pro
**Best for**: Decision making, complex analysis

#### --deep (Deep Research)
Expert-level exhaustive research.

```bash
node bin/perplexity/cli.js --deep "comprehensive guide to building feedback loops for autonomous agents"
```

**Model**: sonar-deep-research
**Best for**: Comprehensive reports, expert analysis

### Options

```bash
--max-results N              Number of results (1-20, default: 10)
--recency [day|week|month|year]  Filter by recency
--domains [domain1,domain2]  Limit to specific domains
--json                       Output as JSON
--help, -h                   Show help message
```

## Common Workflows

### Recent News Search
```bash
node bin/perplexity/cli.js --search "AI agent frameworks" \
  --recency week --max-results 5
```

### Domain-Specific Research
```bash
node bin/perplexity/cli.js --research "Python async/await" \
  --domains github.com,stackoverflow.com
```

### Decision Analysis
```bash
node bin/perplexity/cli.js --reason \
  "GraphQL vs REST for new API project?" \
  --json
```

### Comprehensive Report
```bash
node bin/perplexity/cli.js --deep \
  "state of LLM fine-tuning techniques 2025"
```

### Tech Stack Evaluation
```bash
node bin/perplexity/cli.js --reason \
  "PostgreSQL vs MongoDB for fintech startup? Consider: transactions, scaling, team expertise"
```

## Model Selection Guide

| Need | Use | Why |
|------|-----|-----|
| Quick fact | `--ask` | Fast, lightweight, sufficient for simple questions |
| Find sources | `--search` | Raw results without AI overhead |
| Synthesized answer | `--research` | AI combines multiple sources |
| Complex decision | `--reason` | Chain-of-thought reasoning |
| Comprehensive report | `--deep` | Exhaustive multi-source research |

## Output Formats

### Default (Text)
```bash
node bin/perplexity/cli.js --ask "Python version?"
```

Returns: Plain text answer with optional citations

### JSON Output
```bash
node bin/perplexity/cli.js --ask "Python version?" --json
```

Returns: Structured JSON with full response metadata

## Advanced Features

### Batch Searches
Process multiple queries by creating script file:

```bash
# queries.txt
What is Python 3.12?
How to use async/await?
Best practices for web scraping?
```

Then loop through queries:

```bash
while read query; do
  node bin/perplexity/cli.js --ask "$query"
done < queries.txt
```

### Filtering by Time Range
```bash
# Search only past week
node bin/perplexity/cli.js --search "AI agents" --recency week

# Search past month
node bin/perplexity/cli.js --search "machine learning" --recency month
```

### Domain Filtering
```bash
# Limit to trusted sources
node bin/perplexity/cli.js --research "crypto risks" \
  --domains investopedia.com,sec.gov,forbes.com
```

## Error Handling

### API Key Not Set
```
Error: PERPLEXITY_API_KEY environment variable not set
```

**Solution**: Set environment variable or create `.env` file

```bash
export PERPLEXITY_API_KEY="your_key"
# or create .env with:
# PERPLEXITY_API_KEY="your_key"
```

### Rate Limiting
Perplexity API has rate limits per plan. Check dashboard for current usage.

**Solution**: Implement delays between requests or upgrade plan

### Invalid Query
```
Error: Query too short or invalid
```

**Solution**: Ensure query is meaningful and sufficient length

## Best Practices

1. **Choose appropriate model** — Use `--ask` for quick facts, `--deep` for comprehensive research
2. **Set reasonable result limits** — 5-10 results usually sufficient
3. **Use recency filters** — Add `--recency week` for current information
4. **Filter by domain** — Restrict searches to trusted sources
5. **Batch related queries** — Group similar searches for efficiency
6. **Check citations** — Verify sources in synthesized answers
7. **Use JSON for processing** — Parse structured output for automation
8. **Handle rate limits** — Implement backoff for batch operations

## Troubleshooting

### Setup Issues
```bash
# Verify API key
echo $PERPLEXITY_API_KEY

# Run setup script
node bin/perplexity/setup.js
```

### API Errors
- Check API key validity at: https://www.perplexity.ai/api
- Verify network connectivity
- Check rate limit status

### Query Issues
- Ensure query is specific enough
- Try shorter query if too complex
- Use `--search` first to verify sources exist

## Related

- See [REFERENCE.md](references/REFERENCE.md) for complete API reference
- See [scripts/](scripts/) for example workflows
- Perplexity API: https://www.perplexity.ai/api
- Perplexity Documentation: https://docs.perplexity.ai/
