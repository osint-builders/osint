#!/usr/bin/env node

/**
 * Agent Browser Entry Point (CLI)
 * 
 * Convenience alias for cli.js. Delegates to the native agent-browser binary.
 */

import { execSync } from 'child_process';
import { argv } from 'process';

const args = argv.slice(2).join(' ');

try {
  const result = execSync(`agent-browser ${args}`, {
    stdio: 'inherit',
    env: process.env,
  });
  process.exit(0);
} catch (error) {
  process.exit(error.status || 1);
}
