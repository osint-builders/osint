#!/usr/bin/env tsx
/**
 * Example: Parallel Agents with Sandcastle
 *
 * Demonstrates running multiple AI agents in parallel on separate branches.
 */

import { run, claudeCode } from "@ai-hero/sandcastle";
import { docker } from "@ai-hero/sandcastle/sandboxes/docker";

async function parallelFeatureDevelopment() {
  console.log("Starting parallel feature development...\n");

  const tasks = [
    {
      name: "authentication",
      prompt: `
        Implement user authentication module:

        - JWT-based authentication
        - Login and register endpoints
        - Password hashing with bcrypt
        - Token refresh mechanism
        - TypeScript types for auth data
        - Unit tests for all functions

        Create in src/auth/
      `,
      branch: "agent/auth",
    },
    {
      name: "database",
      prompt: `
        Set up database layer:

        - PostgreSQL connection with pg library
        - Connection pooling
        - Migration system
        - Query builder helpers
        - Transaction support
        - TypeScript types for models

        Create in src/db/
      `,
      branch: "agent/database",
    },
    {
      name: "api-routes",
      prompt: `
        Implement REST API routes:

        - Express router setup
        - CRUD endpoints for users
        - Request validation middleware
        - Error handling
        - Response formatting
        - API documentation comments

        Create in src/routes/
      `,
      branch: "agent/api",
    },
  ];

  console.log(`Launching ${tasks.length} agents in parallel...\n`);

  const results = await Promise.all(
    tasks.map((task) =>
      run({
        agent: claudeCode("claude-opus-4-6"),
        sandbox: docker(),
        prompt: task.prompt,
        branchStrategy: { type: "branch", branch: task.branch },
        maxIterations: 3,
        name: task.name,
      })
    )
  );

  console.log("\n✓ All parallel agents completed\n");

  results.forEach((result, index) => {
    const task = tasks[index];
    console.log(`${task.name}:`);
    console.log(`  Branch: ${result.branch}`);
    console.log(`  Commits: ${result.commits.length}`);
    console.log(`  Iterations: ${result.iterations.length}`);
    console.log();
  });

  return results;
}

async function parallelTestingWorkflow() {
  console.log("Starting parallel testing workflow...\n");

  const testTasks = [
    {
      name: "unit-tests",
      prompt: `
        Write comprehensive unit tests:

        - Test all utility functions
        - Test authentication logic
        - Test database helpers
        - Test validation functions
        - Aim for >90% code coverage

        Use Jest and create tests in src/**/*.test.ts
      `,
      branch: "tests/unit",
    },
    {
      name: "integration-tests",
      prompt: `
        Write integration tests:

        - Test API endpoints end-to-end
        - Test database operations
        - Test authentication flow
        - Use supertest for HTTP testing
        - Set up test database

        Create in tests/integration/
      `,
      branch: "tests/integration",
    },
    {
      name: "e2e-tests",
      prompt: `
        Write end-to-end tests:

        - Test complete user workflows
        - Test error scenarios
        - Test edge cases
        - Use Playwright or Cypress
        - Create test fixtures

        Create in tests/e2e/
      `,
      branch: "tests/e2e",
    },
  ];

  const results = await Promise.all(
    testTasks.map((task) =>
      run({
        agent: claudeCode("claude-sonnet-4-5"), // Use faster model for tests
        sandbox: docker(),
        prompt: task.prompt,
        branchStrategy: { type: "branch", branch: task.branch },
        maxIterations: 4,
        name: task.name,
      })
    )
  );

  console.log("\n✓ All test suites completed\n");

  results.forEach((result, index) => {
    const task = testTasks[index];
    console.log(`${task.name}:`);
    console.log(`  Branch: ${result.branch}`);
    console.log(`  Commits: ${result.commits.length}`);
    console.log();
  });

  return results;
}

async function parallelRefactoringTasks() {
  console.log("Starting parallel refactoring tasks...\n");

  const refactorTasks = [
    {
      name: "code-style",
      prompt: `
        Improve code style and consistency:

        - Apply consistent naming conventions
        - Add JSDoc comments
        - Improve code readability
        - Extract magic numbers to constants
        - Simplify complex functions

        Focus on src/ directory
      `,
      branch: "refactor/style",
    },
    {
      name: "type-safety",
      prompt: `
        Improve TypeScript type safety:

        - Add strict type annotations
        - Remove 'any' types
        - Add proper interfaces
        - Use generic types where appropriate
        - Enable strict mode in tsconfig

        Focus on type definitions
      `,
      branch: "refactor/types",
    },
    {
      name: "error-handling",
      prompt: `
        Improve error handling:

        - Add try-catch blocks where needed
        - Create custom error classes
        - Implement error middleware
        - Add error logging
        - Return proper error responses

        Focus on error flows
      `,
      branch: "refactor/errors",
    },
  ];

  const results = await Promise.all(
    refactorTasks.map((task) =>
      run({
        agent: claudeCode("claude-opus-4-6"),
        sandbox: docker(),
        prompt: task.prompt,
        branchStrategy: { type: "branch", branch: task.branch },
        maxIterations: 3,
        name: task.name,
      })
    )
  );

  console.log("\n✓ All refactoring tasks completed\n");

  results.forEach((result, index) => {
    const task = refactorTasks[index];
    console.log(`${task.name}:`);
    console.log(`  Branch: ${result.branch}`);
    console.log(`  Commits: ${result.commits.length}`);
    console.log();
  });

  return results;
}

async function coordinatedMultiAgentWorkflow() {
  console.log("Starting coordinated multi-agent workflow...\n");

  // Phase 1: Architecture and planning (parallel)
  console.log("Phase 1: Architecture and Planning");
  const planningResults = await Promise.all([
    run({
      agent: claudeCode("claude-opus-4-6"),
      sandbox: docker(),
      prompt: "Design database schema with tables, relationships, and indexes",
      branchStrategy: { type: "branch", branch: "planning/database" },
      name: "db-planning",
    }),
    run({
      agent: claudeCode("claude-opus-4-6"),
      sandbox: docker(),
      prompt: "Design API endpoints with request/response schemas",
      branchStrategy: { type: "branch", branch: "planning/api" },
      name: "api-planning",
    }),
  ]);

  console.log("✓ Planning phase completed\n");

  // Phase 2: Implementation (parallel)
  console.log("Phase 2: Implementation");
  const implementationResults = await Promise.all([
    run({
      agent: claudeCode("claude-opus-4-6"),
      sandbox: docker(),
      prompt: "Implement database layer based on planning/database design",
      branchStrategy: { type: "branch", branch: "impl/database" },
      maxIterations: 3,
      name: "db-impl",
    }),
    run({
      agent: claudeCode("claude-opus-4-6"),
      sandbox: docker(),
      prompt: "Implement API routes based on planning/api design",
      branchStrategy: { type: "branch", branch: "impl/api" },
      maxIterations: 3,
      name: "api-impl",
    }),
    run({
      agent: claudeCode("claude-sonnet-4-5"),
      sandbox: docker(),
      prompt: "Create TypeScript types for all data models",
      branchStrategy: { type: "branch", branch: "impl/types" },
      maxIterations: 2,
      name: "types-impl",
    }),
  ]);

  console.log("✓ Implementation phase completed\n");

  // Phase 3: Testing and validation (parallel)
  console.log("Phase 3: Testing and Validation");
  const testingResults = await Promise.all([
    run({
      agent: claudeCode("claude-sonnet-4-5"),
      sandbox: docker(),
      prompt: "Write unit tests for database layer",
      branchStrategy: { type: "branch", branch: "tests/database" },
      maxIterations: 2,
      name: "db-tests",
    }),
    run({
      agent: claudeCode("claude-sonnet-4-5"),
      sandbox: docker(),
      prompt: "Write integration tests for API endpoints",
      branchStrategy: { type: "branch", branch: "tests/api" },
      maxIterations: 2,
      name: "api-tests",
    }),
  ]);

  console.log("✓ Testing phase completed\n");

  console.log("\n✅ Coordinated workflow completed");
  console.log(`Total agents: ${planningResults.length + implementationResults.length + testingResults.length}`);

  return { planningResults, implementationResults, testingResults };
}

// Run examples
async function main() {
  try {
    // Example 1: Parallel feature development
    await parallelFeatureDevelopment();

    console.log("\n" + "=".repeat(60) + "\n");

    // Example 2: Parallel testing workflow
    await parallelTestingWorkflow();

    console.log("\n" + "=".repeat(60) + "\n");

    // Example 3: Parallel refactoring
    await parallelRefactoringTasks();

    console.log("\n" + "=".repeat(60) + "\n");

    // Example 4: Coordinated multi-phase workflow
    await coordinatedMultiAgentWorkflow();

    console.log("\n✅ All parallel workflows completed successfully");
  } catch (error) {
    console.error("\n❌ Parallel workflow failed:", error);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export {
  parallelFeatureDevelopment,
  parallelTestingWorkflow,
  parallelRefactoringTasks,
  coordinatedMultiAgentWorkflow,
};
