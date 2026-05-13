const assert = require('assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const test = require('node:test');
const {
  getUsagePath,
  loadUsageSeconds,
  saveUsageSeconds
} = require('../src/main/usage-store');

function tempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'cat-break-usage-'));
}

test('usage store saves and loads active usage seconds', () => {
  const dir = tempDir();

  saveUsageSeconds(dir, 42, { now: () => 1000 });

  assert.equal(loadUsageSeconds(dir, {
    now: () => 2000,
    staleAfterMs: 5000
  }), 42);
  assert.equal(fs.existsSync(getUsagePath(dir)), true);
});

test('usage store resets stale and invalid entries', () => {
  const dir = tempDir();

  fs.writeFileSync(getUsagePath(dir), JSON.stringify({
    seconds: 99,
    updatedAt: 1000
  }));

  assert.equal(loadUsageSeconds(dir, {
    now: () => 10_000,
    staleAfterMs: 5000
  }), 0);
  assert.equal(loadUsageSeconds(path.join(dir, 'missing')), 0);
});
