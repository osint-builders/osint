---
name: perplexity-search
description: Optional source corroboration and location research through Perplexity. Verify cited pages directly before using a finding in a published event.
license: MIT
compatibility: linux (warp-cloud-agent-env-image)
metadata:
  author: osint-builders
  version: "1.0.0"
  provider: perplexity-ai
  upstream: "https://www.perplexity.ai/api"
---

# Perplexity Search

Optional search for claim corroboration or ambiguous event locations. A synthesized answer supplies leads; the cited source must support any published fact.

## When to use

Use sparingly when the original report leaves a consequential claim or location uncertain. Read the cited source before accepting the finding, and reject a candidate when evidence remains inadequate.

## Entry-point Commands

This optional skill requires `PERPLEXITY_API_KEY` in the Warp environment. Never print or persist the key. Requests use `https://api.perplexity.ai/chat/completions`.

```bash
# OSINT confidence check for a recent event
curl -s https://api.perplexity.ai/chat/completions \
  -H "Authorization: Bearer $PERPLEXITY_API_KEY" \
  -H "Content-Type: application/json" \
  -d "$(jq -n --arg q "YOUR QUERY" \
    '{model:"sonar-pro",search_recency_filter:"hour",messages:[{role:"user",content:$q}]}')" \
  | jq '{answer: .choices[0].message.content, citations: .citations}'
```

## Pitfalls

- Check the current API documentation for model availability and rate limits.
- Vague queries → poor answers.
- Check key: `test -n "$PERPLEXITY_API_KEY" && echo "ok" || echo "missing"`.
- Avoid routine queries for every tip; external calls add latency and cost.

## See also

- `skills/remember-as-you-go/SKILL.md` — log rate limit patterns, model selection findings
- `skills/agent-browser/SKILL.md` — navigate to citations for deeper verification
- Perplexity docs: https://docs.perplexity.ai/
