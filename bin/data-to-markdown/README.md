# data-to-markdown CLI Tool

Command-line utility for converting various data formats to clean, semantic Markdown with E-PRIME principles.

## Installation

The CLI tool requires Node.js (v16 or later).

```bash
# From the project root
cd bin/data-to-markdown

# Make executable (if not already)
chmod +x cli.js

# Create symlink for global use (optional)
npm link
# or
ln -s "$(pwd)/cli.js" /usr/local/bin/data-to-markdown
```

## Usage

```bash
data-to-markdown <command> [options]
```

## Commands

### convert

Convert a file to Markdown format.

```bash
data-to-markdown convert <input> <output> [options]
```

**Examples**:

```bash
# Convert HTML to Markdown
data-to-markdown convert page.html output.md

# Convert plain text with E-PRIME applied
data-to-markdown convert notes.txt output.md --eprime

# Convert with list detection
data-to-markdown convert document.txt output.md --detect-lists
```

**Options**:
- `--eprime` - Apply E-PRIME principles (remove "to be" forms)
- `--detect-lists` - Auto-detect and format lists in plain text
- `--include-notes` - Include speaker notes (PowerPoint, not yet implemented)
- `--pages <range>` - Page range for PDF conversion (not yet implemented)

### validate

Validate Markdown structure and report issues.

```bash
data-to-markdown validate <file>
```

**Checks**:
- Single H1 heading
- No heading level skips
- Code blocks have language specifications

**Example**:

```bash
data-to-markdown validate document.md
```

### check-eprime

Check for E-PRIME violations (forms of "to be").

```bash
data-to-markdown check-eprime <file>
```

**Example**:

```bash
data-to-markdown check-eprime document.md
```

## Supported Formats

Currently supported:
- `.html`, `.htm` - HTML documents
- `.txt`, `.text` - Plain text files
- `.md`, `.markdown` - Markdown files (for validation and E-PRIME conversion)

Coming soon:
- `.docx` - Microsoft Word documents (requires `mammoth` package)
- `.pptx` - PowerPoint presentations (requires `pptx2json` package)
- `.pdf` - PDF documents (requires `pdf-parse` package)

## Examples

### Basic HTML Conversion

```bash
# Input: page.html
# Output: page.md
data-to-markdown convert page.html page.md
```

### Plain Text with Structure Detection

```bash
# Detects headings, lists, and code blocks
data-to-markdown convert notes.txt notes.md --detect-lists
```

### E-PRIME Conversion

```bash
# Applies E-PRIME transformations
data-to-markdown convert draft.md final.md --eprime
```

### Validation Workflow

```bash
# 1. Convert
data-to-markdown convert source.html output.md --eprime

# 2. Validate structure
data-to-markdown validate output.md

# 3. Check E-PRIME compliance
data-to-markdown check-eprime output.md
```

## Programmatic Usage

You can also use the CLI functions in Node.js code:

```javascript
const { convertHTML, convertText, validateMarkdown, checkEPrime } = require('./cli.js');

// Convert HTML
const markdown = convertHTML('<h1>Title</h1><p>Content</p>', { eprime: true });

// Validate
const issues = validateMarkdown(markdown);
console.log(issues); // []

// Check E-PRIME
const violations = checkEPrime(markdown);
console.log(violations); // []
```

## Exit Codes

- `0` - Success
- `1` - Error or validation failure

## Integration with AI Agents

This CLI tool integrates with the `data-to-markdown` skill for AI agents. Agents can:

1. Use the CLI to convert files
2. Apply validation rules
3. Check E-PRIME compliance
4. Provide suggestions for improvement

See `../../skills/data-to-markdown/SKILL.md` for the complete skill documentation.

## Future Enhancements

- Support for `.docx`, `.pptx`, `.pdf` conversion
- Table detection and conversion in plain text
- Custom E-PRIME rule configuration
- Batch conversion mode
- Watch mode for continuous conversion
- Markdown linting with configurable rules
- HTML entity decoding improvements
- Language detection for code blocks

## License

MIT

## Related Documentation

- [Data-to-Markdown Skill](../../skills/data-to-markdown/SKILL.md)
- [Conversion Examples](../../skills/data-to-markdown/references/)
- [E-PRIME Guide](../../skills/data-to-markdown/references/eprime-guide.md)
