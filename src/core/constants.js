const DEFAULT_SETTINGS = Object.freeze({
  workMinutes: 25,
  breakSeconds: 75,
  launchAtLogin: false,
  showOnAllDisplays: true,
  catAssets: {
    walk: null,
    rest: null
  }
});

const DEFAULT_ASSET_SOURCES = Object.freeze({
  walk: './assets/orange-cat-walk-60fps.gif',
  rest: './assets/orange-cat-rest-60fps.gif'
});

const CAT_ASSET_ROLES = Object.freeze(['walk', 'rest']);
const CAT_ASSET_EXTENSIONS = Object.freeze([
  '.gif',
  '.png',
  '.apng',
  '.webp',
  '.jpg',
  '.jpeg',
  '.webm',
  '.mp4',
  '.m4v',
  '.ogv',
  '.ogg'
]);
const VIDEO_ASSET_EXTENSIONS = Object.freeze(['.webm', '.mp4', '.m4v', '.ogv', '.ogg']);

const USAGE_STALE_AFTER_MS = 30 * 60 * 1000;
const USAGE_SAVE_INTERVAL_SECONDS = 5;
const IDLE_IGNORE_AFTER_SECONDS = 60;

module.exports = {
  DEFAULT_SETTINGS,
  DEFAULT_ASSET_SOURCES,
  CAT_ASSET_ROLES,
  CAT_ASSET_EXTENSIONS,
  VIDEO_ASSET_EXTENSIONS,
  USAGE_STALE_AFTER_MS,
  USAGE_SAVE_INTERVAL_SECONDS,
  IDLE_IGNORE_AFTER_SECONDS
};
