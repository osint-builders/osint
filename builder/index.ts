#!/usr/bin/env tsx
/**
 * OSINT Builder
 *
 * Reads sources from source/manifest.json, constructs collection prompt,
 * and spawns agent providers (Warp or Vibe) to perform the collection workflow.
 *
 * Provider Selection:
 *   - Primary: Warp Cloud Agents (via oz-agent-sdk)
 *   - Fallback: Mistral Vibe CLI (local execution)
 *   - Mode: 'auto' (default), 'warp', or 'vibe'
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { DateTime } from 'luxon';

import {
  AgentProvider,
  RunState,
  isQuotaError,
  isAgentProviderError,
} from './providers';
import { WarpAgentProvider } from './providers/WarpAgentProvider';
import { VibeAgentProvider } from './providers/VibeAgentProvider';

// ============================================================================
// Constants
// ============================================================================

const POLL_BASE_MS = 15_000;
const POLL_JITTER_MS = 5_000;
const POLL_MAX_BACKOFF_MS = 120_000;
const SPAWN_STAGGER_MS = 500;
const POLL_MAX_TRANSIENT_RETRIES = 5;
const MAX_PROMPT_SIZE_BYTES = 838_860;
const BYTES_PER_SOURCE = 14_500;
const BASE_PROMPT_OVERHEAD = 50_000;

// ============================================================================
// Types
// ============================================================================

type ProviderMode = 'auto' | 'warp' | 'vibe';

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

// ============================================================================
// Global State
// ============================================================================

const activeRunIds = new Set<string>();
const runProviderMap = new Map<string, AgentProvider>();

let warpProvider: WarpAgentProvider | null = null;
let vibeProvider: VibeAgentProvider | null = null;

// ============================================================================
// Provider Management
// ============================================================================

async function createProviders(mode: ProviderMode): Promise<void> {
  const warpApiKey = process.env.WARP_API_KEY;
  const mistralApiKey = process.env.MISTRAL_API_KEY;

  // Initialize Warp if API key available
  if (warpApiKey) {
    warpProvider = new WarpAgentProvider({ apiKey: warpApiKey, environmentId: process.env.WARP_ENVIRONMENT_ID });
    try {
      await warpProvider.setup();
      console.log(`✓ Warp provider initialized`);
    } catch (error) {
      console.warn(`⚠ Warp provider failed: ${(error as Error).message}`);
      warpProvider = null;
    }
  } else if (mode === 'warp') {
    throw new Error('Warp provider requested but WARP_API_KEY not set');
  }

  // Initialize Vibe if API key available
  if (mistralApiKey) {
    vibeProvider = new VibeAgentProvider({ apiKey: mistralApiKey });
    try {
      await vibeProvider.setup();
      console.log(`✓ Vibe provider initialized`);
    } catch (error) {
      console.warn(`⚠ Vibe provider failed: ${(error as Error).message}`);
      vibeProvider = null;
    }
  } else if (mode === 'vibe') {
    throw new Error('Vibe provider requested but MISTRAL_API_KEY not set');
  }

  // Validate mode
  if (mode === 'auto' && !warpProvider && !vibeProvider) {
    throw new Error('No providers available in auto mode');
  }
}

function selectProvider(mode: ProviderMode): WarpAgentProvider | VibeAgentProvider {
  switch (mode) {
    case 'warp':
      if (!warpProvider) throw new Error('Warp provider not available');
      return warpProvider;
    case 'vibe':
      if (!vibeProvider) throw new Error('Vibe provider not available');
      return vibeProvider;
    default: // auto
      if (warpProvider) return warpProvider;
      if (vibeProvider) return vibeProvider;
      throw new Error('No providers available');
  }
}

// ============================================================================
// SIGTERM Handler
// ============================================================================

async function cancelActiveRuns(): Promise<void> {
  if (activeRunIds.size === 0) return;

  console.log(`\nCancelling ${activeRunIds.size} in-progress run(s)...`);
  await Promise.allSettled(
    Array.from(activeRunIds).map(async (runId) => {
      const provider = runProviderMap.get(runId);
      if (provider) {
        try {
          await provider.cancel(runId);
          console.log(`  ✓ Cancelled ${runId} (${provider.name})`);
        } catch (err) {
          console.warn(`  ⚠ Could not cancel ${runId}: ${(err as Error).message}`);
        }
      }
    })
  );
}

process.on("SIGTERM", async () => {
  console.log("\nSIGTERM received — cancelling runs...");
  await cancelActiveRuns();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("\nSIGINT received — cancelling runs...");
  await cancelActiveRuns();
  process.exit(0);
});

// ============================================================================
// Bucketing
// ============================================================================

function calculateOptimalBucketCount(sourceCount: number): number {
  const configuredCount = parseInt(process.env.PARALLEL_AGENT_COUNT || "0");
  const totalSizeEstimate = BASE_PROMPT_OVERHEAD + (sourceCount * BYTES_PER_SOURCE);
  const minBucketsNeeded = Math.ceil(totalSizeEstimate / MAX_PROMPT_SIZE_BYTES);
  const optimalCount = Math.max(configuredCount, minBucketsNeeded);

  console.log(`\nBucket calculation:`);
  console.log(`  Sources: ${sourceCount}`);
  console.log(`  Estimated total prompt size: ${(totalSizeEstimate / 1024).toFixed(0)} KB`);
  console.log(`  Configured PARALLEL_AGENT_COUNT: ${configuredCount}`);
  console.log(`  Minimum buckets needed: ${minBucketsNeeded}`);
  console.log(`  Using: ${optimalCount} buckets\n`);

  return optimalCount;
}

const EXCLUDED_STATUSES = new Set(["inactive", "archived", "deprecated"]);

function loadProcessableSources(repoRoot: string): Source[] {
  const manifestPath = path.join(repoRoot, "source", "manifest.json");
  const manifest: Manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
  return manifest.sources.filter(s => !EXCLUDED_STATUSES.has(s.status?.toLowerCase()));
}

function readSourceFile(repoRoot: string, source: Source): string {
  const sourcePath = path.join(repoRoot, "source", source.file);
  if (!fs.existsSync(sourcePath)) return `(source file not found: source/${source.file})`;
  return fs.readFileSync(sourcePath, "utf-8");
}

function getOriginUrl(repoRoot: string): string {
  try {
    return execSync("git remote get-url origin", { cwd: repoRoot }).toString().trim();
  } catch {
    return "git@github.com:osint-builders/osint.git";
  }
}

function partitionSources(sources: Source[], bucketCount: number): Source[][] {
  const shuffled = [...sources].sort(() => Math.random() - 0.5);
  const buckets: Source[][] = Array.from({ length: bucketCount }, () => []);
  shuffled.forEach((source, index) => buckets[index % bucketCount].push(source));
  return buckets.filter(bucket => bucket.length > 0);
}

// ============================================================================
// Prompt Building
// ============================================================================

let cachedTemplate: string | null = null;

function loadPromptTemplate(): string {
  if (cachedTemplate === null) {
    const templatePath = path.join(__dirname, "prompts", "collection-prompt.md");
    cachedTemplate = fs.readFileSync(templatePath, "utf-8");
  }
  return cachedTemplate;
}

const LEARNINGS_MAX_ENTRIES = 100;
const LEARNINGS_MAX_BYTES = 30 * 1024;

function loadLearnings(repoRoot: string): string {
  const learningsPath = path.join(repoRoot, "LEARNINGS.md");
  if (!fs.existsSync(learningsPath)) return "_No prior learnings recorded yet._";

  const text = fs.readFileSync(learningsPath, "utf-8");
  const marker = "<!-- entries below this line; newest first -->";
  const idx = text.indexOf(marker);
  const body = idx >= 0 ? text.slice(idx + marker.length) : text;

  const entryRe = /^## (\d{4}-\d{2}-\d{2})[^\n]*$/gm;
  const matches: { headerStart: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = entryRe.exec(body)) !== null) matches.push({ headerStart: m.index });

  const entries: { raw: string; date: string | null; expires: string | null }[] = [];
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].headerStart;
    const end = i + 1 < matches.length ? matches[i + 1].headerStart : body.length;
    const raw = body.slice(start, end).trim();
    const dateMatch = raw.match(/^## (\d{4}-\d{2}-\d{2})/);
    const expiresMatch = raw.match(/\*\*Expires:\*\*\s*([^\n]+)/i);
    entries.push({ raw, date: dateMatch ? dateMatch[1] : null, expires: expiresMatch ? expiresMatch[1].trim() : null });
  }

  if (entries.length === 0) return "_No prior learnings recorded yet._";

  const todayIso = new Date().toISOString().slice(0, 10);
  const live = entries.filter(e => {
    if (!e.expires) return true;
    if (/^permanent$/i.test(e.expires)) return true;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(e.expires)) return true;
    return e.expires >= todayIso;
  });

  live.sort((a, b) => {
    if (a.date && b.date) return b.date.localeCompare(a.date);
    if (a.date) return -1;
    if (b.date) return 1;
    return 0;
  });

  const isPermanent = (e: { expires: string | null }) => !e.expires || /^permanent$/i.test(e.expires);
  const permanent = live.filter(isPermanent);
  const dated = live.filter(e => !isPermanent(e));
  const kept: typeof entries = [...permanent];
  let bytes = kept.reduce((n, e) => n + e.raw.length + 2, 0);
  for (const e of dated) {
    if (kept.length >= LEARNINGS_MAX_ENTRIES) break;
    if (bytes + e.raw.length + 2 > LEARNINGS_MAX_BYTES) break;
    kept.push(e);
    bytes += e.raw.length + 2;
  }

  const out = [...permanent, ...dated.filter(e => kept.includes(e))].map(e => e.raw).join("\n\n");
  return out || "_No prior learnings recorded yet._";
}

function renderTemplate(template: string, vars: Record<string, string | number>): string {
  const placeholderRe = /\$\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g;
  const seen = new Set<string>();
  const result = template.replace(placeholderRe, (_match, key: string) => {
    seen.add(key);
    if (!(key in vars)) throw new Error(`Prompt template references unknown placeholder $${key}`);
    return String(vars[key]);
  });
  for (const k of Object.keys(vars)) {
    if (!seen.has(k)) throw new Error(`Prompt template never used variable ${k}`);
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
  const extractionDate = extractionTime.toISODate();
  const yearMonth = extractionDate.slice(0, 7);
  const oneHourAgo = executionTime.minus({ hours: 1 });
  const timeWindowStart = oneHourAgo.toISO();
  const timeWindowEnd = executionTime.toISO();

  const sourceBlocks = sources.map(s => {
    const content = readSourceFile(repoRoot, s);
    return `### Source: ${s.name} (id: ${s.id}, file: source/${s.file})\n\n${content}`;
  }).join("\n\n---\n\n");

  const expectedIds = sources.map(s => s.id);
  const expectedIdsBash = expectedIds.map(id => `"${id}"`).join(" ");
  const expectedIdsList = expectedIds.map(id => `- ${id}`).join("\n");

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

// ============================================================================
// Polling
// ============================================================================

async function pollUntilComplete(provider: AgentProvider, runId: string, bucketNum: number): Promise<RunState> {
  process.stdout.write(`Polling run ${runId} (${provider.name})`);
  await new Promise(r => setTimeout(r, Math.random() * POLL_BASE_MS));

  let backoffMs = POLL_BASE_MS;
  let transientRetries = 0;

  while (true) {
    try {
      const result = await provider.poll(runId);
      process.stdout.write(` [${result.state}]`);
      transientRetries = 0;

      if (result.state === 'SUCCEEDED' || result.state === 'FAILED' || result.state === 'CANCELLED') {
        process.stdout.write('\n');
        return result.state;
      }

      backoffMs = POLL_BASE_MS;
      await new Promise(r => setTimeout(r, POLL_BASE_MS + Math.random() * POLL_JITTER_MS));
    } catch (err: unknown) {
      const error = err as Error & { status?: number };
      if (error.status === 429) {
        process.stdout.write(` [429, retrying in ${(backoffMs / 1000).toFixed(0)}s]`);
        await new Promise(r => setTimeout(r, backoffMs));
        backoffMs = Math.min(backoffMs * 2, POLL_MAX_BACKOFF_MS);
      } else {
        transientRetries++;
        if (transientRetries > POLL_MAX_TRANSIENT_RETRIES) {
          process.stdout.write(` [fatal poll error after ${transientRetries} retries]\n`);
          throw err;
        }
        const delay = Math.min(backoffMs * transientRetries, POLL_MAX_BACKOFF_MS);
        process.stdout.write(` [transient error ${transientRetries}/${POLL_MAX_TRANSIENT_RETRIES}, retry in ${(delay / 1000).toFixed(0)}s]`);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }
}

// ============================================================================
// Main
// ============================================================================

async function main(): Promise<void> {
  const repoRoot = process.env.REPO_ROOT ?? process.cwd();
  const dryRun = process.argv.includes("--dry-run");
  const providerMode: ProviderMode = (process.env.AGENT_PROVIDER as ProviderMode) || 'auto';

  console.log(`Starting collection with provider mode: ${providerMode}`);

  // Initialize providers
  if (!dryRun) {
    await createProviders(providerMode);
    console.log(`Using provider: ${selectProvider(providerMode).name}`);
  }

  // Load sources
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

  const originUrl = getOriginUrl(repoRoot);
  console.log(`Repository: ${originUrl}`);

  // Bucketing
  const bucketCount = calculateOptimalBucketCount(processableSources.length);
  const buckets = partitionSources(processableSources, bucketCount);

  // Validate coverage
  {
    const manifestIds = processableSources.map(s => s.id);
    const bucketIds = new Set<string>();
    for (const b of buckets) {
      for (const s of b) {
        if (bucketIds.has(s.id)) throw new Error(`Source ${s.id} appears in more than one bucket`);
        bucketIds.add(s.id);
      }
    }
    if (bucketIds.size !== new Set(manifestIds).size) {
      throw new Error(`Bucket coverage mismatch: ${bucketIds.size} bucketed, ${new Set(manifestIds).size} processable`);
    }
    for (const id of manifestIds) {
      if (!bucketIds.has(id)) throw new Error(`Source ${id} in manifest but not in any bucket`);
    }
    console.log(`✓ Coverage: ${bucketIds.size} sources across ${buckets.length} buckets`);
  }

  console.log(`\nPartitioning ${processableSources.length} sources into ${buckets.length} parallel agents`);
  buckets.forEach((bucket, i) => {
    const sourceIds = bucket.map(s => s.id).join(', ');
    console.log(`  Bucket ${i + 1}: ${bucket.length} sources (${sourceIds.slice(0, 60)}...)`);
  });

  // Spawn agents
  console.log(dryRun ? '[dry-run] Building prompts...' : 'Spawning agents...');
  
  // Track progress for GitHub Actions
  let completedBuckets = 0;
  const totalBuckets = buckets.length;

  const runPromises = buckets.map(async (bucket, bucketIndex) => {
    const bucketNum = bucketIndex + 1;
    const prompt = buildCollectionPrompt(repoRoot, bucket, originUrl, bucketNum, buckets.length);
    const promptSizeBytes = Buffer.byteLength(prompt, 'utf8');
    const promptSizeKB = (promptSizeBytes / 1024).toFixed(1);
    const promptSizeMB = (promptSizeBytes / 1024 / 1024).toFixed(2);
    
    // Estimate token count (approximately 4 characters per token for English text)
    const estimatedTokens = Math.ceil(promptSizeBytes / 4);
    const estimatedTokensK = (estimatedTokens / 1000).toFixed(0);

    console.log(`  Bucket ${bucketNum}: ${bucket.length} sources, ${promptSizeKB} KB (${promptSizeMB} MB), ~${estimatedTokens} tokens (~${estimatedTokensK}K tokens)`);

    if (promptSizeBytes > 1_048_576) {
      throw new Error(`Bucket ${bucketNum} prompt exceeds 1 MB: ${promptSizeMB} MB`);
    }

    if (dryRun) {
      const outDir = path.join(repoRoot, ".dry-run-prompts");
      fs.mkdirSync(outDir, { recursive: true });
      fs.writeFileSync(path.join(outDir, `bucket-${bucketNum}.md`), prompt);
      console.log(`  ✓ Bucket ${bucketNum}: wrote prompt`);
      // Return with a dummy provider reference
      return { bucketNum, runId: `dry-run-${bucketNum}`, bucket, provider: selectProvider(providerMode) };
    }

    // Update progress: spawn starting
    const spawnProgress = Math.round(((bucketIndex) / totalBuckets) * 50);
    console.log(`::progress::{"value":${spawnProgress},"total":100,"title":"Spawning bucket ${bucketNum}/${totalBuckets}"}`);

    // Select provider
    let provider = selectProvider(providerMode);
    let runId: string;

    try {
      const result = await provider.spawn(prompt, {
        name: `osint-bucket${bucketNum}`,
        description: `OSINT collection bucket ${bucketNum}/${buckets.length}`,
        env: { ...process.env, REPO_ROOT: repoRoot },
      });
      runId = result.runId;
      runProviderMap.set(runId, provider);
      activeRunIds.add(runId);
      console.log(`  ✓ Bucket ${bucketNum}: spawned ${runId} (${provider.name})`);
    } catch (err) {
      // Fallback on quota error
      if (isAgentProviderError(err) && isQuotaError(err) && providerMode === 'auto' && vibeProvider) {
        console.warn(`  ⚠ Bucket ${bucketNum}: Warp quota exhausted, falling back to Vibe`);
        provider = vibeProvider;
        const result = await provider.spawn(prompt, {
          name: `osint-bucket${bucketNum}-fallback`,
          description: `OSINT collection bucket ${bucketNum}/${buckets.length} (fallback)`,
          env: { ...process.env, REPO_ROOT: repoRoot },
        });
        runId = result.runId;
        runProviderMap.set(runId, provider);
        activeRunIds.add(runId);
        console.log(`  ✓ Bucket ${bucketNum}: spawned ${runId} (${provider.name})`);
      } else {
        throw err;
      }
    }

    return { bucketNum, runId, bucket, provider };
  });

  let runs: { bucketNum: number; runId: string; bucket: Source[]; provider: AgentProvider }[];
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

  // Poll all runs
  console.log(`\nPolling ${runs.length} agents...`);
  
  // Reset progress for polling phase
  console.log(`::progress::{"value":50,"total":100,"title":"Polling ${runs.length} agents"}`);

  const pollPromises = runs.map(async ({ bucketNum, runId, bucket, provider }) => {
    const finalState = await pollUntilComplete(provider, runId, bucketNum);
    activeRunIds.delete(runId);
    
    // Update progress after each bucket completes
    const pollProgress = Math.round(50 + ((bucketNum) / totalBuckets) * 50);
    console.log(`::progress::{"value":${pollProgress},"total":100,"title":"Bucket ${bucketNum}/${totalBuckets} completed"}`);
    
    return { bucketNum, finalState, sourceCount: bucket.length, provider };
  });

  let results: { bucketNum: number; finalState: RunState; sourceCount: number; provider: AgentProvider }[];
  try {
    results = await Promise.all(pollPromises);
  } catch (err) {
    console.error(`\nFatal polling error: ${err}`);
    await cancelActiveRuns();
    process.exit(1);
  }

  // Final progress update
  console.log(`::progress::{"value":100,"total":100,"title":"All buckets processed"}`);

  // Report results
  console.log(`\n=== Collection Results ===`);
  const stats = new Map<string, { total: number; succeeded: number }>();
  let allSucceeded = true;

  results.forEach(({ bucketNum, finalState, sourceCount, provider }) => {
    const name = provider.name;
    if (!stats.has(name)) stats.set(name, { total: 0, succeeded: 0 });
    const s = stats.get(name)!;
    s.total += sourceCount;
    if (finalState === 'SUCCEEDED') s.succeeded += sourceCount;
    else allSucceeded = false;

    const symbol = finalState === 'SUCCEEDED' ? '✓' : '✗';
    console.log(`  ${symbol} Bucket ${bucketNum}: ${finalState} (${sourceCount} sources, ${name})`);
  });

  console.log(`\n--- Provider Summary ---`);
  Array.from(stats.entries()).forEach(([name, s]) => {
    console.log(`  ${name}: ${s.succeeded}/${s.total} succeeded`);
  });

  if (allSucceeded) {
    console.log("\n✓ All collection buckets succeeded.");
    process.exit(0);
  } else {
    console.error("\n✗ One or more collection buckets failed.");
    process.exit(1);
  }
}

export { buildCollectionPrompt };

if (require.main === module) {
  main();
}
