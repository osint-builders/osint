# Sandcastle Quick Reference

Fast reference guide for common sandcastle operations.

## Installation

```bash
# Install dependencies
cd bin/sandcastle
npm install

# Initialize in project
sandcastle init

# Configure API key
echo 'ANTHROPIC_API_KEY="sk-ant-..."' > .sandcastle/.env
```

## CLI Commands

### Basic Run

```bash
# Inline prompt
sandcastle run --prompt "Your task here"

# Prompt file
sandcastle run --prompt-file .sandcastle/prompt.md

# Specific branch
sandcastle run --prompt "Fix bug" --branch fix/auth-bug

# Multiple iterations
sandcastle run --prompt "Complex task" --max-iterations 5
```

### Interactive Mode

```bash
# Start interactive session (no sandbox, runs on host)
sandcastle interactive

# With initial prompt
sandcastle interactive --prompt "Help debug this issue"

# In Docker sandbox (slower but isolated)
sandcastle interactive --sandbox docker
```

### Parallel Agents

```bash
# Run 3 agents in parallel
sandcastle parallel \
  --task "auth:Implement authentication module" \
  --task "api:Build REST API endpoints" \
  --task "tests:Write comprehensive tests"

# With different model
sandcastle parallel \
  --task "docs:Update documentation" \
  --task "refactor:Improve code style" \
  --model sonnet-4-5
```

## TypeScript API

### Basic Usage

```typescript
import { run, claudeCode } from "@ai-hero/sandcastle";
import { docker } from "@ai-hero/sandcastle/sandboxes/docker";

const result = await run({
  agent: claudeCode("claude-opus-4-6"),
  sandbox: docker(),
  prompt: "Your task",
});
```

### With Options

```typescript
await run({
  agent: claudeCode("claude-opus-4-6"),
  sandbox: docker({
    mounts: [
      { hostPath: "~/.npm", sandboxPath: "/home/agent/.npm", readonly: true }
    ],
    env: { NODE_ENV: "test" },
  }),
  branchStrategy: { type: "branch", branch: "feature/new-api" },
  maxIterations: 3,
  promptFile: ".sandcastle/implement-prompt.md",
  hooks: {
    sandbox: {
      onSandboxReady: [
        { command: "npm install" },
        { command: "npm run build" },
      ],
    },
  },
});
```

### Reusable Sandbox

```typescript
import { createSandbox } from "@ai-hero/sandcastle";

await using sandbox = await createSandbox({
  branch: "agent/feature",
  sandbox: docker(),
});

// Run multiple times
await sandbox.run({
  agent: claudeCode("claude-opus-4-6"),
  prompt: "Task 1",
});

await sandbox.run({
  agent: claudeCode("claude-opus-4-6"),
  prompt: "Task 2",
});
```

### Parallel Execution

```typescript
const results = await Promise.all([
  run({
    agent: claudeCode("claude-opus-4-6"),
    sandbox: docker(),
    branchStrategy: { type: "branch", branch: "agent/auth" },
    prompt: "Implement authentication",
  }),
  run({
    agent: claudeCode("claude-opus-4-6"),
    sandbox: docker(),
    branchStrategy: { type: "branch", branch: "agent/api" },
    prompt: "Implement API",
  }),
]);
```

## Common Options

### Models

| Model | Best For | Speed | Cost |
|-------|----------|-------|------|
| `claude-opus-4-6` | Complex tasks, architecture | Slower | Higher |
| `claude-sonnet-4-5` | Balanced performance | Fast | Medium |
| `claude-haiku-4` | Simple tasks, quick fixes | Fastest | Lower |

### Sandbox Providers

| Provider | Import | Use Case |
|----------|--------|----------|
| Docker | `@ai-hero/sandcastle/sandboxes/docker` | Local, full isolation |
| Podman | `@ai-hero/sandcastle/sandboxes/podman` | Rootless containers |
| Vercel | `@ai-hero/sandcastle/sandboxes/vercel` | Cloud-based microVMs |
| No-sandbox | `@ai-hero/sandcastle/sandboxes/no-sandbox` | Interactive only |

### Branch Strategies

| Strategy | Description | Use Case |
|----------|-------------|----------|
| `head` | Work on current branch | Quick tests |
| `branch` | Create named branch | Feature development |
| `merge-to-head` | Temp branch, merge back | Isolated with integration |

## Environment Variables

```bash
# .sandcastle/.env
ANTHROPIC_API_KEY="sk-ant-..."
ANTHROPIC_MODEL="claude-opus-4-6"
DEFAULT_SANDBOX="docker"
DEFAULT_MAX_ITERATIONS="1"
```

## Prompt Templates

### Implementation Prompt

```markdown
<!-- .sandcastle/implement-prompt.md -->
Implement {{FEATURE_NAME}}:

## Requirements
- {{REQUIREMENT_1}}
- {{REQUIREMENT_2}}

## Deliverables
- Working implementation
- Unit tests
- Documentation

Use TypeScript and follow project conventions.
```

Use with:
```bash
sandcastle run \
  --prompt-file .sandcastle/implement-prompt.md \
  --env FEATURE_NAME="User Authentication" \
  --env REQUIREMENT_1="JWT tokens" \
  --env REQUIREMENT_2="Password hashing"
```

### Testing Prompt

```markdown
Write comprehensive tests for {{MODULE_NAME}}:

- Unit tests for all functions
- Edge case coverage
- Performance tests
- Aim for >90% code coverage

Use Jest and create tests in appropriate locations.
```

## Troubleshooting

### Docker Not Running

```bash
# Check Docker status
docker info

# Start Docker Desktop (macOS)
open -a Docker

# Start Docker daemon (Linux)
sudo systemctl start docker
```

### Permission Denied

```bash
# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Or use Podman (no root required)
sandcastle run --prompt "Task" --sandbox podman
```

### API Key Not Found

```bash
# Create .env file
cp .sandcastle/.env.example .sandcastle/.env

# Add API key
echo 'ANTHROPIC_API_KEY="sk-ant-..."' >> .sandcastle/.env
```

### Branch Already Exists

```bash
# Delete old branch
git branch -D agent/feature-name

# Or use different name
sandcastle run --prompt "Task" --branch agent/feature-v2
```

## Result Object

```typescript
const result = await run({...});

result.iterations         // Array of iteration results
result.iterations.length  // Number of iterations executed
result.completionSignal   // Matched signal string (if any)
result.commits            // Array of { sha } for commits
result.branch             // Branch name where work occurred
```

## Best Practices

### ✅ Do

- Use specific, clear prompts
- Set appropriate `maxIterations` (1-5 typical)
- Mount package caches for faster installs
- Use `branch` strategy for parallel work
- Review agent commits before merging
- Set reasonable timeouts
- Use Sonnet for speed, Opus for complexity

### ❌ Don't

- Mount sensitive directories (`.ssh`, `.aws`)
- Use unlimited iterations
- Skip sandbox for file-modifying code
- Run untrusted code without review
- Forget to set ANTHROPIC_API_KEY
- Use overly complex prompts

## Quick Examples

### Prototype Algorithm

```bash
sandcastle run --prompt "Implement binary search with tests and benchmarks" --branch prototype/binary-search
```

### Fix Bug

```bash
sandcastle run --prompt "Fix bug #42: handle null values in user input" --branch fix/bug-42 --max-iterations 2
```

### Parallel Features

```bash
sandcastle parallel \
  --task "auth:Implement JWT authentication" \
  --task "db:Set up PostgreSQL connection pool" \
  --task "api:Create REST endpoints"
```

### Multi-Stage Pipeline

```bash
# Stage 1: Plan
sandcastle run --prompt-file .sandcastle/plan-prompt.md --branch plan/feature

# Stage 2: Implement
sandcastle run --prompt-file .sandcastle/implement-prompt.md --branch impl/feature

# Stage 3: Test
sandcastle run --prompt-file .sandcastle/test-prompt.md --branch test/feature
```

## Resources

- **Skill Documentation**: `skills/sandcastle/SKILL.md`
- **CLI Documentation**: `bin/sandcastle/README.md`
- **Example Scripts**: `skills/sandcastle/scripts/`
- **Upstream Docs**: https://github.com/mattpocock/sandcastle
