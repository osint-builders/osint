#!/usr/bin/env tsx
/**
 * OSINT Builder — orchestrator.
 *
 * Reads sources from source/manifest.json (every source whose status stays
 * outside EXCLUDED_STATUSES), partitions them into buckets, renders
 * builder/prompts/collection-prompt.md per bucket, and spawns one Warp cloud
 * agent per bucket via oz-agent-sdk. Each agent clones this repo and drives
 * the versioned helper scripts in builder/runtime/ (pre-check → collect →
 * enrich → validate → merge → submit).
 *
 * IMPORTANT: this builder uses a deny-list, not an allow-list. New sources
 * (including ones with status "testing" or "unverified") automatically join
 * every run. To skip a source, set its status to one of EXCLUDED_STATUSES
 * ("inactive", "archived", "deprecated"). The prompt also embeds a sentinel
 * ID list that the agent cross-checks against the live manifest.
 *
 * Required environment variables:
 *   WARP_API_KEY          — Warp API key (exhausted credits surface as
 *                           401/402 at spawn time — see the spawn handler)
 *   WARP_ENVIRONMENT_ID   — UID of a pre-configured Warp cloud environment
 *
 * Optional:
 *   REPO_ROOT             — Repository root (defaults to cwd)
 *   PARALLEL_AGENT_COUNT  — Bucket-count override; otherwise auto-sized
 *                           from SOURCES_PER_AGENT
 *   WARP_MODEL_ID         — Oz model_id pinned on every agent run. Defaults
 *                           to DEFAULT_MODEL_ID below. Pinning avoids the
 *                           account/environment default resolving to a
 *                           non-Warp-native model (e.g. Mistral).
 */

import OzAPI from "oz-agent-sdk";
import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import { DateTime } from "luxon";
import {
  MAX_PROMPT_SIZE_BYTES,
  DEFAULT_MODEL_ID,
  SPAWN_STAGGER_MS,
  activeRunIds,
  setOzClient,
  registerShutdownHandlers,
  cancelActiveRuns,
  sleep,
  renderTemplate,
  pollUntilComplete,
} from "./lib/agent-runner";

// Bucket count derives from wall-clock parallelism, not prompt size: each
// agent processes its sources sequentially, so SOURCES_PER_AGENT bounds the
// per-agent workload. PARALLEL_AGENT_COUNT (when set > 0) overrides.
const SOURCES_PER_AGENT = 12;

function calculateBucketCount(sourceCount: number): number {
  const configuredCount = parseInt(process.env.PARALLEL_AGENT_COUNT || "0");
  const autoCount = Math.ceil(sourceCount / SOURCES_PER_AGENT);
  const count = configuredCount > 0 ? configuredCount : autoCount;

  console.log(`\nBucket calculation:`);
  console.log(`  Sources: ${sourceCount}`);
  console.log(`  Auto (ceil(n/${SOURCES_PER_AGENT})): ${autoCount}`);
  console.log(`  Configured PARALLEL_AGENT_COUNT: ${configuredCount || "(unset)"}`);
  console.log(`  Using: ${count} buckets\n`);

  return count;
}

// Statuses that should be EXCLUDED from a collection run.
// Anything else (active, testing, unverified, etc.) is processed so that
// new sources are never silently dropped from the prompt.
const EXCLUDED_STATUSES = new Set(["inactive", "archived", "deprecated"]);

export interface Source {
  id: string;
  name: string;
  file: string;
  status: string;
  type?: string;
  priority?: string;
}

export interface Manifest {
  sources: Source[];
}

/**
 * Returns every source from source/manifest.json whose status is NOT in
 * EXCLUDED_STATUSES. We explicitly opt out of an allow-list (e.g. status ===
 * "active") so a freshly-added source with status "testing" cannot silently
 * disappear from the collection run. To skip a source, set its status to one
 * of the EXCLUDED_STATUSES values.
 */
export function loadProcessableSources(repoRoot: string): Source[] {
  const manifestPath = path.join(repoRoot, "source", "manifest.json");
  const manifest: Manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
  return manifest.sources.filter(
    (s) => !EXCLUDED_STATUSES.has((s.status ?? "").toLowerCase())
  );
}

export function readSourceFile(repoRoot: string, source: Source): string {
  const sourcePath = path.join(repoRoot, "source", source.file);
  if (!fs.existsSync(sourcePath)) {
    return `(source file not found: source/${source.file})`;
  }
  return fs.readFileSync(sourcePath, "utf-8");
}

export function getOriginUrl(repoRoot: string): string {
  try {
    return execSync("git remote get-url origin", { cwd: repoRoot })
      .toString()
      .trim();
  } catch {
    return "git@github.com:osint-builders/osint.git";
  }
}

/**
 * Deterministic partition: sort by priority (high first), then by id, and
 * deal round-robin so high-priority sources spread evenly across buckets.
 * The same manifest always produces the same buckets — runs reproduce and
 * bucket-specific learnings stay meaningful.
 */
function partitionSources(sources: Source[], bucketCount: number): Source[][] {
  const rank = (s: Source) =>
    ({ high: 0, medium: 1, low: 2 } as Record<string, number>)[
      (s.priority ?? "medium").toLowerCase()
    ] ?? 1;
  const ordered = [...sources].sort(
    (a, b) => rank(a) - rank(b) || a.id.localeCompare(b.id)
  );

  const buckets: Source[][] = Array.from({ length: bucketCount }, () => []);
  ordered.forEach((source, index) => {
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

// LEARNINGS.md injection cap: 100 entries OR 10 KB, whichever first. The
// injected block repeats in EVERY bucket prompt, so the byte cap directly
// multiplies into per-run token cost. Per-source liveness facts belong in
// source/manifest.json notes, not here.
const LEARNINGS_MAX_ENTRIES = 100;
const LEARNINGS_MAX_BYTES = 10 * 1024;

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

registerShutdownHandlers();

async function main(): Promise<void> {
  const repoRoot = process.env["REPO_ROOT"] ?? process.cwd();
  const dryRun = process.argv.includes("--dry-run");
  const warpApiKey = process.env["WARP_API_KEY"];
  const environmentId = process.env["WARP_ENVIRONMENT_ID"];
  const modelId = process.env["WARP_MODEL_ID"] || DEFAULT_MODEL_ID;

  if (!warpApiKey && !dryRun) {
    console.error("Error: WARP_API_KEY environment variable is required.");
    console.error("Hint: pass --dry-run to build the prompts without dispatching agents.");
    process.exit(1);
  }

  const client = dryRun ? null : new OzAPI({ apiKey: warpApiKey! });
  setOzClient(client); // expose to SIGTERM handler

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
  console.log(`Model: ${modelId}`);

  // Bucket count derives from per-agent workload (see SOURCES_PER_AGENT).
  const bucketCount = calculateBucketCount(processableSources.length);
  const buckets = partitionSources(processableSources, bucketCount);

  // Total-coverage guarantee: the union of all bucket IDs must exactly
  // equal the set of processable manifest IDs. Run ONCE here in the
  // orchestrator, where both sets exist side by side — per-bucket checks
  // cannot see the whole picture.
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

    if (promptSizeBytes > MAX_PROMPT_SIZE_BYTES) {
      const errorMsg = `Bucket ${bucketNum} prompt exceeds 1 MB limit: ${promptSizeMB} MB (${promptSizeBytes} bytes). Raise PARALLEL_AGENT_COUNT or slim the sources.`;
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
        model_id: modelId,
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
      const status = (err as { status?: number }).status;
      if (status === 401 || status === 402 || status === 403) {
        console.error(
          `  ✗ Bucket ${bucketNum}: spawn rejected (HTTP ${status}). ` +
          `WARP_API_KEY looks invalid, expired, or out of credits — ` +
          `rotate the key / top up credits (see README §Configuration).`
        );
      } else {
        console.error(`  ✗ Bucket ${bucketNum}: failed to spawn - ${err}`);
      }
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
