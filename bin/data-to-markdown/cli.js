#!/usr/bin/env node
/**
 * data-to-markdown CLI
 *
 * Command-line utility for converting various data formats to Markdown
 * with E-PRIME principles and semantic structure.
 */

const fs = require('fs');
const path = require('path');

const COMMANDS = {
    convert: 'Convert file to Markdown',
    validate: 'Validate Markdown structure',
    'check-eprime': 'Check for E-PRIME violations',
    help: 'Show help information'
};

/**
 * Main CLI entry point
 */
function main() {
    const args = process.argv.slice(2);

    if (args.length === 0 || args[0] === 'help' || args[0] === '--help' || args[0] === '-h') {
        showHelp();
        process.exit(0);
    }

    const command = args[0];
    const commandArgs = args.slice(1);

    switch (command) {
        case 'convert':
            handleConvert(commandArgs);
            break;
        case 'validate':
            handleValidate(commandArgs);
            break;
        case 'check-eprime':
            handleCheckEPrime(commandArgs);
            break;
        default:
            console.error(`Unknown command: ${command}`);
            console.error('Run "data-to-markdown help" for usage information.');
            process.exit(1);
    }
}

/**
 * Show help information
 */
function showHelp() {
    console.log(`
data-to-markdown - Convert data to clean, semantic Markdown

USAGE:
    data-to-markdown <command> [options]

COMMANDS:
    convert <input> <output>     Convert file to Markdown
    validate <file>              Validate Markdown structure
    check-eprime <file>          Check for E-PRIME violations
    help                         Show this help message

CONVERT OPTIONS:
    --eprime                     Apply E-PRIME principles
    --detect-lists               Detect and convert lists in plain text
    --include-notes              Include speaker notes (PowerPoint)
    --pages <range>              Page range for PDF (e.g., "1-10")

EXAMPLES:
    # Convert HTML to Markdown
    data-to-markdown convert input.html output.md

    # Convert with E-PRIME
    data-to-markdown convert input.txt output.md --eprime

    # Validate Markdown structure
    data-to-markdown validate document.md

    # Check for E-PRIME violations
    data-to-markdown check-eprime document.md

For more information, see:
    skills/data-to-markdown/SKILL.md
    skills/data-to-markdown/references/
`);
}

/**
 * Handle convert command
 */
function handleConvert(args) {
    if (args.length < 2) {
        console.error('Error: convert requires <input> and <output> arguments');
        console.error('Usage: data-to-markdown convert <input> <output> [options]');
        process.exit(1);
    }

    const inputFile = args[0];
    const outputFile = args[1];
    const options = parseOptions(args.slice(2));

    if (!fs.existsSync(inputFile)) {
        console.error(`Error: Input file not found: ${inputFile}`);
        process.exit(1);
    }

    console.log(`Converting: ${inputFile} → ${outputFile}`);

    const ext = path.extname(inputFile).toLowerCase();
    let markdown;

    try {
        const content = fs.readFileSync(inputFile, 'utf8');

        switch (ext) {
            case '.html':
            case '.htm':
                markdown = convertHTML(content, options);
                break;
            case '.txt':
            case '.text':
                markdown = convertText(content, options);
                break;
            case '.md':
            case '.markdown':
                markdown = content; // Already Markdown
                if (options.eprime) {
                    markdown = applyEPrime(markdown);
                }
                break;
            default:
                console.error(`Error: Unsupported file type: ${ext}`);
                console.error('Supported types: .html, .htm, .txt, .text, .md');
                console.error('Note: .docx, .pptx, .pdf require additional dependencies');
                process.exit(1);
        }

        fs.writeFileSync(outputFile, markdown, 'utf8');
        console.log(`✓ Conversion complete: ${outputFile}`);

        // Run validation
        const issues = validateMarkdown(markdown);
        if (issues.length > 0) {
            console.log('\n⚠ Validation warnings:');
            issues.forEach(issue => console.log(`  - ${issue}`));
        }

        // Check E-PRIME if requested
        if (options.eprime || options['check-eprime']) {
            const violations = checkEPrime(markdown);
            if (violations.length > 0) {
                console.log('\n⚠ E-PRIME violations found:');
                violations.forEach(v => console.log(`  Line ${v.line}: ${v.text}`));
            }
        }

    } catch (error) {
        console.error(`Error during conversion: ${error.message}`);
        process.exit(1);
    }
}

/**
 * Handle validate command
 */
function handleValidate(args) {
    if (args.length === 0) {
        console.error('Error: validate requires a <file> argument');
        process.exit(1);
    }

    const file = args[0];
    if (!fs.existsSync(file)) {
        console.error(`Error: File not found: ${file}`);
        process.exit(1);
    }

    const content = fs.readFileSync(file, 'utf8');
    const issues = validateMarkdown(content);

    if (issues.length === 0) {
        console.log('✓ Markdown validation passed');
        process.exit(0);
    } else {
        console.log('✗ Markdown validation failed:\n');
        issues.forEach(issue => console.log(`  - ${issue}`));
        process.exit(1);
    }
}

/**
 * Handle check-eprime command
 */
function handleCheckEPrime(args) {
    if (args.length === 0) {
        console.error('Error: check-eprime requires a <file> argument');
        process.exit(1);
    }

    const file = args[0];
    if (!fs.existsSync(file)) {
        console.error(`Error: File not found: ${file}`);
        process.exit(1);
    }

    const content = fs.readFileSync(file, 'utf8');
    const violations = checkEPrime(content);

    if (violations.length === 0) {
        console.log('✓ No E-PRIME violations found');
        process.exit(0);
    } else {
        console.log(`✗ Found ${violations.length} E-PRIME violation(s):\n`);
        violations.forEach(v => {
            console.log(`Line ${v.line}: "${v.text}"`);
            if (v.suggestion) {
                console.log(`  Suggestion: "${v.suggestion}"\n`);
            }
        });
        process.exit(1);
    }
}

/**
 * Parse command-line options
 */
function parseOptions(args) {
    const options = {};
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg.startsWith('--')) {
            const key = arg.slice(2);
            if (i + 1 < args.length && !args[i + 1].startsWith('--')) {
                options[key] = args[i + 1];
                i++;
            } else {
                options[key] = true;
            }
        }
    }
    return options;
}

/**
 * Convert HTML to Markdown
 */
function convertHTML(html, options = {}) {
    let markdown = html;

    // Remove HTML comments
    markdown = markdown.replace(/<!--[\s\S]*?-->/g, '');

    // Convert headings
    markdown = markdown.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '\n# $1\n');
    markdown = markdown.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '\n## $1\n');
    markdown = markdown.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '\n### $1\n');
    markdown = markdown.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '\n#### $1\n');
    markdown = markdown.replace(/<h5[^>]*>(.*?)<\/h5>/gi, '\n##### $1\n');
    markdown = markdown.replace(/<h6[^>]*>(.*?)<\/h6>/gi, '\n###### $1\n');

    // Convert emphasis
    markdown = markdown.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
    markdown = markdown.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');
    markdown = markdown.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
    markdown = markdown.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');

    // Convert code
    markdown = markdown.replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`');
    markdown = markdown.replace(
        /<pre><code class="language-(\w+)">([\s\S]*?)<\/code><\/pre>/gi,
        '\n```$1\n$2\n```\n'
    );
    markdown = markdown.replace(/<pre><code>([\s\S]*?)<\/code><\/pre>/gi, '\n```\n$1\n```\n');

    // Convert links
    markdown = markdown.replace(/<a\s+href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)');

    // Convert lists
    markdown = markdown.replace(/<ul[^>]*>/gi, '\n');
    markdown = markdown.replace(/<\/ul>/gi, '\n');
    markdown = markdown.replace(/<ol[^>]*>/gi, '\n');
    markdown = markdown.replace(/<\/ol>/gi, '\n');
    markdown = markdown.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1');

    // Convert blockquotes
    markdown = markdown.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (match, content) => {
        return '\n> ' + content.trim().replace(/<p[^>]*>/gi, '').replace(/<\/p>/gi, '\n> ') + '\n';
    });

    // Convert paragraphs
    markdown = markdown.replace(/<p[^>]*>/gi, '\n');
    markdown = markdown.replace(/<\/p>/gi, '\n');

    // Remove remaining HTML tags
    markdown = markdown.replace(/<[^>]+>/g, '');

    // Decode HTML entities
    markdown = markdown
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec));

    // Clean up whitespace
    markdown = markdown.replace(/\n\s*\n\s*\n/g, '\n\n');
    markdown = markdown.trim();

    if (options.eprime) {
        markdown = applyEPrime(markdown);
    }

    return markdown;
}

/**
 * Convert plain text to Markdown
 */
function convertText(text, options = {}) {
    const lines = text.split('\n');
    const result = [];
    let inCodeBlock = false;
    let codeLines = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        if (!trimmed) {
            if (!inCodeBlock) result.push('');
            continue;
        }

        // Detect code blocks (indented or structured data)
        if (line.match(/^[a-z_]+:\s*$/) || line.match(/^  [a-z_]+:/)) {
            if (!inCodeBlock) {
                inCodeBlock = true;
                codeLines = [];
            }
            codeLines.push(line);
            continue;
        } else if (inCodeBlock) {
            result.push('```yaml');
            result.push(codeLines.join('\n'));
            result.push('```');
            result.push('');
            inCodeBlock = false;
        }

        // ALL CAPS = heading
        if (trimmed === trimmed.toUpperCase() && trimmed.length > 3 && !trimmed.match(/^[0-9-]/)) {
            const title = trimmed.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
            result.push('');
            result.push(`## ${title}`);
            result.push('');
            continue;
        }

        // List items
        if (trimmed.match(/^[-*•]\s+/)) {
            result.push(trimmed);
            continue;
        }

        if (trimmed.match(/^\d+\.\s+/)) {
            result.push(trimmed);
            continue;
        }

        // Regular text
        result.push(trimmed);
    }

    if (inCodeBlock) {
        result.push('```yaml');
        result.push(codeLines.join('\n'));
        result.push('```');
    }

    let markdown = result.join('\n').replace(/\n{3,}/g, '\n\n').trim();

    if (options.eprime) {
        markdown = applyEPrime(markdown);
    }

    return markdown;
}

/**
 * Apply E-PRIME transformations
 */
function applyEPrime(text) {
    // Simple pattern replacements
    const patterns = [
        { from: /\bis designed for\b/gi, to: 'serves' },
        { from: /\bis built for\b/gi, to: 'targets' },
        { from: /\bis located at\b/gi, to: 'resides at' },
        { from: /\bis used for\b/gi, to: 'handles' },
        { from: /\bare used for\b/gi, to: 'handle' },
        { from: /\bwas created by\b/gi, to: 'came from' },
        { from: /\bwere created by\b/gi, to: 'came from' },
    ];

    let result = text;
    for (const { from, to } of patterns) {
        result = result.replace(from, to);
    }

    return result;
}

/**
 * Validate Markdown structure
 */
function validateMarkdown(markdown) {
    const issues = [];
    const lines = markdown.split('\n');

    let h1Count = 0;
    let lastHeadingLevel = 0;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNum = i + 1;

        // Check for H1
        if (line.match(/^#\s+/)) {
            h1Count++;
            if (h1Count > 1) {
                issues.push(`Line ${lineNum}: Multiple H1 headings (should have only one)`);
            }
            lastHeadingLevel = 1;
        }

        // Check for heading level skips
        const headingMatch = line.match(/^(#{2,6})\s+/);
        if (headingMatch) {
            const level = headingMatch[1].length;
            if (lastHeadingLevel > 0 && level > lastHeadingLevel + 1) {
                issues.push(`Line ${lineNum}: Heading level skip (H${lastHeadingLevel} → H${level})`);
            }
            lastHeadingLevel = level;
        }

        // Check for code blocks without language
        if (line === '```' && i > 0 && lines[i - 1] !== '```') {
            issues.push(`Line ${lineNum}: Code block without language specification`);
        }
    }

    if (h1Count === 0) {
        issues.push('No H1 heading found (document should have a title)');
    }

    return issues;
}

/**
 * Check for E-PRIME violations
 */
function checkEPrime(markdown) {
    const violations = [];
    const lines = markdown.split('\n');

    // Forms of "to be" to check
    const patterns = [
        { pattern: /\b(is|are)\b/gi, form: 'is/are' },
        { pattern: /\b(was|were)\b/gi, form: 'was/were' },
        { pattern: /\b(be|been|being)\b/gi, form: 'be/been/being' },
    ];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNum = i + 1;

        // Skip code blocks, links, and headings for E-PRIME check
        if (line.match(/^```/) || line.match(/^\[.*\]\(/) || line.match(/^#{1,6}\s/)) {
            continue;
        }

        for (const { pattern, form } of patterns) {
            const matches = line.match(pattern);
            if (matches) {
                violations.push({
                    line: lineNum,
                    text: line.trim(),
                    form: form
                });
            }
        }
    }

    return violations;
}

// Run CLI
if (require.main === module) {
    main();
}

module.exports = {
    convertHTML,
    convertText,
    applyEPrime,
    validateMarkdown,
    checkEPrime
};
