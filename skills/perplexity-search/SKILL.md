---
name: perplexity-search
description: Perplexity AI search for web search with AI-powered answers, deep research, and chain-of-thought reasoning. Perform direct web searches, get AI-synthesized research, conduct complex reasoning, and generate comprehensive reports. Use for fact-checking, research, decision-making, and finding current information with citations.
license: MIT
compatibility: linux (warp-cloud-agent-env-image)
metadata:
  author: osint-builders
  version: "1.0.0"
  provider: perplexity-ai
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
# Test a quick query to confirm the key works
curl -s https://api.perplexity.ai/chat/completions \
  -H "Authorization: Bearer $PERPLEXITY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"sonar","messages":[{"role":"user","content":"ping"}]}' \
  | jq -r '.choices[0].message.content'
```

## Quick Start Examples

All examples use direct `curl` calls to the Perplexity API. Set `PERPLEXITY_API_KEY` first.

### Quick Question
```bash
curl -s https://api.perplexity.ai/chat/completions \
  -H "Authorization: Bearer $PERPLEXITY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"sonar","messages":[{"role":"user","content":"What is the latest version of Python?"}]}' \
  | jq -r '.choices[0].message.content'
```

Output: AI-generated answer with sources

### AI Research
```bash
curl -s https://api.perplexity.ai/chat/completions \
  -H "Authorization: Bearer $PERPLEXITY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"sonar-pro","messages":[{"role":"user","content":"compare FastAPI vs Django for microservices"}]}' \
  | jq -r '.choices[0].message.content'
```

Output: Synthesized comparison from multiple sources

### Deep Research
```bash
curl -s https://api.perplexity.ai/chat/completions \
  -H "Authorization: Bearer $PERPLEXITY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"sonar-deep-research","messages":[{"role":"user","content":"state of AI agent observability 2025"}]}' \
  | jq -r '.choices[0].message.content'
```

Output: Exhaustive report from expert sources

## Core Usage

All requests go to `https://api.perplexity.ai/chat/completions` using the `PERPLEXITY_API_KEY` environment variable.

### Models

| Model | Use Case |
|-------|----------|
| `sonar` | Quick facts, lightweight |
| `sonar-pro` | Complex research, synthesis |
| `sonar-reasoning-pro` | Decision making, chain-of-thought |
| `sonar-deep-research` | Comprehensive, multi-source reports |

### Request Pattern

```bash
curl -s https://api.perplexity.ai/chat/completions \
  -H "Authorization: Bearer $PERPLEXITY_API_KEY" \
  -H "Content-Type: application/json" \
  -d "$(jq -n \
    --arg model "sonar-pro" \
    --arg content "YOUR QUERY HERE" \
    '{model: $model, messages: [{role: "user", content: $content}]}')" \
  | jq -r '.choices[0].message.content'
```

### With recency filter

```bash
curl -s https://api.perplexity.ai/chat/completions \
  -H "Authorization: Bearer $PERPLEXITY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"sonar","search_recency_filter":"week","messages":[{"role":"user","content":"latest AI agent news"}]}' \
  | jq '{answer: .choices[0].message.content, citations: .citations}'
```

### Full JSON response (with citations)

```bash
curl -s https://api.perplexity.ai/chat/completions \
  -H "Authorization: Bearer $PERPLEXITY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"sonar-pro","messages":[{"role":"user","content":"YOUR QUERY"}]}'
```

## Common Workflows

### Recent News Search
```bash
curl -s https://api.perplexity.ai/chat/completions \
  -H "Authorization: Bearer $PERPLEXITY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"sonar","search_recency_filter":"week","messages":[{"role":"user","content":"AI agent frameworks"}]}' \
  | jq -r '.choices[0].message.content'
```

### Decision Analysis
```bash
curl -s https://api.perplexity.ai/chat/completions \
  -H "Authorization: Bearer $PERPLEXITY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"sonar-reasoning-pro","messages":[{"role":"user","content":"GraphQL vs REST for new API project?"}]}' \
  | jq -r '.choices[0].message.content'
```

### Comprehensive Report
```bash
curl -s https://api.perplexity.ai/chat/completions \
  -H "Authorization: Bearer $PERPLEXITY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"sonar-deep-research","messages":[{"role":"user","content":"state of LLM fine-tuning techniques 2025"}]}' \
  | jq -r '.choices[0].message.content'
```

### Batch Queries
```bash
for query in "topic one" "topic two" "topic three"; do
  curl -s https://api.perplexity.ai/chat/completions \
    -H "Authorization: Bearer $PERPLEXITY_API_KEY" \
    -H "Content-Type: application/json" \
    -d "$(jq -n --arg q "$query" '{model:"sonar",messages:[{role:"user",content:$q}]}')" \
    | jq -r '.choices[0].message.content'
done
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

1. **Choose appropriate model** — Use `sonar` for quick facts, `sonar-deep-research` for comprehensive reports
2. **Use recency filters** — Add `"search_recency_filter":"week"` to the JSON body for current information
3. **Filter by domain** — Use `"search_domain_filter":["domain.com"]` in the request body
4. **Batch related queries** — Group similar searches using a shell loop
5. **Check citations** — Parse `.citations[]` from the response to verify sources
6. **Use `jq` for processing** — Pipe responses through `jq` for structured extraction
7. **Handle rate limits** — Add `sleep 1` between batch requests or implement exponential backoff

## Troubleshooting

### Setup Issues
```bash
# Verify API key is set
test -n "$PERPLEXITY_API_KEY" && echo "Key set" || echo "Key missing"
```

### API Errors
- Check API key validity at: https://www.perplexity.ai/api
- Verify network connectivity
- Check rate limit status

### Query Issues
- Ensure query is specific enough
- Try shorter query if too complex
- Use `--search` first to verify sources exist

## Related Tools & Skills

### Skills
- **agent-browser** - Navigate to search results for verification
- **data-to-markdown** - Convert research output to clean Markdown
- **remember-as-you-go** - Capture API key setup, rate limiting patterns, model selection learnings

### System CLIs
- `curl` - Direct Perplexity API calls without wrapper
- `jq` - Parse and filter JSON responses

### Integration Hints
```bash
# Research → Visit sources → Extract pipeline
curl -s https://api.perplexity.ai/chat/completions \
  -H "Authorization: Bearer $PERPLEXITY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"sonar-pro","messages":[{"role":"user","content":"topic"}]}' > results.json
jq -r '.citations[]?' results.json | head -3 | while read url; do
  agent-browser open "$url"
  agent-browser get text "article" > "source_$(echo $url | md5sum | cut -c1-8).txt"
done

# Deep research → Save as Markdown
curl -s https://api.perplexity.ai/chat/completions \
  -H "Authorization: Bearer $PERPLEXITY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"sonar-deep-research","messages":[{"role":"user","content":"topic"}]}' \
  | jq -r '.choices[0].message.content' > report.md
```

## Related

- See [REFERENCE.md](references/REFERENCE.md) for complete API reference
- See [scripts/](scripts/) for example workflows
- Perplexity API: https://www.perplexity.ai/api
- Perplexity Documentation: https://docs.perplexity.ai/
