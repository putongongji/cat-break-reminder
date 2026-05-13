const assert = require('assert/strict');
const test = require('node:test');
const {
  clampNumber,
  normalizeSettings,
  normalizeCatAssetPath,
  getAssetKind
} = require('../src/core/settings');

test('clampNumber bounds numeric values and falls back for invalid input', () => {
  assert.equal(clampNumber(25, 1, 240, 30), 25);
  assert.equal(clampNumber(-5, 1, 240, 30), 1);
  assert.equal(clampNumber(999, 1, 240, 30), 240);
  assert.equal(clampNumber('bad', 1, 240, 30), 30);
});

test('normalizeSettings applies conservative defaults and ranges', () => {
  const settings = normalizeSettings({
    workMinutes: 0,
    breakSeconds: 9999,
    launchAtLogin: 1,
    showOnAllDisplays: '',
    catAssets: {
      walk: '/tmp/cat.webm',
      rest: '/tmp/cat.txt'
    }
  }, {
    fileExists: (assetPath) => assetPath === '/tmp/cat.webm'
  });

  assert.equal(settings.workMinutes, 1);
  assert.equal(settings.breakSeconds, 1800);
  assert.equal(settings.launchAtLogin, true);
  assert.equal(settings.showOnAllDisplays, false);
  assert.equal(settings.catAssets.walk, '/tmp/cat.webm');
  assert.equal(settings.catAssets.rest, null);
});

test('normalizeCatAssetPath accepts supported assets only when present', () => {
  const exists = (assetPath) => assetPath.includes('exists');

  assert.equal(normalizeCatAssetPath('/tmp/exists.gif', { fileExists: exists }), '/tmp/exists.gif');
  assert.equal(normalizeCatAssetPath('/tmp/exists.webm', { fileExists: exists }), '/tmp/exists.webm');
  assert.equal(normalizeCatAssetPath('/tmp/missing.gif', { fileExists: exists }), null);
  assert.equal(normalizeCatAssetPath('/tmp/exists.txt', { fileExists: exists }), null);
});

test('getAssetKind distinguishes video from image material', () => {
  assert.equal(getAssetKind('/tmp/cat.webm'), 'video');
  assert.equal(getAssetKind('/tmp/cat.mp4'), 'video');
  assert.equal(getAssetKind('/tmp/cat.gif'), 'image');
  assert.equal(getAssetKind('/tmp/cat.png'), 'image');
});
