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

# Perplexity Search

AI-powered web search. OSINT: event confidence validation + location research.

## When to use

Fact-check claims, verify locations, corroborate high-priority events (conflict/military/attack/disaster/sanctions/nuclear).

## Entry-point Commands

Set `PERPLEXITY_API_KEY` first. All requests → `https://api.perplexity.ai/chat/completions`.

```bash
# OSINT confidence check (recency=hour for current events)
curl -s https://api.perplexity.ai/chat/completions \
  -H "Authorization: Bearer $PERPLEXITY_API_KEY" \
  -H "Content-Type: application/json" \
  -d "$(jq -n --arg q "YOUR QUERY" \
    '{model:"sonar-pro",search_recency_filter:"hour",messages:[{role:"user",content:$q}]}')" \
  | jq -r '.choices[0].message.content'

# With citations
curl -s ... | jq '{answer: .choices[0].message.content, citations: .citations}'
```

Model selection:

| Model | Use case |
|-------|----------|
| `sonar` | Quick facts, lightweight |
| `sonar-pro` | Complex synthesis — default for OSINT validation |
| `sonar-reasoning-pro` | Chain-of-thought decisions |
| `sonar-deep-research` | Exhaustive multi-source reports |

`search_recency_filter` values: `"hour"`, `"day"`, `"week"`, `"month"`.

## Pitfalls

- Rate limits vary — `sleep 1` between batches.
- Vague queries → poor answers.
- Check key: `test -n "$PERPLEXITY_API_KEY" && echo "ok" || echo "missing"`.
- Max 50 calls/bucket.

## See also

- `skills/remember-as-you-go/SKILL.md` — log rate limit patterns, model selection findings
- `skills/agent-browser/SKILL.md` — navigate to citations for deeper verification
- Perplexity docs: https://docs.perplexity.ai/
