import * as fs from "fs";
import * as path from "path";
import { execFileSync } from "child_process";

// The manifest is a deny-list. New and testing sources run immediately.
const EXCLUDED_STATUSES = new Set(["inactive", "archived", "deprecated"]);

export interface Source {
  id: string;
  name: string;
  file: string;
  status: string;
  type?: string;
  priority?: string;
}

interface Manifest {
  sources: Source[];
}

export function loadManifestSources(repoRoot: string): Source[] {
  const manifestPath = path.join(repoRoot, "source", "manifest.json");
  const manifest: Manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
  return manifest.sources;
}

export function loadProcessableSources(repoRoot: string): Source[] {
  return loadManifestSources(repoRoot).filter(
    (source) => !EXCLUDED_STATUSES.has((source.status ?? "").toLowerCase())
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
    const origin = execFileSync("git", ["remote", "get-url", "origin"], {
      cwd: repoRoot,
      stdio: ["ignore", "pipe", "ignore"],
    }).toString().trim();
    if (/^https?:\/\//i.test(origin)) {
      const url = new URL(origin);
      url.username = "";
      url.password = "";
      return url.toString();
    }
    return origin;
  } catch {
    return "https://github.com/osint-builders/osint.git";
  }
}
