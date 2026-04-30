

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
2. Setup Node.js 20
3. Install builder dependencies (`npm ci` in `builder/`)
4. Run collection (`npm run collect` in `builder/`) — spawns a Warp cloud agent via oz-agent-sdk
5. The cloud agent collects data, writes JSONL, and commits/pushes directly to the repo

**Outputs**:
- JSONL event files in `data/events/YYYY-MM/YYYY-MM-DD.jsonl`
- Media files in `data/media/YYYY-MM/{images,videos}/YYYY-MM-DD/`
- Updated `memory.md` with learnings
- GitHub Actions artifacts (90-day retention)

**Secrets required**:
- `WARP_API_KEY` (required) — Warp API key for oz-agent-sdk
- `WARP_ENVIRONMENT_ID` (required) — UID of a pre-configured Warp cloud environment with the repo, tools, and API keys

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
| `WARP_API_KEY` | Warp API key for oz-agent-sdk | ✅ Yes |
| `WARP_ENVIRONMENT_ID` | UID of pre-configured Warp cloud environment | ✅ Yes |

**Get API Keys**:
- **Warp API key**: https://app.warp.dev/ → Settings → API
- **Warp environment UID**: Create an environment in the Warp dashboard with the osint repo cloned, `agent-browser` installed globally, and required API keys (`ANTHROPIC_API_KEY`, `TWITTER_BEARER_TOKEN`, `PERPLEXITY_API_KEY`) configured as environment variables

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
- Missing `WARP_API_KEY` or `WARP_ENVIRONMENT_ID` secret
- Invalid API key
- `builder/node_modules` not installed (check `npm ci` step)

**Solutions**:
```bash
# Check secrets configured
gh secret list

# Set missing secrets
gh secret set WARP_API_KEY
gh secret set WARP_ENVIRONMENT_ID

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

#### 4. Warp Agent Timeout or Failure

**Symptoms**: Collection run ends with state `FAILED` or `CANCELLED`

**Possible Causes**:
- Warp environment not configured correctly (missing repo, tools, or API keys)
- Source taking too long
- Network issues in the cloud environment

**Solutions**:
- Check `memory.md` for specific errors logged by the agent
- Verify the Warp environment has `agent-browser` installed and the repo cloned
- Trigger a manual run and inspect logs: `gh run view --log`

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

Before pushing workflow changes, test the builder locally:

```bash
# Install dependencies
cd builder && npm install

# Set required env vars
export WARP_API_KEY="your-warp-api-key"
export WARP_ENVIRONMENT_ID="your-environment-uid"
export REPO_ROOT=$(pwd)/..

# Run builder
npm run collect
```

---

## Workflow Architecture

```
┌─────────────────────────────────────────────────────┐
│         GitHub Actions (Hourly Trigger)             │
└────────────────┤─────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────┐
│     builder/index.ts (oz-agent-sdk)                 │
│                                                      │
│  1. Load active sources from source/manifest.json   │
│  2. Build collection prompt with source details      │
│  3. client.agent.run() → spawn Warp cloud agent     │
│  4. Poll runs.retrieve() until SUCCEEDED/FAILED      │
└────────────────┤─────────────────────────────────────┘
                 │
                 ↓ (cloud)
┌─────────────────────────────────────────────────────┐
│     Warp Cloud Agent (oz-agent-sdk environment)     │
│                                                      │
│  - Reads source files (source/sources/*.md)          │
│  - Uses skills (agent-browser, perplexity-search)    │
│  - Collects raw data per source                      │
│  - Structures World Event Entities (E-PRIME)         │
│  - Validates and writes JSONL to data/               │
│  - Downloads media                                   │
│  - Updates memory.md                                 │
│  - Commits and pushes to repo                        │
└─────────────────────────────────────────────────────┘
```

---

## Maintenance

### Update Dependencies

**Builder dependencies**:
```bash
cd builder && npm update && npm install
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

- **Builder**: `builder/index.ts`
- **Automation Instructions**: Root `README.md` (Automation Instructions section)
- **Data Schema**: `data/SCHEMA.md`
- **Skills**: `skills/README.md`
- **Sources**: `source/README.md`

---

**Last Updated**: 2026-04-29
