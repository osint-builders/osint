#!/usr/bin/env node

/**
 * snowflake.js
 *
 * Twitter-style Snowflake ID generator for World Event Entities.
 *
 * 64-bit structure (as a BigInt, output as decimal string):
 *   Bits 63–22 (42 bits): milliseconds since EPOCH  → ~139 years
 *   Bits 21–12 (10 bits): worker ID (0–1023)        → maps to bucket number
 *   Bits 11–0  (12 bits): sequence (0–4095/ms/worker)
 *
 * Output format: evt_<decimal_snowflake>
 *   e.g. evt_12345678901234567
 *
 * CLI:
 *   node snowflake.js                     # print one ID
 *   node snowflake.js --worker 3          # set worker (bucket) ID
 *   node snowflake.js --count 5           # print 5 IDs
 *   node snowflake.js --worker 3 --count 5
 *   node snowflake.js --raw               # print without evt_ prefix
 *
 * Module:
 *   const { generateId, generateSnowflake, createGenerator } = require('./snowflake.js');
 *   generateId()          // → "evt_12345678901234567"
 *   generateId(3)         // → "evt_..." with worker=3
 *   generateSnowflake()   // → "12345678901234567" (no prefix)
 *   const gen = createGenerator(3);
 *   gen.nextId()           // → "evt_..."
 */

'use strict';

// Custom epoch: 2026-01-01T00:00:00Z
const EPOCH = 1767225600000n;

const WORKER_BITS = 10n;
const SEQUENCE_BITS = 12n;

const MAX_WORKER_ID = (1n << WORKER_BITS) - 1n;   // 1023
const MAX_SEQUENCE = (1n << SEQUENCE_BITS) - 1n;    // 4095

const WORKER_SHIFT = SEQUENCE_BITS;                  // 12
const TIMESTAMP_SHIFT = SEQUENCE_BITS + WORKER_BITS; // 22

// ---------------------------------------------------------------------------
// Generator class — holds per-worker state
// ---------------------------------------------------------------------------

class SnowflakeGenerator {
  constructor(workerId = 0) {
    const wid = BigInt(workerId);
    if (wid < 0n || wid > MAX_WORKER_ID) {
      throw new RangeError(`Worker ID must be 0–${MAX_WORKER_ID}: got ${workerId}`);
    }
    this._workerId = wid;
    this._sequence = 0n;
    this._lastTimestamp = -1n;
  }

  _currentTimestamp() {
    return BigInt(Date.now()) - EPOCH;
  }

  _waitNextMillis(lastTs) {
    let ts = this._currentTimestamp();
    while (ts <= lastTs) {
      ts = this._currentTimestamp();
    }
    return ts;
  }

  /**
   * Generate the next raw snowflake as a BigInt.
   */
  nextSnowflake() {
    let timestamp = this._currentTimestamp();

    if (timestamp === this._lastTimestamp) {
      this._sequence = (this._sequence + 1n) & MAX_SEQUENCE;
      if (this._sequence === 0n) {
        // Sequence exhausted for this millisecond — spin until next ms
        timestamp = this._waitNextMillis(this._lastTimestamp);
      }
    } else {
      this._sequence = 0n;
    }

    this._lastTimestamp = timestamp;

    return (
      (timestamp << TIMESTAMP_SHIFT) |
      (this._workerId << WORKER_SHIFT) |
      this._sequence
    );
  }

  /**
   * Generate a snowflake from a specific timestamp (for migration).
   * Does NOT update internal clock state — use only for backfill.
   */
  snowflakeFromTimestamp(dateMs) {
    const timestamp = BigInt(dateMs) - EPOCH;
    this._sequence = (this._sequence + 1n) & MAX_SEQUENCE;
    return (
      (timestamp << TIMESTAMP_SHIFT) |
      (this._workerId << WORKER_SHIFT) |
      this._sequence
    );
  }

  /**
   * Generate an evt_-prefixed ID string.
   */
  nextId() {
    return `evt_${this.nextSnowflake().toString()}`;
  }

  /**
   * Generate an evt_-prefixed ID from a specific timestamp (for migration).
   */
  idFromTimestamp(dateMs) {
    return `evt_${this.snowflakeFromTimestamp(dateMs).toString()}`;
  }
}

// ---------------------------------------------------------------------------
// Convenience functions (default worker = 0)
// ---------------------------------------------------------------------------

const _default = new SnowflakeGenerator(0);

function generateId(workerId) {
  if (workerId !== undefined && workerId !== 0) {
    return new SnowflakeGenerator(workerId).nextId();
  }
  return _default.nextId();
}

function generateSnowflake(workerId) {
  if (workerId !== undefined && workerId !== 0) {
    return new SnowflakeGenerator(workerId).nextSnowflake().toString();
  }
  return _default.nextSnowflake().toString();
}

function createGenerator(workerId = 0) {
  return new SnowflakeGenerator(workerId);
}

/**
 * Parse a snowflake back into its components.
 */
function parseSnowflake(idStr) {
  const raw = idStr.startsWith('evt_') ? idStr.slice(4) : idStr;
  const snowflake = BigInt(raw);
  const timestamp = (snowflake >> TIMESTAMP_SHIFT) + EPOCH;
  const workerId = Number((snowflake >> WORKER_SHIFT) & MAX_WORKER_ID);
  const sequence = Number(snowflake & MAX_SEQUENCE);
  return {
    timestamp: Number(timestamp),
    date: new Date(Number(timestamp)),
    workerId,
    sequence,
  };
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

if (require.main === module) {
  const args = process.argv.slice(2);
  let workerId = 0;
  let count = 1;
  let raw = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--worker' && args[i + 1]) {
      workerId = parseInt(args[++i], 10);
      if (isNaN(workerId) || workerId < 0 || workerId > Number(MAX_WORKER_ID)) {
        console.error(`Error: --worker must be 0–${MAX_WORKER_ID}`);
        process.exit(1);
      }
    } else if (args[i] === '--count' && args[i + 1]) {
      count = parseInt(args[++i], 10);
      if (isNaN(count) || count < 1) {
        console.error('Error: --count must be ≥ 1');
        process.exit(1);
      }
    } else if (args[i] === '--raw') {
      raw = true;
    } else if (args[i] === '--help' || args[i] === '-h') {
      console.log(`Usage: node snowflake.js [--worker N] [--count N] [--raw]

Generate globally unique Snowflake IDs for World Event Entities.

Options:
  --worker N   Worker/bucket ID (0–1023, default: 0)
  --count N    Number of IDs to generate (default: 1)
  --raw        Output without evt_ prefix
  --help       Show this help`);
      process.exit(0);
    }
  }

  const gen = new SnowflakeGenerator(workerId);
  for (let i = 0; i < count; i++) {
    console.log(raw ? gen.nextSnowflake().toString() : gen.nextId());
  }
}

// ---------------------------------------------------------------------------
// Module exports
// ---------------------------------------------------------------------------

module.exports = {
  SnowflakeGenerator,
  generateId,
  generateSnowflake,
  createGenerator,
  parseSnowflake,
  EPOCH,
};
