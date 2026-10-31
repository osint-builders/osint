import { test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { execFileSync } from "node:child_process";
import { getOriginUrl } from "./source-catalog";

test("origin URL embedded in agent prompts never includes git credentials", () => {
  const prefix = path.join(os.tmpdir(), "osint-origin-test-");
  const root = fs.mkdtempSync(prefix);
  try {
    execFileSync("git", ["init", "--quiet", root]);
    execFileSync("git", ["remote", "add", "origin",
      "https://x-access-token:test-secret@github.com/osint-builders/osint.git"], { cwd: root });
    assert.equal(getOriginUrl(root), "https://github.com/osint-builders/osint.git");
  } finally {
    if (!root.startsWith(prefix)) throw new Error("Unexpected origin fixture cleanup path");
    fs.rmSync(root, { recursive: true, force: true });
  }
});
