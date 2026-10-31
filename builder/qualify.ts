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
import { loadProcessableSources, readSourceFile, getOriginUrl, Source } from "./index";

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

interface TipCandidate {
  url: string;
  snippet: string;
  published_at: string;
}

interface Tip {
  source_id: string;
  source_name: string;
  type: string;
  window_start: string;
  window_end: string;
  identified_at: string;
  candidates: TipCandidate[];
}

interface LoadedTip {
  tip: Tip;
  relPath: string; // repo-relative path, e.g. data/queue/pending/<id>-<epoch>.json
}

/** Loads pending tips, with the newest scan first and deterministic ties. */
function loadPendingTips(repoRoot: string): LoadedTip[] {
  const pendingDir = path.join(repoRoot, "data", "queue", "pending");
  const processedDir = path.join(repoRoot, "data", "queue", "processed");
  if (!fs.existsSync(pendingDir)) return [];
  const files = fs
    .readdirSync(pendingDir)
    .filter((f) => f.endsWith(".json"))
    .sort();
  const tips: LoadedTip[] = [];
  for (const f of files) {
    if (fs.existsSync(path.join(processedDir, f))) {
      console.warn(`Skipping duplicate pending tip already in processed/: ${f}`);
      continue;
    }
    const filePath = path.join(pendingDir, f);
    const tip: Tip = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    if (!Array.isArray(tip.candidates)) {
      throw new Error(`Invalid pending tip ${f}: candidates must be an array`);
    }
    tips.push({ tip, relPath: path.join("data", "queue", "pending", f) });
  }
  return tips.sort((a, b) => {
    const aTime = Date.parse(a.tip.window_end || a.tip.identified_at || "") || 0;
    const bTime = Date.parse(b.tip.window_end || b.tip.identified_at || "") || 0;
    return bTime - aTime || a.relPath.localeCompare(b.relPath);
  });
}

function partitionTips(tips: LoadedTip[], batchSize: number): LoadedTip[][] {
  const batches: LoadedTip[][] = [];
  for (let i = 0; i < tips.length; i += batchSize) {
    batches.push(tips.slice(i, i + batchSize));
  }
  return batches;
}

let cachedTemplate: string | null = null;
function loadQualifyTemplate(): string {
  if (cachedTemplate === null) {
    const templatePath = path.join(__dirname, "prompts", "qualify-prompt.md");
    cachedTemplate = fs.readFileSync(templatePath, "utf-8");
  }
  return cachedTemplate;
}

function buildQualifyPrompt(
  repoRoot: string,
  batch: LoadedTip[],
  sourcesById: Map<string, Source>,
  originUrl: string,
  batchNum: number,
  totalBatches: number
): string {
  const executionTime = DateTime.now().setZone("UTC");
  const extractionTime = executionTime.setZone("America/New_York");
  const extractionDate = extractionTime.toISODate(); // YYYY-MM-DD
  const yearMonth = extractionDate.slice(0, 7);

  const tipBlocks = batch
    .map(({ tip, relPath }) => {
      const source = sourcesById.get(tip.source_id);
      const sourceContext = source
        ? readSourceFile(repoRoot, source)
        : `(source ${tip.source_id} no longer in manifest — use tip metadata only)`;
      const candidateLines = tip.candidates
        .map(
          (c) =>
            `  - URL: ${c.url}\n    Published: ${c.published_at}\n    Snippet: ${c.snippet || "(none captured — fetch the URL for full content)"}`
        )
        .join("\n");
      return `### Tip: ${tip.source_id} (queue file: ${relPath})\n\n**Source context** (id: ${tip.source_id}, type: ${tip.type}):\n\n${sourceContext}\n\n**Candidates** (window ${tip.window_start} → ${tip.window_end}):\n${candidateLines}`;
    })
    .join("\n\n---\n\n");

  const queueFiles = batch.map((b) => b.relPath);
  const queueFilesBash = queueFiles.map((f) => `"${f}"`).join(" ");
  const queueFilesList = queueFiles.map((f) => `- ${f}`).join("\n");

  return renderTemplate(loadQualifyTemplate(), {
    batchNum,
    totalBatches,
    tipCount: batch.length,
    executionTimestamp: executionTime.toISO(),
    extractionDate,
    yearMonth,
    originUrl,
    tipBlocks,
    queueFilesBash,
    queueFilesList,
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
  setOzClient(client);

  const pendingTips = loadPendingTips(repoRoot);
  if (pendingTips.length === 0) {
    console.log("No pending tips found in data/queue/pending/. Exiting.");
    process.exit(0);
  }
  const selectedTips = pendingTips.slice(0, QUALIFY_BATCH_SIZE * QUALIFY_MAX_BATCHES);
  console.log(`Found ${pendingTips.length} pending tip(s); selecting ${selectedTips.length} newest tip(s)`);
  if (selectedTips.length < pendingTips.length) {
    console.log(`Deferred ${pendingTips.length - selectedTips.length} older tip(s) to a later run`);
  }

  const sourcesById = new Map(
    loadProcessableSources(repoRoot).map((s) => [s.id, s])
  );

  const originUrl = getOriginUrl(repoRoot);
  console.log(`Repository: ${originUrl}`);
  console.log(`Model: ${modelId}`);

  const batches = partitionTips(selectedTips, QUALIFY_BATCH_SIZE);
  console.log(
    `\nPartitioning ${selectedTips.length} tip(s) into ${batches.length} batch(es) of up to ${QUALIFY_BATCH_SIZE}`
  );

  console.log(
    dryRun ? `[dry-run] Building ${batches.length} prompts...` : `Spawning ${batches.length} Warp cloud agents...`
  );
  const runPromises = batches.map(async (batch, batchIndex) => {
    const batchNum = batchIndex + 1;
    const prompt = buildQualifyPrompt(repoRoot, batch, sourcesById, originUrl, batchNum, batches.length);

    const promptSizeBytes = Buffer.byteLength(prompt, "utf8");
    console.log(`  Batch ${batchNum}: ${batch.length} tip(s), prompt size: ${(promptSizeBytes / 1024).toFixed(1)} KB`);

    if (promptSizeBytes > MAX_PROMPT_SIZE_BYTES) {
      const errorMsg = `Batch ${batchNum} prompt exceeds 1 MB limit. Lower QUALIFY_BATCH_SIZE.`;
      console.error(`  ❌ ${errorMsg}`);
      throw new Error(errorMsg);
    }

    if (dryRun) {
      const outDir = path.join(repoRoot, ".dry-run-prompts");
      fs.mkdirSync(outDir, { recursive: true });
      const outPath = path.join(outDir, `qualify-batch-${batchNum}.md`);
      fs.writeFileSync(outPath, prompt);
      console.log(`  ✓ Batch ${batchNum}: wrote ${outPath}`);
      return { batchNum, runId: "dry-run", batch };
    }

    const runParams: OzAPI.AgentRunParams = {
      prompt,
      config: {
        name: `osint-qualify-batch${batchNum}-${new Date().toISOString()}`,
        model_id: modelId,
        ...(environmentId ? { environment_id: environmentId } : {}),
      },
    };

    // Stagger spawns to avoid hitting the API with many simultaneous requests.
    await sleep(batchIndex * SPAWN_STAGGER_MS);

    try {
      const runResponse = await client!.agent.run(runParams);
      activeRunIds.add(runResponse.run_id);
      console.log(`  ✓ Batch ${batchNum}: spawned (run ID: ${runResponse.run_id})`);
      return { batchNum, runId: runResponse.run_id, batch };
    } catch (err) {
      const status = (err as { status?: number }).status;
      if (status === 401 || status === 402 || status === 403) {
        console.error(
          `  ✗ Batch ${batchNum}: spawn rejected (HTTP ${status}). ` +
          `WARP_API_KEY looks invalid, expired, or out of credits.`
        );
      } else {
        console.error(`  ✗ Batch ${batchNum}: failed to spawn - ${err}`);
      }
      throw err;
    }
  });

  let runs: { batchNum: number; runId: string; batch: LoadedTip[] }[];
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

  console.log(`\nPolling ${runs.length} agents for completion...`);
  const pollPromises = runs.map(async ({ batchNum, runId, batch }) => {
    const finalState = await pollUntilComplete(client!, runId);
    activeRunIds.delete(runId);
    return { batchNum, finalState, tipCount: batch.length };
  });

  let results: { batchNum: number; finalState: string; tipCount: number }[];
  try {
    results = await Promise.all(pollPromises);
  } catch (err) {
    console.error(`\nFatal polling error: ${err}`);
    console.error(`Cancelling remaining in-progress runs before exit...`);
    await cancelActiveRuns();
    process.exit(1);
  }

  console.log(`\n=== Qualify Results ===`);
  let allSucceeded = true;
  results.forEach(({ batchNum, finalState, tipCount }) => {
    const status = finalState === "SUCCEEDED" ? "✓" : "✗";
    console.log(`  ${status} Batch ${batchNum}: ${finalState} (${tipCount} tips)`);
    if (finalState !== "SUCCEEDED") {
      allSucceeded = false;
    }
  });

  if (allSucceeded) {
    console.log("\n✓ All qualify batches succeeded.");
    process.exit(0);
  } else {
    console.error("\n✗ One or more qualify batches failed.");
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
