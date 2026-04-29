/**
 * Agent Browser Binaries
 * 
 * This is the entry point for agent-browser functionality.
 * Provides direct access to Browserbase SDK for OSINT skills.
 */

const Browserbase = require('@browserbasehq/sdk');

module.exports = {
  Browserbase,
  version: require('./package.json').version,
};
