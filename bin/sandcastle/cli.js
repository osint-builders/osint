#!/usr/bin/env node
/**
 * Sandcastle CLI Wrapper
 *
 * Convenient command-line interface for running AI agents in isolated sandboxes.
 */

import { spawn } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { resolve, join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const COMMANDS = {
  init: 'Initialize sandcastle in current project',
  run: 'Run agent in sandbox with prompt',
  interactive: 'Start interactive session with agent',
  parallel: 'Run multiple agents in parallel',
  help: 'Show help information',
};

/**
 * Main CLI entry point
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === 'help' || args[0] === '--help' || args[0] === '-h') {
    showHelp();
    process.exit(0);
  }

  const command = args[0];
  const commandArgs = args.slice(1);

  try {
    switch (command) {
      case 'init':
        await handleInit(commandArgs);
        break;
      case 'run':
        await handleRun(commandArgs);
        break;
      case 'interactive':
        await handleInteractive(commandArgs);
        break;
      case 'parallel':
        await handleParallel(commandArgs);
        break;
      default:
        console.error(`Unknown command: ${command}`);
        console.error('Run "sandcastle help" for usage information.');
        process.exit(1);
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Show help information
 */
function showHelp() {
  console.log(`
Sandcastle CLI - Run AI agents in isolated sandboxes

USAGE:
    sandcastle <command> [options]

COMMANDS:
    init                         Initialize sandcastle in current project
    run [options]                Run agent in sandbox with prompt
    interactive [options]        Start interactive session
    parallel [options]           Run multiple agents in parallel
    help                         Show this help message

RUN OPTIONS:
    --prompt <text>              Inline prompt text
    --prompt-file <path>         Path to prompt file (default: .sandcastle/prompt.md)
    --sandbox <provider>         Sandbox provider: docker, podman, vercel (default: docker)
    --model <model>              Claude model: opus-4-6, sonnet-4-5, haiku-4 (default: opus-4-6)
    --branch <name>              Target branch name
    --branch-strategy <type>     Strategy: head, branch, merge-to-head (default: head)
    --max-iterations <n>         Maximum iterations (default: 1)
    --cwd <path>                 Working directory (default: current)
    --env <KEY=VALUE>            Environment variable (can be repeated)

INTERACTIVE OPTIONS:
    --prompt <text>              Initial prompt (optional)
    --sandbox <provider>         Sandbox provider (default: no-sandbox)
    --model <model>              Claude model (default: opus-4-6)
    --cwd <path>                 Working directory (default: current)

PARALLEL OPTIONS:
    --task <name:prompt>         Task definition (can be repeated)
    --sandbox <provider>         Sandbox provider (default: docker)
    --model <model>              Claude model (default: opus-4-6)
    --cwd <path>                 Working directory (default: current)

EXAMPLES:
    # Initialize sandcastle
    sandcastle init

    # Run with inline prompt
    sandcastle run --prompt "Fix bug in auth module" --sandbox docker

    # Run with prompt file
    sandcastle run --prompt-file .sandcastle/implement-prompt.md --branch feature/api

    # Interactive session
    sandcastle interactive --prompt "Help me debug this issue"

    # Parallel agents
    sandcastle parallel \\
      --task "auth:Implement authentication" \\
      --task "api:Build REST API" \\
      --task "tests:Write test suite"

ENVIRONMENT:
    ANTHROPIC_API_KEY            Required for Claude agent (or configure in .sandcastle/.env)

For more information, see:
    skills/sandcastle/SKILL.md
    https://github.com/mattpocock/sandcastle
`);
}

/**
 * Handle init command
 */
async function handleInit(args) {
  console.log('Initializing sandcastle...');

  // Run npx sandcastle init
  const result = await runCommand('npx', ['sandcastle', 'init'], { stdio: 'inherit' });

  if (result.code === 0) {
    console.log('\n✓ Sandcastle initialized');
    console.log('\nNext steps:');
    console.log('  1. Edit .sandcastle/.env and add your ANTHROPIC_API_KEY');
    console.log('  2. Run: sandcastle run --prompt "Your task here"');
  } else {
    throw new Error('Failed to initialize sandcastle');
  }
}

/**
 * Handle run command
 */
async function handleRun(args) {
  const options = parseOptions(args);

  // Validate required options
  if (!options.prompt && !options['prompt-file']) {
    throw new Error('Either --prompt or --prompt-file is required');
  }

  console.log('Running sandcastle agent...');

  // Create temporary TypeScript file
  const runScript = generateRunScript(options);
  const scriptPath = join(process.cwd(), '.sandcastle', 'temp-run.ts');

  await writeFile(scriptPath, runScript);

  // Run with tsx
  const envFile = join(process.cwd(), '.sandcastle', '.env');
  const tsxArgs = existsSync(envFile)
    ? ['--env-file=' + envFile, scriptPath]
    : [scriptPath];

  const result = await runCommand('npx', ['tsx', ...tsxArgs], { stdio: 'inherit' });

  if (result.code !== 0) {
    throw new Error('Sandcastle run failed');
  }
}

/**
 * Handle interactive command
 */
async function handleInteractive(args) {
  const options = parseOptions(args);

  console.log('Starting interactive session...');

  const interactiveScript = generateInteractiveScript(options);
  const scriptPath = join(process.cwd(), '.sandcastle', 'temp-interactive.ts');

  await writeFile(scriptPath, interactiveScript);

  const envFile = join(process.cwd(), '.sandcastle', '.env');
  const tsxArgs = existsSync(envFile)
    ? ['--env-file=' + envFile, scriptPath]
    : [scriptPath];

  const result = await runCommand('npx', ['tsx', ...tsxArgs], { stdio: 'inherit' });

  if (result.code !== 0) {
    throw new Error('Interactive session failed');
  }
}

/**
 * Handle parallel command
 */
async function handleParallel(args) {
  const options = parseOptions(args);

  if (!options.task || options.task.length === 0) {
    throw new Error('At least one --task is required');
  }

  console.log(`Running ${options.task.length} agents in parallel...`);

  const parallelScript = generateParallelScript(options);
  const scriptPath = join(process.cwd(), '.sandcastle', 'temp-parallel.ts');

  await writeFile(scriptPath, parallelScript);

  const envFile = join(process.cwd(), '.sandcastle', '.env');
  const tsxArgs = existsSync(envFile)
    ? ['--env-file=' + envFile, scriptPath]
    : [scriptPath];

  const result = await runCommand('npx', ['tsx', ...tsxArgs], { stdio: 'inherit' });

  if (result.code !== 0) {
    throw new Error('Parallel execution failed');
  }
}

/**
 * Parse command-line options
 */
function parseOptions(args) {
  const options = { env: {}, task: [] };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const value = args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true;

      if (key === 'env' && typeof value === 'string') {
        const [envKey, envValue] = value.split('=');
        options.env[envKey] = envValue;
        i++;
      } else if (key === 'task' && typeof value === 'string') {
        options.task.push(value);
        i++;
      } else {
        options[key] = value;
        if (typeof value === 'string') i++;
      }
    }
  }

  return options;
}

/**
 * Generate run script
 */
function generateRunScript(options) {
  const sandbox = options.sandbox || 'docker';
  const model = options.model || 'claude-opus-4-6';
  const maxIterations = options['max-iterations'] || 1;
  const branchStrategy = options['branch-strategy'] || 'head';
  const branch = options.branch || undefined;
  const cwd = options.cwd || process.cwd();

  let promptConfig;
  if (options.prompt) {
    promptConfig = `prompt: ${JSON.stringify(options.prompt)},`;
  } else {
    const promptFile = options['prompt-file'] || '.sandcastle/prompt.md';
    promptConfig = `promptFile: ${JSON.stringify(promptFile)},`;
  }

  let branchStrategyConfig;
  if (branch) {
    branchStrategyConfig = `branchStrategy: { type: "branch", branch: ${JSON.stringify(branch)} },`;
  } else if (branchStrategy !== 'head') {
    branchStrategyConfig = `branchStrategy: { type: ${JSON.stringify(branchStrategy)} },`;
  } else {
    branchStrategyConfig = '';
  }

  const envConfig = Object.keys(options.env).length > 0
    ? `env: ${JSON.stringify(options.env)},`
    : '';

  // Use Node.js Docker image with git and basic tools
  const imageConfig = sandbox === 'docker'
    ? `imageName: "node:20-bullseye",`
    : '';

  const sandboxConfig = (envConfig || imageConfig)
    ? `{ ${envConfig}${envConfig && imageConfig ? ' ' : ''}${imageConfig} }`
    : '';

  return `
import { run, claudeCode } from "@ai-hero/sandcastle";
import { ${sandbox} } from "@ai-hero/sandcastle/sandboxes/${sandbox}";

const result = await run({
  agent: claudeCode(${JSON.stringify(model)}),
  sandbox: ${sandbox}(${sandboxConfig}),
  ${promptConfig}
  ${branchStrategyConfig}
  maxIterations: ${maxIterations},
  cwd: ${JSON.stringify(cwd)},
});

console.log("\\n✓ Agent completed");
console.log("Commits:", result.commits.length);
console.log("Branch:", result.branch);
`;
}

/**
 * Generate interactive script
 */
function generateInteractiveScript(options) {
  const sandbox = options.sandbox || 'no-sandbox';
  const model = options.model || 'claude-opus-4-6';
  const cwd = options.cwd || process.cwd();
  const prompt = options.prompt ? `prompt: ${JSON.stringify(options.prompt)},` : '';

  return `
import { interactive, claudeCode } from "@ai-hero/sandcastle";
import { ${sandbox === 'no-sandbox' ? 'noSandbox' : sandbox} } from "@ai-hero/sandcastle/sandboxes/${sandbox === 'no-sandbox' ? 'no-sandbox' : sandbox}";

await interactive({
  agent: claudeCode(${JSON.stringify(model)}),
  sandbox: ${sandbox === 'no-sandbox' ? 'noSandbox' : sandbox}(),
  ${prompt}
  cwd: ${JSON.stringify(cwd)},
});
`;
}

/**
 * Generate parallel script
 */
function generateParallelScript(options) {
  const sandbox = options.sandbox || 'docker';
  const model = options.model || 'claude-opus-4-6';
  const cwd = options.cwd || process.cwd();

  const tasks = options.task.map(task => {
    const [name, prompt] = task.split(':', 2);
    if (!prompt) throw new Error(`Invalid task format: ${task}. Expected "name:prompt"`);

    return `
  run({
    agent: claudeCode(${JSON.stringify(model)}),
    sandbox: ${sandbox}(),
    branchStrategy: { type: "branch", branch: "agent/${name}" },
    prompt: ${JSON.stringify(prompt)},
    name: ${JSON.stringify(name)},
    cwd: ${JSON.stringify(cwd)},
  })`;
  }).join(',\n');

  return `
import { run, claudeCode } from "@ai-hero/sandcastle";
import { ${sandbox} } from "@ai-hero/sandcastle/sandboxes/${sandbox}";

console.log("Running ${options.task.length} agents in parallel...");

const results = await Promise.all([
${tasks}
]);

console.log("\\n✓ All agents completed");
results.forEach((result, i) => {
  console.log(\`Task \${i + 1}: \${result.commits.length} commits on \${result.branch}\`);
});
`;
}

/**
 * Run command and capture result
 */
function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, { ...options, shell: true });

    proc.on('close', (code) => {
      resolve({ code });
    });

    proc.on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Write file (simple wrapper for fs.writeFileSync)
 */
async function writeFile(path, content) {
  const fs = await import('fs');
  fs.writeFileSync(path, content, 'utf8');
}

// Run CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error(`Fatal error: ${error.message}`);
    process.exit(1);
  });
}
