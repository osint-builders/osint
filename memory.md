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

**Issue**: `https://windward.ai/blog/` renders the article listing client-side via React/Next.js. The bare HTML fetch returns only the page chrome (title, footer, subscribe form) with no article cards inside `/html/body/div[3]`. With no `agent-browser` available in the sandbox, headless rendering was not an option.

**Workaround**: Used Exa search (`site:windward.ai/blog ...`) to discover individual article URLs and `fetch_web_pages` to retrieve fully-rendered article bodies. Exa's snapshot service appears to render the JS pages, so the article body, author, and publish date come through cleanly without needing Playwright/Puppeteer locally.

**Lesson**: For SPA-rendered blogs (Windward, similar Next.js sites), prefer Exa search + page-fetch combo over the raw blog index when no headless browser is present. Confirm article URLs match the `/blog/{slug}/` include pattern before extracting.

## 2026-04-30 — Twitter timeline collection without API access

**Issue**: Sandbox lacked `curl`, `wget`, `python`, `node`, and `agent-browser`. Twitter API requires `TWITTER_BEARER_TOKEN`, which was not set. Public Nitter instances did not respond from this environment.

**Workaround**: Used Exa search + `fetch_web_pages` to collect verified TankerTrackers tweet content via mainstream outlets (Bloomberg, gCaptain, Iran International, Caliber.Az, Marine Insight, Voice of Emirates, WANA, Pars Today). Each event preserves the original tweet substance, posting timestamp, and a link back to `https://twitter.com/TankerTrackers` plus the citing outlet(s).

**Lesson**: When `TWITTER_BEARER_TOKEN` is missing, prefer authoritative outlets that quote and embed the original tweet (often with the tweet's exact text + permalink). They generally provide enough context to reconstruct a high-confidence World Event Entity even without direct API access.

## 2026-04-30 — E-PRIME validator word-boundary behaviour

**Validation gotcha**: The E-PRIME validator uses `grep -Ei '\b(is|are|was|were|be|been|being)\b'`. The `\b` word boundaries make it safe to use words like "this", "ships", "between", "before", "begin", "beyond", "Washington", and "based" — only standalone forbidden tokens fail. Quoted speech remains a common trap; rewrite it in active voice.

**Substitutes that pass validation**: `is → remains/shows/stays`, `was/were → got + past participle / operated / showed`, `are → remain / show`, `be → continue / function / serve`. Avoid passive `is/was/were boarded` — use `got boarded` or rewrite with active subject.
