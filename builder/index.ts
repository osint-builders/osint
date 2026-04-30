#!/usr/bin/env tsx
/**
 * OSINT Builder
 *
 * Reads active sources from source/manifest.json, constructs a collection
 * prompt, and spawns a single Warp cloud agent via oz-agent-sdk to perform
 * the full collection workflow (collect → validate → write JSONL → commit).
 *
 * Required environment variables:
 *   WARP_API_KEY          — Warp API key
 *   WARP_ENVIRONMENT_ID   — UID of a pre-configured Warp cloud environment
 *
 * Optional:
 *   REPO_ROOT             — Repository root (defaults to cwd)
 */

import OzAPI from "oz-agent-sdk";
import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

const POLL_INTERVAL_MS = 10_000;
const TERMINAL_STATES = new Set(["SUCCEEDED", "FAILED", "CANCELLED"]);

interface Source {
  id: string;
  name: string;
  file: string;
  status: string;
  type?: string;
}

interface Manifest {
  sources: Source[];
}

function loadActiveSources(repoRoot: string): Source[] {
  const manifestPath = path.join(repoRoot, "source", "manifest.json");
  const manifest: Manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
  return manifest.sources.filter((s) => s.status === "active");
}

function readSourceFile(repoRoot: string, source: Source): string {
  const sourcePath = path.join(repoRoot, "source", source.file);
  if (!fs.existsSync(sourcePath)) {
    return `(source file not found: source/${source.file})`;
  }
  return fs.readFileSync(sourcePath, "utf-8");
}

function getOriginUrl(repoRoot: string): string {
  try {
    return execSync("git remote get-url origin", { cwd: repoRoot })
      .toString()
      .trim();
  } catch {
    return "git@github.com:osint-builders/osint.git";
  }
}

function buildCollectionPrompt(
  repoRoot: string,
  sources: Source[],
  originUrl: string
): string {
  const timestamp = new Date().toISOString();
  const date = timestamp.slice(0, 10);
  const yearMonth = date.slice(0, 7);

  const sourceBlocks = sources
    .map((s) => {
      const content = readSourceFile(repoRoot, s);
      return `### Source: ${s.name} (id: ${s.id}, file: source/${s.file})\n\n${content}`;
    })
    .join("\n\n---\n\n");

  return `# OSINT World Event Collection Task

You are an AI agent tasked with collecting OSINT world events.

**Run timestamp**: ${timestamp}
**Target date**: ${date}
**Repository**: ${originUrl}

## Your Mission

Collect world events from each active source listed below, structure them as World Event Entities, and commit the results to the repository.

## Step 0: Clone and Enter the Repository

Before doing anything else, ensure you are working inside the correct repository:

\`\`\`bash
# If the repo is not already cloned, clone it
if [ ! -d "osint/.git" ]; then
  git clone ${originUrl} osint
fi
cd osint
REPO_ROOT=$(pwd)
\`\`\`

All subsequent steps must run from **inside the cloned repo directory**.

## Active Sources (${sources.length} total — process ONE AT A TIME)

${sourceBlocks}

## Step-by-Step Execution

### Step 1: Validate Prerequisites

\`\`\`bash
test -d source/sources || exit 1
test -f source/manifest.json || exit 1
test -d data/events || exit 1
test -f data/SCHEMA.md || exit 1
test -d skills || exit 1
command -v node >/dev/null 2>&1 || exit 1
command -v git >/dev/null 2>&1 || exit 1
command -v jq >/dev/null 2>&1 || exit 1
\`\`\`

### Step 2: Create Temporary Work Directory

\`\`\`bash
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
WORK_DIR="/tmp/osint-collection-$TIMESTAMP"
mkdir -p "$WORK_DIR/raw" "$WORK_DIR/media/images" "$WORK_DIR/media/videos"
\`\`\`

### Step 3: Process Each Source Sequentially

For each source listed above:

1. **Read source file** — understand collection method, selectors, auth requirements, quality indicators
2. **Collect raw data** using the appropriate approach:
   - **Twitter/X**: Use \`agent-browser\` to navigate and extract tweets, or use Twitter API with \`curl\` and \`$TWITTER_BEARER_TOKEN\`
   - **Webpage**: Use \`agent-browser\` with CSS selectors from the source file
   - **API**: Use \`curl\` with appropriate auth headers
   - **RSS**: Fetch with \`curl\` and parse XML
3. **Extract World Event Entities** from raw data following the schema in \`data/SCHEMA.md\`
4. **Transform contents to E-PRIME** — rewrite \`contents\` field removing all "to be" verbs (is, are, was, were, be, been, being). Use active, specific verbs. See \`skills/data-to-markdown/SKILL.md\` for guidance.
5. **Save to \`$WORK_DIR/{source_id}/events.jsonl\`** — one JSON object per line
6. **Download media** to \`$WORK_DIR/{source_id}/media/\` and update \`image_urls\` to relative paths
7. **Log non-obvious issues** to \`$WORK_DIR/{source_id}/new-memory.md\` (errors, rate limits, unexpected formats only)

**Required JSONL fields per event**: \`id\`, \`source\`, \`title\`, \`summary\`, \`contents\` (100+ words, E-PRIME), \`date_published\`, \`links\`, \`image_urls\`

**ID format**: \`evt_YYYYMMDD_NNN\` (e.g., \`evt_${date.replace(/-/g, "")}_001\`)

**Skills available** (read the SKILL.md for each before using):
- \`skills/agent-browser/SKILL.md\` — web scraping, Twitter data
- \`skills/perplexity-search/SKILL.md\` — AI-powered web research via Perplexity API (\`$PERPLEXITY_API_KEY\`)
- \`skills/data-to-markdown/SKILL.md\` — E-PRIME transformation and markdown structuring
- \`skills/world-event-entities/SKILL.md\` — entity schema reference
- \`skills/remember-as-you-go/SKILL.md\` — when and how to log learnings

### Step 4: Validate Collected Events

For each \`events.jsonl\` file found:
\`\`\`bash
# Check valid JSON per line
while IFS= read -r line; do
  echo "$line" | jq empty || { echo "Invalid JSON"; exit 1; }
done < events.jsonl

# Check required fields
cat events.jsonl | jq -e '.id and .source and .title and .summary and .contents and .date_published and .links and .image_urls' >/dev/null

# Check E-PRIME in contents (fail if "to be" verbs found)
cat events.jsonl | jq -r '.contents' | \\
  grep -Ei '\\b(is|are|was|were|be|been|being)\\b' && \\
  { echo "ERROR: E-PRIME violation in contents field"; exit 1; } || true
\`\`\`

### Step 5: Move Events to Data Folder

\`\`\`bash
YEAR_MONTH="${yearMonth}"
DATE="${date}"
mkdir -p "data/events/$YEAR_MONTH"
TARGET="data/events/$YEAR_MONTH/$DATE.jsonl"
touch "$TARGET"

# Combine all collected JSONL files
find "$WORK_DIR" -name "events.jsonl" -type f -exec cat {} \\; >> "$TARGET"

# Deduplicate by ID
sort -t'"' -k4,4 -u "$TARGET" > "$TARGET.tmp" && mv "$TARGET.tmp" "$TARGET"
\`\`\`

### Step 6: Handle Media Files

\`\`\`bash
mkdir -p "data/media/$YEAR_MONTH/images/$DATE" "data/media/$YEAR_MONTH/videos/$DATE"
find "$WORK_DIR/media" -type f \\( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" -o -name "*.webp" \\) \\
  -exec mv {} "data/media/$YEAR_MONTH/images/$DATE/" \\; 2>/dev/null || true
find "$WORK_DIR/media" -type f \\( -name "*.mp4" -o -name "*.webm" -o -name "*.mov" \\) \\
  -exec mv {} "data/media/$YEAR_MONTH/videos/$DATE/" \\; 2>/dev/null || true
\`\`\`

### Step 7: Update memory.md

Append any \`new-memory.md\` files from the work directory to \`memory.md\`. Trim \`memory.md\` to last 500 lines if it exceeds that.

### Step 8: Commit and Push

\`\`\`bash
git config user.name "OSINT Collector Bot"
git config user.email "osint-bot@github-actions"
git add "data/events/$YEAR_MONTH/$DATE.jsonl" "data/media/$YEAR_MONTH/" "memory.md" 2>/dev/null || true

if ! git diff --cached --quiet; then
  EVENT_COUNT=$(wc -l < "data/events/$YEAR_MONTH/$DATE.jsonl")
  git commit -m "Collect $EVENT_COUNT world events on $DATE

Automated OSINT collection run at ${timestamp}

Data format: JSONL (JSON Lines)
Storage: data/events/$YEAR_MONTH/$DATE.jsonl

[skip ci]"

  # Pick the push token. Prefer OSINT_GH_TOKEN (fine-grained PAT with
  # Contents:write on osint-builders/osint); fall back to GH_TOKEN.
  PUSH_TOKEN="\${OSINT_GH_TOKEN:-\$GH_TOKEN}"
  if [ -z "$PUSH_TOKEN" ]; then
    echo "ERROR: No push token available (set OSINT_GH_TOKEN or GH_TOKEN)." >&2
    exit 1
  fi

  # Derive owner/repo from the configured origin URL (handles SSH or HTTPS form).
  REPO_PATH=$(git remote get-url origin \\
    | sed -E 's|^git@github\\.com:|https://github.com/|; s|^https?://github\\.com/||; s|\\.git$||')
  PUSH_URL="https://x-access-token:$PUSH_TOKEN@github.com/$REPO_PATH.git"

  # Redact the token from any output that gets logged.
  REDACT='s|https://[^@]+@|https://<redacted>@|g'

  git push "$PUSH_URL" main 2>&1 | sed -E "$REDACT"
  PUSH_RC=\${PIPESTATUS[0]}
  if [ "$PUSH_RC" -ne 0 ]; then
    git pull --rebase "$PUSH_URL" main 2>&1 | sed -E "$REDACT"
    git push "$PUSH_URL" main 2>&1 | sed -E "$REDACT"
  fi
fi
\`\`\`

### Step 9: Cleanup

\`\`\`bash
rm -rf "$WORK_DIR"
\`\`\`

## Error Handling

- **Source fails**: Log to memory.md, continue to next source (do not abort)
- **Validation fails**: Stop and exit with error (do not commit invalid data)
- **Git push fails**: Retry once with pull/rebase
- **Zero events**: Commit is skipped; exit 0 (no new data is normal)

## Quality Requirements

- \`contents\` field: 100+ words minimum
- \`contents\` field: E-PRIME only (no "to be" verbs)
- All URLs must be valid HTTP/HTTPS
- Dates in ISO 8601 format
- Each event has a unique ID
- No HTML in text fields (Markdown only in contents)
`;
}

async function pollUntilComplete(
  client: OzAPI,
  runId: string
): Promise<string> {
  process.stdout.write(`Polling run ${runId}`);
  while (true) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    const run = await client.agent.runs.retrieve(runId);
    process.stdout.write(` [${run.state}]`);
    if (TERMINAL_STATES.has(run.state)) {
      process.stdout.write("\n");
      return run.state;
    }
  }
}

async function main(): Promise<void> {
  const repoRoot = process.env["REPO_ROOT"] ?? process.cwd();
  const warpApiKey = process.env["WARP_API_KEY"];
  const environmentId = process.env["WARP_ENVIRONMENT_ID"];

  if (!warpApiKey) {
    console.error("Error: WARP_API_KEY environment variable is required.");
    process.exit(1);
  }

  const client = new OzAPI({ apiKey: warpApiKey });

  // Load active sources
  let activeSources: Source[];
  try {
    activeSources = loadActiveSources(repoRoot);
  } catch (err) {
    console.error(`Error loading source manifest: ${err}`);
    process.exit(1);
  }

  if (activeSources.length === 0) {
    console.log("No active sources found in source/manifest.json. Exiting.");
    process.exit(0);
  }

  console.log(
    `Found ${activeSources.length} active source(s): ${activeSources
      .map((s) => s.id)
      .join(", ")}`
  );

  // Read git origin URL so the cloud agent pushes to the right repo
  const originUrl = getOriginUrl(repoRoot);
  console.log(`Repository: ${originUrl}`);

  // Build collection prompt
  const prompt = buildCollectionPrompt(repoRoot, activeSources, originUrl);

  // Spawn Warp cloud agent
  console.log("Spawning Warp cloud agent...");
  const runParams: OzAPI.AgentRunParams = {
    prompt,
    config: {
      name: `osint-collection-${new Date().toISOString()}`,
      ...(environmentId ? { environment_id: environmentId } : {}),
    },
  };

  let runResponse: OzAPI.AgentRunResponse;
  try {
    runResponse = await client.agent.run(runParams);
  } catch (err) {
    console.error(`Error spawning agent: ${err}`);
    process.exit(1);
  }

  console.log(`Agent run created. Run ID: ${runResponse.run_id}`);

  // Poll until terminal state
  const finalState = await pollUntilComplete(client, runResponse.run_id);

  if (finalState === "SUCCEEDED") {
    console.log("Collection run succeeded.");
    process.exit(0);
  } else {
    console.error(`Collection run ended with state: ${finalState}`);
    process.exit(1);
  }
}

main();
