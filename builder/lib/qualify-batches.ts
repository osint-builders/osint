import * as fs from "fs";
import * as path from "path";
import { DateTime } from "luxon";
import { AgentJob, assertPromptSize } from "./agent-runner";
import { getOriginUrl, loadProcessableSources, readSourceFile, Source } from "./source-catalog";
import { renderTemplate } from "./prompt-template";

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
  relPath: string;
}

function parseTip(file: string, text: string): Tip {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch (error) {
    throw new Error(`Invalid pending tip ${file}: ${error}`);
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`Invalid pending tip ${file}: expected an object`);
  }
  const tip = value as Partial<Tip>;
  for (const field of ["source_id", "source_name", "type", "window_start", "window_end", "identified_at"] as const) {
    if (typeof tip[field] !== "string" || !tip[field]) {
      throw new Error(`Invalid pending tip ${file}: ${field} must be a nonempty string`);
    }
  }
  const start = Date.parse(tip.window_start!);
  const end = Date.parse(tip.window_end!);
  if (!Number.isFinite(start) || !Number.isFinite(end) || start >= end) {
    throw new Error(`Invalid pending tip ${file}: scan window must have ordered timestamps`);
  }
  if (!Array.isArray(tip.candidates) || tip.candidates.length < 1 || tip.candidates.length > 3) {
    throw new Error(`Invalid pending tip ${file}: candidates must contain 1-3 items`);
  }
  for (const candidate of tip.candidates) {
    if (!candidate || typeof candidate.url !== "string" ||
        !/^https?:\/\//i.test(candidate.url) ||
        typeof candidate.snippet !== "string" ||
        typeof candidate.published_at !== "string" || !candidate.published_at) {
      throw new Error(`Invalid pending tip ${file}: candidate URL, snippet, or published_at is malformed`);
    }
  }
  return tip as Tip;
}

export interface QualifyPlan {
  pendingTipCount: number;
  selectedTipCount: number;
  originUrl: string;
  jobs: AgentJob[];
}

function loadPendingTips(repoRoot: string): LoadedTip[] {
  const pendingDir = path.join(repoRoot, "data", "queue", "pending");
  const processedDir = path.join(repoRoot, "data", "queue", "processed");
  if (!fs.existsSync(pendingDir)) return [];
  const files = fs.readdirSync(pendingDir).filter((file) => file.endsWith(".json")).sort();
  const tips: LoadedTip[] = [];
  for (const file of files) {
    if (fs.existsSync(path.join(processedDir, file))) {
      console.warn(`Skipping duplicate pending tip already in processed/: ${file}`);
      continue;
    }
    const tip = parseTip(file, fs.readFileSync(path.join(pendingDir, file), "utf-8"));
    tips.push({ tip, relPath: path.join("data", "queue", "pending", file) });
  }
  return tips.sort((a, b) => {
    const aTime = Date.parse(a.tip.window_end || a.tip.identified_at || "") || 0;
    const bTime = Date.parse(b.tip.window_end || b.tip.identified_at || "") || 0;
    return bTime - aTime || a.relPath.localeCompare(b.relPath);
  });
}

function partitionTips(tips: LoadedTip[], batchSize: number): LoadedTip[][] {
  const batches: LoadedTip[][] = [];
  for (let index = 0; index < tips.length; index += batchSize) {
    batches.push(tips.slice(index, index + batchSize));
  }
  return batches;
}

let cachedTemplate: string | null = null;
function loadQualifyTemplate(): string {
  if (cachedTemplate === null) {
    cachedTemplate = fs.readFileSync(
      path.join(__dirname, "..", "prompts", "qualify-prompt.md"),
      "utf-8"
    );
  }
  return cachedTemplate;
}

function buildQualifyPrompt(
  repoRoot: string,
  batch: LoadedTip[],
  sourcesById: Map<string, Source>,
  originUrl: string,
  batchNum: number,
  totalBatches: number,
  executionTime: DateTime
): string {
  const extractionDate = executionTime.setZone("America/New_York").toISODate();
  const executionTimestamp = executionTime.toISO();
  if (!extractionDate || !executionTimestamp) {
    throw new Error("Could not format qualify dispatch time as ISO date");
  }
  const yearMonth = extractionDate.slice(0, 7);

  const tipBlocks = batch
    .map(({ tip, relPath }) => {
      const source = sourcesById.get(tip.source_id);
      const sourceContext = source
        ? readSourceFile(repoRoot, source)
        : `(source ${tip.source_id} no longer processable — use queued name: ${tip.source_name})`;
      const candidateLines = tip.candidates
        .map((candidate) =>
          `  - URL: ${candidate.url}\n    Published: ${candidate.published_at}\n    Snippet: ${candidate.snippet || "(none captured — fetch the URL for full content)"}`
        )
        .join("\n");
      return `### Tip: ${tip.source_id} (queue file: ${relPath})\n\n**Source context** (id: ${tip.source_id}, type: ${tip.type}):\n\n${sourceContext}\n\n**Candidates** (window ${tip.window_start} → ${tip.window_end}):\n${candidateLines}`;
    })
    .join("\n\n---\n\n");

  const queueFiles = batch.map((item) => item.relPath);
  const queueFilesBash = queueFiles.map((file) => `"${file}"`).join(" ");
  const queueFilesList = queueFiles.map((file) => `- ${file}`).join("\n");

  return renderTemplate(loadQualifyTemplate(), {
    batchNum,
    totalBatches,
    tipCount: batch.length,
    executionTimestamp,
    extractionDate,
    yearMonth,
    originUrl,
    tipBlocks,
    queueFilesBash,
    queueFilesList,
  });
}

/** Prepare a bounded, newest-first set of complete prompts before dispatch. */
export function prepareQualifyBatches(
  repoRoot: string,
  batchSize: number,
  maxBatches: number
): QualifyPlan {
  if (!Number.isSafeInteger(batchSize) || batchSize < 1 ||
      !Number.isSafeInteger(maxBatches) || maxBatches < 1) {
    throw new Error("Qualify batch size and maximum must be positive integers");
  }
  const pendingTips = loadPendingTips(repoRoot);
  const originUrl = getOriginUrl(repoRoot);
  const selected = pendingTips.slice(0, batchSize * maxBatches);
  if (selected.length === 0) {
    return { pendingTipCount: pendingTips.length, selectedTipCount: 0, originUrl, jobs: [] };
  }
  const sourcesById = new Map(loadProcessableSources(repoRoot).map((source) => [source.id, source]));
  const batches = partitionTips(selected, batchSize);
  const executionTime = DateTime.now().setZone("UTC");
  const jobs = batches.map((batch, index) => {
    const batchNum = index + 1;
    const prompt = buildQualifyPrompt(
      repoRoot, batch, sourcesById, originUrl, batchNum, batches.length, executionTime
    );
    assertPromptSize(prompt, `Batch ${batchNum}`);
    return { label: `osint-qualify-batch${batchNum}`, prompt, itemCount: batch.length };
  });
  return { pendingTipCount: pendingTips.length, selectedTipCount: selected.length, originUrl, jobs };
}
