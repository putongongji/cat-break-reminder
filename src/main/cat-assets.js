const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const {
  DEFAULT_ASSET_SOURCES,
  CAT_ASSET_ROLES,
  CAT_ASSET_EXTENSIONS
} = require('../core/constants');
const { getAssetKind } = require('../core/settings');

const catAssetRoles = new Set(CAT_ASSET_ROLES);
const catAssetExtensions = new Set(CAT_ASSET_EXTENSIONS);

function getCatAssetDir(userDataPath) {
  return path.join(userDataPath, 'cat-assets');
}

function assertCatAssetRole(role) {
  if (!catAssetRoles.has(role)) {
    throw new Error(`Unsupported cat asset role: ${role}`);
  }
}

function isSupportedCatAssetPath(assetPath) {
  return catAssetExtensions.has(path.extname(assetPath).toLowerCase());
}

function catAssetDialogExtensions() {
  return CAT_ASSET_EXTENSIONS.map((extension) => extension.slice(1));
}

function copyCatAsset({ sourcePath, role, userDataPath }) {
  assertCatAssetRole(role);

  if (!isSupportedCatAssetPath(sourcePath)) {
    throw new Error('Unsupported file type. Use GIF, APNG, WebP, PNG, JPG, WebM, or MP4.');
  }

  const assetDir = getCatAssetDir(userDataPath);
  fs.mkdirSync(assetDir, { recursive: true });
  const destinationPath = path.join(assetDir, `cat-${role}${path.extname(sourcePath).toLowerCase()}`);
  fs.copyFileSync(sourcePath, destinationPath);
  return destinationPath;
}

function publicCatAsset({ role, assetPath }) {
  assertCatAssetRole(role);

  if (!assetPath || !fs.existsSync(assetPath)) {
    return {
      src: DEFAULT_ASSET_SOURCES[role],
      name: role === 'walk' ? 'Default walking cat' : 'Default resting cat',
      kind: 'image',
      custom: false
    };
  }

  const fileUrl = pathToFileURL(assetPath);
  try {
    fileUrl.searchParams.set('v', String(Math.round(fs.statSync(assetPath).mtimeMs)));
  } catch {
    fileUrl.searchParams.set('v', String(Date.now()));
  }

  return {
    src: fileUrl.href,
    name: path.basename(assetPath),
    kind: getAssetKind(assetPath),
    custom: true
  };
}

module.exports = {
  assertCatAssetRole,
  catAssetDialogExtensions,
  copyCatAsset,
  getCatAssetDir,
  isSupportedCatAssetPath,
  publicCatAsset
};
