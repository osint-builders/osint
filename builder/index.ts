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

const POLL_BASE_MS = 15_000;         // base poll interval
const POLL_JITTER_MS = 5_000;         // ±jitter added to every poll sleep
const POLL_MAX_BACKOFF_MS = 120_000;  // max backoff on 429: 2 minutes
const SPAWN_STAGGER_MS = 500;         // delay between consecutive agent spawns
const POLL_MAX_TRANSIENT_RETRIES = 5; // retry non-429 transient errors before giving up
const TERMINAL_STATES = new Set(["SUCCEEDED", "FAILED", "CANCELLED"]);

// Track spawned run IDs so the SIGTERM handler can cancel them before the
// process exits. This prevents the Warp platform from leaving runs orphaned
// and auto-cancelling them as "Cancelled by user".
const activeRunIds = new Set<string>();
let ozClient: OzAPI | null = null;

async function cancelActiveRuns(): Promise<void> {
  if (!ozClient || activeRunIds.size === 0) return;
  console.log(`\nCancelling ${activeRunIds.size} in-progress run(s) before exit...`);
  await Promise.allSettled(
    [...activeRunIds].map(id =>
      ozClient!.agent.runs.cancel(id)
        .then(() => console.log(`  ✓ Cancelled ${id}`))
        .catch(err => console.warn(`  ⚠ Could not cancel ${id}: ${err?.message ?? err}`))
    )
  );
}

process.on("SIGTERM", async () => {
  console.log("\nSIGTERM received — cancelling outstanding runs...");
  await cancelActiveRuns();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("\nSIGINT received — cancelling outstanding runs...");
  await cancelActiveRuns();
  process.exit(0);
});

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

/**
 * Loads the prompt template once. Path is relative to this file so it works
 * regardless of cwd.
 */
let cachedTemplate: string | null = null;
function loadPromptTemplate(): string {
  if (cachedTemplate === null) {
    const templatePath = path.join(__dirname, "prompts", "collection-prompt.md");
    cachedTemplate = fs.readFileSync(templatePath, "utf-8");
  }
  return cachedTemplate;
}

// LEARNINGS.md cap: 100 entries OR 30 KB, whichever first.
const LEARNINGS_MAX_ENTRIES = 100;
const LEARNINGS_MAX_BYTES = 30 * 1024;

interface LearningEntry {
  raw: string;        // full markdown of the entry, including its `## ...` header
  date: string | null; // YYYY-MM-DD parsed from the header, for ordering
  expires: string | null; // YYYY-MM-DD or "permanent"
}

/**
 * Parses LEARNINGS.md into individual entries, drops expired ones, and caps
 * the result at LEARNINGS_MAX_ENTRIES / LEARNINGS_MAX_BYTES (oldest
 * non-permanent entries fall off first).
 *
 * Returns the markdown to inject into the prompt as `${learnings}`. If the
 * file is missing or has no entries, returns a sentinel string so the agent
 * can recognize an empty knowledge base.
 */
function loadLearnings(repoRoot: string): string {
  const learningsPath = path.join(repoRoot, "LEARNINGS.md");
  if (!fs.existsSync(learningsPath)) {
    return "_No prior learnings recorded yet._";
  }
  const text = fs.readFileSync(learningsPath, "utf-8");

  // Split on `## ` headers that look like dated entries. The file's own
  // doc headers (`## Rules…`, `## Required entry format`, `## Maintenance`)
  // are above the `<!-- entries below this line; newest first -->` marker.
  const marker = "<!-- entries below this line; newest first -->";
  const idx = text.indexOf(marker);
  const body = idx >= 0 ? text.slice(idx + marker.length) : text;

  const entryRe = /^## (\d{4}-\d{2}-\d{2})[^\n]*$/gm;
  const matches: { headerStart: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = entryRe.exec(body)) !== null) {
    matches.push({ headerStart: m.index });
  }
  const entries: LearningEntry[] = [];
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].headerStart;
    const end = i + 1 < matches.length ? matches[i + 1].headerStart : body.length;
    const raw = body.slice(start, end).trim();
    const dateMatch = raw.match(/^## (\d{4}-\d{2}-\d{2})/);
    const expiresMatch = raw.match(/\*\*Expires:\*\*\s*([^\n]+)/i);
    const expiresRaw = expiresMatch ? expiresMatch[1].trim() : null;
    entries.push({
      raw,
      date: dateMatch ? dateMatch[1] : null,
      expires: expiresRaw,
    });
  }

  if (entries.length === 0) {
    return "_No prior learnings recorded yet._";
  }

  // Drop expired entries.
  const todayIso = new Date().toISOString().slice(0, 10);
  const live = entries.filter((e) => {
    if (!e.expires) return true; // missing expiry → keep, treated as permanent
    if (/^permanent$/i.test(e.expires)) return true;
    // Anything other than YYYY-MM-DD → keep (don't silently drop weird input).
    if (!/^\d{4}-\d{2}-\d{2}$/.test(e.expires)) return true;
    return e.expires >= todayIso;
  });

  // Sort newest-first by date for the agent's reading order. Permanent /
  // undated entries sort to the end.
  live.sort((a, b) => {
    if (a.date && b.date) return b.date.localeCompare(a.date);
    if (a.date) return -1;
    if (b.date) return 1;
    return 0;
  });

  // Cap: keep all permanent entries, then fill remaining quota with newest
  // non-permanent until we hit either limit.
  const isPermanent = (e: LearningEntry) =>
    !e.expires || /^permanent$/i.test(e.expires);
  const permanent = live.filter(isPermanent);
  const dated = live.filter((e) => !isPermanent(e));

  const kept: LearningEntry[] = [...permanent];
  let bytes = kept.reduce((n, e) => n + e.raw.length + 2, 0);
  for (const e of dated) {
    if (kept.length >= LEARNINGS_MAX_ENTRIES) break;
    if (bytes + e.raw.length + 2 > LEARNINGS_MAX_BYTES) break;
    kept.push(e);
    bytes += e.raw.length + 2;
  }

  // Re-sort kept entries newest-first for output, with permanent at top.
  const out = [...permanent, ...dated.filter((e) => kept.includes(e))]
    .map((e) => e.raw)
    .join("\n\n");
  return out || "_No prior learnings recorded yet._";
}

/**
 * Substitutes `${KEY}` placeholders in the template with values from `vars`.
 * Throws on unknown placeholder OR unfilled placeholder, so drift between
 * the template and the orchestrator surfaces immediately.
 */
function renderTemplate(template: string, vars: Record<string, string | number>): string {
  const placeholderRe = /\$\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g;
  const seen = new Set<string>();
  const result = template.replace(placeholderRe, (_match, key: string) => {
    seen.add(key);
    if (!(key in vars)) {
      throw new Error(`Prompt template references unknown placeholder \${${key}}`);
    }
    return String(vars[key]);
  });
  for (const k of Object.keys(vars)) {
    if (!seen.has(k)) {
      throw new Error(`Prompt template never used variable ${k}; check for drift`);
    }
  }
  return result;
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

  // Time window for 1-hour lookback (UTC)
  const oneHourAgo = executionTime.minus({ hours: 1 });
  const timeWindowStart = oneHourAgo.toISO();
  const timeWindowEnd = executionTime.toISO();

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

  return renderTemplate(loadPromptTemplate(), {
    bucketNum,
    totalBuckets,
    bucketSourceCount: sources.length,
    executionTimestamp,
    extractionTimestamp,
    extractionDate,
    extractionDateCompact: extractionDate.replace(/-/g, ""),
    yearMonth,
    timeWindowStart,
    timeWindowEnd,
    originUrl,
    extractionTimeHHMM: extractionTime.toFormat("HH:mm"),
    expectedIdsList,
    expectedIdsBash,
    sourceBlocks,
    learnings: loadLearnings(repoRoot),
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Polls a run until it reaches a terminal state.
 *
 * Uses an initial random jitter delay to spread 15 concurrent pollers apart
 * so they don't all fire at the same instant and trigger API rate limits.
 * On a 429 response the backoff doubles (capped at POLL_MAX_BACKOFF_MS)
 * instead of crashing the whole collection run.
 */
async function pollUntilComplete(
  client: OzAPI,
  runId: string
): Promise<string> {
  process.stdout.write(`Polling run ${runId}`);

  // Stagger concurrent pollers: random initial offset in [0, POLL_BASE_MS).
  await sleep(Math.random() * POLL_BASE_MS);

  let backoffMs = POLL_BASE_MS;
  let transientRetries = 0;

  while (true) {
    try {
      const run = await client.agent.runs.retrieve(runId);
      process.stdout.write(` [${run.state}]`);
      transientRetries = 0; // reset on successful poll
      if (TERMINAL_STATES.has(run.state)) {
        process.stdout.write("\n");
        return run.state;
      }
      backoffMs = POLL_BASE_MS;
      await sleep(POLL_BASE_MS + Math.random() * POLL_JITTER_MS);
    } catch (err: unknown) {
      const status = (err as { status?: number }).status;
      if (status === 429) {
        process.stdout.write(` [429, retrying in ${(backoffMs / 1000).toFixed(0)}s]`);
        await sleep(backoffMs);
        backoffMs = Math.min(backoffMs * 2, POLL_MAX_BACKOFF_MS);
      } else {
        // Retry transient errors (5xx, network blips) up to the limit before
        // giving up. Re-throwing immediately was crashing Promise.all and
        // leaving other in-progress buckets orphaned.
        transientRetries++;
        if (transientRetries > POLL_MAX_TRANSIENT_RETRIES) {
          process.stdout.write(` [fatal poll error after ${transientRetries} retries]\n`);
          throw err;
        }
        const delay = Math.min(backoffMs * transientRetries, POLL_MAX_BACKOFF_MS);
        process.stdout.write(` [transient error ${transientRetries}/${POLL_MAX_TRANSIENT_RETRIES}, retry in ${(delay / 1000).toFixed(0)}s]`);
        await sleep(delay);
      }
    }
  }
}

async function main(): Promise<void> {
  const repoRoot = process.env["REPO_ROOT"] ?? process.cwd();
  const dryRun = process.argv.includes("--dry-run");
  const warpApiKey = process.env["WARP_API_KEY"];
  const environmentId = process.env["WARP_ENVIRONMENT_ID"];

  if (!warpApiKey && !dryRun) {
    console.error("Error: WARP_API_KEY environment variable is required.");
    console.error("Hint: pass --dry-run to build the prompts without dispatching agents.");
    process.exit(1);
  }

  const client = dryRun ? null : new OzAPI({ apiKey: warpApiKey! });
  ozClient = client; // expose to SIGTERM handler

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

  // Total-coverage guarantee: the union of all bucket IDs must exactly
  // equal the set of processable manifest IDs. This is the real check the
  // old per-bucket bash sentinel was trying (and failing) to do — see
  // PR-D in .hermes/plans/2026-05-01_150225-osint-macro-review.md §1.6.
  // Run it ONCE here in the orchestrator where we still have both sets.
  {
    const manifestIds = new Set(processableSources.map((s) => s.id));
    const bucketIds = new Set<string>();
    for (const b of buckets) {
      for (const s of b) {
        if (bucketIds.has(s.id)) {
          throw new Error(
            `Source ${s.id} appears in more than one bucket — partitionSources is broken.`
          );
        }
        bucketIds.add(s.id);
      }
    }
    if (bucketIds.size !== manifestIds.size) {
      throw new Error(
        `Bucket coverage mismatch: ${bucketIds.size} bucketed, ` +
        `${manifestIds.size} processable in manifest.`
      );
    }
    for (const id of manifestIds) {
      if (!bucketIds.has(id)) {
        throw new Error(`Source ${id} is in the manifest but not in any bucket.`);
      }
    }
    console.log(
      `✓ Total-coverage check: ${bucketIds.size} sources across ${buckets.length} buckets ` +
      `equals manifest's processable set.`
    );
  }

  console.log(`\nPartitioning ${processableSources.length} sources into ${buckets.length} parallel agents:`);
  buckets.forEach((bucket, i) => {
    const sourceIds = bucket.map(s => s.id).join(', ');
    console.log(`  Bucket ${i + 1}: ${bucket.length} sources (${sourceIds.slice(0, 60)}...)`);
  });

  // Spawn all agents in parallel
  console.log(dryRun ? `[dry-run] Building ${buckets.length} prompts...` : `Spawning ${buckets.length} Warp cloud agents...`);
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

    if (dryRun) {
      // Write the constructed prompt to disk for inspection rather than spawning.
      const outDir = path.join(repoRoot, ".dry-run-prompts");
      fs.mkdirSync(outDir, { recursive: true });
      const outPath = path.join(outDir, `bucket-${bucketNum}.md`);
      fs.writeFileSync(outPath, prompt);
      console.log(`  ✓ Bucket ${bucketNum}: wrote ${outPath}`);
      return { bucketNum, runId: "dry-run", bucket };
    }

    const runParams: OzAPI.AgentRunParams = {
      prompt,
      config: {
        name: `osint-collection-bucket${bucketNum}-${new Date().toISOString()}`,
        ...(environmentId ? { environment_id: environmentId } : {}),
      },
    };

    // Stagger spawns to avoid hitting the API with 15 simultaneous requests.
    await sleep(bucketIndex * SPAWN_STAGGER_MS);

    try {
      const runResponse = await client!.agent.run(runParams);
      activeRunIds.add(runResponse.run_id); // track for SIGTERM cleanup
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

  if (dryRun) {
    console.log(`\n[dry-run] Built ${runs.length} prompts. No agents dispatched.`);
    process.exit(0);
  }

  // Poll all agents concurrently
  console.log(`\nPolling ${runs.length} agents for completion...`);
  const pollPromises = runs.map(async ({ bucketNum, runId, bucket }) => {
    const finalState = await pollUntilComplete(client!, runId);
    activeRunIds.delete(runId); // no longer needs SIGTERM cleanup
    return { bucketNum, finalState, sourceCount: bucket.length };
  });

  let results: { bucketNum: number; finalState: string; sourceCount: number }[];
  try {
    results = await Promise.all(pollPromises);
  } catch (err) {
    console.error(`\nFatal polling error: ${err}`);
    console.error(`Cancelling remaining in-progress runs before exit...`);
    await cancelActiveRuns();
    process.exit(1);
  }

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

// Allow this file to be require()d for tests/verification without triggering
// the full collection run.
export { buildCollectionPrompt };

if (require.main === module) {
  main();
}
