import { test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { buildCollectionPrompt } from "./collection-prompt";

function renderedLearnings(entries: string[]): string {
  const prefix = path.join(os.tmpdir(), "osint-learnings-test-");
  const root = fs.mkdtempSync(prefix);
  try {
    const sourceDir = path.join(root, "source", "sources");
    fs.mkdirSync(sourceDir, { recursive: true });
    fs.writeFileSync(path.join(sourceDir, "fixture.md"), "# Fixture\n");
    fs.writeFileSync(path.join(root, "LEARNINGS.md"),
      `# Learnings\n\n<!-- entries below this line; newest first -->\n\n${entries.join("\n\n")}`);
    const prompt = buildCollectionPrompt(root,
      [{ id: "fixture", name: "Fixture", file: "sources/fixture.md", status: "testing" }],
      "https://github.com/osint-builders/osint.git", 1, 1);
    return prompt.split("## Prior learnings\n\n")[1].split("\n\nSupersede stale entries")[0];
  } finally {
    if (!root.startsWith(prefix)) throw new Error("Unexpected learnings fixture cleanup path");
    fs.rmSync(root, { recursive: true, force: true });
  }
}

test("permanent learnings obey the 100-entry cap", () => {
  const entries = Array.from({ length: 120 }, (_, i) =>
    `## 2026-10-01 Fixture ${i}\n**Expires:** Permanent\n\nAction ${i}`);
  const learnings = renderedLearnings(entries);
  assert.equal((learnings.match(/^## 2026-10-01/gm) || []).length, 100);
});

test("learnings cap counts UTF-8 bytes", () => {
  const entries = Array.from({ length: 3 }, (_, i) =>
    `## 2026-10-01 Fixture ${i}\n**Expires:** Permanent\n\n${"é".repeat(3000)}`);
  const learnings = renderedLearnings(entries);
  assert.equal((learnings.match(/^## 2026-10-01/gm) || []).length, 1);
  assert.ok(Buffer.byteLength(learnings, "utf8") <= 10 * 1024);
});
