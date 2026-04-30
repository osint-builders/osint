# Remember-As-You-Go Skill Summary

## What This Skill Does

Observes AI execution patterns and creates memories in `memory.md` when:
- Commands fail with errors
- Multiple attempts needed before success
- Non-obvious solutions discovered
- Environment-specific quirks encountered

**Skips** memory creation for:
- Standard documented operations
- First-time successes
- Well-known patterns

## Key Philosophy

> **"Remember pain points, not trivial execution."**

Only capture what's truly non-obvious or error-prone to prevent repeating mistakes.

## How It Works

```
Execute Command
    ↓
Observe Outcome
    ↓
Error or Guesswork?
    ├─ NO → Continue (no memory)
    └─ YES → Is solution obvious?
             ├─ YES → Continue (no memory)
             └─ NO → Create Memory Entry
```

## Memory Storage

**Location**: `/Users/erik.zettersten/Projects/osint/memory.md`

**Format**:
```markdown
## [Tool] [Problem] - [Brief Description]

[Explanation]

[Commands]

[Context]

---
```

## Integration

Every skill can trigger remember-as-you-go:
- **agent-browser** → Chrome setup, auth quirks
- **perplexity** → API keys, rate limits
- **ffmpeg** → Codec issues, format constraints
- **imagemagick** → Policy restrictions
- **data-to-markdown** → Format edge cases
- **word-event-entities** → Schema validation

## Value Proposition

- **Prevents repetition**: Don't solve the same problem twice
- **Eliminates guesswork**: Future executions know the right approach
- **Captures institutional knowledge**: Environment quirks documented
- **Reactive not proactive**: Only remembers when needed

## Files Created

1. `skills/remember-as-you-go/SKILL.md` - Complete specification
2. `skills/remember-as-you-go/README.md` - Quick start guide
3. `skills/remember-as-you-go/references/REFERENCE.md` - Patterns and templates
4. `skills/remember-as-you-go/scripts/example-memory-capture.sh` - Demonstrations
5. `memory.md` - Root memory storage (template)

## Cross-References Added

All existing skills now reference remember-as-you-go for capturing tool-specific issues.

## Example Memory Entry

```markdown
## Agent-Browser Requires Chrome Installation

After installing agent-browser globally, must run `agent-browser install` to download Chrome for Testing.

Error:
```bash
agent-browser open https://example.com
# Error: Chrome binary not found
```

Solution:
```bash
agent-browser install
agent-browser open https://example.com  # Now works
```

Context: One-time setup after global install.

---
```

## Usage Pattern

AI should:
1. Execute commands normally
2. Notice when errors or guesswork occur
3. After resolution, decide if memory warranted
4. If yes, append entry to `memory.md`
5. Continue execution with learning captured

No explicit skill invocation needed - this is a meta-skill that activates reactively during any workflow.
