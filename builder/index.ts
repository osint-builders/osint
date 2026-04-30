#!/usr/bin/env tsx
/**
 * OSINT Builder
 *
 * Reads sources from source/manifest.json (every source whose status is NOT
 * in EXCLUDED_STATUSES), constructs a collection prompt, and spawns a single
 * Warp cloud agent via oz-agent-sdk to perform the full collection workflow
 * (collect → validate → write JSONL → commit).
 *
 * IMPORTANT: this builder uses a deny-list, not an allow-list. New sources
 * (including ones with status "testing" or "unverified") are automatically
 * included in every run. To skip a source, set its status to one of
 * EXCLUDED_STATUSES (e.g. "inactive", "archived", "deprecated"). The prompt
 * also embeds an explicit cross-check step that fails if the source list
 * embedded in the prompt does not match the live manifest.
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
import { DateTime } from "luxon";

const POLL_INTERVAL_MS = 10_000;
const TERMINAL_STATES = new Set(["SUCCEEDED", "FAILED", "CANCELLED"]);

// Warp's prompt size limit (1 MB = 1,048,576 bytes)
// We target 80% of limit for safety (838,860 bytes)
const MAX_PROMPT_SIZE_BYTES = 838_860;

// Calculate optimal bucket count based on source count
// Average: ~14,500 bytes per source (based on 2.06 MB / 142 sources)
const BYTES_PER_SOURCE = 14_500;
const BASE_PROMPT_OVERHEAD = 50_000; // Base prompt without sources

function calculateOptimalBucketCount(sourceCount: number): number {
  const configuredCount = parseInt(process.env.PARALLEL_AGENT_COUNT || "0");

  // Calculate minimum buckets needed to stay under size limit
  const totalSizeEstimate = BASE_PROMPT_OVERHEAD + (sourceCount * BYTES_PER_SOURCE);
  const minBucketsNeeded = Math.ceil(totalSizeEstimate / MAX_PROMPT_SIZE_BYTES);

  // Use the larger of: configured count or minimum needed
  const optimalCount = Math.max(configuredCount, minBucketsNeeded);

  console.log(`\nBucket calculation:`);
  console.log(`  Sources: ${sourceCount}`);
  console.log(`  Estimated total prompt size: ${(totalSizeEstimate / 1024).toFixed(0)} KB`);
  console.log(`  Configured PARALLEL_AGENT_COUNT: ${configuredCount}`);
  console.log(`  Minimum buckets needed: ${minBucketsNeeded}`);
  console.log(`  Using: ${optimalCount} buckets (max of configured vs minimum)\n`);

  return optimalCount;
}

// Statuses that should be EXCLUDED from a collection run.
// Anything else (active, testing, unverified, etc.) is processed so that
// new sources are never silently dropped from the prompt.
const EXCLUDED_STATUSES = new Set(["inactive", "archived", "deprecated"]);

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

/**
 * Returns every source from source/manifest.json whose status is NOT in
 * EXCLUDED_STATUSES. We explicitly opt out of an allow-list (e.g. status ===
 * "active") so a freshly-added source with status "testing" cannot silently
 * disappear from the collection run. To skip a source, set its status to one
 * of the EXCLUDED_STATUSES values.
 */
function loadProcessableSources(repoRoot: string): Source[] {
  const manifestPath = path.join(repoRoot, "source", "manifest.json");
  const manifest: Manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
  return manifest.sources.filter(
    (s) => !EXCLUDED_STATUSES.has((s.status ?? "").toLowerCase())
  );
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

function partitionSources(sources: Source[], bucketCount: number): Source[][] {
  // Shuffle sources to distribute high-priority sources across buckets
  const shuffled = [...sources].sort(() => Math.random() - 0.5);

  const buckets: Source[][] = Array.from({ length: bucketCount }, () => []);
  shuffled.forEach((source, index) => {
    buckets[index % bucketCount].push(source);
  });

  return buckets.filter(bucket => bucket.length > 0);
}

function buildCollectionPrompt(
  repoRoot: string,
  sources: Source[],
  originUrl: string,
  bucketNum: number,
  totalBuckets: number
): string {
  const executionTime = DateTime.now().setZone("UTC");
  const extractionTime = executionTime.minus({ hours: 1 }).setZone("America/New_York");
  const executionTimestamp = executionTime.toISO();
  const extractionTimestamp = extractionTime.toISO();
  const extractionDate = extractionTime.toISODate(); // YYYY-MM-DD
  const yearMonth = extractionDate.slice(0, 7);

  const sourceBlocks = sources
    .map((s) => {
      const content = readSourceFile(repoRoot, s);
      return `### Source: ${s.name} (id: ${s.id}, file: source/${s.file})\n\n${content}`;
    })
    .join("\n\n---\n\n");

  // Sentinel list of expected source IDs. The agent MUST cross-check this
  // against source/manifest.json at runtime and abort if they disagree, so
  // a newly-added source can never be silently dropped from a collection run.
  const expectedIds = sources.map((s) => s.id);
  const expectedIdsBash = expectedIds.map((id) => `"${id}"`).join(" ");
  const expectedIdsList = expectedIds.map((id) => `- ${id}`).join("\n");

  return `# OSINT World Event Collection Task (Bucket ${bucketNum} of ${totalBuckets})

You are an AI agent tasked with collecting OSINT world events.
This agent is processing **bucket ${bucketNum} of ${totalBuckets}**.

**Execution time**: ${executionTimestamp} (UTC)
**Extraction time**: ${extractionTimestamp} (EST)
**Target date**: ${extractionDate} (EST)
**Repository**: ${originUrl}
**Bucket**: ${bucketNum} / ${totalBuckets} (${sources.length} sources in this bucket)

This agent collects events from approximately **${extractionTime.toFormat('HH:mm')} EST** on **${extractionDate}** (1 hour lookback from execution).

## Your Mission

Collect world events from **every** source listed in the "Sources to Process"
section below, structure them as World Event Entities, and commit the results
to the repository.

You MUST process every source. The orchestrator already pre-filtered sources
from \`source/manifest.json\`; the section below is the authoritative worklist.
If you skip a source, the run is considered failed.

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

## Sources to Process (${sources.length} in this bucket — process ONE AT A TIME, do NOT skip any)

Expected source IDs for this run (sentinel — used by the cross-check below):

${expectedIdsList}

Full source definitions follow. The agent must process **every** one of them.

${sourceBlocks}

## Step-by-Step Execution

### Step 0.5: Cross-Check Source List Against Live Manifest

Before collecting anything, verify that the sentinel list above matches the
set of processable sources in \`source/manifest.json\` (everything whose status
is NOT in {inactive, archived, deprecated}). This is a hard guard against the
builder template silently dropping a source.

\`\`\`bash
# IDs the orchestrator embedded in this prompt
EXPECTED_IDS=(${expectedIdsBash})

# IDs currently in the manifest with a processable status
MANIFEST_IDS=$(jq -r '.sources[] | select((.status // "") | ascii_downcase | IN("inactive","archived","deprecated") | not) | .id' source/manifest.json | sort)

EXPECTED_SORTED=$(printf "%s\\n" "\${EXPECTED_IDS[@]}" | sort)

if [ "$EXPECTED_SORTED" != "$MANIFEST_IDS" ]; then
  echo "ERROR: Source list mismatch between prompt and source/manifest.json" >&2
  echo "Expected (from prompt):" >&2
  printf "  %s\\n" "\${EXPECTED_IDS[@]}" | sort >&2
  echo "Found in manifest (processable):" >&2
  echo "$MANIFEST_IDS" | sed 's/^/  /' >&2
  echo "Aborting collection so no source is silently skipped." >&2
  exit 1
fi

echo "Source list cross-check passed: \${#EXPECTED_IDS[@]} sources to process."
\`\`\`

If this check fails, do NOT continue. Investigate the mismatch and either
(a) regenerate the prompt with the missing source, or (b) update the manifest
status to one of {inactive, archived, deprecated} if the source genuinely
should be skipped.

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
BUCKET_ID="bucket${bucketNum}"
WORK_DIR="/tmp/osint-collection-$TIMESTAMP-$BUCKET_ID"
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

**ID format**: \`evt_YYYYMMDD_NNN\` using extraction date (e.g., \`evt_${extractionDate.replace(/-/g, "")}_001\`)

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
DATE="${extractionDate}"
# Note: Use extraction date (EST), not execution date (UTC)
mkdir -p "data/events/$YEAR_MONTH"
TARGET="data/events/$YEAR_MONTH/$DATE.jsonl"
touch "$TARGET"

# Phase A: URL pre-filter — skip events whose primary URL already exists in today's file
if [ -f "$TARGET" ]; then
  SEEN_URLS=$(jq -r '.links[0].url // empty' "$TARGET" 2>/dev/null | sort -u)
else
  SEEN_URLS=""
fi

find "$WORK_DIR" -name "events.jsonl" -type f | while read f; do
  while IFS= read -r line; do
    EVENT_URL=$(printf '%s' "$line" | jq -r '.links[0].url // empty')
    if [ -z "$EVENT_URL" ] || ! printf '%s\\n' "$SEEN_URLS" | grep -qF "$EVENT_URL"; then
      printf '%s\\n' "$line"
    fi
  done < "$f"
done >> "$TARGET"

# Phase B: ID post-dedup — collapse any ID collisions within the merged file
jq -s 'unique_by(.id) | .[]' "$TARGET" > "$TARGET.tmp" && mv "$TARGET.tmp" "$TARGET"
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

Automated OSINT collection run
- Execution time: ${executionTimestamp} (UTC)
- Extraction time: ${extractionTimestamp} (EST)
- Data collected from 1-hour lookback window

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

### Step 8.5: Update Indexes and Statistics

\`\`\`bash
# Rebuild all indexes from collected data
echo "Rebuilding data indexes..."
node data/scripts/rebuild-indexes.js

# Generate statistics and update manifest
echo "Updating manifest statistics..."
STATS_JSON=$(node data/scripts/stats-report.js)
TOTAL_EVENTS=$(echo "$STATS_JSON" | jq -r '.total_events')
OLDEST_DATE=$(jq -s 'map(.date_published) | sort | .[0] // null' data/events/*/*.jsonl 2>/dev/null || echo "null")
NEWEST_DATE=$(jq -s 'map(.date_published) | sort | .[-1] // null' data/events/*/*.jsonl 2>/dev/null || echo "null")

# Update manifest.json with fresh statistics
jq --arg updated "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \\
   --arg oldest "$OLDEST_DATE" \\
   --arg newest "$NEWEST_DATE" \\
   --argjson total "$TOTAL_EVENTS" \\
   --argjson by_month "$(echo "$STATS_JSON" | jq '.by_month')" \\
   --argjson by_source "$(echo "$STATS_JSON" | jq '.by_source')" \\
   --argjson media "$(echo "$STATS_JSON" | jq '.media')" \\
   '.last_updated = $updated |
    .data_range.oldest_date = $oldest |
    .data_range.newest_date = $newest |
    .statistics.total_events = $total |
    .statistics.events_by_month = $by_month |
    .statistics.events_by_source = $by_source |
    .statistics.media_files = $media' \\
   data/manifest.json > data/manifest.json.tmp && mv data/manifest.json.tmp data/manifest.json

# Commit index and manifest updates
git add data/indexes/*.json data/manifest.json
if ! git diff --cached --quiet; then
  git commit -m "Update data indexes and statistics

Generated indexes:
- by-source.json
- by-topic.json
- by-location.json
- stats.json

Updated manifest.json with latest statistics

[skip ci]"

  git push "$PUSH_URL" main 2>&1 | sed -E "$REDACT"
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

  // Load every processable source
  let processableSources: Source[];
  try {
    processableSources = loadProcessableSources(repoRoot);
  } catch (err) {
    console.error(`Error loading source manifest: ${err}`);
    process.exit(1);
  }

  if (processableSources.length === 0) {
    console.log("No processable sources found. Exiting.");
    process.exit(0);
  }

  console.log(`Found ${processableSources.length} processable source(s)`);

  // Read git origin URL
  const originUrl = getOriginUrl(repoRoot);
  console.log(`Repository: ${originUrl}`);

  // Calculate optimal bucket count based on source count and size limits
  const bucketCount = calculateOptimalBucketCount(processableSources.length);
  const buckets = partitionSources(processableSources, bucketCount);

  console.log(`\nPartitioning ${processableSources.length} sources into ${buckets.length} parallel agents:`);
  buckets.forEach((bucket, i) => {
    const sourceIds = bucket.map(s => s.id).join(', ');
    console.log(`  Bucket ${i + 1}: ${bucket.length} sources (${sourceIds.slice(0, 60)}...)`);
  });

  // Spawn all agents in parallel
  console.log(`Spawning ${buckets.length} Warp cloud agents...`);
  const runPromises = buckets.map(async (bucket, bucketIndex) => {
    const bucketNum = bucketIndex + 1;
    const prompt = buildCollectionPrompt(repoRoot, bucket, originUrl, bucketNum, buckets.length);

    // Validate prompt size before sending
    const promptSizeBytes = Buffer.byteLength(prompt, 'utf8');
    const promptSizeKB = (promptSizeBytes / 1024).toFixed(1);
    const promptSizeMB = (promptSizeBytes / 1024 / 1024).toFixed(2);

    console.log(`  Bucket ${bucketNum}: ${bucket.length} sources, prompt size: ${promptSizeKB} KB (${promptSizeMB} MB)`);

    if (promptSizeBytes > 1_048_576) {
      const errorMsg = `Bucket ${bucketNum} prompt exceeds 1 MB limit: ${promptSizeMB} MB (${promptSizeBytes} bytes). Need more buckets!`;
      console.error(`  ❌ ${errorMsg}`);
      throw new Error(errorMsg);
    }

    const runParams: OzAPI.AgentRunParams = {
      prompt,
      config: {
        name: `osint-collection-bucket${bucketNum}-${new Date().toISOString()}`,
        ...(environmentId ? { environment_id: environmentId } : {}),
      },
    };

    try {
      const runResponse = await client.agent.run(runParams);
      console.log(`  ✓ Bucket ${bucketNum}: spawned (run ID: ${runResponse.run_id})`);
      return { bucketNum, runId: runResponse.run_id, bucket };
    } catch (err) {
      console.error(`  ✗ Bucket ${bucketNum}: failed to spawn - ${err}`);
      throw err;
    }
  });

  let runs: { bucketNum: number; runId: string; bucket: Source[] }[];
  try {
    runs = await Promise.all(runPromises);
  } catch (err) {
    console.error(`Error spawning agents: ${err}`);
    process.exit(1);
  }

  // Poll all agents concurrently
  console.log(`\nPolling ${runs.length} agents for completion...`);
  const pollPromises = runs.map(async ({ bucketNum, runId, bucket }) => {
    const finalState = await pollUntilComplete(client, runId);
    return { bucketNum, finalState, sourceCount: bucket.length };
  });

  const results = await Promise.all(pollPromises);

  // Report results
  console.log(`\n=== Collection Results ===`);
  let allSucceeded = true;
  results.forEach(({ bucketNum, finalState, sourceCount }) => {
    const status = finalState === "SUCCEEDED" ? "✓" : "✗";
    console.log(`  ${status} Bucket ${bucketNum}: ${finalState} (${sourceCount} sources)`);
    if (finalState !== "SUCCEEDED") {
      allSucceeded = false;
    }
  });

  if (allSucceeded) {
    console.log("\n✓ All collection buckets succeeded.");
    process.exit(0);
  } else {
    console.error("\n✗ One or more collection buckets failed.");
    process.exit(1);
  }
}

main();
