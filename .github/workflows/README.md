

# GitHub Actions Workflows

Automated OSINT collection and data release workflows for continuous intelligence gathering.

## Workflows

### 1. Hourly OSINT Collection (`hourly-collection.yml`)

**Purpose**: Collect world events from active OSINT sources every hour.

**Schedule**: Every hour at `:00` (24 times per day)

**Triggers**:
- Schedule: `0 * * * *` (hourly)
- Manual: `workflow_dispatch` (Actions tab → Run workflow)
- Push: `main` branch (excluding data/, memory.md, documentation)

**Steps**:
1. Checkout repository
2. Setup Node.js 20 and Python 3.11
3. Setup Docker for Sandcastle containers
4. Install dependencies (Node + Python)
5. Run Python orchestrator (`python -m orchestrator.main`)
6. Upload data artifacts (90-day retention)
7. Commit and push results (with `[skip ci]` to avoid loops)

**Outputs**:
- JSONL event files in `data/events/YYYY-MM/YYYY-MM-DD.jsonl`
- Media files in `data/media/YYYY-MM/{images,videos}/YYYY-MM-DD/`
- Updated `memory.md` with learnings
- GitHub Actions artifacts (90-day retention)

**Environment Variables**:
- `ANTHROPIC_API_KEY` (required)
- `TWITTER_BEARER_TOKEN` (optional, for Twitter sources)
- `PERPLEXITY_API_KEY` (optional, for Perplexity searches)

### 2. Create Data Release (`create-release.yml`)

**Purpose**: Create weekly releases with archived data for distribution.

**Schedule**: Every Sunday at midnight UTC

**Triggers**:
- Schedule: `0 0 * * 0` (weekly)
- Manual: `workflow_dispatch`

**Steps**:
1. Checkout repository
2. Create tar.gz archive of data folder
3. Generate statistics (event count, media files)
4. Create GitHub release with archive attached

**Outputs**:
- Release tag: `data-YYYY-MM-DD`
- Archive: `osint-data-YYYY-MM-DD.tar.gz`
- Release notes with statistics and usage instructions

---

## Configuration

### Required Secrets

Configure in: **Settings → Secrets and variables → Actions → Repository secrets**

| Secret Name | Description | Required |
|-------------|-------------|----------|
| `ANTHROPIC_API_KEY` | Claude API key for AI agents | ✅ Yes |
| `TWITTER_BEARER_TOKEN` | Twitter API authentication | ⚠️ If Twitter sources active |
| `PERPLEXITY_API_KEY` | Perplexity AI search API | ⬜ Optional |

**Get API Keys**:
- **Anthropic**: https://console.anthropic.com/
- **Twitter**: https://developer.twitter.com/
- **Perplexity**: https://www.perplexity.ai/settings/api

### Required Permissions

Configure in: **Settings → Actions → General → Workflow permissions**

✅ Enable:
- **Read and write permissions** (for pushing commits)
- **Allow GitHub Actions to create and approve pull requests**

---

## Monitoring

### View Workflow Runs

**GitHub UI**:
1. Go to **Actions** tab
2. Select workflow (Hourly OSINT Collection / Create Data Release)
3. View run history and logs

**GitHub CLI**:
```bash
# List recent runs
gh run list --workflow=hourly-collection.yml --limit 10

# Watch current run
gh run watch

# View logs for specific run
gh run view <run-id> --log

# Download artifacts
gh run download <run-id>
```

### Workflow Status

Check status badge in root README.md:

```markdown
![OSINT Collection](https://github.com/your-org/osint/actions/workflows/hourly-collection.yml/badge.svg)
```

### Artifacts

**Access artifacts**:
1. Go to workflow run details
2. Scroll to **Artifacts** section
3. Download `osint-data-run-NNNN.zip`

**Retention**: 90 days

---

## Troubleshooting

### Common Issues

#### 1. Workflow Fails Immediately

**Symptoms**: Workflow fails in "Run OSINT collection" step

**Possible Causes**:
- Missing `ANTHROPIC_API_KEY` secret
- Invalid API key
- Python dependencies not installed

**Solutions**:
```bash
# Check secrets configured
gh secret list

# Set missing secret
gh secret set ANTHROPIC_API_KEY

# Check workflow logs
gh run view --log
```

#### 2. No Events Collected

**Symptoms**: Workflow succeeds but `data/events/` is empty

**Possible Causes**:
- No active sources in `source/manifest.json` (status: "testing" instead of "active")
- Sources have no new data
- Collection criteria too strict

**Solutions**:
```bash
# Check active sources
cat source/manifest.json | jq '.sources[] | select(.status == "active")'

# Update source status
# Edit source/manifest.json and change "status": "testing" to "status": "active"

# Check memory.md for errors
cat memory.md | tail -50
```

#### 3. Git Push Fails

**Symptoms**: "Push results to repository" step fails

**Possible Causes**:
- Permissions not configured
- Branch protection rules blocking bot
- Concurrent runs creating conflicts

**Solutions**:
1. **Check Permissions**: Settings → Actions → General
   - Enable "Read and write permissions"
2. **Branch Protection**: Settings → Branches
   - Allow "OSINT Collector Bot" to bypass rules
   - Or disable "Require pull request reviews" for bot commits
3. **Retry**: Workflow automatically retries with `git pull --rebase`

#### 4. Sandcastle Timeout

**Symptoms**: "Sandcastle agent failed with exit code 124"

**Possible Causes**:
- Source taking longer than 10 minutes (idle timeout)
- Network issues
- Docker container problems

**Solutions**:
- Check memory.md for specific errors
- Increase timeout in orchestrator (currently 600s)
- Test source locally: `node bin/sandcastle/cli.js run --prompt "test"`

#### 5. Validation Errors

**Symptoms**: "Validation failed" in logs

**Possible Causes**:
- Invalid JSON in collected events
- Missing required fields
- E-PRIME violations in contents
- Invalid date formats

**Solutions**:
```bash
# Run validation locally
node data/scripts/validate-events.js data/events/2026-04/2026-04-29.jsonl

# Check E-PRIME compliance
cat data/events/*/*.jsonl | jq -r '.contents' | \
  grep -Ei '\b(is|are|was|were|be|been|being)\b'
```

#### 6. Infinite Loop (Workflow Triggering Itself)

**Symptoms**: Workflow runs continuously after every commit

**Prevention**: Already configured with:
- `paths-ignore` for `data/**` and `memory.md`
- `[skip ci]` in commit messages

**If it happens**:
1. Disable workflow: Actions → Hourly OSINT Collection → ⋯ → Disable workflow
2. Check `.github/workflows/hourly-collection.yml` has correct `paths-ignore`
3. Re-enable workflow

---

## Manual Execution

### Trigger Workflow Manually

**GitHub UI**:
1. Go to **Actions** tab
2. Select **Hourly OSINT Collection**
3. Click **Run workflow**
4. Select branch (main)
5. Click **Run workflow**

**GitHub CLI**:
```bash
# Trigger hourly collection
gh workflow run hourly-collection.yml

# Trigger data release
gh workflow run create-release.yml

# Watch execution
gh run watch
```

### Test Locally

Before pushing workflow changes, test orchestrator locally:

```bash
# Setup
pip install -r requirements.txt
export ANTHROPIC_API_KEY="your-key"
export REPO_ROOT=$(pwd)

# Run orchestrator
python -m orchestrator.main

# Verify output
ls -lh data/events/$(date +%Y-%m)/$(date +%Y-%m-%d).jsonl
node data/scripts/validate-events.js --from $(date +%Y-%m-%d)
```

---

## Workflow Architecture

```
┌─────────────────────────────────────────────────────┐
│         GitHub Actions (Hourly Trigger)             │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│         Python Orchestrator (LangGraph)             │
│                                                      │
│  Nodes:                                              │
│  1. Load sources from manifest                       │
│  2. Create work directory                            │
│  3. Process sources (Sandcastle + Claude)            │
│  4. Validate events (schema + E-PRIME)               │
│  5. Move data to storage                             │
│  6. Update memory                                    │
│  7. Commit and push                                  │
│  8. Cleanup                                          │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│            Sandcastle (Docker Isolation)            │
│                                                      │
│  Claude Code Agent:                                  │
│  - Reads source file (source/sources/*.md)           │
│  - Uses skills (agent-browser, perplexity, etc.)     │
│  - Collects raw data                                 │
│  - Transforms to World Event Entities                │
│  - Applies E-PRIME via data-to-markdown              │
│  - Downloads media                                   │
│  - Outputs JSONL                                     │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│              Data Storage (Repository)              │
│                                                      │
│  data/events/YYYY-MM/YYYY-MM-DD.jsonl                │
│  data/media/YYYY-MM/{images,videos}/YYYY-MM-DD/     │
│  memory.md                                           │
└─────────────────────────────────────────────────────┘
```

---

## Maintenance

### Update Dependencies

**Node dependencies**:
```bash
cd bin/sandcastle && npm update && cd ../..
cd bin/agent-browser && npm update && cd ../..
```

**Python dependencies**:
```bash
pip install --upgrade -r requirements.txt
pip freeze > requirements.txt
```

### Adjust Schedule

Edit `.github/workflows/hourly-collection.yml`:

```yaml
on:
  schedule:
    - cron: '0 * * * *'  # Change to desired schedule
```

**Examples**:
- Every 2 hours: `0 */2 * * *`
- Every 30 minutes: `*/30 * * * *`
- Daily at 9am UTC: `0 9 * * *`

### Monitor Resource Usage

GitHub Actions free tier limits:
- **Public repos**: Unlimited
- **Private repos**: 2,000 minutes/month

**Current usage**: ~50 minutes per day (24 hourly runs × 2 min avg)

**Optimize**:
- Process fewer sources per run
- Reduce Sandcastle iterations (currently 3)
- Skip workflow if no active sources

---

## Related Documentation

- **Orchestrator**: `orchestrator/README.md`
- **Automation Instructions**: Root `README.md` (lines 49-786)
- **Data Schema**: `data/SCHEMA.md`
- **Skills**: `skills/README.md`
- **Sources**: `source/README.md`

---

**Last Updated**: 2026-04-29
