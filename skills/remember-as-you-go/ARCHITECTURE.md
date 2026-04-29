# Remember-As-You-Go Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      AI Execution Flow                       │
└─────────────────────────────────────────────────────────────┘
                              ↓
                    ┌─────────────────┐
                    │  Execute Command │
                    └─────────────────┘
                              ↓
                    ┌─────────────────┐
                    │ Observe Outcome  │
                    └─────────────────┘
                              ↓
                  ┌──────────────────────┐
                  │   Success or Error?   │
                  └──────────────────────┘
                    ↙                  ↘
            ┌──────────┐          ┌──────────┐
            │ Success  │          │  Error   │
            │ First    │          │ or Issue │
            │ Try      │          └──────────┘
            └──────────┘                ↓
                  ↓                ┌──────────────┐
            ┌──────────┐          │  Resolve     │
            │   Skip   │          │  Problem     │
            │  Memory  │          └──────────────┘
            └──────────┘                ↓
                              ┌────────────────────┐
                              │ Solution Obvious?  │
                              └────────────────────┘
                                ↙              ↘
                        ┌──────────┐      ┌──────────────┐
                        │   Skip   │      │   CREATE     │
                        │  Memory  │      │   MEMORY     │
                        └──────────┘      └──────────────┘
                                                  ↓
                                          ┌──────────────┐
                                          │  Append to   │
                                          │  memory.md   │
                                          └──────────────┘
                                                  ↓
                                          ┌──────────────┐
                                          │   Continue   │
                                          │  Execution   │
                                          └──────────────┘
```

## Integration Points

### Skill Layer
```
┌────────────────────────────────────────────────────────────┐
│                    Existing Skills                         │
├────────────────────────────────────────────────────────────┤
│  agent-browser     │  perplexity-search  │  ffmpeg-cli    │
│  imagemagick       │  sandcastle         │  data-to-md    │
│  word-event-entities                                       │
└────────────────────────────────────────────────────────────┘
                              ↓
              ┌──────────────────────────────┐
              │  Execution Issues Detected    │
              └──────────────────────────────┘
                              ↓
┌────────────────────────────────────────────────────────────┐
│              remember-as-you-go (Meta-Skill)               │
├────────────────────────────────────────────────────────────┤
│  • Observes execution patterns                             │
│  • Detects errors, guesswork, non-obvious solutions        │
│  • Creates memory entries when warranted                   │
└────────────────────────────────────────────────────────────┘
                              ↓
┌────────────────────────────────────────────────────────────┐
│                       memory.md                            │
├────────────────────────────────────────────────────────────┤
│  Persistent storage of execution learnings                 │
│  Referenced in future sessions                             │
└────────────────────────────────────────────────────────────┘
```

## Memory Flow

### Write Path
```
Error Occurs
    ↓
Solution Found
    ↓
Evaluate: "Will this help future execution?"
    ↓
[YES] → Format Memory Entry
    ↓
Append to memory.md
    ↓
Continue Execution
```

### Read Path
```
Future Execution
    ↓
Similar Issue Encountered
    ↓
Search memory.md
    ↓
Find Previous Solution
    ↓
Apply Solution Immediately
    ↓
Success (No Guesswork)
```

## Decision Matrix

| Scenario | Attempts | Error? | Solution Obvious? | Memory? |
|----------|----------|--------|-------------------|---------|
| Standard op | 1 | No | N/A | ❌ No |
| First success | 1 | No | N/A | ❌ No |
| Error + doc fix | 2 | Yes | Yes | ❌ No |
| Error + experiment | 3+ | Yes | No | ✅ YES |
| Config issue | 2+ | Yes | No | ✅ YES |
| Non-obvious param | 2+ | No | No | ✅ YES |
| Tool integration | 2+ | Yes/No | No | ✅ YES |

## Memory Categories

```
┌─────────────────────────────────────────────────────────┐
│                      Memory Types                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  1. Installation & Setup                                │
│     • Environment variables                              │
│     • Post-install config                                │
│     • System dependencies                                │
│                                                          │
│  2. Command Syntax                                       │
│     • Flag order requirements                            │
│     • Parameter combinations                             │
│     • Default behavior surprises                         │
│                                                          │
│  3. Error Patterns                                       │
│     • Common failure modes                               │
│     • Error message → solution mapping                   │
│     • Permission issues                                  │
│                                                          │
│  4. Tool Integration                                     │
│     • Format conversions                                 │
│     • Encoding issues                                    │
│     • Pipeline breaks                                    │
│                                                          │
│  5. Performance                                          │
│     • Slow operations with fast alternatives             │
│     • Resource optimization                              │
│     • Timeout adjustments                                │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## File Structure

```
osint/
├── memory.md                           # Root memory storage
│
└── skills/
    └── remember-as-you-go/
        ├── SKILL.md                    # Skill specification
        ├── README.md                   # Quick start guide
        ├── SUMMARY.md                  # Executive summary
        ├── ARCHITECTURE.md             # This file
        │
        ├── references/
        │   └── REFERENCE.md            # Memory patterns
        │
        └── scripts/
            └── example-memory-capture.sh  # Demonstrations
```

## Skill Cross-References

Each skill now includes hints about when to trigger remember-as-you-go:

```markdown
### Skills
- **remember-as-you-go** - Capture [tool-specific issues]
```

Examples:
- **agent-browser**: Chrome installation, auth quirks, session persistence
- **perplexity**: API key setup, rate limiting patterns
- **ffmpeg**: Codec issues, container constraints
- **imagemagick**: Policy restrictions, format delegates
- **sandcastle**: Docker daemon, Git config requirements
- **data-to-markdown**: Format edge cases, encoding issues
- **word-event-entities**: Schema validation failures

## Memory Entry Lifecycle

```
Creation
    ↓
    When: Error/exception resolved with non-obvious solution
    Format: ## [Tool] [Problem] - [Description]
    Storage: Append to memory.md
    ↓
Usage
    ↓
    When: Similar issue encountered in future
    Action: Search memory.md for previous solution
    Result: Apply solution, avoid repeat guesswork
    ↓
Maintenance
    ↓
    Review: Periodically check for obsolete entries
    Update: Better solutions found
    Remove: Issues fixed in tool updates
    ↓
Retirement
    ↓
    When: No longer relevant to workflow
    Action: Remove from memory.md
```

## Signal Detection

### Strong Signals (Always Remember)
1. **Exception with undocumented fix**
   - Not in official docs
   - Found through experimentation
   - Workaround required

2. **Permission/configuration issues**
   - System-level changes
   - Environment-specific setup
   - One-time configuration pain

3. **Tool interaction failures**
   - Output incompatibilities
   - Format conversion required
   - Encoding/decoding needed

### Weak Signals (Skip Memory)
1. **First-time success**
   - Worked immediately
   - Standard behavior
   - Common pattern

2. **Well-documented operations**
   - In official docs
   - Standard Unix patterns
   - Basic operations

## Quality Metrics

### High-Value Memory
- ✅ Prevents future errors
- ✅ Saves multiple attempts
- ✅ Captures non-obvious solutions
- ✅ Applies to recurring scenarios
- ✅ Includes error messages for searchability
- ✅ Shows concrete commands

### Low-Value Memory
- ❌ Too vague or generic
- ❌ Task-specific one-offs
- ❌ Standard documented operations
- ❌ No actionable solution
- ❌ Missing context

## Memory Search Patterns

```bash
# By tool
grep -A 10 "^## FFmpeg" memory.md

# By error
grep -B 2 -A 8 "permission denied" memory.md

# By category
grep -A 10 "Requires.*Key" memory.md

# Recent entries
tail -50 memory.md
```

## Integration with AI Context

### Memory as AI Context
```
AI Session Start
    ↓
Load memory.md into context
    ↓
Execute commands
    ↓
If similar issue in memory:
    - Apply known solution
    - Skip experimentation
    ↓
If new issue:
    - Resolve normally
    - Add to memory if warranted
```

### Feedback Loop
```
Session N: Encounter issue → Resolve → Create memory
    ↓
Session N+1: Encounter similar issue → Check memory → Apply solution
    ↓
Result: Faster resolution, no guesswork
```

## Anti-Patterns

### ❌ Don't Remember
```markdown
## Used ls command
I used ls today to list files.
```
**Why**: Standard operation, no issue

### ❌ Don't Remember
```markdown
## Video conversion
Converted a video for client project.
```
**Why**: Task-specific, won't recur

### ✅ Do Remember
```markdown
## FFmpeg MKV Requires Explicit Codecs

Error: "codec not supported"
Solution: ffmpeg -i input.mp4 -c:v libx264 -c:a aac output.mkv
Context: MKV needs explicit codecs unlike MP4
```
**Why**: Non-obvious, error-driven, reusable

## Future Enhancements

1. **Memory Search Tool**: CLI for searching memory.md
2. **Memory Analytics**: Track which entries most valuable
3. **Auto-cleanup**: Remove entries not referenced in N months
4. **Memory Sharing**: Export/import memories across projects
5. **Memory Clustering**: Group related entries by pattern
