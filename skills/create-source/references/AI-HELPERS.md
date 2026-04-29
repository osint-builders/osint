# AI Helper Prompts for Source Creation

Comprehensive prompts to help AI agents assist with OSINT source creation, validation, and troubleshooting.

## Planning Phase

### Prompt: Plan New Source

```
I want to create a new OSINT source for world event monitoring.

Type: [twitter/webpage/api/email/rss/other]
Brief description: [what intelligence this provides]

Please help me plan by:

1. **Gathering Requirements**
   - Ask questions to understand the source fully
   - Identify what collection criteria are needed
   - Determine authentication requirements
   - Understand update frequency needs

2. **Assessing Feasibility**
   - Evaluate reliability and data quality expectations
   - Identify potential challenges
   - Suggest alternatives if issues exist

3. **Providing Recommendations**
   - Recommend priority level
   - Suggest appropriate reliability rating
   - Advise on update frequency
   - Identify required resources (API keys, etc.)

Ask me clarifying questions before providing recommendations.
```

### Prompt: Choose Between Similar Sources

```
I'm deciding between multiple sources for [topic/region]:

Option 1: [description]
Option 2: [description]
Option 3: [description]

Compare these options based on:
1. Data quality and reliability
2. Update frequency and timeliness
3. Coverage breadth vs depth
4. Ease of integration
5. Cost and sustainability
6. Redundancy with existing sources

Recommend which source(s) to add and why.
```

### Prompt: Evaluate Source Reliability

```
Evaluate the reliability of this source:

Name: [source name]
Type: [type]
Details: [URL/handle/API/etc.]

Research and assess:
1. Source reputation and history
2. Track record of accuracy
3. Bias or agenda concerns
4. Verification processes
5. Update consistency
6. Coverage scope

Recommend a reliability rating (high/medium/low/unverified) with justification.
```

## Creation Phase

### Prompt: Generate Front Matter

```
Generate complete front matter for this OSINT source:

**Basic Info:**
- Type: [type]
- Name: [name]
- Description: [description]

**Configuration:**
- Status: testing
- Reliability: [high/medium/low]
- Priority: [high/medium/low]
- Update frequency: [frequency]

**Coverage:**
- Languages: [languages]
- Geographic focus: [regions]

Generate YAML front matter with all required and relevant optional fields.
Include appropriate tags based on the source type and description.
```

### Prompt: Create Collection Criteria

```
Define detailed collection criteria for this source:

**Source Details:**
- Type: [twitter/webpage/api/email/rss]
- [Type-specific details: URL, handle, endpoint, etc.]

**Requirements:**
- What to collect: [description]
- What to filter out: [description]
- Quality thresholds: [description]

Provide:
1. Specific parameters (selectors, keywords, filters)
2. Include/exclude rules
3. Quality thresholds
4. Rate limiting considerations
5. Error handling approaches

Be specific and actionable - these will be used by automated collection systems.
```

### Prompt: Design Processing Pipeline

```
Design a data processing pipeline for this source:

**Source Type:** [type]
**Data Format:** [format description]
**Target Schema:** World Event Entity (see world-event-entities skill)

Provide step-by-step processing instructions:

1. **Extraction**: How to get data from source
2. **Parsing**: How to extract structured fields
3. **Validation**: Quality checks to perform
4. **Transformation**: Mapping to world event schema
5. **Enrichment**: Additional processing
6. **Storage**: Final format

Include code examples where helpful.
```

### Prompt: Generate Examples

```
Create realistic examples for this source:

**Source Type:** [type]
**Source Details:** [details]

Generate 3 examples:
1. **High-priority breaking event**
2. **Medium-priority regular update**
3. **Edge case or problematic data**

For each example provide:
- Raw data from source (realistic format)
- Extracted fields
- Transformed world event entity
- Quality indicators that apply
- Processing notes

Examples should be realistic enough to guide implementation.
```

## Validation Phase

### Prompt: Review Source File

```
Review this source file for completeness and quality:

[paste entire source file content]

Provide detailed feedback on:

1. **Front Matter**
   - All required fields present?
   - Valid values and formats?
   - Appropriate settings for source type?
   - Missing recommended fields?

2. **Type-Specific Requirements**
   - Are all type-specific requirements included?
   - Are they sufficiently detailed?
   - Any missing configuration?

3. **Body Sections**
   - All required sections present?
   - Adequate detail in each section?
   - Clear and actionable instructions?

4. **Examples**
   - Realistic and representative?
   - Cover important cases?
   - Show data transformations?

5. **Quality Indicators**
   - Specific and measurable?
   - Cover both positive and negative signals?
   - Appropriate for source type?

6. **Issues and Concerns**
   - Potential problems documented?
   - Workarounds provided?
   - Sensitive data present?

Provide specific line-by-line feedback with recommendations.
```

### Prompt: Fix Validation Errors

```
My source validation is failing with these errors:

[paste validation output]

Source file excerpt:
[paste relevant sections]

Help me:
1. Understand each error
2. Identify root causes
3. Provide corrected versions
4. Suggest prevention strategies

Show specific fixes for each error.
```

### Prompt: Improve Quality Score

```
My source validation passed but quality score is only [score]/100.

Warnings:
[list warnings]

Source type: [type]

Help me improve the quality score by:
1. Addressing each warning with specific improvements
2. Suggesting additional details to add
3. Recommending better examples
4. Improving clarity and specificity

Provide concrete suggestions with examples.
```

## Testing Phase

### Prompt: Troubleshoot Connection Issues

```
I'm testing source connectivity and getting this error:

**Source Type:** [type]
**Error Message:** [error]
**Configuration:** [relevant config]

Help me:
1. Diagnose the likely cause
2. Suggest debugging steps
3. Provide potential solutions
4. Recommend configuration changes

If authentication is involved, ensure solutions don't expose credentials.
```

### Prompt: Debug Extraction Failures

```
Data extraction test is failing:

**Source Type:** [type]
**Issue:** [description - no data, partial data, wrong format, etc.]
**Expected:** [what should happen]
**Actual:** [what is happening]

**Extraction Configuration:**
[paste selectors, patterns, or extraction rules]

**Sample Source Data:**
[paste sample of raw source data]

Debug this by:
1. Analyzing why extraction is failing
2. Testing extraction rules
3. Providing corrected configuration
4. Suggesting validation checks
```

### Prompt: Optimize Quality Filters

```
My quality test shows low scores:

**Passed:** [X]/[Y] items
**Average Quality:** [score]/100

**Common failures:**
- [issue 1]
- [issue 2]
- [issue 3]

**Current Quality Indicators:**
[paste quality indicators section]

Help me optimize quality filters by:
1. Analyzing failure patterns
2. Adjusting quality thresholds
3. Adding new quality checks
4. Refining existing indicators

Balance between catching low-quality data and not being too restrictive.
```

## Maintenance Phase

### Prompt: Update Existing Source

```
I need to update an existing source that's having issues:

**Source:** [name]
**Current Status:** [status]
**Issues:**
- [issue 1]
- [issue 2]

**Changes Needed:**
- [change 1]
- [change 2]

Help me:
1. Review current configuration
2. Suggest specific updates
3. Update front matter appropriately
4. Document changes
5. Update last_updated date

Provide the updated sections that need to change.
```

### Prompt: Deprecate Source

```
I need to deprecate a source that's no longer useful:

**Source:** [name]
**Reason:** [why deprecating]
**Alternatives:** [replacement sources if any]

Guide me through:
1. Changing status to 'inactive' or 'archived'
2. Documenting deprecation reason
3. Updating manifest
4. Notifying stakeholders
5. Preserving historical data

Provide checklist and updated configuration.
```

### Prompt: Analyze Source Performance

```
Analyze performance of this source over time:

**Source:** [name]
**Metrics:**
- Uptime: [percentage]
- Data quality: [average score]
- False positives: [count]
- False negatives: [estimated count]
- Collection success rate: [percentage]

**Recent Issues:**
[list any issues]

Provide:
1. Performance assessment
2. Reliability rating recommendation
3. Optimization suggestions
4. Decision on keeping/deprecating source
5. Recommended update frequency

Base recommendations on data patterns.
```

## Type-Specific Helpers

### Twitter Source Helper

```
Help me configure a Twitter source:

**Account:** @[handle]

I need help with:
1. Finding the numeric user ID
2. Determining best collection method (timeline/search/stream)
3. Setting appropriate filters (retweets, replies, engagement)
4. Defining keyword monitoring
5. Configuring rate limits
6. Handling API v2 requirements

Provide specific configuration recommendations with code examples.
```

### Webpage Source Helper

```
Help me configure a webpage scraping source:

**URL:** [url]

I need help with:
1. Identifying correct CSS selectors for content
2. Setting crawl depth and patterns
3. Handling JavaScript-rendered content
4. Respecting robots.txt and rate limits
5. Extracting article metadata (date, author, etc.)
6. Handling pagination or infinite scroll

Analyze the webpage structure and provide specific selectors and configuration.
```

### API Source Helper

```
Help me configure an API source:

**API:** [name or URL]
**Documentation:** [link if available]

I need help with:
1. Understanding authentication requirements
2. Identifying relevant endpoints
3. Mapping API response to world event schema
4. Handling rate limits and pagination
5. Error handling and retry logic
6. Optimizing API queries

Provide endpoint documentation, request examples, and response mapping.
```

### Email Source Helper

```
Help me configure an email source:

**Type:** [newsletter/digest/alerts]
**Sender:** [email address or domain]

I need help with:
1. Configuring IMAP or API connection
2. Creating sender allowlist
3. Defining subject line filters
4. Parsing HTML and plain text emails
5. Extracting structured data from email content
6. Handling attachments

Provide configuration examples and parsing logic.
```

### RSS Source Helper

```
Help me configure an RSS feed source:

**Feed URL:** [url]

I need help with:
1. Determining feed format (RSS/Atom)
2. Parsing feed entries correctly
3. Mapping feed fields to entity schema
4. Filtering relevant entries
5. Handling feed updates and new items
6. Deduplication strategy

Provide feed parsing configuration and item mapping.
```

## Advanced Scenarios

### Prompt: Create Multi-Source Strategy

```
I need a comprehensive sourcing strategy for monitoring [topic/region]:

**Requirements:**
- Coverage: [geographic/thematic scope]
- Timeliness: [how quickly need updates]
- Reliability: [quality requirements]
- Resources: [available budget, API keys, etc.]

Recommend:
1. Mix of source types (social, news, APIs, etc.)
2. Specific sources to add (3-5 sources)
3. Priority and update frequency for each
4. Redundancy and verification strategy
5. Resource allocation
6. Implementation order

Explain rationale for each recommendation.
```

### Prompt: Validate Source Ecosystem

```
Review my complete source configuration:

**Current Sources:**
[list sources with types and focus]

Analyze:
1. Coverage gaps (geographic, thematic, source type)
2. Redundancy (too much overlap?)
3. Reliability distribution (enough high-quality sources?)
4. Timeliness (fast enough for breaking news?)
5. Resource efficiency (duplication or waste?)
6. Single points of failure

Recommend additions, removals, or adjustments.
```

### Prompt: Design Source Integration

```
Design integration between multiple sources:

**Sources:**
1. [source 1]: [type and focus]
2. [source 2]: [type and focus]
3. [source 3]: [type and focus]

Design:
1. Data flow architecture
2. Cross-validation strategy
3. Deduplication approach
4. Confidence scoring based on multiple sources
5. Conflict resolution when sources disagree
6. Event merging and enrichment

Provide architectural diagram and processing logic.
```

## Troubleshooting Templates

### Rate Limiting Issues

```
I'm hitting rate limits on [source type]:

**Current Configuration:**
- Update frequency: [frequency]
- Requests per cycle: [count]
- Rate limit: [API limit]

**Symptoms:**
[describe what's happening]

Optimize by suggesting:
1. Adjusted update frequency
2. Request batching strategies
3. Priority-based polling
4. Caching approaches
5. Alternative endpoints or methods
```

### Data Quality Issues

```
I'm getting low-quality data from this source:

**Source:** [name and type]
**Issues:**
- [issue 1]: [percentage of items affected]
- [issue 2]: [percentage of items affected]

**Examples:**
[paste 1-2 examples of low-quality items]

Help me:
1. Identify root causes
2. Improve filtering
3. Add quality checks
4. Adjust extraction logic
5. Document known quality issues
```

### Authentication Failures

```
Authentication is failing for this source:

**Source Type:** [type]
**Auth Method:** [method]
**Error:** [error message]

**Current Configuration:**
[paste non-sensitive auth config]

Troubleshoot:
1. Common causes for this auth method
2. Configuration verification steps
3. Testing approach
4. Alternative auth methods
5. Environment variable setup
```

## Best Practices

When using AI helpers:

1. **Be Specific**: Provide exact error messages, configuration, and examples
2. **Provide Context**: Share source type, requirements, and constraints
3. **Show Work**: Include what you've already tried
4. **Paste Content**: Include relevant file sections for review
5. **Ask Follow-ups**: Iterate until solution is clear
6. **Validate Suggestions**: Test recommendations before implementing
7. **Document Learnings**: Add insights to source file
8. **Share Successes**: Document what worked for future reference

## Example Workflow

Complete source creation workflow using AI helpers:

```
1. Plan new source
   → Use "Plan New Source" prompt
   → Get recommendations

2. Create source file
   → Use "Generate Front Matter" prompt
   → Use "Create Collection Criteria" prompt
   → Use type-specific helper
   → Use "Generate Examples" prompt

3. Validate
   → Run validation script
   → If errors, use "Fix Validation Errors" prompt
   → If warnings, use "Improve Quality Score" prompt
   → Use "Review Source File" prompt for final check

4. Test
   → Run test script
   → If connectivity fails, use "Troubleshoot Connection" prompt
   → If extraction fails, use "Debug Extraction" prompt
   → If quality low, use "Optimize Quality Filters" prompt

5. Deploy
   → Mark as active
   → Update manifest
   → Document in commit message

6. Maintain
   → Monitor performance
   → Use "Analyze Source Performance" periodically
   → Update or deprecate as needed
```
