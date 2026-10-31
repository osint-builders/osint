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
 *                           to DEFAULT_MODEL_ID in agent-runner. Pinning avoids the
 *                           account/environment default resolving to a
 *                           non-Warp-native model (e.g. Mistral).
 */

import OzAPI from "oz-agent-sdk";
import * as fs from "fs";
import * as path from "path";
import { loadProcessableSources, getOriginUrl, Source } from "./lib/source-catalog";
import { buildCollectionPrompt } from "./lib/collection-prompt";
import {
  DEFAULT_MODEL_ID,
  AgentJob,
  AgentResult,
  AgentRunCoordinator,
  assertPromptSize,
  ozClientAdapter,
} from "./lib/agent-runner";

// Bucket count derives from wall-clock parallelism, not prompt size: each
// agent processes its sources sequentially, so SOURCES_PER_AGENT bounds the
// per-agent workload. PARALLEL_AGENT_COUNT (when set > 0) overrides.
const SOURCES_PER_AGENT = 12;

function calculateBucketCount(sourceCount: number): number {
  const raw = process.env.PARALLEL_AGENT_COUNT;
  const configuredCount = raw ? Number(raw) : 0;
  if (raw && (!Number.isSafeInteger(configuredCount) || configuredCount < 1)) {
    throw new Error(`PARALLEL_AGENT_COUNT must be a positive integer (got ${raw})`);
  }
  const autoCount = Math.ceil(sourceCount / SOURCES_PER_AGENT);
  const count = configuredCount > 0 ? configuredCount : autoCount;

  console.log(`\nBucket calculation:`);
  console.log(`  Sources: ${sourceCount}`);
  console.log(`  Auto (ceil(n/${SOURCES_PER_AGENT})): ${autoCount}`);
  console.log(`  Configured PARALLEL_AGENT_COUNT: ${configuredCount || "(unset)"}`);
  console.log(`  Using: ${count} buckets\n`);

  return count;
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

async function main(): Promise<void> {
  const repoRoot = process.env["REPO_ROOT"] ?? path.resolve(__dirname, "..");
  const dryRun = process.argv.includes("--dry-run");
  const warpApiKey = process.env["WARP_API_KEY"];
  const environmentId = process.env["WARP_ENVIRONMENT_ID"];
  const modelId = process.env["WARP_MODEL_ID"] || DEFAULT_MODEL_ID;

  if (!warpApiKey && !dryRun) {
    console.error("Error: WARP_API_KEY environment variable is required.");
    console.error("Hint: pass --dry-run to build the prompts without dispatching agents.");
    process.exit(1);
  }
  if (!environmentId && !dryRun) {
    throw new Error("WARP_ENVIRONMENT_ID is required for the cloud agent runtime");
  }

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

  // Build and validate every prompt before the first cloud agent starts.
  console.log(dryRun ? `[dry-run] Building ${buckets.length} prompts...` : `Preparing ${buckets.length} Warp cloud agents...`);
  const jobs: AgentJob[] = buckets.map((bucket, bucketIndex) => {
    const bucketNum = bucketIndex + 1;
    const prompt = buildCollectionPrompt(repoRoot, bucket, originUrl, bucketNum, buckets.length);
    const promptSizeBytes = assertPromptSize(prompt, `Bucket ${bucketNum}`);
    const promptSizeKB = (promptSizeBytes / 1024).toFixed(1);
    const promptSizeMB = (promptSizeBytes / 1024 / 1024).toFixed(2);
    console.log(`  Bucket ${bucketNum}: ${bucket.length} sources, prompt size: ${promptSizeKB} KB (${promptSizeMB} MB)`);
    return { label: `osint-collection-bucket${bucketNum}`, prompt, itemCount: bucket.length };
  });

  if (dryRun) {
    jobs.forEach((job, index) => {
      const bucketNum = index + 1;
      // Write the constructed prompt to disk for inspection rather than spawning.
      const outDir = path.join(repoRoot, ".dry-run-prompts");
      fs.mkdirSync(outDir, { recursive: true });
      const outPath = path.join(outDir, `bucket-${bucketNum}.md`);
      fs.writeFileSync(outPath, job.prompt);
      console.log(`  ✓ Bucket ${bucketNum}: wrote ${outPath}`);
    });
    console.log(`\n[dry-run] Built ${jobs.length} prompts. No agents dispatched.`);
    return;
  }

  const coordinator = new AgentRunCoordinator(
    ozClientAdapter(new OzAPI({ apiKey: warpApiKey! })),
    { modelId, environmentId }
  );
  let results: AgentResult[];
  try {
    results = await coordinator.execute(jobs);
  } catch (err) {
    console.error(`Collection failed: ${err}`);
    process.exitCode = 1;
    return;
  }

  console.log(`\n=== Collection Results ===`);
  results.forEach(({ state, itemCount }, index) => {
    const status = state === "SUCCEEDED" ? "✓" : "✗";
    console.log(`  ${status} Bucket ${index + 1}: ${state} (${itemCount} sources)`);
  });
  if (results.every(({ state }) => state === "SUCCEEDED")) {
    console.log("\n✓ All collection buckets succeeded.");
  } else {
    console.error("\n✗ One or more collection buckets failed.");
    process.exitCode = 1;
  }
}

// Allow this file to be require()d for tests/verification without triggering
// the full collection run.
export { buildCollectionPrompt };

if (require.main === module) {
  main().catch((error) => {
    console.error(`Collection failed: ${error}`);
    process.exitCode = 1;
  });
}
