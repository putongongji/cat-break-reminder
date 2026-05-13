const fs = require('fs');
const path = require('path');
const { USAGE_STALE_AFTER_MS } = require('../core/constants');

function getUsagePath(userDataPath) {
  return path.join(userDataPath, 'usage.json');
}

function loadUsageSeconds(userDataPath, { now = Date.now, staleAfterMs = USAGE_STALE_AFTER_MS } = {}) {
  try {
    const entry = JSON.parse(fs.readFileSync(getUsagePath(userDataPath), 'utf8'));
    if (now() - Number(entry.updatedAt || 0) > staleAfterMs) {
      return 0;
    }
    return Math.max(0, Number.parseInt(entry.seconds, 10) || 0);
  } catch {
    return 0;
  }
}

function saveUsageSeconds(userDataPath, seconds, { now = Date.now } = {}) {
  fs.mkdirSync(userDataPath, { recursive: true });
  fs.writeFileSync(getUsagePath(userDataPath), JSON.stringify({
    seconds: Math.max(0, Number.parseInt(seconds, 10) || 0),
    updatedAt: now()
  }, null, 2));
}

module.exports = {
  getUsagePath,
  loadUsageSeconds,
  saveUsageSeconds
};
