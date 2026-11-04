import { test } from "node:test";
import assert from "node:assert/strict";
import type { AgentResult } from "./lib/agent-runner";
import { RETRYABLE_QUALIFY_EXIT_CODE, shouldRetryQualify } from "./qualify";

function result(state: string, retryable?: boolean): AgentResult {
  return { label: "batch", runId: "run", state, itemCount: 3, retryable };
}

test("only explicitly retryable Oz platform errors request a fresh queue pass", () => {
  assert.equal(RETRYABLE_QUALIFY_EXIT_CODE, 75);
  assert.equal(shouldRetryQualify([result("SUCCEEDED"), result("ERROR", true)]), true);
  assert.equal(shouldRetryQualify([result("ERROR", true), result("ERROR", true)]), true);
  assert.equal(shouldRetryQualify([result("ERROR", true), result("ERROR", false)]), false);
  assert.equal(shouldRetryQualify([result("ERROR")]), false);
});

test("successful and permanent failure outcomes never request a retry", () => {
  assert.equal(shouldRetryQualify([result("SUCCEEDED")]), false);
  assert.equal(shouldRetryQualify([result("SUCCEEDED"), result("FAILED")]), false);
  assert.equal(shouldRetryQualify([result("ERROR", true), result("CANCELLED")]), false);
  assert.equal(shouldRetryQualify([]), false);
});
