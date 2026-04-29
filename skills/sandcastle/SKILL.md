---
name: sandcastle
description: Run code in isolated sandbox environments for AI agents. Execute TypeScript/JavaScript code, test implementations, parallelize coding tasks, and orchestrate multi-agent workflows using Docker, Podman, or Vercel providers. Perfect for on-the-fly code execution when AI needs to prototype, test, or validate solutions.
license: MIT
compatibility: Node.js 18+, requires Docker/Podman/Vercel
metadata:
  author: osint-builders
  version: "1.0.0"
  upstream: "https://github.com/mattpocock/sandcastle"
  package: "@ai-hero/sandcastle"
  cli-location: "../../bin/sandcastle"
---

# Sandcastle Skill

Orchestrate AI coding agents in isolated sandboxes. Run code safely, prototype solutions, test implementations, and parallelize coding tasks without affecting the host environment.

## Core Purpose

Enable AI agents to:
- Execute code in isolated, reproducible environments
- Prototype and test solutions without host contamination
- Run multiple agents in parallel on separate branches
- Validate implementations before merging to main branch
- Create safe experimentation spaces for coding tasks

## Key Capabilities

### Sandbox Providers

| Provider | Type | Use Case | Speed |
|----------|------|----------|-------|
| **Docker** | Bind-mount | Local development, full isolation | Fast |
| **Podman** | Bind-mount | Rootless alternative to Docker | Fast |
| **Vercel** | Isolated | Cloud-based Firecracker microVMs | Medium |
| **No-sandbox** | None | Interactive testing on host | Fastest |

### Branch Strategies

| Strategy | Description | Use Case |
|----------|-------------|----------|
| `head` | Work directly on current branch | Quick tests, single agent |
| `branch` | Create named branch for work | Feature development, PRs |
| `merge-to-head` | Work on temp branch, merge back | Isolated work with integration |

### Agent Providers

- **Claude Code**: Built-in support for Claude Opus, Sonnet, Haiku models
- **Custom agents**: Create your own agent providers

## Installation

```bash
# Install sandcastle package
npm install --save-dev @ai-hero/sandcastle

# Initialize .sandcastle directory
npx sandcastle init

# Configure API keys
cp .sandcastle/.env.example .sandcastle/.env
# Edit .sandcastle/.env and add ANTHROPIC_API_KEY
```

## Quick Start

### Basic Usage

```typescript
import { run, claudeCode } from "@ai-hero/sandcastle";
import { docker } from "@ai-hero/sandcastle/sandboxes/docker";

// Run agent in Docker sandbox
const result = await run({
  agent: claudeCode("claude-opus-4-6"),
  sandbox: docker(),
  prompt: "Create a function to calculate Fibonacci numbers with tests",
});

console.log(result.commits); // Commits created by agent
console.log(result.branch);  // Branch where work occurred
```

### Using Prompt Files

```typescript
await run({
  agent: claudeCode("claude-sonnet-4-5"),
  sandbox: docker(),
  promptFile: ".sandcastle/implement-prompt.md",
  promptArgs: {
    FEATURE: "user authentication",
    ISSUE: "42",
  },
});
```

### Multiple Iterations

```typescript
// Allow agent to iterate up to 5 times
await run({
  agent: claudeCode("claude-opus-4-6"),
  sandbox: docker(),
  prompt: "Implement feature with full test coverage",
  maxIterations: 5,
  completionSignal: "<promise>COMPLETE</promise>",
});
```

## Common Use Cases

### 1. Prototype and Test Code

```typescript
// AI needs to test an algorithm
await run({
  agent: claudeCode("claude-opus-4-6"),
  sandbox: docker(),
  prompt: `
    Implement a binary search tree with:
    - Insert, delete, search operations
    - In-order, pre-order, post-order traversal
    - Full test coverage with edge cases
    - Benchmark performance against array search
  `,
  maxIterations: 3,
});
```

### 2. Validate Solutions

```typescript
// Test a fix before applying to main
await run({
  agent: claudeCode("claude-sonnet-4-5"),
  sandbox: docker(),
  branchStrategy: { type: "branch", branch: "test/fix-42" },
  prompt: "Fix bug #42: handle null values in user input",
  hooks: {
    sandbox: {
      onSandboxReady: [
        { command: "npm install" },
        { command: "npm test" },
      ],
    },
  },
});
```

### 3. Parallel Agent Tasks

```typescript
// Run multiple agents in parallel
const tasks = [
  run({
    agent: claudeCode("claude-opus-4-6"),
    sandbox: docker(),
    branchStrategy: { type: "branch", branch: "agent/auth" },
    prompt: "Implement authentication module",
  }),
  run({
    agent: claudeCode("claude-opus-4-6"),
    sandbox: docker(),
    branchStrategy: { type: "branch", branch: "agent/api" },
    prompt: "Implement REST API endpoints",
  }),
  run({
    agent: claudeCode("claude-opus-4-6"),
    sandbox: docker(),
    branchStrategy: { type: "branch", branch: "agent/tests" },
    prompt: "Write integration tests",
  }),
];

const results = await Promise.all(tasks);
```

### 4. Code Review Pipeline

```typescript
// Multi-stage pipeline: plan → implement → review
import { createSandbox } from "@ai-hero/sandcastle";

await using sandbox = await createSandbox({
  branch: "feature/new-api",
  sandbox: docker(),
});

// Stage 1: Plan
const plan = await sandbox.run({
  agent: claudeCode("claude-opus-4-6"),
  promptFile: ".sandcastle/plan-prompt.md",
});

// Stage 2: Implement
const implementation = await sandbox.run({
  agent: claudeCode("claude-opus-4-6"),
  promptFile: ".sandcastle/implement-prompt.md",
});

// Stage 3: Review
const review = await sandbox.run({
  agent: claudeCode("claude-opus-4-6"),
  promptFile: ".sandcastle/review-prompt.md",
});
```

### 5. On-the-Fly Prototyping

```typescript
// AI needs to quickly test an approach
await run({
  agent: claudeCode("claude-sonnet-4-5"),
  sandbox: docker(),
  prompt: `
    Test three sorting algorithm implementations:
    1. Quicksort
    2. Merge sort
    3. Heap sort
    
    Compare performance with 10k, 100k, 1M elements.
    Report which performs best for our use case.
  `,
  maxIterations: 2,
});
```

## Advanced Configuration

### Custom Mounts

```typescript
await run({
  agent: claudeCode("claude-opus-4-6"),
  sandbox: docker({
    mounts: [
      { hostPath: "~/.npm", sandboxPath: "/home/agent/.npm", readonly: true },
      { hostPath: "./data", sandboxPath: "/app/data" },
    ],
  }),
  prompt: "Process data files and generate report",
});
```

### Lifecycle Hooks

```typescript
await run({
  agent: claudeCode("claude-opus-4-6"),
  sandbox: docker(),
  prompt: "Implement feature",
  hooks: {
    host: {
      onWorktreeReady: [
        { command: "cp .env.example .env" },
      ],
    },
    sandbox: {
      onSandboxReady: [
        { command: "npm install" },
        { command: "npm run build" },
      ],
    },
  },
});
```

### Timeout Configuration

```typescript
await run({
  agent: claudeCode("claude-opus-4-6"),
  sandbox: docker(),
  prompt: "Long-running task",
  idleTimeoutSeconds: 1800, // 30 minutes
  timeouts: {
    copyToWorktreeMs: 120_000, // 2 minutes
  },
});
```

### Environment Variables

```typescript
await run({
  agent: claudeCode("claude-opus-4-6"),
  sandbox: docker({
    env: {
      NODE_ENV: "test",
      API_URL: "http://localhost:3000",
    },
  }),
  prompt: "Run integration tests",
});
```

## CLI Usage

The CLI wrapper provides convenient access to common sandcastle operations:

```bash
# Initialize sandcastle in current project
sandcastle-init

# Run agent with prompt file
sandcastle-run --prompt .sandcastle/prompt.md --sandbox docker

# Run agent with inline prompt
sandcastle-run --prompt "Fix bug in user auth" --sandbox docker --branch fix/auth

# Interactive mode (no sandbox, runs on host)
sandcastle-interactive --prompt "Help me debug this issue"

# Parallel agents
sandcastle-parallel \
  --task "auth:Implement auth module" \
  --task "api:Build REST API" \
  --task "tests:Write test suite"
```

See `bin/sandcastle/README.md` for complete CLI documentation.

## Best Practices

### When to Use Sandboxes

✅ **Use sandboxes for**:
- Code that modifies files
- Installing dependencies
- Running tests
- Building artifacts
- Database migrations
- API testing

❌ **Skip sandboxes for**:
- Read-only analysis
- Code review
- Documentation updates
- Simple calculations

### Choosing Sandbox Providers

| Scenario | Recommended Provider |
|----------|---------------------|
| Local development | Docker (fast, full isolation) |
| Rootless containers | Podman |
| CI/CD pipelines | Vercel (cloud-based, no local Docker) |
| Quick prototypes | Docker with `head` strategy |
| Parallel agents | Docker with `branch` strategy |

### Performance Optimization

1. **Reuse sandboxes**: Use `createSandbox()` for multiple runs
2. **Cache dependencies**: Mount package manager caches (`.npm`, `.cargo`)
3. **Minimize iterations**: Use specific prompts, set low `maxIterations`
4. **Choose right model**: Opus for complex tasks, Sonnet for speed

### Security Considerations

- Never mount sensitive directories (`.ssh`, `.aws`, credentials)
- Use `readonly: true` for mounts when possible
- Review agent code before merging to main
- Set appropriate timeouts to prevent runaway processes
- Use isolated providers (Vercel) for untrusted code

## Integration with AI Workflows

### Example: AI Testing Workflow

```typescript
// AI agent needs to validate a solution
async function testSolution(code: string) {
  const result = await run({
    agent: claudeCode("claude-sonnet-4-5"),
    sandbox: docker(),
    prompt: `
      Test this code:
      
      ${code}
      
      1. Write comprehensive unit tests
      2. Test edge cases
      3. Run performance benchmarks
      4. Report any issues found
    `,
    maxIterations: 2,
  });
  
  return result.commits.length > 0; // Tests created and passed
}
```

### Example: Multi-Agent Pipeline

```typescript
// Orchestrate planning, implementation, testing
async function buildFeature(featureSpec: string) {
  const planResult = await run({
    agent: claudeCode("claude-opus-4-6"),
    sandbox: docker(),
    branchStrategy: { type: "branch", branch: "feature/plan" },
    prompt: `Plan implementation for: ${featureSpec}`,
  });
  
  const implResult = await run({
    agent: claudeCode("claude-opus-4-6"),
    sandbox: docker(),
    branchStrategy: { type: "branch", branch: "feature/impl" },
    prompt: `Implement feature based on plan in ${planResult.branch}`,
  });
  
  const testResult = await run({
    agent: claudeCode("claude-sonnet-4-5"),
    sandbox: docker(),
    branchStrategy: { type: "branch", branch: "feature/test" },
    prompt: `Write tests for implementation in ${implResult.branch}`,
  });
  
  return { plan: planResult, impl: implResult, test: testResult };
}
```

## Troubleshooting

### Docker Not Running

```bash
# Start Docker Desktop or daemon
docker info
# If error, start Docker Desktop
```

### Permission Issues

```bash
# Docker: Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Podman: No root required, but verify installation
podman info
```

### Sandbox Timeout

```typescript
// Increase timeout for long-running tasks
await run({
  agent: claudeCode("claude-opus-4-6"),
  sandbox: docker(),
  prompt: "Long task",
  idleTimeoutSeconds: 3600, // 1 hour
});
```

### Git Issues

```bash
# Ensure git is configured
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
```

## Examples

See `scripts/` directory for complete examples:
- `example-prototype.ts` - Quick prototyping workflow
- `example-parallel-agents.ts` - Multiple agents in parallel
- `example-pipeline.ts` - Multi-stage development pipeline
- `example-testing.ts` - Automated testing workflow

## Related Tools & Skills

### Bin CLIs
- **bin/agent-browser** - Test UI changes in sandboxes via browser automation

### Skills
- **agent-browser** - Automated testing of UI implementations in sandboxes
- **remember-as-you-go** - Capture Docker daemon issues, Git config requirements, sandbox provider quirks

### System CLIs
- `docker` - Primary sandbox container runtime
- `podman` - Rootless container alternative
- `git` - Branch management for sandbox strategies
- `gh` - Create PRs from sandbox results

### Integration Hints
```bash
# Sandbox test → Browser validation → PR creation
sandcastle-run --prompt "Implement feature" --sandbox docker --branch test/feature
agent-browser open http://localhost:3000
agent-browser snapshot -i
git log --oneline -5
gh pr create --title "Feature implementation"

# Parallel agents → Aggregate results
sandcastle-parallel \
  --task "auth:OAuth module" \
  --task "api:REST endpoints" \
  --task "ui:Dashboard"
git branch | grep agent/
```

## References

- [Sandcastle Documentation](https://github.com/mattpocock/sandcastle)
- [API Reference](references/api-reference.md)
- [Configuration Guide](references/configuration.md)
- [Sandbox Providers](references/providers.md)
- [CLI Tool](../../bin/sandcastle/README.md)

## License

MIT (following upstream @ai-hero/sandcastle)
