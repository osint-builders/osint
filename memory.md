# Execution Memory

This file contains execution learnings captured during AI-assisted workflows. Each entry represents a non-obvious solution, error resolution, or environment quirk discovered through trial and error.

**Purpose**: Prevent repeating mistakes and eliminate future guesswork.

**Guidelines**: 
- Only remember pain points, not trivial execution
- Include concrete examples and error messages
- Keep entries actionable and specific
- Remove obsolete entries as tools evolve

**When to Add Memory**:
- ✅ Errors, exceptions, workarounds
- ✅ Non-obvious flags or parameter requirements
- ✅ Environment quirks, configuration issues
- ✅ Tool interaction problems
- ❌ Standard operations, documented behavior
- ❌ First-time successes without issues

---

<!-- Memory entries go below this line -->

## 2026-04-30 — Windward AI blog index returns near-empty body without JS rendering

**Issue**: `https://windward.ai/blog/` renders the article listing client-side via React/Next.js. A bare HTTP fetch returns only page chrome — no article cards inside `/html/body/div[3]`. Headless rendering via `agent-browser` is required.

**Primary approach**: Use `agent-browser open https://windward.ai/blog/` + `wait --load networkidle`, then `eval "return [...document.querySelectorAll('a[href*=\"/blog/\"]')].map(a => a.href)"` to extract article URLs. Navigate to each and extract `h1`, `time[datetime]`, and article body.

**Fallback** (if `agent-browser` unavailable): Exa search (`site:windward.ai/blog ...`) + `fetch_web_pages` — Exa's snapshot service renders JS pages, so article body, author, and publish date come through cleanly.

**Lesson**: Always confirm discovered URLs match the `/blog/{slug}/` include pattern before extracting. Exclude `/blog/` root and tag/category URLs.

## 2026-04-30 — E-PRIME validator word-boundary behaviour

**Validation gotcha**: The E-PRIME validator uses `grep -Ei '\b(is|are|was|were|be|been|being)\b'`. The `\b` word boundaries make it safe to use words like "this", "ships", "between", "before", "begin", "beyond", "Washington", and "based" — only standalone forbidden tokens fail. Quoted speech remains a common trap; rewrite it in active voice.

**Substitutes that pass validation**: `is → remains/shows/stays`, `was/were → got + past participle / operated / showed`, `are → remain / show`, `be → continue / function / serve`. Avoid passive `is/was/were boarded` — use `got boarded` or rewrite with active subject.

## 2026-04-30 — Twitter API credits depleted; X.com requires login for live timeline access

**Issue**: The Twitter API v2 endpoint `/2/users/{id}/tweets` returned HTTP 402 `CreditsDepleted` for the configured `TWITTER_BEARER_TOKEN`. Direct browsing of `https://x.com/{handle}` via `agent-browser` works but only displays a small set of "Top" historical tweets (sorted by engagement, not recency); the `https://x.com/search?q=from%3A{handle}&f=live` endpoint redirects to a login page.

**Fallbacks tried**:
- Nitter mirrors (nitter.net, nitter.privacydev.net, nitter.poast.org): all returned HTTP 503 or empty bodies. xcancel.com presents an antibot verification screen that does not auto-clear.
- Source-owned subscription site (tankertrackers.com/articles): Most articles are paywalled; only the title + publication date are visible publicly.

**Working approach**: Use `perplexity-search` with `search_recency_filter=week` to find news outlets that quote TankerTrackers reports, then fetch those citation URLs with `fetch_web_pages`. Extract the TankerTrackers-attributed claims from the news article bodies. Always validate that Perplexity returned non-empty `.citations[]` — when citations are empty, the model is hallucinating tweet IDs/URLs and content cannot be trusted.

**Lesson**: For Twitter sources with paywalled API access, treat news outlets that cite the source as the authoritative ingestion path. Anchor each event to the citation URL, not a fabricated `x.com/.../status/{id}` link.

## 2026-04-30 — Perplexity URL field often contains citation markers like [1]

**Issue**: Perplexity sonar/sonar-pro responses include source URLs with appended citation markers (e.g., `https://example.com/[1]`). A naive `.split()[0].rstrip(".,)")` strip doesn't remove the bracketed marker, leading to invalid links in the events file.

**Fix**: Apply `re.sub(r"\[\d+\]", "", candidate)` after splitting on whitespace and before stripping trailing punctuation.

## 2026-04-30 — Sonar responses sometimes use **TITLE:** bold markdown for labels

**Issue**: When the model decides to format its TITLE/WHEN/WHERE/etc. block as Markdown headings, it wraps each label with `**...**` (e.g., `**TITLE:**`). A simple `^([A-Z]+):` regex misses these.

**Fix**: Pre-normalize the response with `re.sub(r"\*\*(TITLE|WHEN|WHERE|WHAT|DETAILS|URL)\*\*:", r"\1:", content)` and a sibling pattern for `**TITLE:**` → `TITLE:` before parsing.

## 2026-04-30 — Sonar often replies "no recent news matches" for narrow topics with day filter

**Observation**: With `search_recency_filter:"day"` on niche source topics (e.g., Esri defense GIS, NATO Arctic on a quiet day), Sonar returns explicit refusals like "No specific news story matching the criteria was found" or "I cannot provide a specific news event from the past 7 days based on the search results provided." Treat these as legitimate empty results — don't synthesize content. Detection regex: `r"no (specific|recent) news (story )?(matching|matches|was found)|cannot provide a specific|no concrete recent|no information (on|about)"`.
