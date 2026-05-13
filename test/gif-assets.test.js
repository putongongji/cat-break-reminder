const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const test = require('node:test');
const { summarizeGifTiming } = require('../src/core/gif');

const assetDir = path.join(__dirname, '..', 'src', 'assets');

test('default walking GIF is transparent and averages 60fps', () => {
  const summary = summarizeGifTiming(fs.readFileSync(path.join(assetDir, 'orange-cat-walk-60fps.gif')));

  assert.equal(summary.frames, 60);
  assert.equal(summary.totalCentiseconds, 100);
  assert.equal(summary.averageFps, 60);
  assert.equal(summary.transparentFrames, 60);
});

test('default resting GIF is transparent and averages 60fps', () => {
  const summary = summarizeGifTiming(fs.readFileSync(path.join(assetDir, 'orange-cat-rest-60fps.gif')));

  assert.equal(summary.frames, 120);
  assert.equal(summary.totalCentiseconds, 200);
  assert.equal(summary.averageFps, 60);
  assert.equal(summary.transparentFrames, 120);
});
