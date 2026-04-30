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
