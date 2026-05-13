const path = require('path');
const {
  DEFAULT_SETTINGS,
  CAT_ASSET_EXTENSIONS,
  VIDEO_ASSET_EXTENSIONS
} = require('./constants');

const assetExtensions = new Set(CAT_ASSET_EXTENSIONS);
const videoAssetExtensions = new Set(VIDEO_ASSET_EXTENSIONS);

function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

function normalizeSettings(next = {}, { fileExists = () => false } = {}) {
  return {
    workMinutes: clampNumber(next.workMinutes, 1, 240, DEFAULT_SETTINGS.workMinutes),
    breakSeconds: clampNumber(next.breakSeconds, 10, 1800, DEFAULT_SETTINGS.breakSeconds),
    launchAtLogin: Boolean(next.launchAtLogin),
    showOnAllDisplays: Boolean(next.showOnAllDisplays),
    catAssets: normalizeCatAssets(next.catAssets, { fileExists })
  };
}

function normalizeCatAssets(assets = {}, options = {}) {
  return {
    walk: normalizeCatAssetPath(assets.walk, options),
    rest: normalizeCatAssetPath(assets.rest, options)
  };
}

function normalizeCatAssetPath(assetPath, { fileExists = () => false } = {}) {
  if (typeof assetPath !== 'string' || assetPath.trim() === '') return null;
  const extension = path.extname(assetPath).toLowerCase();
  if (!assetExtensions.has(extension)) return null;
  return fileExists(assetPath) ? assetPath : null;
}

function getAssetKind(assetPath) {
  const extension = path.extname(assetPath || '').toLowerCase();
  return videoAssetExtensions.has(extension) ? 'video' : 'image';
}

module.exports = {
  clampNumber,
  normalizeSettings,
  normalizeCatAssets,
  normalizeCatAssetPath,
  getAssetKind
};
