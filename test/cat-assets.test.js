const assert = require('assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const test = require('node:test');
const {
  catAssetDialogExtensions,
  copyCatAsset,
  isSupportedCatAssetPath,
  publicCatAsset
} = require('../src/main/cat-assets');

function tempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'cat-break-assets-'));
}

test('cat asset extension list supports transparent video and image material', () => {
  assert.equal(isSupportedCatAssetPath('/tmp/cat.webm'), true);
  assert.equal(isSupportedCatAssetPath('/tmp/cat.gif'), true);
  assert.equal(isSupportedCatAssetPath('/tmp/cat.txt'), false);
  assert.ok(catAssetDialogExtensions().includes('webm'));
});

test('copyCatAsset stores selected material in app data', () => {
  const dir = tempDir();
  const source = path.join(dir, 'source.webm');
  fs.writeFileSync(source, 'fake media');

  const copied = copyCatAsset({
    sourcePath: source,
    role: 'walk',
    userDataPath: dir
  });

  assert.equal(path.basename(copied), 'cat-walk.webm');
  assert.equal(fs.readFileSync(copied, 'utf8'), 'fake media');
});

test('publicCatAsset returns default and custom metadata', () => {
  const dir = tempDir();
  const source = path.join(dir, 'rest.webm');
  fs.writeFileSync(source, 'fake media');

  const fallback = publicCatAsset({ role: 'walk', assetPath: null });
  const custom = publicCatAsset({ role: 'rest', assetPath: source });

  assert.equal(fallback.custom, false);
  assert.equal(fallback.kind, 'image');
  assert.equal(custom.custom, true);
  assert.equal(custom.kind, 'video');
  assert.equal(custom.name, 'rest.webm');
  assert.equal(custom.src.startsWith('file://'), true);
});
