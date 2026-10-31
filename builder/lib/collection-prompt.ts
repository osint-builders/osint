import * as fs from "fs";
import * as path from "path";
import { DateTime } from "luxon";
import { readSourceFile, Source } from "./source-catalog";
import { renderTemplate } from "./prompt-template";

let cachedTemplate: string | null = null;
function loadPromptTemplate(): string {
  if (cachedTemplate === null) {
    cachedTemplate = fs.readFileSync(
      path.join(__dirname, "..", "prompts", "collection-prompt.md"),
      "utf-8"
    );
  }
  return cachedTemplate;
}

// Each bucket receives the same learnings, so cap their injected size.
const LEARNINGS_MAX_ENTRIES = 100;
const LEARNINGS_MAX_BYTES = 10 * 1024;

interface LearningEntry {
  raw: string;
  date: string | null;
  expires: string | null;
}

function loadLearnings(repoRoot: string): string {
  const learningsPath = path.join(repoRoot, "LEARNINGS.md");
  if (!fs.existsSync(learningsPath)) {
    return "_No prior learnings recorded yet._";
  }
  const text = fs.readFileSync(learningsPath, "utf-8");
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
    entries.push({
      raw,
      date: dateMatch ? dateMatch[1] : null,
      expires: expiresMatch ? expiresMatch[1].trim() : null,
    });
  }
  if (entries.length === 0) {
    return "_No prior learnings recorded yet._";
  }

  const todayIso = new Date().toISOString().slice(0, 10);
  const live = entries.filter((entry) => {
    if (!entry.expires || /^permanent$/i.test(entry.expires)) return true;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(entry.expires)) return true;
    return entry.expires >= todayIso;
  });
  live.sort((a, b) => {
    if (a.date && b.date) return b.date.localeCompare(a.date);
    if (a.date) return -1;
    if (b.date) return 1;
    return 0;
  });

  const isPermanent = (entry: LearningEntry) =>
    !entry.expires || /^permanent$/i.test(entry.expires);
  const permanent = live.filter(isPermanent);
  const dated = live.filter((entry) => !isPermanent(entry));
  const kept: LearningEntry[] = [];
  let bytes = 0;
  for (const entry of [...permanent, ...dated]) {
    if (kept.length >= LEARNINGS_MAX_ENTRIES) break;
    const entryBytes = Buffer.byteLength(entry.raw, "utf8") + (kept.length ? 2 : 0);
    if (bytes + entryBytes > LEARNINGS_MAX_BYTES) continue;
    kept.push(entry);
    bytes += entryBytes;
  }
  return kept
    .map((entry) => entry.raw)
    .join("\n\n") || "_No prior learnings recorded yet._";
}

function requireIso(value: string | null, name: string): string {
  if (value === null) throw new Error(`Could not format ${name} as an ISO timestamp`);
  return value;
}

/** The legacy collector's complete prompt construction and learnings policy. */
export function buildCollectionPrompt(
  repoRoot: string,
  sources: Source[],
  originUrl: string,
  bucketNum: number,
  totalBuckets: number
): string {
  const executionTime = DateTime.now().setZone("UTC");
  const extractionTime = executionTime.minus({ hours: 1 }).setZone("America/New_York");
  const executionTimestamp = requireIso(executionTime.toISO(), "execution time");
  const extractionTimestamp = requireIso(extractionTime.toISO(), "extraction time");
  const extractionDate = requireIso(extractionTime.toISODate(), "extraction date");
  const yearMonth = extractionDate.slice(0, 7);
  const timeWindowStart = requireIso(executionTime.minus({ hours: 1 }).toISO(), "window start");
  const timeWindowEnd = executionTimestamp;

  const sourceBlocks = sources
    .map((source) => {
      const content = readSourceFile(repoRoot, source);
      return `### Source: ${source.name} (id: ${source.id}, file: source/${source.file})\n\n${content}`;
    })
    .join("\n\n---\n\n");

  const expectedIds = sources.map((source) => source.id);
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
