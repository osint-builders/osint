#!/usr/bin/env tsx
/**
 * Example: Quick Prototyping with Sandcastle
 *
 * Demonstrates using sandcastle for rapid code prototyping and testing.
 */

import { run, claudeCode } from "@ai-hero/sandcastle";
import { docker } from "@ai-hero/sandcastle/sandboxes/docker";

async function prototypeAlgorithm() {
  console.log("Prototyping sorting algorithm comparison...\n");

  const result = await run({
    agent: claudeCode("claude-opus-4-6"),
    sandbox: docker(),
    prompt: `
      Create a performance comparison of sorting algorithms:

      1. Implement three sorting algorithms:
         - Quick sort
         - Merge sort
         - Heap sort

      2. Create a benchmark suite that tests each algorithm with:
         - Small dataset (100 elements)
         - Medium dataset (10,000 elements)
         - Large dataset (100,000 elements)

      3. Generate a report comparing:
         - Execution time
         - Memory usage
         - Best/worst case performance

      4. Write the report to BENCHMARK_RESULTS.md

      Use TypeScript with proper types. Include visualization if possible.
    `,
    branchStrategy: { type: "branch", branch: "prototype/sorting-benchmark" },
    maxIterations: 3,
    name: "sorting-benchmark",
  });

  console.log("\n✓ Prototype completed");
  console.log(`Branch: ${result.branch}`);
  console.log(`Commits: ${result.commits.length}`);
  console.log(`Iterations: ${result.iterations.length}`);

  if (result.completionSignal) {
    console.log("✓ Agent marked task as complete");
  }

  return result;
}

async function prototypeDataStructure() {
  console.log("\nPrototyping custom data structure...\n");

  const result = await run({
    agent: claudeCode("claude-sonnet-4-5"),
    sandbox: docker(),
    prompt: `
      Implement a custom LRU (Least Recently Used) Cache:

      1. Core functionality:
         - Set key-value pairs with capacity limit
         - Get values by key (updates access time)
         - Automatic eviction of least recently used items

      2. Requirements:
         - O(1) time complexity for get and set
         - Generic type support in TypeScript
         - Thread-safe operations (use async where needed)

      3. Comprehensive test suite covering:
         - Basic operations (get, set, delete)
         - Capacity limits and eviction
         - Edge cases (empty cache, single item, etc.)
         - Performance tests

      4. Usage examples and API documentation

      Create files:
      - src/lru-cache.ts (implementation)
      - src/lru-cache.test.ts (tests)
      - README.md (documentation)
    `,
    branchStrategy: { type: "branch", branch: "prototype/lru-cache" },
    maxIterations: 4,
    name: "lru-cache",
  });

  console.log("\n✓ Data structure prototype completed");
  console.log(`Branch: ${result.branch}`);
  console.log(`Commits: ${result.commits.length}`);

  return result;
}

async function testAPIDesign() {
  console.log("\nTesting API design...\n");

  const result = await run({
    agent: claudeCode("claude-opus-4-6"),
    sandbox: docker(),
    prompt: `
      Design and implement a REST API for a todo application:

      1. Define endpoints:
         - GET /todos - List all todos
         - GET /todos/:id - Get specific todo
         - POST /todos - Create todo
         - PUT /todos/:id - Update todo
         - DELETE /todos/:id - Delete todo

      2. Implement using Express.js with TypeScript:
         - Input validation with Zod
         - Error handling middleware
         - In-memory data store (for prototype)
         - Response typing

      3. Create OpenAPI/Swagger documentation

      4. Write integration tests using supertest

      5. Create a simple client example showing API usage

      Structure:
      - src/api/ (API implementation)
      - src/api/routes/ (route handlers)
      - src/api/middleware/ (middleware)
      - tests/api.test.ts (integration tests)
      - docs/api.yaml (OpenAPI spec)
      - examples/client.ts (usage example)
    `,
    branchStrategy: { type: "branch", branch: "prototype/todo-api" },
    maxIterations: 5,
    name: "todo-api",
  });

  console.log("\n✓ API prototype completed");
  console.log(`Branch: ${result.branch}`);
  console.log(`Commits: ${result.commits.length}`);

  return result;
}

// Run examples
async function main() {
  try {
    // Example 1: Algorithm comparison
    await prototypeAlgorithm();

    // Example 2: Data structure implementation
    await prototypeDataStructure();

    // Example 3: API design
    await testAPIDesign();

    console.log("\n✅ All prototypes completed successfully");
  } catch (error) {
    console.error("\n❌ Prototype failed:", error);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { prototypeAlgorithm, prototypeDataStructure, testAPIDesign };
