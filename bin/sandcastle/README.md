# Sandcastle CLI Wrapper

Command-line interface for running AI coding agents in isolated sandbox environments using [@ai-hero/sandcastle](https://github.com/mattpocock/sandcastle).

## Installation

```bash
# Navigate to bin/sandcastle directory
cd bin/sandcastle

# Install dependencies
npm install

# Create symlink for global use (optional)
npm link
# or
ln -s "$(pwd)/cli.js" /usr/local/bin/sandcastle
```

## Prerequisites

- Node.js 18 or later
- Git installed and configured
- One of:
  - Docker Desktop (most common)
  - Podman (rootless alternative)
  - Vercel account (for cloud sandboxes)
- Anthropic API key (for Claude agent)

## Quick Start

### 1. Initialize Sandcastle

```bash
# Initialize .sandcastle directory in your project
cd /path/to/your/project
sandcastle init

# Configure API key
cp .sandcastle/.env.example .sandcastle/.env
# Edit .sandcastle/.env and add:
# ANTHROPIC_API_KEY="your-api-key-here"
```

### 2. Run Your First Agent

```bash
# Run agent with inline prompt
sandcastle run --prompt "Create a function to calculate prime numbers with tests"

# Run agent with prompt file
sandcastle run --prompt-file .sandcastle/implement-prompt.md
```

## Commands

### `init`

Initialize sandcastle in the current project.

```bash
sandcastle init
```

Creates `.sandcastle/` directory with:
- `.env.example` - Environment variable template
- `prompt.md` - Default prompt file
- `Dockerfile` - Docker image configuration
- Prompt templates for common tasks

### `run`

Run an agent in a sandbox with a specific prompt.

```bash
sandcastle run [options]
```

**Options**:

- `--prompt <text>` - Inline prompt text
- `--prompt-file <path>` - Path to prompt file (default: `.sandcastle/prompt.md`)
- `--sandbox <provider>` - Sandbox provider: `docker`, `podman`, `vercel` (default: `docker`)
- `--model <model>` - Claude model: `opus-4-6`, `sonnet-4-5`, `haiku-4` (default: `opus-4-6`)
- `--branch <name>` - Target branch name
- `--branch-strategy <type>` - Strategy: `head`, `branch`, `merge-to-head` (default: `head`)
- `--max-iterations <n>` - Maximum iterations (default: `1`)
- `--cwd <path>` - Working directory (default: current directory)
- `--env <KEY=VALUE>` - Environment variable (can be repeated)

**Examples**:

```bash
# Basic run
sandcastle run --prompt "Fix bug in authentication"

# Specific branch
sandcastle run --prompt "Add API endpoint" --branch feature/api

# Multiple iterations
sandcastle run --prompt "Implement with full tests" --max-iterations 3

# Custom environment
sandcastle run --prompt "Run integration tests" --env NODE_ENV=test --env API_URL=http://localhost:3000

# Different model
sandcastle run --prompt "Quick fix" --model sonnet-4-5

# Podman instead of Docker
sandcastle run --prompt "Build feature" --sandbox podman
```

### `interactive`

Start an interactive session with the agent.

```bash
sandcastle interactive [options]
```

**Options**:

- `--prompt <text>` - Initial prompt (optional)
- `--sandbox <provider>` - Sandbox provider (default: `no-sandbox` for interactive)
- `--model <model>` - Claude model (default: `opus-4-6`)
- `--cwd <path>` - Working directory (default: current directory)

**Examples**:

```bash
# Start interactive session
sandcastle interactive

# With initial prompt
sandcastle interactive --prompt "Help me debug this authentication issue"

# In sandbox (slower but isolated)
sandcastle interactive --sandbox docker
```

### `parallel`

Run multiple agents in parallel on separate branches.

```bash
sandcastle parallel --task <name:prompt> [options]
```

**Options**:

- `--task <name:prompt>` - Task definition (can be repeated, required)
- `--sandbox <provider>` - Sandbox provider (default: `docker`)
- `--model <model>` - Claude model (default: `opus-4-6`)
- `--cwd <path>` - Working directory (default: current directory)

**Examples**:

```bash
# Run 3 agents in parallel
sandcastle parallel \
  --task "auth:Implement user authentication module" \
  --task "api:Build REST API endpoints" \
  --task "tests:Write comprehensive test suite"

# With different model
sandcastle parallel \
  --task "refactor:Refactor auth module" \
  --task "docs:Update API documentation" \
  --model sonnet-4-5
```

## Use Cases

### 1. Quick Prototyping

```bash
sandcastle run --prompt "Create a React component for user profile with TypeScript"
```

### 2. Bug Fixing

```bash
sandcastle run \
  --prompt "Fix bug #42: null pointer in user authentication" \
  --branch fix/auth-bug-42
```

### 3. Feature Implementation

```bash
sandcastle run \
  --prompt-file .sandcastle/feature-spec.md \
  --branch feature/new-api \
  --max-iterations 5
```

### 4. Testing and Validation

```bash
sandcastle run \
  --prompt "Write integration tests for the payment API" \
  --env NODE_ENV=test \
  --max-iterations 2
```

### 5. Code Review Pipeline

```bash
# Step 1: Plan
sandcastle run --prompt-file .sandcastle/plan-prompt.md --branch review/plan

# Step 2: Implement
sandcastle run --prompt-file .sandcastle/implement-prompt.md --branch review/impl

# Step 3: Test
sandcastle run --prompt-file .sandcastle/test-prompt.md --branch review/test
```

### 6. Parallel Development

```bash
sandcastle parallel \
  --task "frontend:Build React components" \
  --task "backend:Implement API endpoints" \
  --task "db:Create database migrations" \
  --task "tests:Write unit tests"
```

## Configuration

### Environment Variables

Create `.sandcastle/.env` with:

```bash
# Required
ANTHROPIC_API_KEY="sk-ant-..."

# Optional
ANTHROPIC_MODEL="claude-opus-4-6"
DEFAULT_SANDBOX="docker"
DEFAULT_MAX_ITERATIONS="1"
```

### Prompt Files

Create reusable prompt files in `.sandcastle/`:

**`.sandcastle/implement-prompt.md`**:
```markdown
Implement the following feature:

{{FEATURE_DESCRIPTION}}

Requirements:
- Write clean, well-documented code
- Include unit tests
- Follow project coding standards
- Update relevant documentation

Use TypeScript and follow best practices.
```

Use with:
```bash
sandcastle run \
  --prompt-file .sandcastle/implement-prompt.md \
  --env FEATURE_DESCRIPTION="User authentication with JWT"
```

### Docker Image

Customize `.sandcastle/Dockerfile` for project-specific setup:

```dockerfile
FROM node:20-slim

RUN apt-get update && apt-get install -y git

WORKDIR /workspace

# Pre-install common dependencies
COPY package*.json ./
RUN npm install

CMD ["/bin/bash"]
```

Build custom image:
```bash
cd .sandcastle
docker build -t sandcastle:custom .
```

Use custom image:
```bash
sandcastle run --prompt "Your task" --sandbox docker --env DOCKER_IMAGE=sandcastle:custom
```

## Integration with Scripts

### Node.js/TypeScript

```typescript
import { spawn } from 'child_process';

async function runAgent(prompt: string) {
  return new Promise((resolve, reject) => {
    const proc = spawn('sandcastle', ['run', '--prompt', prompt], {
      stdio: 'inherit',
    });

    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Agent failed with code ${code}`));
    });
  });
}

await runAgent('Implement feature X');
```

### Shell Scripts

```bash
#!/bin/bash
# run-agents.sh

set -e

echo "Running parallel agents..."

sandcastle parallel \
  --task "auth:Implement authentication" \
  --task "api:Build API endpoints" \
  --task "tests:Write tests"

echo "Agents completed successfully"
```

### CI/CD Pipelines

**GitHub Actions**:
```yaml
name: AI Agent Tasks

on: [push]

jobs:
  agent-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 20
      - name: Install sandcastle
        run: |
          cd bin/sandcastle
          npm install
      - name: Run agent
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          sandcastle run --prompt "Run test suite and fix any failures"
```

## Troubleshooting

### Docker Not Running

**Error**: `Cannot connect to Docker daemon`

**Solution**:
```bash
# macOS: Start Docker Desktop
open -a Docker

# Linux: Start Docker service
sudo systemctl start docker

# Verify
docker info
```

### Permission Denied

**Error**: `Permission denied while trying to connect to Docker`

**Solution**:
```bash
# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Or use Podman (no root required)
sandcastle run --prompt "Your task" --sandbox podman
```

### API Key Not Found

**Error**: `ANTHROPIC_API_KEY not found`

**Solution**:
```bash
# Create .env file
cp .sandcastle/.env.example .sandcastle/.env

# Edit and add key
echo 'ANTHROPIC_API_KEY="sk-ant-..."' > .sandcastle/.env
```

### Agent Timeout

**Error**: `Agent exceeded idle timeout`

**Solution**: Increase timeout or reduce task complexity
```bash
# Longer timeout (not yet exposed in CLI, use TypeScript API)
# Or break task into smaller pieces
sandcastle run --prompt "Part 1 of task" --max-iterations 1
sandcastle run --prompt "Part 2 of task" --max-iterations 1
```

### Branch Already Exists

**Error**: `Branch already exists`

**Solution**:
```bash
# Delete old branch
git branch -D agent/feature-name

# Or use different branch name
sandcastle run --prompt "Task" --branch agent/feature-v2
```

## Advanced Usage

### Custom Sandbox Providers

For advanced use cases, use the TypeScript API directly:

```typescript
import { run, claudeCode } from "@ai-hero/sandcastle";
import { createBindMountSandboxProvider } from "@ai-hero/sandcastle";

const customSandbox = createBindMountSandboxProvider({
  name: "custom",
  start: async (opts) => {
    // Custom sandbox startup logic
  },
  stop: async () => {
    // Custom cleanup logic
  },
});

await run({
  agent: claudeCode("claude-opus-4-6"),
  sandbox: customSandbox(),
  prompt: "Your task",
});
```

### Lifecycle Hooks

Use TypeScript API for advanced lifecycle hooks:

```typescript
import { run, claudeCode } from "@ai-hero/sandcastle";
import { docker } from "@ai-hero/sandcastle/sandboxes/docker";

await run({
  agent: claudeCode("claude-opus-4-6"),
  sandbox: docker(),
  prompt: "Your task",
  hooks: {
    host: {
      onWorktreeReady: [
        { command: "cp .env.example .env" },
        { command: "npm run setup" },
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

## Related Documentation

- [Sandcastle Skill](../../skills/sandcastle/SKILL.md)
- [Sandcastle GitHub](https://github.com/mattpocock/sandcastle)
- [Claude API Documentation](https://docs.anthropic.com/claude/docs)

## License

MIT (following upstream @ai-hero/sandcastle)
