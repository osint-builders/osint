/**
 * Agent Browser Entry Point
 * 
 * Direct access to Browserbase SDK for CLI and programmatic use.
 * Location: bin/agent-browser/
 */

const Browserbase = require('./node_modules/@browserbasehq/sdk');

module.exports = {
  Browserbase,
  version: require('./package.json').version,
};
