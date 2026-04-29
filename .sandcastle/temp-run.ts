
import { run, claudeCode } from "@ai-hero/sandcastle";
import { docker } from "@ai-hero/sandcastle/sandboxes/docker";

const result = await run({
  agent: claudeCode("claude-opus-4-6"),
  sandbox: docker(),
  promptFile: "/tmp/osint-collection-20260429-182338/twitter-tanker-trackers/collection-prompt.md",
  
  maxIterations: 3,
  cwd: "/Users/erik.zettersten/Projects/osint",
});

console.log("\n✓ Agent completed");
console.log("Commits:", result.commits.length);
console.log("Branch:", result.branch);
