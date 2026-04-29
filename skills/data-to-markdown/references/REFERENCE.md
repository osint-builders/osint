# Data-to-Markdown Conversion Reference

Complete specification for converting various data types to Markdown.

## Heading Hierarchy Rules

### Rule 1: Single H1 Per Document
Every Markdown document must have exactly one H1 (document title).

```markdown
# Document Title

## Section One
## Section Two
```

### Rule 2: Logical Progression
Heading levels must follow logical progression. Never skip levels.

❌ Wrong:
```markdown
# Title
### Subsection (skips H2)
```

✅ Correct:
```markdown
# Title
## Section
### Subsection
```

### Rule 3: Descriptive Headings
Headings should describe content, not be generic labels.

❌ Vague:
```markdown
## Details
## Information
## Other
```

✅ Descriptive:
```markdown
## System Architecture
## Configuration Options
## Troubleshooting Guide
```

## E-PRIME Conversion Rules

### Remove All Forms of "To Be"

| ❌ Form of "Be" | ✅ Replacement | Context |
|-----------------|-----------------|---------|
| "is" | Use verb or restructure | "Data is important" → "Data matters" |
| "are" | Use verb or restructure | "These are critical" → "These matter" |
| "was" | Use past tense verb | "It was broken" → "It broke" |
| "were" | Use past tense verb | "They were successful" → "They succeeded" |
| "be" | Use active verb | "To be successful" → "To succeed" |
| "been" | Use perfect tense verb | "Has been tested" → "Testing confirms" |
| "being" | Restructure | "While being processed" → "During processing" |

### Common E-PRIME Conversions

| ❌ Original | ✅ E-PRIME |
|-----------|----------|
| This is a feature | This feature enables... |
| The system is fast | The system performs quickly |
| Data is accurate | Data reflects reality / Verification confirms the data |
| Users are happy | Users report satisfaction |
| The process is complex | The process involves multiple steps |
| This is important | This matters / Consider this |
| The issue is that... | The issue: ... |
| It is necessary | This requirement... / You must... |
| The company is large | The company employs 1000+ people |
| The error was in the code | The code contained an error |

## Content Type Conversion

### Plain Text → Markdown

**Process**:
1. Identify natural section breaks (blank lines, topic changes)
2. Convert section starts to headings (H2 if top-level section)
3. Convert bullet lists to Markdown lists
4. Apply E-PRIME to all text
5. Add emphasis where appropriate
6. Create links for references

**Example**:

Input (Plain Text):
```
SYSTEM REQUIREMENTS

The system needs hardware. It needs a processor that is modern. It needs memory. 
The memory should be 8GB or more. Storage requirements are 100GB minimum.

Features include:
- Real-time processing
- Data validation
- Export capabilities

The system is built on Linux. It is deployed on Ubuntu 20.04 or later.
```

Output (Markdown):
```markdown
# System Requirements

## Hardware
- **Processor**: Modern multi-core processor
- **Memory**: 8GB minimum
- **Storage**: 100GB minimum

## Features
- Real-time processing
- Data validation
- Export capabilities

## Platform
The system runs on Linux (Ubuntu 20.04 or later).
```

### HTML → Markdown

**Tag Mapping**:
```
<h1> → # Title
<h2> → ## Section
<h3> → ### Subsection
<p> → Paragraph (blank line between)
<strong>, <b> → **text**
<em>, <i> → *text*
<code> → `code`
<pre><code> → ```language ... ```
<ul> → - item
<ol> → 1. item
<table> → | header | header |
<a href="url">text</a> → [text](url)
<img src="url" alt="text"> → ![text](url)
<blockquote> → > quote
```

**Example**:

Input (HTML):
```html
<h1>Project Overview</h1>
<p>This is an <strong>important</strong> project that <em>requires</em> attention.</p>
<h2>Key Features</h2>
<ul>
  <li>Feature 1</li>
  <li>Feature 2</li>
</ul>
<p>See <a href="https://example.com">documentation</a> for details.</p>
```

Output (Markdown):
```markdown
# Project Overview

An important project requiring immediate attention.

## Key Features

- Feature 1
- Feature 2

See [documentation](https://example.com) for details.
```

### Code → Markdown

**Rules**:
- Always specify language in code block fence
- Add explanatory text before code
- Use inline code for variable/function references
- Comment code where necessary
- Group related code samples

**Example**:

Input (Raw Code):
```
function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0);
}
```

Output (Markdown):
```markdown
## Total Calculation

The `calculateTotal()` function computes the sum of all item prices:

```javascript
function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0);
}
```

This uses the array `reduce()` method to accumulate prices across items.
```

### Markdown Table Structure

**Input** (Unstructured Data):
```
Product A costs $10, released in 2023
Product B costs $15, released in 2024
Product C costs $20, released in 2024
```

**Output** (Markdown Table):
```markdown
| Product | Price | Release |
|---------|-------|---------|
| Product A | $10 | 2023 |
| Product B | $15 | 2024 |
| Product C | $20 | 2024 |
```

## Document Conversion (.docx, .pptx, .pdf)

### Word Document Structure

Map document structure to Markdown:

| Word Element | Markdown |
|--------------|----------|
| Heading 1 | `# Title` |
| Heading 2 | `## Section` |
| Normal paragraph | `Paragraph text` |
| Bulleted list | `- Item` |
| Numbered list | `1. Item` |
| Table | Markdown table |
| Bold text | `**text**` |
| Italic text | `*text*` |
| Code | `` `code` `` |
| Image | `![alt](url)` |

### PowerPoint Conversion

**One Slide = One Section**:

Slide 1:
```
[Slide Title]
- Bullet point 1
- Bullet point 2
```

Becomes:

```markdown
## Slide Title

- Bullet point 1
- Bullet point 2
```

**Speaker Notes**: Include as blockquote or separate section

**Images**: Reference separately or embed with captions

## Validation Checklist

### Structural Validation

- [ ] One and only one H1 heading
- [ ] No heading level skips (H2 → H3 → H4)
- [ ] Headings are descriptive and specific
- [ ] Logical section grouping
- [ ] Appropriate use of lists vs paragraphs

### Language Validation (E-PRIME)

- [ ] No "is" or "are" (except in quotes or code)
- [ ] No "was" or "were" (except in quotes or code)
- [ ] No "be," "been," or "being"
- [ ] Active voice preferred
- [ ] Specific, concrete language

### Format Validation

- [ ] Code blocks specify language
- [ ] Tables properly aligned
- [ ] Lists properly nested and formatted
- [ ] Links have descriptive text
- [ ] No HTML tags remaining
- [ ] Consistent spacing

### Content Validation

- [ ] Information complete and accurate
- [ ] Facts match source material
- [ ] Code examples functional
- [ ] Links valid and relevant

## Common Conversions

### List Conversion

**Input** (Prose):
```
The system has three main components. First, it validates input. Second, it 
processes the data. Third, it generates output.
```

**Output** (Markdown):
```markdown
The system operates in three stages:

1. Validate input
2. Process data
3. Generate output
```

### Quote Conversion

**Input** (Embedded quote):
```
As the documentation states: "This is the correct approach."
```

**Output** (Markdown):
```markdown
> This is the correct approach.

This approach aligns with documented best practices.
```

## Tools for Conversion

### Command Line
```bash
# Validate Markdown file
node bin/data-to-markdown/cli.js validate document.md

# Check E-PRIME compliance
node bin/data-to-markdown/cli.js check-eprime document.md

# Convert HTML to Markdown
node bin/data-to-markdown/cli.js convert input.html output.md
```

### Python
```python
from data_to_markdown import convert_html, validate_eprime

md = convert_html(html_string)
issues = validate_eprime(md)
```

### JavaScript
```javascript
const { convertHTML, validateEPrime } = require('data-to-markdown');

const md = convertHTML(htmlString);
const issues = validateEPrime(md);
```
