# Remember-As-You-Go Reference

Complete reference for adaptive memory creation patterns and decision trees.

## Memory Decision Tree

```
Command Executed
    ↓
Was there an error?
    ├─ NO → Did it require multiple attempts?
    │        ├─ NO → Skip memory
    │        └─ YES → Was solution obvious?
    │                  ├─ YES → Skip memory
    │                  └─ NO → Create memory
    └─ YES → Was error documented/expected?
             ├─ YES → Skip memory
             └─ NO → Create memory
```

## Signal Classification

### Strong Signals (Always Remember)

1. **Exception with undocumented fix**
   - Error message not in official docs
   - Solution found through experimentation
   - Workaround required

2. **Permission/configuration issues**
   - Requires system-level changes
   - Environment-specific setup
   - One-time configuration pain

3. **Tool interaction failures**
   - Output from tool A breaks tool B
   - Format conversion required
   - Encoding/decoding needed

4. **Non-obvious parameter requirements**
   - Default doesn't work
   - Specific flag combination needed
   - Order matters

### Medium Signals (Consider Remembering)

1. **Multiple documentation sources consulted**
   - Official docs insufficient
   - StackOverflow/GitHub issues searched
   - Trial and error applied

2. **Surprising behavior**
   - Contradicts expectations
   - Different from similar tools
   - Version-specific quirk

3. **Performance optimization**
   - Slow default behavior
   - Non-obvious speed improvement
   - Resource constraints

### Weak Signals (Skip Memory)

1. **First-time success**
   - Command worked immediately
   - Standard documented behavior
   - Common pattern

2. **One-off operation**
   - Unique to specific context
   - Unlikely to recur
   - Task-specific

3. **Well-known patterns**
   - Standard Unix patterns
   - Common flags/options
   - Documented in basics

## Entry Templates

### Error Resolution Template

```markdown
## [Tool] [Error Type] - [Brief Description]

[Tool/command] fails with "[error message]" when [condition].

Error:
```bash
[command that failed]
# Error output
```

Solution:
```bash
[working command]
```

Context: [When this applies, version info, platform specifics]

---
```

### Configuration Template

```markdown
## [Tool] Requires [Configuration Type]

[Tool] needs [configuration] before [operation].

Setup:
```bash
[setup commands]
```

Verify:
```bash
[verification command]
```

Context: [One-time vs recurring, platform-specific notes]

---
```

### Parameter Discovery Template

```markdown
## [Tool] [Operation] Requires [Parameter]

[Tool] [operation] needs [non-obvious parameter] for [outcome].

Without parameter:
```bash
[failing command]
# What happens
```

With parameter:
```bash
[working command]
# Expected outcome
```

Context: [When needed, why not default, alternatives]

---
```

### Integration Pattern Template

```markdown
## [Tool A] → [Tool B] Requires [Transformation]

Output from [Tool A] needs [transformation] before [Tool B] can process it.

Problem:
```bash
[tool-a command] | [tool-b command]  # Fails
```

Solution:
```bash
[tool-a command] | [transform] | [tool-b command]  # Works
```

Context: [Format details, alternative approaches]

---
```

## Memory Categories

### Category 1: Installation & Setup

**When to remember**:
- Non-standard installation steps
- Post-install configuration
- System dependencies
- Environment variables

**Example topics**:
- Chrome installation for agent-browser
- Docker group membership
- API key configuration
- Binary permissions

### Category 2: Command Syntax

**When to remember**:
- Flag order matters
- Required parameter combinations
- Default behavior surprises
- Undocumented options

**Example topics**:
- FFmpeg `-ss` position
- Mogrify `-path` requirement
- Git command order

### Category 3: Error Patterns

**When to remember**:
- Cryptic error messages
- Common failure modes
- Error → solution mapping
- Debugging approaches

**Example topics**:
- "Permission denied" fixes
- "Command not found" resolutions
- Codec/format errors

### Category 4: Tool Integration

**When to remember**:
- Format conversions
- Encoding issues
- Pipeline breaks
- Output compatibility

**Example topics**:
- HTML entity decoding
- JSON parsing between tools
- Character encoding

### Category 5: Performance

**When to remember**:
- Slow operations with fast alternatives
- Resource optimization
- Timeout adjustments
- Parallel execution

**Example topics**:
- Input vs output seeking
- Batch operations
- Concurrent processing

## Memory Quality Checklist

- [ ] **Heading is searchable** - Contains tool name and problem
- [ ] **Problem is clear** - States what failed/confused
- [ ] **Solution is concrete** - Shows actual commands
- [ ] **Context is provided** - Explains when this applies
- [ ] **Examples are complete** - Can copy-paste and run
- [ ] **Error messages included** - For future searchability
- [ ] **No task-specific details** - General enough to recur

## Anti-Pattern Examples

### Too Vague
```markdown
## Docker Issues

Had some docker problems today.

---
```

**Why bad**: No problem statement, no solution, unsearchable

### Too Specific
```markdown
## Process Video for Client Project X

Used ffmpeg to convert client-x-video-final-v2.mp4 to output.mkv today.

---
```

**Why bad**: Task-specific, won't recur, no learning

### No Solution
```markdown
## FFmpeg Failed

FFmpeg command didn't work.

---
```

**Why bad**: No solution, no context, not actionable

### Standard Operation
```markdown
## Git Status Command

Used `git status` to check repository status.

---
```

**Why bad**: Standard documented operation, no issue

## Memory Evolution

### Initial Memory
```markdown
## FFmpeg Conversion Failed

FFmpeg conversion didn't work, had to add codec flags.

---
```

### Improved Memory
```markdown
## FFmpeg MKV Requires Video and Audio Codecs

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

**Improvements**:
- Specific tool and operation in heading
- Clear error message
- Concrete commands
- Context explaining why

## Memory Search Patterns

### By Tool
```bash
grep -A 10 "^## FFmpeg" memory.md
grep -A 10 "^## ImageMagick" memory.md
```

### By Error
```bash
grep -B 2 -A 8 "permission denied" memory.md
grep -B 2 -A 8 "not found" memory.md
```

### By Category
```bash
grep -A 10 "Requires.*Key" memory.md  # API keys
grep -A 10 "Permission" memory.md     # Permission issues
```

### Recent Entries
```bash
tail -50 memory.md
```

## Memory Lifecycle

### Creation
1. Encounter error or non-obvious solution
2. Resolve issue
3. Determine if worth remembering (decision tree)
4. Write clear entry
5. Append to memory.md

### Maintenance
1. Review memory.md periodically
2. Update entries if better solutions found
3. Remove entries for fixed bugs or obsolete tools
4. Consolidate duplicate patterns

### Retirement
Remove memory when:
- Tool version fixes the issue
- Better approach makes it obsolete
- No longer relevant to workflow
- Problem hasn't occurred in 6+ months

## Integration with AI Workflow

### During Execution
1. Run command
2. If error: Note error message
3. Try solution
4. If solution non-obvious: Create memory
5. Continue execution

### Before Memory Creation
Ask:
- "Will this help future me?"
- "Is this documented somewhere obvious?"
- "Is this a one-off or recurring pattern?"
- "Can I search for this later?"

### After Memory Creation
- Verify entry is searchable
- Check examples are runnable
- Ensure context is clear
- Test that solution actually works

## Memory Statistics

Track memory effectiveness:
- How many times memory prevented repeat error?
- Which categories most useful?
- Which entries never referenced?
- What patterns emerge?

## Real-World Examples

### High-Value Memory
```markdown
## Perplexity API Rate Limiting Returns 429

Perplexity API returns 429 "Too Many Requests" after rapid queries.

Solution: Add delay between requests
```bash
for query in "${queries[@]}"; do
  node bin/perplexity/cli.js --ask "$query"
  sleep 2  # Prevent rate limiting
done
```

Context: Free tier limited to 30 requests/minute. Paid tiers have higher limits.

---
```

**Why valuable**: Prevents future rate limit hits, shows workaround

### Low-Value Memory
```markdown
## Used FFmpeg

Used ffmpeg today to convert a video. It worked.

---
```

**Why low-value**: No problem, no learning, not actionable
