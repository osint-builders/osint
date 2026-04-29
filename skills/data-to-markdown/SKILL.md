---
name: data-to-markdown
description: Transform any data source into clean, semantic, concise Markdown following E-PRIME principles and structured conventions. Convert plain text, HTML, code, documents (Word, PowerPoint, PDF) into well-structured Markdown with precision and clarity. Communicate conversion scheme, validate output, and leverage CLI tools for automated transformations.
license: MIT
compatibility: Language-agnostic conversion principles. Tool support for Node.js, Python, CLI-based workflows.
metadata:
  author: osint-builders
  version: "1.0.0"
  conversion-framework: data-to-markdown
  cli-location: "../../bin/data-to-markdown"
---

# Data-to-Markdown Skill

Comprehensive framework for transforming any data source into clean, semantic, well-structured Markdown. Convert from plain text, HTML, code, Word documents, PowerPoint, PDF, and other formats into precisely formatted Markdown following established conventions and E-PRIME principles.

## Core Purpose

Enable AI agents to reliably convert raw data into publication-ready Markdown by:
- Establishing clear conversion rules and semantic structures
- Ensuring consistency across different data types
- Maintaining precision and clarity in transformation
- Removing redundancy and unclear language
- Producing machine-readable, human-friendly output

## Key Principles

### E-PRIME (English Prime)
E-PRIME is a subset of English that removes all forms of "to be" (is, are, was, were, be, been, being). This produces:
- More precise, actionable language
- Reduced ambiguity and assumptions
- Stronger, more dynamic writing
- Clearer statements of fact

**Examples**:
- ❌ "This is important" → ✅ "This matters" or "Consider this"
- ❌ "The system was broken" → ✅ "The system failed" or "The system stopped working"
- ❌ "The data is accurate" → ✅ "The data reflects reality" or "Verification confirms the data"

### Semantic Clarity
- Use appropriate Markdown structures (headings, lists, tables, code blocks)
- Match structure to content type and hierarchy
- Preserve meaning and relationships
- Eliminate formatting noise

### Conciseness
- Remove redundant words and phrases
- Condense without losing meaning
- Use active voice
- Prefer specific terms over vague descriptions

## Markdown Scheme

### Document Structure

```
# Main Title

Brief introduction paragraph explaining the document's purpose and scope.

## Section 1

Content for section 1.

### Subsection 1.1

Detailed content with semantic structure.

## Section 2

Content for section 2.

```

### Heading Hierarchy

| Level | Usage | Markdown |
|-------|-------|----------|
| 1 | Document title (1 per document) | `# Title` |
| 2 | Major sections | `## Section Name` |
| 3 | Subsections | `### Subsection` |
| 4 | Sub-subsections | `#### Detail` |
| 5+ | Rarely used; reconsider structure | `##### Level 5` |

**Rules**:
- Only one H1 per document
- Headings must form logical hierarchy (don't skip levels: H2 → H3 → H4)
- Use descriptive, action-oriented headings
- Apply E-PRIME: avoid "is," "are," "was"

### Paragraph Structure

**Good**:
```markdown
The system processes data in three stages. First, it validates input against 
predefined schemas. Next, it transforms the data using configured mappings. 
Finally, it outputs results to specified destinations.
```

**Bad**:
```markdown
The system is composed of three parts. The first part is the validation system. 
The second part is the transformation system. The third part is the output system.
```

### Lists

#### Unordered Lists
Use for non-sequential items:
```markdown
- Item 1
- Item 2
- Item 3
```

#### Ordered Lists
Use for sequential steps or priorities:
```markdown
1. First step
2. Second step
3. Third step
```

#### Nested Lists
```markdown
- Main item
  - Sub-item 1
  - Sub-item 2
- Another main item
  - Sub-item A
  - Sub-item B
```

### Tables

Use for comparative or structured data:

```markdown
| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Value A  | Value B  | Value C  |
| Value D  | Value E  | Value F  |
```

**Rules**:
- Use for data with 2+ columns and 2+ rows
- Align columns for readability
- Don't use tables for sequential instructions (use numbered lists)

### Code Blocks

#### Inline Code
For references to code, commands, or technical terms:
```markdown
The `function_name()` accepts parameters.
```

#### Block Code
For larger code samples or complete examples:
````markdown
```javascript
function example() {
  console.log("Hello, World!");
}
```
````

**Language specification**: Always specify language (javascript, python, bash, sql, etc.)

### Emphasis

| Style | Markdown | Usage |
|-------|----------|-------|
| Bold | `**text**` | Important concepts, key terms |
| Italic | `*text*` or `_text_` | Emphasis, titles, variables |
| Code | `` `text` `` | Commands, code, technical terms |

**Rule**: Avoid overuse of emphasis. Use sparingly for true emphasis.

### Blockquotes

Use for quotes, extracted text, or callouts:

```markdown
> This is a blockquote. Use for quoted material, callouts, or extracted text.
> 
> Blockquotes can span multiple paragraphs.
```

### Links

#### Inline Links
```markdown
[Link text](https://example.com)
```

#### Reference Links
```markdown
[Link text][reference]

[reference]: https://example.com
```

#### Usage Rules**:
- Use descriptive link text (not "click here")
- Include links inline in flow, or collect at end
- Use reference-style for frequently-repeated URLs

### Horizontal Rules

```markdown
---
```

Use sparingly to separate major sections or document flow changes.

### Metadata Blocks

For documents requiring metadata, use YAML frontmatter at document start:

```markdown
---
title: Document Title
author: Author Name
date: 2024-02-06
tags: [tag1, tag2, tag3]
---

# Document Title

Content begins here...
```

## Conversion Workflow

### Step 1: Analyze Source Data
- Identify data type (plain text, HTML, code, document)
- Understand structure and hierarchy
- Note special content (code, tables, lists, quotes)
- Plan heading structure

### Step 2: Extract Content
- Extract all text content
- Preserve meaningful structure
- Note formatting that conveys meaning
- Identify code blocks, tables, lists

### Step 3: Apply E-PRIME
- Remove forms of "to be"
- Strengthen language with active voice
- Replace vague terms with precise ones
- Simplify without losing meaning

### Step 4: Structure in Markdown
- Create logical heading hierarchy
- Format lists, tables, code appropriately
- Use emphasis judiciously
- Ensure readability and flow

### Step 5: Validate
- Check heading hierarchy (no skipped levels)
- Verify code blocks have language specifications
- Confirm all links are valid
- Read for clarity and conciseness

## Data Type Specific Guides

### Plain Text → Markdown
1. Identify natural section breaks
2. Create headings for sections
3. Convert lists to Markdown list format
4. Apply E-PRIME to all text
5. Add links where references exist

### HTML → Markdown
1. Parse HTML structure
2. Map HTML tags to Markdown:
   - `<h1>` → `# Title`
   - `<h2>` → `## Section`
   - `<p>` → Paragraph
   - `<ul>`/`<ol>` → Markdown lists
   - `<table>` → Markdown tables
   - `<code>` → Backticks
   - `<pre><code>` → Code blocks
3. Remove HTML attributes and styling
4. Clean extracted text
5. Apply E-PRIME

### Code → Markdown
1. Preserve code blocks with language specification
2. Add explanatory text before/after code
3. Use inline code for references
4. Structure with headings if multiple code samples
5. Include comments for clarity

### Word Documents (.docx) → Markdown
1. Extract text with structure preserved
2. Map paragraph styles to heading levels
3. Convert tables to Markdown tables
4. Extract and format lists
5. Handle images (reference or embed)
6. Apply E-PRIME

### PowerPoint Presentations (.pptx) → Markdown
1. One slide = one section (H2 heading)
2. Slide title → section heading
3. Bullet points → unordered lists
4. Text boxes → paragraphs
5. Extract speaker notes if present
6. Note slide numbers for reference
7. Handle images separately

### PDF Documents → Markdown
1. Extract text while preserving structure
2. Identify heading hierarchy
3. Recognize and format tables
4. Extract code blocks
5. Handle images and diagrams
6. Maintain cross-references

## Tools and Utilities

### CLI Tool: `bin/data-to-markdown`
Command-line utility for automated conversion:

```bash
# Convert HTML file to Markdown
node bin/data-to-markdown/cli.js convert input.html output.md

# Convert with E-PRIME validation
node bin/data-to-markdown/cli.js convert input.txt output.md --validate-eprime

# Batch convert multiple files
node bin/data-to-markdown/cli.js batch *.html --output-dir ./markdown

# Validate existing Markdown
node bin/data-to-markdown/cli.js validate document.md

# Check for E-PRIME violations
node bin/data-to-markdown/cli.js check-eprime document.md
```

### Python Conversion Library
For programmatic use in Python-based AI agents:

```python
from data_to_markdown import convert_html, convert_text, validate_eprime

# Convert HTML string to Markdown
markdown = convert_html(html_content)

# Convert plain text with structure detection
markdown = convert_text(text_content, detect_lists=True)

# Validate and suggest E-PRIME improvements
issues = validate_eprime(markdown)
```

### JavaScript/Node.js Library
For JavaScript-based agents:

```javascript
const { convertHTML, convertText, validateEPrime } = require('data-to-markdown');

// Convert HTML to Markdown
const markdown = convertHTML(htmlContent);

// Validate E-PRIME compliance
const issues = validateEPrime(markdown);
```

## Quality Checklist

After conversion, verify:

- [ ] Single H1 heading (document title)
- [ ] Heading hierarchy is logical (no skipped levels)
- [ ] All text uses E-PRIME (no "is," "are," "was," "been," "be," "being")
- [ ] Code blocks have language specifications
- [ ] Lists are properly formatted and nested
- [ ] Tables are properly aligned
- [ ] Links have descriptive text
- [ ] No trailing whitespace
- [ ] Consistent spacing between sections
- [ ] No HTML tags remain
- [ ] No unnecessary emphasis
- [ ] Content is concise and clear

## Examples

See [references/](references/) directory for detailed conversion examples:
- [HTML Conversion Examples](references/html-conversion.md)
- [Plain Text Conversion Examples](references/text-conversion.md)
- [Document Conversion Examples](references/document-conversion.md)
- [E-PRIME Guide and Examples](references/eprime-guide.md)

See [scripts/](scripts/) for conversion workflows and demonstrations.

## Common Pitfalls

### ❌ Excessive Emphasis
```markdown
**This** is *very* `important` and must be ***understood***
```

✅ Better:
```markdown
This matters. Understand the core concept.
```

### ❌ Unclear Headings
```markdown
### Is This Working
### What About This
### Important Things
```

✅ Better:
```markdown
### Performance Metrics
### Configuration Status
### Security Requirements
```

### ❌ Vague Language (E-PRIME Violations)
```markdown
The system is broken. This is a critical issue. The data is accurate.
```

✅ Better:
```markdown
The system failed. This breaks critical workflows. Verification confirms the data.
```

### ❌ Poor Code Block Specification
```markdown
```
function doSomething() { ... }
```
```

✅ Better:
```markdown
```javascript
function doSomething() { ... }
```
```

## Related Tools & Skills

### Bin CLIs
- **bin/agent-browser** - Scrape web content for conversion to Markdown
- **bin/perplexity** - Research content that needs formatting
- **bin/imagemagick** - Process images referenced in documents

### Skills
- **agent-browser** - Extract HTML content for Markdown conversion
- **perplexity-search** - Gather research for Markdown report generation
- **word-event-entities** - Structure event data for `contents` field
- **remember-as-you-go** - Capture format-specific edge cases, E-PRIME validation patterns, encoding issues

### System CLIs
- `pandoc` - Universal document converter (Word, HTML, LaTeX)
- `jq` - Transform JSON to Markdown structures
- `prettier` - Format and clean Markdown output
- `markdownlint` - Validate Markdown structure

### Integration Hints
```bash
# Scrape → Convert → Validate → Format
agent-browser get html "article" > article.html
node bin/data-to-markdown/cli.js convert article.html output.md
node bin/data-to-markdown/cli.js check-eprime output.md
prettier --write output.md

# Research → Extract → Structure → Convert
node bin/perplexity/cli.js --research "topic" > research.txt
agent-browser open https://source.com/article
agent-browser get text "body" > source.txt
cat research.txt source.txt | node bin/data-to-markdown/cli.js convert - report.md
```

## References

- See [REFERENCE.md](references/REFERENCE.md) for complete conversion specifications
- See [E-PRIME Guide](references/eprime-guide.md) for detailed language examples
- CLI tool documentation: `../../bin/data-to-markdown/README.md`
