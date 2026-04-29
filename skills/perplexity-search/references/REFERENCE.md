# Perplexity AI Search API Reference

Complete command and option reference for Perplexity search integration.

## Quick Reference

```bash
# Quick question
node bin/perplexity/cli.js --ask "query"

# Web search
node bin/perplexity/cli.js --search "query" --max-results 10

# AI research
node bin/perplexity/cli.js --research "query"

# Reasoning
node bin/perplexity/cli.js --reason "query"

# Deep research
node bin/perplexity/cli.js --deep "query"
```

## Modes

### --ask (Quick Question)
Fast AI answer using `sonar` model.

```bash
node bin/perplexity/cli.js --ask "What is Python?"
node bin/perplexity/cli.js --ask "How do I use async/await?"
node bin/perplexity/cli.js --ask "Latest TypeScript version?"
```

**Model**: sonar
**Speed**: Fast
**Cost**: Lower
**Best for**: Straightforward questions, quick facts

### --search (Web Search)
Direct web search with ranked results.

```bash
node bin/perplexity/cli.js --search "Python frameworks"
node bin/perplexity/cli.js --search "AI agent patterns" --max-results 5
node bin/perplexity/cli.js --search "GraphQL" --recency month
```

**Model**: Direct search (no AI synthesis)
**Speed**: Very fast
**Cost**: Lower
**Best for**: Finding sources, current information

### --research (AI Research)
AI-synthesized research using `sonar-pro`.

```bash
node bin/perplexity/cli.js --research "FastAPI vs Django"
node bin/perplexity/cli.js --research "best practices for microservices"
node bin/perplexity/cli.js --research "comparing database options"
```

**Model**: sonar-pro
**Speed**: Medium
**Cost**: Medium
**Best for**: Complex topics, synthesized answers

### --reason (Chain-of-Thought)
Complex reasoning using `sonar-reasoning-pro`.

```bash
node bin/perplexity/cli.js --reason "should I use NoSQL or SQL?"
node bin/perplexity/cli.js --reason "monolith vs microservices decision"
node bin/perplexity/cli.js --reason "which cloud provider for startup?"
```

**Model**: sonar-reasoning-pro
**Speed**: Slower
**Cost**: Higher
**Best for**: Decision making, complex analysis

### --deep (Deep Research)
Expert-level research using `sonar-deep-research`.

```bash
node bin/perplexity/cli.js --deep "state of AI observability 2025"
node bin/perplexity/cli.js --deep "comprehensive guide to LLM fine-tuning"
node bin/perplexity/cli.js --deep "future of distributed systems"
```

**Model**: sonar-deep-research
**Speed**: Slowest
**Cost**: Highest
**Best for**: Comprehensive reports, expert analysis

## Options

### --max-results N
Number of search results (1-20, default: 10).

```bash
node bin/perplexity/cli.js --search "AI" --max-results 5
node bin/perplexity/cli.js --search "Python" --max-results 20
```

**Default**: 10
**Range**: 1-20
**Use**: Limit results for focused searches

### --recency [time]
Filter results by time range.

```bash
node bin/perplexity/cli.js --search "AI trends" --recency day
node bin/perplexity/cli.js --search "Python" --recency week
node bin/perplexity/cli.js --search "Tech news" --recency month
node bin/perplexity/cli.js --search "History" --recency year
```

**Options**: 
- `day` - Past 24 hours
- `week` - Past 7 days
- `month` - Past 30 days
- `year` - Past year

**Use**: Find current information

### --domains [domains]
Limit search to specific domains (comma-separated).

```bash
node bin/perplexity/cli.js --research "Python" \
  --domains python.org,realpython.com

node bin/perplexity/cli.js --search "security" \
  --domains securityresearch.org,owasp.org

node bin/perplexity/cli.js --research "AI" \
  --domains openai.com,arxiv.org,github.com
```

**Format**: Comma-separated domain names
**Example**: `github.com,stackoverflow.com,arxiv.org`
**Use**: Restrict to trusted sources

### --json
Output response as structured JSON.

```bash
node bin/perplexity/cli.js --ask "Python version?" --json
node bin/perplexity/cli.js --search "AI agents" --json | jq '.choices[0]'
```

**Use**: Parse response programmatically, integration with other tools

### --help, -h
Show help message.

```bash
node bin/perplexity/cli.js --help
node bin/perplexity/cli.js -h
```

## Response Format

### Text Output
Default response format with citations.

```
[AI-generated or search results text]

--- Sources ---
1. https://example.com/article
2. https://another-source.com/page
```

### JSON Output
Structured response with metadata.

```json
{
  "id": "response-id",
  "model": "sonar",
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "answer text"
      }
    }
  ],
  "citations": ["url1", "url2"]
}
```

## Environment Variables

### PERPLEXITY_API_KEY
Required API key for authentication.

```bash
export PERPLEXITY_API_KEY="pplx-your-api-key-here"
```

**Required**: Yes
**Format**: pplx-* prefix
**Source**: https://www.perplexity.ai/api

### Optional Environment
Can also set in `.env` file:

```bash
# .env
PERPLEXITY_API_KEY="pplx-your-key"
```

## Common Examples

### Recent News
```bash
node bin/perplexity/cli.js --search "AI agents" \
  --recency week \
  --max-results 5
```

### Technical Research
```bash
node bin/perplexity/cli.js --research "async/await in Python" \
  --domains python.org,realpython.com
```

### Decision Making
```bash
node bin/perplexity/cli.js --reason \
  "GraphQL vs REST for new API project? Consider: team expertise, use case, learning curve"
```

### Comprehensive Report
```bash
node bin/perplexity/cli.js --deep \
  "how to build an AI-powered chatbot from scratch in 2025"
```

### Quick Fact Check
```bash
node bin/perplexity/cli.js --ask "Is Python 3.12 released?"
```

### Domain-Specific Deep Dive
```bash
node bin/perplexity/cli.js --deep \
  "latest security vulnerabilities in web frameworks" \
  --domains nvd.nist.gov,cve.mitre.org
```

## Error Messages & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| "PERPLEXITY_API_KEY not set" | Missing env var | Set `PERPLEXITY_API_KEY` or create `.env` |
| "Invalid API key" | Wrong/expired key | Get new key from https://www.perplexity.ai/api |
| "Rate limit exceeded" | Too many requests | Wait or upgrade plan |
| "Query too short" | Insufficient input | Make query more specific |
| "Invalid model" | Wrong mode | Use: ask, search, research, reason, deep |

## Model Capabilities

| Feature | sonar | sonar-pro | reasoning-pro | deep-research |
|---------|-------|-----------|---------------|---------------|
| Speed | Fast | Medium | Slow | Very slow |
| Depth | Basic | Good | Very good | Excellent |
| Cost | Low | Medium | Higher | Highest |
| Citations | Yes | Yes | Yes | Yes |
| Reasoning | No | Yes | Yes | Yes |
| Best for | Quick facts | Complex topics | Decisions | Reports |

## Rate Limits

Rate limits depend on your Perplexity plan. Check dashboard for current usage:

- **Free tier**: Limited requests/day
- **Pro tier**: Higher request limit
- **Enterprise**: Custom limits

**Approach**: Implement delays between requests if hitting limits

```bash
# Example: search with delay
for query in "AI" "ML" "LLM"; do
  node bin/perplexity/cli.js --search "$query"
  sleep 2  # Wait 2 seconds between requests
done
```

## API Endpoint

**Base URL**: `https://api.perplexity.ai`
**Endpoint**: `/chat/completions`
**Method**: POST
**Auth**: Bearer token in Authorization header

## Related Documentation

- Setup: `../../bin/perplexity/README.md`
- Skill: `../SKILL.md`
- Perplexity API: https://www.perplexity.ai/api
