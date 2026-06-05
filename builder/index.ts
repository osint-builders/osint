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

// ============================================================================
// Formatting Utilities for GitHub Actions Logs
// ============================================================================

const C = {
  r: '\x1b[0m',     // reset
  b: '\x1b[1m',     // bold
  d: '\x1b[2m',     // dim
  R: '\x1b[31m',    // red
  G: '\x1b[32m',    // green
  Y: '\x1b[33m',    // yellow
  B: '\x1b[34m',    // blue
  M: '\x1b[35m',    // magenta
  C: '\x1b[36m',    // cyan
  W: '\x1b[37m',    // white
};

const color = (t: string, c: string) => C[c as keyof typeof C] ? `${C[c as keyof typeof C]}${t}${C.r}` : t;
const dim   = (t: string) => color(t, 'd');
const bold  = (t: string) => color(t, 'b');

// Box drawing characters (no color)
const box = {
  tl: '╭', tr: '╮', bl: '╰', br: '╯',
  h: '─', v: '│',
  lt: '├', rt: '┤', tt: '┬', bt: '┴', cross: '┼'
};

function hr(width: number = 70): void {
  console.log(box.h.repeat(width));
}

function header(text: string, width: number = 70): void {
  const pad = Math.max(0, Math.floor((width - text.length - 2) / 2));
  const remainder = width - text.length - 2 - pad * 2;
  console.log(`\n${box.tl}${box.h.repeat(width - 2)}${box.tr}`);
  console.log(`${box.v}${' '.repeat(pad)}${bold(text)}${' '.repeat(pad + remainder)}${box.v}`);
  console.log(`${box.bl}${box.h.repeat(width - 2)}${box.br}\n`);
}

function groupStart(text: string): void {
  console.log(`\n${color(box.lt + box.h + ' ' + text, 'Y')}`);
}

function groupEnd(): void {
  console.log(`${color(box.bt + box.h, 'Y')}\n`);
}

function table(headers: string[], rows: string[][], colWidths?: number[]): void {
  if (!colWidths) {
    colWidths = headers.map(h => h.length);
    rows.forEach(row => row.forEach((cell, i) => {
      colWidths![i] = Math.max(colWidths![i], cell.length);
    }));
  }
  
  const sep = colWidths.map(w => box.h.repeat(w)).join(box.cross);
  const hdr = headers.map((h, i) => h.padEnd(colWidths[i])).join(` ${box.v} `);
  
  console.log(`  ${box.tt}${sep}${box.tt}`);
  console.log(`  ${box.v} ${hdr} ${box.v}`);
  console.log(`  ${box.lt}${sep}${box.rt}`);
  rows.forEach(row => {
    const cells = row.map((c, i) => c.padEnd(colWidths[i])).join(` ${box.v} `);
    console.log(`  ${box.v} ${cells} ${box.v}`);
  });
  console.log(`  ${box.bt}${sep}${box.bt}`);
}

function elapsed(startMs: number): string {
  const ms = performance.now() - startMs;
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const msRemain = Math.floor(ms % 1000);
  return m > 0 ? `${m}m ${s}s` : s > 0 ? `${s}s ${msRemain}ms` : `${msRemain}ms`;
}

function progress(current: number, total: number, label: string): void {
  const pct = Math.round((current / total) * 100);
  const filled = Math.round(pct / 5);
  const empty = 20 - filled;
  const bar = color('█'.repeat(filled), 'G') + color('█'.repeat(empty), 'd');
  console.log(`  ${bar} ${pct}% ${label}`);
}

import {
  AgentProvider,
  RunState,
  isQuotaError,
  isAgentProviderError,
} from './providers';
import { WarpAgentProvider } from './providers/WarpAgentProvider';
import { VibeAgentProvider } from './providers/VibeAgentProvider';

// Semaphore for concurrency control
class Semaphore {
  private permits: number;
  private max: number;
  private waiting: Array<() => void> = [];

  constructor(max: number) {
    this.permits = max;
    this.max = max;
  }

  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--;
      return;
    }
    await new Promise<void>(resolve => this.waiting.push(resolve));
  }

  release(): void {
    if (this.waiting.length > 0) {
      this.waiting.shift()!();
    } else {
      this.permits++;
    }
  }
}

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
  const startTime = performance.now();
  const repoRoot = process.env.REPO_ROOT ?? process.cwd();
  const dryRun = process.argv.includes("--dry-run");
  const providerMode: ProviderMode = (process.env.AGENT_PROVIDER as ProviderMode) || 'auto';

  header('OSINT COLLECTION RUN');
  console.log(`${color('Mode:', 'b')} ${color(providerMode.toUpperCase(), 'C')}   ${color('Dry Run:', 'b')} ${dryRun ? color('YES', 'Y') : color('NO', 'G')}`);
  console.log(`${color('Timestamp:', 'b')} ${new Date().toISOString()}`);

  groupStart('Initializing Providers');
  
  // Initialize providers
  if (!dryRun) {
    await createProviders(providerMode);
    console.log(`  ${color('✓', 'G')} Using provider: ${bold(selectProvider(providerMode).name)}`);
  } else {
    console.log(`  ${color('ℹ', 'B')} Dry run mode - skipping provider initialization`);
  }
  groupEnd();

  // Load sources
  groupStart('Loading Sources');
  
  let processableSources: Source[];
  try {
    processableSources = loadProcessableSources(repoRoot);
  } catch (err) {
    console.error(`  ${color('✗', 'R')} Error loading source manifest: ${err}`);
    process.exit(1);
  }

  if (processableSources.length === 0) {
    console.log(`  ${color('ℹ', 'B')} No processable sources found. Exiting.`);
    process.exit(0);
  }

  console.log(`  ${color('✓', 'G')} Found ${bold(String(processableSources.length))} processable source(s)`);

  const originUrl = getOriginUrl(repoRoot);
  console.log(`  ${color('ℹ', 'B')} Repository: ${originUrl}`);
  groupEnd();

  // Bucketing
  groupStart('Bucketing Sources');
  
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
    console.log(`  ${color('✓', 'G')} Coverage: ${bold(String(bucketIds.size))} sources across ${bold(String(buckets.length))} buckets`);
  }

  console.log(`\n  ${color('Partitioning', 'b')} ${bold(String(processableSources.length))} sources into ${bold(String(buckets.length))} parallel agents`);
  
  // Table of buckets
  const tableRows = buckets.map((bucket, i) => [
    String(i + 1),
    String(bucket.length),
    `${(Buffer.byteLength(JSON.stringify(bucket.map(s => s.id)), 'utf8') / 1024).toFixed(1)} KB`
  ]);
  table(['Bucket', 'Sources', 'Size'], tableRows);
  
  groupEnd();

  // Spawn agents
  groupStart('Spawning Agents');
  
  // Get concurrency limit from environment
  const parallelCount = parseInt(process.env.PARALLEL_AGENT_COUNT || "1");
  const maxConcurrency = Math.max(1, Math.min(parallelCount, buckets.length));
  const semaphore = new Semaphore(maxConcurrency);
  
  console.log(`  ${color('Target:', 'b')} ${bold(String(buckets.length))} buckets, ${bold(String(maxConcurrency))} concurrent${dryRun ? color(' (dry-run)', 'd') : ''}`);
  
  const bucketStartTime = performance.now();
  let spawnedCount = 0;
  const totalBuckets = buckets.length;

  const runPromises = buckets.map(async (bucket, bucketIndex) => {
    // Acquire semaphore permit for concurrency control
    await semaphore.acquire();
    try {
      const bucketNum = bucketIndex + 1;
    const bucketStart = performance.now();
    const prompt = buildCollectionPrompt(repoRoot, bucket, originUrl, bucketNum, buckets.length);
    const promptSizeBytes = Buffer.byteLength(prompt, 'utf8');
    const promptSizeKB = (promptSizeBytes / 1024).toFixed(1);
    const promptSizeMB = (promptSizeBytes / 1024 / 1024).toFixed(2);
    const estimatedTokens = Math.ceil(promptSizeBytes / 4);
    const estimatedTokensK = (estimatedTokens / 1000).toFixed(0);

    console.log(`  ${color('[' + String(bucketNum).padStart(2) + ']', 'b')} ${bucket.length} sources │ ${promptSizeKB} KB (${promptSizeMB} MB) │ ~${estimatedTokens} tokens`);

    if (promptSizeBytes > 1_048_576) {
      throw new Error(`Bucket ${bucketNum} prompt exceeds 1 MB: ${promptSizeMB} MB`);
    }

    if (dryRun) {
      const outDir = path.join(repoRoot, ".dry-run-prompts");
      fs.mkdirSync(outDir, { recursive: true });
      fs.writeFileSync(path.join(outDir, `bucket-${bucketNum}.md`), prompt);
      console.log(`  ${color('✓', 'G')} Bucket ${bucketNum}: wrote prompt to ${color('.dry-run-prompts/bucket-' + bucketNum + '.md', 'C')}`);
      spawnedCount++;
      progress(spawnedCount, totalBuckets, `Dry run: ${spawnedCount}/${totalBuckets} buckets`);
      semaphore.release();
      return { bucketNum, runId: `dry-run-${bucketNum}`, bucket, provider: selectProvider(providerMode) };
    }

    // Update progress
    spawnedCount++;
    progress(spawnedCount, totalBuckets, `Spawning: ${spawnedCount}/${totalBuckets}`);

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
      console.log(`  ${color('✓', 'G')} Bucket ${bucketNum}: spawned ${dim(runId)} (${color(provider.name, 'C')}) ${color(`[+${elapsed(bucketStart)}]`, 'd')}`);
    } catch (err) {
      // Fallback on quota error
      if (isAgentProviderError(err) && isQuotaError(err) && providerMode === 'auto' && vibeProvider) {
        console.log(`  ${color('↳', 'Y')} Bucket ${bucketNum}: ${color('Warp quota exhausted', 'Y')} → ${color('falling back to Vibe', 'C')}`);
        provider = vibeProvider;
        const result = await provider.spawn(prompt, {
          name: `osint-bucket${bucketNum}-fallback`,
          description: `OSINT collection bucket ${bucketNum}/${buckets.length} (fallback)`,
          env: { ...process.env, REPO_ROOT: repoRoot },
        });
        runId = result.runId;
        runProviderMap.set(runId, provider);
        activeRunIds.add(runId);
        console.log(`  ${color('✓', 'G')} Bucket ${bucketNum}: spawned ${dim(runId)} (${color(provider.name, 'C')}) ${color(`[+${elapsed(bucketStart)}]`, 'd')}`);
      } else {
        throw err;
      }
    }

    return { bucketNum, runId, bucket, provider };
  } finally {
    // Always release semaphore permit
    semaphore.release();
  }
  });

  let runs: { bucketNum: number; runId: string; bucket: Source[]; provider: AgentProvider }[];
  try {
    runs = await Promise.all(runPromises);
  } catch (err) {
    console.error(`\n  ${color('✗', 'R')} Error spawning agents: ${err}`);
    process.exit(1);
  }

  groupEnd();

  if (dryRun) {
    console.log(`\n  ${color('ℹ', 'B')} Dry run: ${bold(String(runs.length))} prompts built. No agents dispatched.`);
    process.exit(0);
  }

  // Poll all runs
  groupStart('Polling Agents');
  console.log(`  ${color('Target:', 'b')} ${bold(String(runs.length))} agents`);
  
  let completedCount = 0;
  const pollStartTime = performance.now();

  const pollPromises = runs.map(async ({ bucketNum, runId, bucket, provider }) => {
    const bucketPollStart = performance.now();
    const finalState = await pollUntilComplete(provider, runId, bucketNum);
    activeRunIds.delete(runId);
    
    completedCount++;
    progress(50 + Math.round((completedCount / totalBuckets) * 50), 100, `Polling: ${completedCount}/${totalBuckets} completed`);
    
    return { bucketNum, finalState, sourceCount: bucket.length, provider, elapsed: performance.now() - bucketPollStart };
  });

  let results: { bucketNum: number; finalState: RunState; sourceCount: number; provider: AgentProvider; elapsed?: number }[];
  try {
    results = await Promise.all(pollPromises);
  } catch (err) {
    console.error(`\nFatal polling error: ${err}`);
    await cancelActiveRuns();
    process.exit(1);
  }

  groupEnd();

  // Final progress
  progress(100, 100, `All ${totalBuckets} buckets processed`);

  // Report results
  header('COLLECTION RESULTS');
  
  const stats = new Map<string, { total: number; succeeded: number; failed: number }>();
  let allSucceeded = true;
  const resultRows: string[][] = [];

  results.forEach(({ bucketNum, finalState, sourceCount, provider, elapsed }) => {
    const name = provider.name;
    if (!stats.has(name)) stats.set(name, { total: 0, succeeded: 0, failed: 0 });
    const s = stats.get(name)!;
    s.total += sourceCount;
    if (finalState === 'SUCCEEDED') {
      s.succeeded += sourceCount;
      resultRows.push([String(bucketNum), color('✓', 'G'), finalState, String(sourceCount), provider.name, elapsed ? `${(elapsed/1000).toFixed(1)}s` : '-']);
    } else {
      allSucceeded = false;
      s.failed += sourceCount;
      resultRows.push([String(bucketNum), color('✗', 'R'), finalState, String(sourceCount), provider.name, elapsed ? `${(elapsed/1000).toFixed(1)}s` : '-']);
    }
  });

  console.log(`\n${color('Bucket Results:', 'b')}`);
  table(['#', 'Status', 'State', 'Sources', 'Provider', 'Time'], resultRows);

  console.log(`\n${color('Provider Summary:', 'b')}`);
  const summaryRows = Array.from(stats.entries()).map(([name, s]) => [
    name,
    String(s.succeeded),
    String(s.failed),
    String(s.total),
    `${Math.round((s.succeeded / s.total) * 100)}%`
  ]);
  table(['Provider', 'Succeeded', 'Failed', 'Total', 'Rate'], summaryRows);

  const totalElapsed = elapsed(startTime);
  if (allSucceeded) {
    console.log(`\n${color('✓', 'G')} ${bold('All collection buckets succeeded')} ${color(`in ${totalElapsed}`, 'd')}`);
    process.exit(0);
  } else {
    console.log(`\n${color('✗', 'R')} ${bold('One or more collection buckets failed')} ${color(`after ${totalElapsed}`, 'd')}`);
    process.exit(1);
  }
}

export { buildCollectionPrompt };

if (require.main === module) {
  main();
}
