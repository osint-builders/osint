#!/usr/bin/env tsx
/**
 * OSINT Qualifier — Tip & Queue stage 2 orchestrator.
 *
 * Reads tip records from data/queue/pending/ (written by
 * builder/runtime/identify.sh, no LLM involved), selects the newest bounded
 * slice, groups it into small fixed-size batches, renders the prompt per batch,
 * and spawns one short-lived Warp cloud agent per batch via oz-agent-sdk.
 * Each agent does the LLM-heavy work (translate, extract, E-PRIME, geocode,
 * enrich, confidence) for just its batch of tips, then commits results and
 * moves the consumed tip files from pending/ to processed/.
 *
 * Shares spawn/poll/cancel infrastructure (including the per-run deadline
 * and BLOCKED handling) with builder/index.ts via builder/lib/agent-runner.
 *
 * Required environment variables:
 *   WARP_API_KEY          — Warp API key
 *   WARP_ENVIRONMENT_ID   — UID of a pre-configured Warp cloud environment
 *
 * Optional:
 *   REPO_ROOT             — Repository root (defaults to cwd)
 *   QUALIFY_BATCH_SIZE    — Tips per agent (default 3)
 *   QUALIFY_MAX_BATCHES   — Maximum agents per run (default 10)
 *   WARP_MODEL_ID         — Oz model_id pinned on every agent run
 */

import OzAPI from "oz-agent-sdk";
import * as fs from "fs";
import * as path from "path";
import { prepareQualifyBatches } from "./lib/qualify-batches";
import {
  DEFAULT_MODEL_ID,
  AgentResult,
  AgentRunCoordinator,
  ozClientAdapter,
} from "./lib/agent-runner";

// Tips per qualify agent. Small on purpose — the whole point of Tip & Queue
// is many short, cheap, bounded runs instead of few long ones.
function positiveInteger(name: string, fallback: number): number {
  const raw = process.env[name];
  const value = raw ? Number(raw) : fallback;
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new Error(`${name} must be a positive integer (got ${raw})`);
  }
  return value;
}

const QUALIFY_BATCH_SIZE = positiveInteger("QUALIFY_BATCH_SIZE", 3);
// Bound every workflow run. The queue can grow while qualification is down;
// launching one agent per backlog batch would exceed the job deadline.
const QUALIFY_MAX_BATCHES = positiveInteger("QUALIFY_MAX_BATCHES", 10);

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

  const plan = prepareQualifyBatches(repoRoot, QUALIFY_BATCH_SIZE, QUALIFY_MAX_BATCHES);
  const { pendingTipCount, selectedTipCount, originUrl, jobs } = plan;
  if (jobs.length === 0) {
    console.log("No pending tips found in data/queue/pending/. Exiting.");
    return;
  }
  console.log(`Found ${pendingTipCount} pending tip(s); selecting ${selectedTipCount} newest tip(s)`);
  if (selectedTipCount < pendingTipCount) {
    console.log(`Deferred ${pendingTipCount - selectedTipCount} older tip(s) to a later run`);
  }
  console.log(`Repository: ${originUrl}`);
  console.log(`Model: ${modelId}`);
  console.log(
    `\nPartitioning ${selectedTipCount} tip(s) into ${jobs.length} batch(es) of up to ${QUALIFY_BATCH_SIZE}`
  );
  console.log(
    dryRun ? `[dry-run] Built ${jobs.length} prompts...` : `Preparing ${jobs.length} Warp cloud agents...`
  );
  jobs.forEach((job, index) => {
    const size = Buffer.byteLength(job.prompt, "utf8");
    console.log(`  Batch ${index + 1}: ${job.itemCount} tip(s), prompt size: ${(size / 1024).toFixed(1)} KB`);
  });

  if (dryRun) {
    jobs.forEach((job, index) => {
      const batchNum = index + 1;
      const outDir = path.join(repoRoot, ".dry-run-prompts");
      fs.mkdirSync(outDir, { recursive: true });
      const outPath = path.join(outDir, `qualify-batch-${batchNum}.md`);
      fs.writeFileSync(outPath, job.prompt);
      console.log(`  ✓ Batch ${batchNum}: wrote ${outPath}`);
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
    console.error(`Qualify failed: ${err}`);
    process.exitCode = 1;
    return;
  }

  console.log(`\n=== Qualify Results ===`);
  results.forEach(({ state, itemCount }, index) => {
    const status = state === "SUCCEEDED" ? "✓" : "✗";
    console.log(`  ${status} Batch ${index + 1}: ${state} (${itemCount} tips)`);
  });

  if (results.every(({ state }) => state === "SUCCEEDED")) {
    console.log("\n✓ All qualify batches succeeded.");
  } else {
    console.error("\n✗ One or more qualify batches failed.");
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`Qualify failed: ${error}`);
    process.exitCode = 1;
  });
}
