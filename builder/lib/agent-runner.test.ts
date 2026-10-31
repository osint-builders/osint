import { test } from "node:test";
import assert from "node:assert/strict";
import {
  AgentClient,
  AgentJob,
  AgentRunCoordinator,
  MAX_PROMPT_SIZE_BYTES,
  RunnerRuntime,
} from "./agent-runner";

const jobs: AgentJob[] = [
  { label: "batch-1", prompt: "first", itemCount: 3 },
  { label: "batch-2", prompt: "second", itemCount: 2 },
  { label: "batch-3", prompt: "third", itemCount: 1 },
];

function fastRuntime(): RunnerRuntime {
  let time = 0;
  return {
    now: () => time,
    sleep: async (ms) => { time += ms; },
    random: () => 0,
    log: () => {},
    write: () => {},
  };
}

test("preflight rejects an oversized prompt before any agent starts", async () => {
  let starts = 0;
  const client: AgentClient = {
    run: async () => { starts++; return { run_id: "unreachable" }; },
    retrieve: async () => ({ state: "SUCCEEDED" }),
    cancel: async () => {},
  };
  const coordinator = new AgentRunCoordinator(client, { modelId: "test-model" }, fastRuntime());
  await assert.rejects(
    coordinator.execute([{ label: "large", prompt: "x".repeat(MAX_PROMPT_SIZE_BYTES + 1), itemCount: 1 }]),
    /exceeds 1 MB limit/
  );
  assert.equal(starts, 0);
});

test("partial spawn failure cancels every successful spawn", async () => {
  const cancelled: string[] = [];
  let starts = 0;
  const client: AgentClient = {
    run: async () => {
      starts++;
      if (starts === 2) throw new Error("spawn failed");
      return { run_id: `run-${starts}` };
    },
    retrieve: async () => ({ state: "SUCCEEDED" }),
    cancel: async (id) => { cancelled.push(id); },
  };
  const coordinator = new AgentRunCoordinator(client, { modelId: "test-model" }, fastRuntime());
  await assert.rejects(coordinator.execute(jobs), /failed to spawn/);
  assert.deepEqual(cancelled.sort(), ["run-1", "run-3"]);
});

test("fatal polling error cancels the other active run", async () => {
  const cancelled = new Set<string>();
  let starts = 0;
  const client: AgentClient = {
    run: async () => ({ run_id: `run-${++starts}` }),
    retrieve: async (id) => {
      if (id === "run-1") throw new Error("poll failed");
      return { state: cancelled.has(id) ? "CANCELLED" : "RUNNING" };
    },
    cancel: async (id) => { cancelled.add(id); },
  };
  const coordinator = new AgentRunCoordinator(client, { modelId: "test-model" }, fastRuntime());
  await assert.rejects(coordinator.execute(jobs.slice(0, 2)), /failed while polling/);
  assert.ok(cancelled.has("run-2"));
});

test("successful runs preserve job order and configured model", async () => {
  const models: string[] = [];
  let starts = 0;
  const client: AgentClient = {
    run: async (params) => {
      models.push(params.config?.model_id ?? "");
      return { run_id: `run-${++starts}` };
    },
    retrieve: async () => ({ state: "SUCCEEDED" }),
    cancel: async () => { throw new Error("successful runs must not be cancelled"); },
  };
  const coordinator = new AgentRunCoordinator(client, { modelId: "test-model" }, fastRuntime());
  const results = await coordinator.execute(jobs);
  assert.deepEqual(results.map((result) => result.label), jobs.map((job) => job.label));
  assert.deepEqual(results.map((result) => result.state), ["SUCCEEDED", "SUCCEEDED", "SUCCEEDED"]);
  assert.deepEqual(models, ["test-model", "test-model", "test-model"]);
});
