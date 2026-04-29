# Remember-As-You-Go Skill

Adaptive memory system that learns from execution patterns and stores critical learnings in `memory.md`.

## Quick Start

This skill operates **reactively** - it activates when AI observes execution patterns that indicate memory should be created.

### Trigger Signals

**Create memory when you observe**:
- Command fails with error
- Multiple attempts needed before success
- Non-obvious parameter required
- Environment-specific workaround needed
- Tool interaction breaks

**Skip memory when**:
- Command succeeds on first try
- Using standard documented behavior
- Operation is one-off/unique

## How It Works

1. **Observe**: AI executes commands normally
2. **Detect**: AI notices errors, guesswork, or exceptions
3. **Capture**: AI writes memory entry to `memory.md`
4. **Benefit**: Future executions avoid the same pitfalls

## Memory Location

All memories stored in: `/Users/erik.zettersten/Projects/osint/memory.md`

## Entry Format

```markdown
## [Tool] [Problem] - [Brief Description]

[Explanation of issue and solution]

[Command examples]

[Context about when this applies]

---
```

## Examples

### Good Memory Entry
```markdown
## FFmpeg MKV Conversion Requires Explicit Codecs

Converting to MKV without explicit codecs fails with "codec not supported".

Error:
```bash
ffmpeg -i input.mp4 output.mkv
# Error: Codec not supported
```

Solution:
```bash
ffmpeg -i input.mp4 -c:v libx264 -c:a aac output.mkv
```

Context: MKV container doesn't have default codec mappings like MP4.

---
```

### What NOT to Remember
```markdown
## Used Git

I used git status today. It worked fine.

---
```
*(Too obvious, no problem, no learning)*

## Decision Flow

```
Executed command
    ↓
Error occurred?
    ├─ NO → Multiple attempts needed?
    │        ├─ NO → Skip memory
    │        └─ YES → Solution obvious?
    │                  ├─ YES → Skip memory
    │                  └─ NO → CREATE MEMORY
    └─ YES → Error documented?
             ├─ YES → Skip memory
             └─ NO → CREATE MEMORY
```

## Common Memory Categories

1. **Installation & Setup** - Chrome install, API keys, permissions
2. **Command Syntax** - Flag order, required parameters
3. **Error Patterns** - Common failures and fixes
4. **Tool Integration** - Format conversions, encoding issues
5. **Environment-Specific** - macOS vs Linux, shell differences

## Usage with Other Skills

Every skill can trigger remember-as-you-go when execution issues arise:

- **agent-browser**: Chrome installation, auth setup
- **perplexity**: API key config, rate limiting
- **ffmpeg**: Codec requirements, format constraints
- **imagemagick**: Policy restrictions, format delegates
- **sandcastle**: Docker daemon, Git configuration
- **data-to-markdown**: Format edge cases, encoding issues
- **word-event-entities**: Schema validation, field requirements

## Maintenance

### Review Memory
```bash
cat memory.md | less
```

### Search Memory
```bash
grep -A 5 "FFmpeg" memory.md
grep -A 5 "permission denied" memory.md
```

### Recent Entries
```bash
tail -50 memory.md
```

## Philosophy

> **"Remember pain points, not trivial execution."**

The goal is to build institutional knowledge that prevents repeating mistakes. Only capture what's truly non-obvious or error-prone.

## See Also

- [SKILL.md](SKILL.md) - Complete skill specification
- [REFERENCE.md](references/REFERENCE.md) - Memory patterns and templates
- [memory.md](/Users/erik.zettersten/Projects/osint/memory.md) - Actual memory storage
