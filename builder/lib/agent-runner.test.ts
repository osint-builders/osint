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

test("terminal Oz runs log session links with run IDs and never log prompts", async () => {
  const output: string[] = [];
  const cancelled: string[] = [];
  const runtime = fastRuntime();
  runtime.log = (message) => { output.push(message); };
  runtime.write = (message) => { output.push(message); };
  let starts = 0;
  let firstPoll = true;
  const client: AgentClient = {
    run: async () => ({ run_id: `run-${++starts}` }),
    retrieve: async (id) => {
      if (id === "run-1" && firstPoll) {
        firstPoll = false;
        return { state: "RUNNING", session_link: "https://app.warp.dev/running" };
      }
      if (id === "run-1") return { state: "SUCCEEDED", session_link: "https://app.warp.dev/success" };
      if (id === "run-2") return { state: "FAILED", session_link: "https://app.warp.dev/failed" };
      return { state: "BLOCKED", session_link: "https://app.warp.dev/blocked" };
    },
    cancel: async (id) => { cancelled.push(id); },
  };
  const coordinator = new AgentRunCoordinator(client, { modelId: "test-model" }, runtime);
  const results = await coordinator.execute([
    { label: "batch-1", prompt: "PRIVATE_PROMPT_VALUE", itemCount: 1 },
    ...jobs.slice(1),
  ]);
  assert.deepEqual(results.map((result) => result.state), ["SUCCEEDED", "FAILED", "CANCELLED"]);
  assert.deepEqual(cancelled, ["run-3"]);
  const log = output.join("\n");
  assert.match(log, /Oz session \(run ID: run-1\): https:\/\/app\.warp\.dev\/success/);
  assert.match(log, /Oz session \(run ID: run-2\): https:\/\/app\.warp\.dev\/failed/);
  assert.match(log, /Oz session \(run ID: run-3\): https:\/\/app\.warp\.dev\/blocked/);
  assert.doesNotMatch(log, /https:\/\/app\.warp\.dev\/running|PRIVATE_PROMPT_VALUE/);
});

test("Oz ERROR is terminal and reports its structured status without cancelling", async () => {
  const output: string[] = [];
  const runtime = fastRuntime();
  runtime.log = (message) => { output.push(message); };
  runtime.write = (message) => { output.push(message); };
  let polls = 0;
  const client: AgentClient = {
    run: async () => ({ run_id: "error-run" }),
    retrieve: async () => {
      polls++;
      return {
        state: "ERROR",
        session_link: "https://app.warp.dev/error-session",
        status_message: {
          message: "Worker unavailable\ntry again",
          error_code: "resource_unavailable",
          retryable: true,
        },
      };
    },
    cancel: async () => { throw new Error("terminated ERROR run must not be cancelled"); },
  };
  const coordinator = new AgentRunCoordinator(client, { modelId: "test-model" }, runtime);
  const results = await coordinator.execute(jobs.slice(0, 1));
  assert.equal(polls, 1);
  assert.equal(results[0].state, "ERROR");
  const log = output.join("\n");
  assert.match(log, /Oz session \(run ID: error-run\): https:\/\/app\.warp\.dev\/error-session/);
  assert.match(log, /code=resource_unavailable retryable=true message=Worker unavailable try again/);
});
