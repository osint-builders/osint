---
name: remember-as-you-go
description: Adaptive memory system that observes execution patterns and stores learnings in memory.md. Only creates memories when guesswork, errors, or exceptions occur. Helps AI refine execution by remembering non-obvious solutions, environment quirks, and tool interactions. Skip memory for straightforward, well-documented operations.
license: MIT
compatibility: Language-agnostic execution pattern analysis. Works with all CLI tools and skills.
metadata:
  author: osint-builders
  version: "1.0.0"
  memory-file: "../../memory.md"
  trigger-mode: "reactive"
---

# Remember-As-You-Go Skill

Adaptive memory system that observes command execution patterns and stores critical learnings in `memory.md`. Only creates memories when execution involves guesswork, errors, exceptions, or non-obvious solutions. Helps AI avoid repeating mistakes and eliminates future uncertainty.

## Core Principle

**Remember pain points, not trivial execution.**

- ✅ **Remember**: Errors, exceptions, workarounds, non-obvious flags, environment quirks
- ❌ **Skip**: Standard operations, documented behavior, straightforward commands

## When to Create Memory

### Signal: High Guesswork
- Multiple command attempts before success
- Uncertain parameter values
- Trial-and-error approach
- Consulting multiple documentation sources

**Example**:
```bash
# First attempt
ffmpeg -i video.mp4 output.mkv  # Failed: codec not supported

# Second attempt  
ffmpeg -i video.mp4 -c:v libx264 output.mkv  # Failed: audio codec

# Third attempt (finally works)
ffmpeg -i video.mp4 -c:v libx264 -c:a aac output.mkv  # Success
```

**Memory entry**:
```markdown
## FFmpeg MKV Conversion Requires Explicit Codecs

When converting to MKV, must specify both video and audio codecs:
- `-c:v libx264` for video
- `-c:a aac` for audio

Context: Default codec selection fails with "codec not supported" error.
```

### Signal: Error or Exception
- Command exits with non-zero status
- Permission denied
- Missing dependencies
- Configuration errors

**Example**:
```bash
# Error
agent-browser open https://example.com
# Error: Chrome binary not found at default location

# Solution (after research)
agent-browser install
agent-browser open https://example.com  # Now works
```

**Memory entry**:
```markdown
## Agent-Browser Requires Explicit Chrome Installation

After installing agent-browser globally, must run `agent-browser install` to download Chrome for Testing.

Error symptom: "Chrome binary not found"
Fix: `agent-browser install` before first use
```

### Signal: Non-Obvious Solution
- Solution contradicts expectations
- Requires obscure flag or parameter
- Undocumented workaround
- Environment-specific quirk

**Example**:
```bash
# Expected approach (doesn't work)
mogrify -resize 800x600 *.jpg

# Actual solution (preserves originals)
mogrify -path ./resized -resize 800x600 *.jpg
```

**Memory entry**:
```markdown
## ImageMagick Mogrify Overwrites Files By Default

`mogrify` modifies images in-place. To preserve originals:
- Use `-path ./output-dir` flag
- Create output directory first: `mkdir -p resized`

Without `-path`, original files are permanently overwritten.
```

### Signal: Repeated Pattern
- Same error occurs multiple times
- Same workaround applied repeatedly
- Pattern emerges across tools

**Example**:
```bash
# Repeated across multiple sessions
curl -s https://api.perplexity.ai/chat/completions \
  -H "Authorization: Bearer $PERPLEXITY_API_KEY" ...
# Error: 401 Unauthorized

export PERPLEXITY_API_KEY="pplx-..."
# Retry — succeeds
```

**Memory entry**:
```markdown
## Perplexity API Requires PERPLEXITY_API_KEY

Before calling the Perplexity API, export the key:
```bash
export PERPLEXITY_API_KEY="your_key_here"
```

Add to `~/.zshrc` or `~/.bashrc` for persistence.
Error symptom: HTTP 401 Unauthorized response.
```

## When NOT to Create Memory

### Standard Documented Behavior
```bash
# Standard operation - no memory needed
git status
git add file.txt
git commit -m "message"
```

### First-Time Success
```bash
# Works immediately - no memory needed
magick input.jpg -resize 800x600 output.jpg
```

### Well-Known Patterns
```bash
# Common pattern - no memory needed
curl -s https://api.example.com/data | jq .
```

### One-Off Tasks
```bash
# Unique context - no memory needed
rm temporary-file-2024-04-29.txt
```

## Memory Structure

### Memory File Location
`memory.md` at repository root

### Entry Format

```markdown
## [Concise Problem Statement]

[2-3 sentence explanation of the issue and solution]

[Optional: Command examples]

[Optional: Context about when this applies]

---
```

### Entry Guidelines

1. **Heading**: Clear, searchable problem statement
2. **Explanation**: Why the issue occurs and how to fix
3. **Commands**: Concrete examples (if applicable)
4. **Context**: When this applies or doesn't apply
5. **Separator**: `---` between entries

### Good Entry Example

```markdown
## Docker Permission Denied Errors on Linux

Docker commands fail with "permission denied" on fresh Linux installs because user is not in docker group.

Fix:
```bash
sudo usermod -aG docker $USER
newgrp docker
```

Verify: `docker ps` should work without sudo.
Context: Only needed once per user on Linux. macOS Docker Desktop handles automatically.

---
```

### Bad Entry Example

```markdown
## Used FFmpeg

I used ffmpeg to convert a video today.

---
```

**Why bad**: No problem/solution, no actionable information, too vague.

## Memory Categories

### Tool Configuration
- Environment variables
- Config file locations
- API key setup
- Installation quirks

### Error Patterns
- Common failure modes
- Error message → solution mapping
- Permission issues
- Dependency problems

### Parameter Discovery
- Non-obvious flags
- Correct parameter order
- Default behavior surprises
- Undocumented options

### Integration Quirks
- Tool chaining issues
- Output format mismatches
- Encoding problems
- Path handling

### Environment-Specific
- macOS vs Linux differences
- Shell variations (bash vs zsh)
- Version-specific behavior
- System dependencies

## Execution Pattern Analysis

### Smooth Execution (No Memory)
```
1. Command executed
2. Success on first try
3. Output as expected
4. No consultation of docs
```

**Action**: Continue, no memory needed

### Problematic Execution (Create Memory)
```
1. Command executed
2. Error or unexpected output
3. Consulted documentation
4. Tried alternative approach
5. Success after adjustment
```

**Action**: Create memory entry capturing the learning

### Uncertain Execution (Consider Memory)
```
1. Command executed
2. Success but unsure why
3. Multiple parameters tried
4. Guessed at correct syntax
```

**Action**: If solution is non-obvious, create memory

## Memory Workflow

### Step 1: Execute Command
Run the command normally.

### Step 2: Observe Outcome
- Success on first try? → No memory
- Error or exception? → Proceed to Step 3
- Multiple attempts? → Proceed to Step 3

### Step 3: Identify Pattern
- Is this a known standard operation? → No memory
- Is this a quirk or exception? → Proceed to Step 4
- Will this help future execution? → Proceed to Step 4

### Step 4: Create Memory Entry
- Write clear heading
- Explain problem and solution
- Include concrete examples
- Add relevant context

### Step 5: Append to memory.md
Add entry to root `memory.md` file with separator.

## Integration with Other Skills

### agent-browser
**Remember**: Chrome installation, authentication setup, session quirks
**Skip**: Standard navigation, snapshot commands

### perplexity-search
**Remember**: API key configuration, rate limiting workarounds
**Skip**: Standard query patterns

### ffmpeg-cli
**Remember**: Codec requirements, container constraints, format issues
**Skip**: Basic conversion commands

### imagemagick
**Remember**: Permission policies, format-specific quirks
**Skip**: Standard resize/convert operations

### data-to-markdown
**Remember**: Format-specific edge cases, E-PRIME validation patterns
**Skip**: Standard conversions

### word-event-entities
**Remember**: Schema validation failures, field requirement patterns
**Skip**: Standard entity creation

## Example Memory Entries

### Entry 1: Tool Installation
```markdown
## ImageMagick PDF Policy Prevents PDF Processing

ImageMagick blocks PDF operations by default due to security policy.

Error: "not authorized to convert PDF"

Fix: Edit `/etc/ImageMagick-7/policy.xml`:
```xml
<!-- Change this line -->
<policy domain="coder" rights="none" pattern="PDF" />
<!-- To this -->
<policy domain="coder" rights="read|write" pattern="PDF" />
```

Context: Only affects PDF operations. Other formats work normally.

---
```

### Entry 2: Command Syntax
```markdown
## FFmpeg -ss Position Matters for Seek Performance

Position of `-ss` flag affects seek speed and accuracy:

Fast (input seek): `ffmpeg -ss 00:01:00 -i input.mp4 output.mp4`
Accurate (output seek): `ffmpeg -i input.mp4 -ss 00:01:00 output.mp4`

Before `-i`: Fast but less accurate
After `-i`: Slow but frame-accurate

Choose based on need for precision vs speed.

---
```

### Entry 3: Environment Setup
```markdown
## agent-browser Requires Chrome Installation After Global Install

Running `agent-browser open` immediately after `npm install -g agent-browser` fails because Chrome for Testing hasn't been downloaded yet.

Fix:
```bash
agent-browser install
```

Verify: `agent-browser open https://example.com` should launch without error.

Context: One-time setup per machine or container image.

---
```

### Entry 4: Tool Interaction
```markdown
## Agent-Browser HTML Contains Encoded Entities — Use pandoc

HTML extracted with `agent-browser get html` may contain entity encoding that disrupts `pandoc` conversion.

Solution: Prefer `get text` for plain extraction; use `pandoc` when Markdown structure matters:
```bash
# Preferred: plain text (no encoding issues)
agent-browser get text "article" > content.txt

# When structure matters: let pandoc handle encoding
agent-browser get html @e1 > raw.html
pandoc raw.html -t markdown -o output.md
```

Alternative: Use `get text` instead of `get html` when structure isn't needed.

---
```

## Memory Maintenance

### When to Update Memory
- Solution becomes outdated
- Better approach discovered
- Tool version changes behavior

### When to Remove Memory
- Issue no longer occurs
- Tool updated to fix quirk
- Memory no longer relevant

### Memory Review
Periodically review `memory.md`:
- Remove obsolete entries
- Consolidate duplicate patterns
- Update with new learnings

## Best Practices

1. **Be Specific**: "FFmpeg requires -c:a aac for MKV" not "FFmpeg has codec issues"
2. **Include Context**: When does this apply? When doesn't it?
3. **Show Examples**: Concrete commands are more valuable than prose
4. **Capture Errors**: Include actual error messages for searchability
5. **Keep It Actionable**: Every entry should prevent future pain

## Anti-Patterns

❌ **Too Vague**: "Had trouble with docker"
❌ **Too Obvious**: "Used ls to list files"
❌ **No Solution**: "FFmpeg failed" (without fix)
❌ **Task-Specific**: "Processed client-X video on Tuesday"
❌ **Premature**: Creating memory on first success without issues

## Related Tools & Skills

### All Skills
This skill applies universally to all other skills. When any skill encounters execution issues, remember-as-you-go should capture the learning.

### System CLIs
- All system CLIs benefit from execution memory
- Focus on non-standard behavior and environment quirks

### Integration Hints
```bash
# After error resolution
echo "## Problem Statement\n\nSolution explanation\n\n---" >> memory.md

# Review recent memories
tail -50 memory.md

# Search for specific tool issues
grep -A 5 "tool-name" memory.md
```

## Trigger Conditions

AI should invoke remember-as-you-go when:
- Command fails with error
- Multiple attempts needed to succeed
- Solution required consulting docs
- Non-obvious parameter discovered
- Environment-specific workaround needed
- Pattern likely to recur

AI should NOT invoke when:
- Command succeeds immediately
- Using standard documented behavior
- One-off unique operation
- Already have memory for this pattern

## Memory File Template

If `memory.md` doesn't exist, create with this template:

```markdown
# Execution Memory

This file contains execution learnings captured during AI-assisted workflows. Each entry represents a non-obvious solution, error resolution, or environment quirk discovered through trial and error.

**Purpose**: Prevent repeating mistakes and eliminate future guesswork.

**Guidelines**: 
- Only remember pain points, not trivial execution
- Include concrete examples and error messages
- Keep entries actionable and specific
- Remove obsolete entries as tools evolve

---

[Memory entries go here]
```

## References

- See [REFERENCE.md](references/REFERENCE.md) for memory entry patterns and examples
- See [scripts/](scripts/) for automated memory capture workflows
