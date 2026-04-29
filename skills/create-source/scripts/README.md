# Create Source Scripts

Automation scripts for creating, validating, and testing OSINT sources.

## Installation

```bash
cd skills/create-source/scripts
npm install
```

## Scripts Overview

| Script | Purpose | Usage |
|--------|---------|-------|
| `create-source.js` | Interactive source creation wizard | `node create-source.js` |
| `validate-source.js` | Validate source files | `node validate-source.js <file>` |
| `test-source.js` | Test source connectivity & extraction | `node test-source.js <file>` |

## Quick Start

### Create New Source

```bash
# Interactive mode (recommended)
node create-source.js

# Follow the prompts to configure your source
```

### Validate Source

```bash
# Validate single source
node validate-source.js ../../source/sources/my-source.md

# Validate all sources
node validate-source.js --all

# Show help
node validate-source.js --help
```

### Test Source

```bash
# Full test suite
node test-source.js ../../source/sources/my-source.md

# Connectivity only
node test-source.js my-source.md --connectivity

# Extraction test with samples
node test-source.js my-source.md --extract --sample-size 10 --show-sample

# Show help
node test-source.js --help
```

## create-source.js

Interactive wizard that guides you through creating a new source file.

### Features

- Type selection with descriptions
- Step-by-step metadata collection
- Type-specific configuration
- Template generation
- Validation guidance
- File saving with naming convention

### Usage

```bash
node create-source.js
```

### Interactive Prompts

1. **Source Type**: Choose from twitter, webpage, api, email, rss, etc.
2. **Basic Metadata**: Name, description, status, reliability, priority
3. **Configuration**: Tags, languages, geographic focus, cost, authentication
4. **Type-Specific**: Handle, URL, endpoint, etc. based on type
5. **Preview & Save**: Review and save to sources directory

### Output

- Creates file in `source/sources/{type}-{identifier}.md`
- Generates complete front matter
- Creates body template with all required sections
- Provides next steps (validation, testing, deployment)

## validate-source.js

Validates source files for completeness, correctness, and quality.

### Features

- Front matter validation (required fields, formats, enums)
- Type-specific requirement checking
- Body section completeness
- Sensitive data detection
- File naming convention
- Quality scoring (0-100)
- Detailed error and warning reporting

### Usage

```bash
# Validate single file
node validate-source.js <file.md>

# Validate all sources in directory
node validate-source.js --all

# Help
node validate-source.js --help
```

### Exit Codes

- `0`: Validation passed (no errors)
- `1`: Validation failed (has errors)

### Quality Score

Score calculation:
- Passed check = 1 point
- Warning = 0.5 points
- Error = 0 points
- Score = (points / total checks) × 100

Thresholds:
- 90-100: EXCELLENT
- 75-89: PASSED
- 60-74: NEEDS IMPROVEMENT
- 0-59: FAILED

### Validation Checks

**Front Matter:**
- Required fields present
- Valid enums (type, status, reliability, priority, cost)
- Date format (YYYY-MM-DD)
- Array fields are arrays
- Numeric fields in valid ranges
- Description length adequate

**Type-Specific:**
- Twitter: handle, user_id, collection_method
- Webpage: url, selectors, crawl config
- API: base_url, endpoints, auth
- Email: email address, senders, filters
- RSS: feed_url, format

**Body Sections:**
- Overview
- Data Collection Criteria
- Expected Data Format
- Processing Instructions
- Quality Indicators
- Known Issues
- Examples

**Security:**
- No hardcoded credentials
- No API keys in file
- Environment variable references used

**File Naming:**
- Matches `{type}-{identifier}.md` pattern

### Output Example

```
Validating: twitter-example.md

✓ Passed (18):
  • Required field present: id
  • Required field present: name
  • Valid date format: created_date
  • Type requirement found: handle
  • Required section found: Overview
  ... and 13 more

⚠ Warnings (2):
  • Description is very short (< 50 chars)
  • Examples section should include code blocks

✗ Errors (0)

Quality Score: 92/100
Status: EXCELLENT

✓ Source is ready for testing!
```

## test-source.js

Tests source connectivity, data extraction, quality, and transformation.

### Features

- Type-specific connectivity tests
- Sample data extraction
- Quality scoring
- Transformation validation
- Detailed test reporting
- Sample output display

### Usage

```bash
# Full test suite
node test-source.js <file.md>

# Specific tests
node test-source.js <file.md> --connectivity
node test-source.js <file.md> --extract
node test-source.js <file.md> --quality
node test-source.js <file.md> --transform

# Options
node test-source.js <file.md> --sample-size 10    # Fetch 10 items
node test-source.js <file.md> --show-sample       # Display sample entity
node test-source.js <file.md> --dry-run          # Don't store results

# Help
node test-source.js --help
```

### Test Phases

**1. Connectivity Test**
- Verifies source is reachable
- Checks authentication if required
- Validates rate limits
- Tests basic query/fetch

**2. Extraction Test**
- Fetches sample data (default 5 items)
- Runs extraction logic
- Validates field mapping
- Checks data completeness

**3. Quality Test**
- Applies quality indicators
- Scores each item (0-100)
- Checks required fields
- Validates data types
- Reports failed items

**4. Transformation Test**
- Transforms to world event entity
- Validates schema compliance
- Generates markdown
- Verifies all mappings

### Exit Codes

- `0`: All tests passed
- `1`: One or more tests failed

### Environment Variables

Tests may require these environment variables:

```bash
# Twitter
TWITTER_API_KEY=your_key
TWITTER_BEARER_TOKEN=your_token

# Email
EMAIL_HOST=imap.gmail.com
EMAIL_USER=your_email
EMAIL_PASSWORD=your_password

# Other APIs
API_KEY=your_key
```

### Output Example

```
Testing Source: twitter-example.md

Type: twitter
Status: testing

[1/4] Connectivity Test
  Testing Twitter connectivity...
  ✓ Twitter API accessible, authentication valid
  {
    "handle": "example_handle",
    "rateLimits": "OK"
  }
  Duration: 523ms

[2/4] Extraction Test
  Testing data extraction (5 items)...
  ✓ Successfully extracted 5 items

[3/4] Quality Test
  Testing data quality...
  ✓ Average quality score: 88/100, 5/5 items passed

[4/4] Transformation Test
  Testing transformation to world event entities...
  ✓ Transformed 5/5 items successfully

Overall Result:
✓ PASSED - Source is ready for deployment

Sample Output (first item):
{
  "title": "Major event occurs in Region X",
  "date": "2026-04-29T14:32:00Z",
  "type": "conflict",
  "priority": "high",
  ...
}
```

## Development

### Running Tests

```bash
# Install dependencies
npm install

# Run validation on examples
node validate-source.js ../../../source/examples/twitter-example.md
node validate-source.js ../../../source/examples/api-example.md

# Test with sample source
node test-source.js ../../../source/examples/twitter-example.md --show-sample
```

### Adding New Validations

Edit `validate-source.js`:

```javascript
// Add new validation function
function validateCustomField(frontMatter) {
  if (frontMatter.custom_field) {
    // Validation logic
    if (isValid) {
      results.passed.push('Custom field valid');
    } else {
      results.errors.push('Custom field invalid');
    }
  }
}

// Call in validateFrontMatter()
validateCustomField(frontMatter);
```

### Adding New Test Types

Edit `test-source.js`:

```javascript
// Add new connectivity test
async function testCustomTypeConnectivity(frontMatter) {
  // Test logic
  return {
    passed: true/false,
    message: 'Test result',
    duration: Date.now() - startTime
  };
}

// Add to testConnectivity() switch
case 'custom-type':
  return await testCustomTypeConnectivity(frontMatter);
```

## Troubleshooting

### "Module not found: js-yaml"

Install dependencies:
```bash
npm install
```

### "File not found" Error

Ensure you're using correct relative path:
```bash
# From scripts directory
node validate-source.js ../../source/sources/my-source.md

# Or use absolute path
node validate-source.js /full/path/to/source.md
```

### "Invalid YAML" Error

Check front matter format:
- Must start and end with `---`
- Proper YAML indentation
- No tabs (use spaces)
- Multiline strings use `|` or `>`

### Tests Require Authentication

Set required environment variables:
```bash
export TWITTER_API_KEY="your_key"
export EMAIL_PASSWORD="your_password"
```

Or create `.env` file in project root.

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Validate Sources

on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        working-directory: skills/create-source/scripts
        run: npm install
      
      - name: Validate all sources
        working-directory: skills/create-source/scripts
        run: node validate-source.js --all
```

### Pre-commit Hook

```bash
#!/bin/bash
# .git/hooks/pre-commit

# Validate any changed source files
changed_sources=$(git diff --cached --name-only | grep '^source/sources/.*\.md$')

if [ -n "$changed_sources" ]; then
  echo "Validating changed sources..."
  cd skills/create-source/scripts
  
  for file in $changed_sources; do
    node validate-source.js "../../../$file"
    if [ $? -ne 0 ]; then
      echo "Validation failed for $file"
      exit 1
    fi
  done
fi
```

## Resources

- **SKILL.md**: Complete skill documentation
- **QUICK-REFERENCE.md**: Fast reference guide
- **AI-HELPERS.md**: AI assistance prompts
- **EXAMPLES.md**: Real-world usage examples
- **source/README.md**: Source specification
- **source/CONTRIBUTING.md**: Contributor guide
