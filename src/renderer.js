const appRoot = document.getElementById('app');
const params = new URLSearchParams(window.location.search);
const mode = params.get('mode') || 'app';
const DEFAULT_CAT_ASSETS = {
  walk: {
    src: './assets/orange-cat-walk-60fps.gif',
    kind: 'image',
    name: 'Default walking cat',
    custom: false
  },
  rest: {
    src: './assets/orange-cat-rest-60fps.gif',
    kind: 'image',
    name: 'Default resting cat',
    custom: false
  }
};
const WALK_ENTRY_MS = 3000;

let currentState = null;
let unlistenState = null;
let overlayResting = false;
let overlayRestTimer = null;

function formatSeconds(totalSeconds) {
  const safe = Math.max(0, Number(totalSeconds) || 0);
  const minutes = Math.floor(safe / 60);
  const seconds = String(safe % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function formatDuration(seconds) {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return rest ? `${minutes}m ${rest}s` : `${minutes}m`;
}

function catMarkup(size = 'large') {
  const hostId = size === 'overlay' ? 'overlayCatHost' : 'miniCatHost';
  return `
    <div class="cat-media-host cat-media-host-${size}" id="${hostId}">
      ${catMediaMarkup(DEFAULT_CAT_ASSETS[size === 'overlay' ? 'walk' : 'rest'], size)}
    </div>
  `;
}

function catMediaMarkup(asset, size, { resting = false } = {}) {
  const className = `cat-media cat-media-${size}${resting ? ' is-resting-media' : ''}`;
  const source = escapeAttr(asset.src);
  const label = size === 'overlay'
    ? resting ? 'Animated cat lying down' : 'Animated cat walking'
    : 'Animated resting cat';

  if (asset.kind === 'video') {
    return `
      <video
        class="${className}"
        src="${source}"
        muted
        playsinline
        ${resting ? 'loop' : ''}
        autoplay
      ></video>
    `;
  }

  return `
    <img
      class="${className}"
      src="${source}"
      alt="${escapeAttr(label)}"
      draggable="false"
    />
  `;
}

function escapeAttr(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function renderMainShell() {
  document.body.className = 'app-body';
  appRoot.innerHTML = `
    <section class="panel">
      <header class="hero">
        <div class="mini-cat-wrap">${catMarkup('mini')}</div>
        <div>
          <p class="eyebrow">Cat Break Reminder</p>
          <h1>Take a real break</h1>
        </div>
      </header>

      <section class="timer-card" aria-live="polite">
        <div class="timer-ring" id="timerRing">
          <span id="timerValue">25:00</span>
        </div>
        <p id="timerLabel" class="timer-label">Next orange cat visit</p>
      </section>

      <section class="button-row">
        <button class="primary" id="toggleButton" type="button">Pause</button>
        <button class="secondary" id="resetButton" type="button">Reset</button>
        <button class="secondary" id="testButton" type="button">Test</button>
      </section>

      <section class="settings">
        <h2>Settings</h2>
        <label class="field">
          <span>Work interval</span>
          <div class="number-field">
            <input id="workMinutes" type="number" min="1" max="240" step="1" />
            <span>min</span>
          </div>
        </label>
        <label class="field">
          <span>Cat rest time</span>
          <div class="number-field">
            <input id="breakSeconds" type="number" min="10" max="1800" step="5" />
            <span>sec</span>
          </div>
        </label>
        <label class="switch-row">
          <input id="showOnAllDisplays" type="checkbox" />
          <span>Show on every display</span>
        </label>
        <label class="switch-row">
          <input id="launchAtLogin" type="checkbox" />
          <span>Launch when computer starts</span>
        </label>
        <div class="asset-panel">
          <div class="asset-row">
            <div>
              <span>Walking cat</span>
              <small id="walkAssetName">Default walking cat</small>
            </div>
            <div class="asset-actions">
              <button class="secondary small-button" id="importWalkButton" type="button">Choose</button>
              <button class="ghost small-button" id="resetWalkButton" type="button">Reset</button>
            </div>
          </div>
          <div class="asset-row">
            <div>
              <span>Resting cat</span>
              <small id="restAssetName">Default resting cat</small>
            </div>
            <div class="asset-actions">
              <button class="secondary small-button" id="importRestButton" type="button">Choose</button>
              <button class="ghost small-button" id="resetRestButton" type="button">Reset</button>
            </div>
          </div>
        </div>
      </section>
    </section>
  `;

  document.getElementById('toggleButton').addEventListener('click', async () => {
    if (currentState?.running) {
      currentState = await window.catBreak.pause();
    } else {
      currentState = await window.catBreak.resume();
    }
    updateMain(currentState);
  });

  document.getElementById('resetButton').addEventListener('click', async () => {
    currentState = await window.catBreak.reset();
    updateMain(currentState);
  });

  document.getElementById('testButton').addEventListener('click', async () => {
    currentState = await window.catBreak.test();
    updateMain(currentState);
  });

  document.getElementById('importWalkButton').addEventListener('click', async () => {
    currentState = await window.catBreak.importCatAsset('walk');
    updateMain(currentState);
  });

  document.getElementById('importRestButton').addEventListener('click', async () => {
    currentState = await window.catBreak.importCatAsset('rest');
    updateMain(currentState);
  });

  document.getElementById('resetWalkButton').addEventListener('click', async () => {
    currentState = await window.catBreak.resetCatAsset('walk');
    updateMain(currentState);
  });

  document.getElementById('resetRestButton').addEventListener('click', async () => {
    currentState = await window.catBreak.resetCatAsset('rest');
    updateMain(currentState);
  });

  for (const id of ['workMinutes', 'breakSeconds']) {
    document.getElementById(id).addEventListener('change', saveSettingsFromForm);
  }

  for (const id of ['showOnAllDisplays', 'launchAtLogin']) {
    document.getElementById(id).addEventListener('change', saveSettingsFromForm);
  }
}

async function saveSettingsFromForm() {
  const workMinutes = Number(document.getElementById('workMinutes').value);
  const breakSeconds = Number(document.getElementById('breakSeconds').value);
  const showOnAllDisplays = document.getElementById('showOnAllDisplays').checked;
  const launchAtLogin = document.getElementById('launchAtLogin').checked;

  currentState = await window.catBreak.updateSettings({
    workMinutes,
    breakSeconds,
    showOnAllDisplays,
    launchAtLogin
  });
  updateMain(currentState);
}

function updateMain(state) {
  if (!state || mode !== 'app') return;

  const timerValue = document.getElementById('timerValue');
  const timerLabel = document.getElementById('timerLabel');
  const toggleButton = document.getElementById('toggleButton');
  const timerRing = document.getElementById('timerRing');
  const workMinutes = document.getElementById('workMinutes');
  const breakSeconds = document.getElementById('breakSeconds');
  const showOnAllDisplays = document.getElementById('showOnAllDisplays');
  const launchAtLogin = document.getElementById('launchAtLogin');
  const walkAssetName = document.getElementById('walkAssetName');
  const restAssetName = document.getElementById('restAssetName');
  const resetWalkButton = document.getElementById('resetWalkButton');
  const resetRestButton = document.getElementById('resetRestButton');

  const workTotalSeconds = state.settings.workMinutes * 60;
  const secondsLeft = state.inBreak ? state.breakSecondsLeft : state.secondsUntilReminder;
  const progress = state.inBreak
    ? 1 - state.breakSecondsLeft / Math.max(1, state.settings.breakSeconds)
    : 1 - state.secondsUntilReminder / Math.max(1, workTotalSeconds);

  timerValue.textContent = state.running
    ? formatSeconds(secondsLeft)
    : 'Paused';
  timerLabel.textContent = state.inBreak
    ? `Cat is resting for ${formatDuration(state.breakSecondsLeft)}`
    : state.running
      ? state.isIdle ? 'Timer paused while you are away' : 'Active time until cat visit'
      : 'Timer paused';
  toggleButton.textContent = state.running ? 'Pause' : 'Resume';
  timerRing.style.setProperty('--progress', `${Math.max(0, Math.min(1, progress)) * 360}deg`);

  if (document.activeElement !== workMinutes) {
    workMinutes.value = state.settings.workMinutes;
  }
  if (document.activeElement !== breakSeconds) {
    breakSeconds.value = state.settings.breakSeconds;
  }
  showOnAllDisplays.checked = state.settings.showOnAllDisplays;
  launchAtLogin.checked = state.settings.launchAtLogin;
  walkAssetName.textContent = state.catAssets.walk.name;
  restAssetName.textContent = state.catAssets.rest.name;
  resetWalkButton.disabled = !state.catAssets.walk.custom;
  resetRestButton.disabled = !state.catAssets.rest.custom;
  applyMainCatAssets(state);
}

function renderOverlayShell() {
  document.body.className = 'overlay-body';
  overlayResting = false;
  clearOverlayRestTimer();
  appRoot.innerHTML = `
    <section class="overlay">
      <div class="overlay-shade"></div>
      <button class="dismiss-button" id="dismissButton" type="button" aria-label="Dismiss break reminder">Skip</button>
      <div class="break-copy">
        <p>Step away for a moment</p>
        <strong id="breakCounter">1:15</strong>
      </div>
      <div class="cat-stage" id="catStage">
        ${catMarkup('overlay')}
      </div>
    </section>
  `;

  document.getElementById('dismissButton').addEventListener('click', () => {
    window.catBreak.dismissBreak();
  });

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      window.catBreak.dismissBreak();
    }
  });
}

function updateOverlay(state) {
  if (!state || mode !== 'overlay') return;
  const counter = document.getElementById('breakCounter');
  if (counter) counter.textContent = formatSeconds(state.breakSecondsLeft);
  applyOverlayCatAssets(state);
}

function applyMainCatAssets(state) {
  const host = document.getElementById('miniCatHost');
  if (!host) return;
  renderCatMedia(host, state.catAssets.rest, 'mini', { resting: true });
}

function applyOverlayCatAssets(state) {
  const host = document.getElementById('overlayCatHost');
  if (!host) return;
  const asset = overlayResting ? state.catAssets.rest : state.catAssets.walk;
  const media = renderCatMedia(host, asset, 'overlay', {
    resting: overlayResting
  });

  if (!overlayResting && media?.tagName === 'VIDEO') {
    clearOverlayRestTimer();
    if (media.dataset.restListenerAttached !== 'true') {
      media.dataset.restListenerAttached = 'true';
      media.addEventListener('ended', switchOverlayToResting, { once: true });
    }
  } else if (!overlayResting) {
    scheduleOverlayRestSwitch();
  }
}

function renderCatMedia(host, asset, size, options = {}) {
  if (!asset?.src) return null;
  const kind = asset.kind || 'image';
  const resting = Boolean(options.resting);
  const stateKey = `${kind}:${asset.src}:${resting}`;

  if (host.dataset.mediaState !== stateKey) {
    host.dataset.mediaState = stateKey;
    host.innerHTML = catMediaMarkup({ ...asset, kind }, size, { resting });
    const media = host.querySelector('.cat-media');
    if (media?.tagName === 'VIDEO') {
      media.muted = true;
      media.playsInline = true;
      media.play().catch(() => {});
    }
    return media;
  }

  return host.querySelector('.cat-media');
}

function switchOverlayToResting() {
  if (overlayResting) return;
  clearOverlayRestTimer();
  overlayResting = true;
  document.getElementById('catStage')?.classList.add('is-resting');

  if (currentState) {
    applyOverlayCatAssets(currentState);
  }
}

function scheduleOverlayRestSwitch() {
  if (overlayRestTimer) return;
  overlayRestTimer = window.setTimeout(() => {
    overlayRestTimer = null;
    switchOverlayToResting();
  }, WALK_ENTRY_MS);
}

function clearOverlayRestTimer() {
  if (!overlayRestTimer) return;
  window.clearTimeout(overlayRestTimer);
  overlayRestTimer = null;
}

async function boot() {
  if (mode === 'overlay') {
    renderOverlayShell();
  } else {
    renderMainShell();
  }

  currentState = await window.catBreak.getState();
  if (mode === 'overlay') {
    updateOverlay(currentState);
  } else {
    updateMain(currentState);
  }

  unlistenState = window.catBreak.onState((nextState) => {
    currentState = nextState;
    if (mode === 'overlay') {
      updateOverlay(nextState);
    } else {
      updateMain(nextState);
    }
  });
}

window.addEventListener('beforeunload', () => {
  if (unlistenState) unlistenState();
});

boot();
