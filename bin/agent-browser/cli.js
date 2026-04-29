#!/usr/bin/env node

/**
 * Agent Browser CLI Wrapper
 * 
 * This wrapper provides a convenient entry point to the native agent-browser CLI.
 * The native binary must be installed globally via: npm install -g agent-browser
 * 
 * For full documentation, see: https://github.com/vercel-labs/agent-browser
 */

import { execSync } from 'child_process';
import { argv } from 'process';

// Pass all arguments directly to the agent-browser binary
const args = argv.slice(2).join(' ');

try {
  const result = execSync(`agent-browser ${args}`, {
    stdio: 'inherit',
    env: process.env,
  });
  process.exit(0);
} catch (error) {
  // execSync throws if agent-browser exits with non-zero status
  // The error output is already printed to stderr, so just exit
  process.exit(error.status || 1);
}
