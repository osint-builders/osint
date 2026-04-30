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

## 2026-04-30 — E-PRIME validator word-boundary behaviour

**Validation gotcha**: The E-PRIME validator uses `grep -Ei '\b(is|are|was|were|be|been|being)\b'`. The `\b` word boundaries make it safe to use words like "this", "ships", "between", "before", "begin", "beyond", "Washington", and "based" — only standalone forbidden tokens fail. Quoted speech remains a common trap; rewrite it in active voice.
