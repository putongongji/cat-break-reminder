const { app, BrowserWindow, Tray, Menu, ipcMain, nativeImage, screen, dialog, powerMonitor } = require('electron');
const fs = require('fs');
const path = require('path');
const {
  DEFAULT_SETTINGS,
  USAGE_SAVE_INTERVAL_SECONDS,
  IDLE_IGNORE_AFTER_SECONDS
} = require('./core/constants');
const { normalizeSettings } = require('./core/settings');
const { ActiveUsageClock } = require('./core/active-usage-clock');
const {
  assertCatAssetRole,
  catAssetDialogExtensions,
  copyCatAsset,
  publicCatAsset
} = require('./main/cat-assets');
const {
  loadUsageSeconds: loadUsageSecondsFromStore,
  saveUsageSeconds: saveUsageSecondsToStore
} = require('./main/usage-store');

let mainWindow = null;
let tray = null;
let isQuitting = false;
let overlayWindows = [];
let tickTimer = null;
let settings = normalizeSettings(DEFAULT_SETTINGS);
let usageClock = new ActiveUsageClock({
  workMinutes: settings.workMinutes,
  idleIgnoreAfterSeconds: IDLE_IGNORE_AFTER_SECONDS
});
let state = {
  running: true,
  inBreak: false,
  nextReminderAt: 0,
  breakEndsAt: 0,
  lastBreakAt: 0,
  usageSeconds: 0,
  isIdle: false
};
let usageSecondsSinceSave = 0;

const gotLock = app.requestSingleInstanceLock();

if (!gotLock) {
  console.log('Another Cat Break Reminder instance is already running.');
  app.quit();
}

function getSettingsPath() {
  return path.join(app.getPath('userData'), 'settings.json');
}

function loadSettings() {
  try {
    const raw = fs.readFileSync(getSettingsPath(), 'utf8');
    settings = normalizeSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(raw) }, {
      fileExists: fs.existsSync
    });
  } catch {
    settings = normalizeSettings(DEFAULT_SETTINGS);
  }
  usageClock.updateWorkMinutes(settings.workMinutes);
}

function saveSettings() {
  fs.mkdirSync(app.getPath('userData'), { recursive: true });
  fs.writeFileSync(getSettingsPath(), JSON.stringify(settings, null, 2));
}

function loadUsageSeconds() {
  usageClock.setUsageSeconds(loadUsageSecondsFromStore(app.getPath('userData')));
  state.usageSeconds = usageClock.usageSeconds;
}

function saveUsageSeconds() {
  const snapshot = usageClock.snapshot();
  saveUsageSecondsToStore(app.getPath('userData'), snapshot.usageSeconds);
}

function resetUsageSeconds() {
  usageClock.reset();
  state.usageSeconds = usageClock.usageSeconds;
  state.isIdle = usageClock.isIdle;
  usageSecondsSinceSave = 0;
  saveUsageSeconds();
  refreshNextReminderEstimate();
}

function refreshNextReminderEstimate() {
  const snapshot = usageClock.snapshot();
  state.usageSeconds = snapshot.usageSeconds;
  state.isIdle = snapshot.isIdle;
  const secondsLeft = snapshot.secondsUntilReminder;
  state.nextReminderAt = Date.now() + secondsLeft * 1000;
}

function publicState() {
  const snapshot = usageClock.snapshot();
  return {
    ...state,
    usageSeconds: snapshot.usageSeconds,
    isIdle: snapshot.isIdle,
    settings,
    catAssets: getPublicCatAssets(),
    now: Date.now(),
    secondsUntilReminder: snapshot.secondsUntilReminder,
    breakSecondsLeft: Math.max(0, Math.ceil((state.breakEndsAt - Date.now()) / 1000))
  };
}

function getPublicCatAssets() {
  return {
    walk: publicCatAsset({ role: 'walk', assetPath: settings.catAssets?.walk }),
    rest: publicCatAsset({ role: 'rest', assetPath: settings.catAssets?.rest })
  };
}

function broadcastState() {
  const payload = publicState();
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) {
      win.webContents.send('app:state', payload);
    }
  }
  updateTrayMenu();
  createApplicationMenu();
}

function scheduleNextReminder(from = Date.now()) {
  resetUsageSeconds();
  state.nextReminderAt = from + settings.workMinutes * 60 * 1000;
  state.inBreak = false;
  state.breakEndsAt = 0;
  broadcastState();
}

function startTicking() {
  clearInterval(tickTimer);
  tickTimer = setInterval(() => {
    const snapshot = usageClock.tick({
      running: state.running,
      inBreak: state.inBreak,
      idleSeconds: powerMonitor.getSystemIdleTime()
    });

    state.usageSeconds = snapshot.usageSeconds;
    state.isIdle = snapshot.isIdle;

    if (snapshot.counted) {
      usageSecondsSinceSave += 1;
    }

    if (usageSecondsSinceSave >= USAGE_SAVE_INTERVAL_SECONDS) {
      saveUsageSeconds();
      usageSecondsSinceSave = 0;
    }

    refreshNextReminderEstimate();

    if (state.running && !state.inBreak && snapshot.shouldBreak) {
      resetUsageSeconds();
      showBreakOverlay();
    }

    broadcastState();
  }, 1000);
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 420,
    height: 820,
    minWidth: 360,
    minHeight: 680,
    show: false,
    title: 'Cat Break Reminder',
    backgroundColor: '#fff8ee',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'), {
    query: { mode: 'app' }
  });

  mainWindow.once('ready-to-show', () => {
    if (!settings.startMinimized) {
      mainWindow.show();
    }
    broadcastState();
  });

  mainWindow.on('close', (event) => {
    if (!isQuitting && settings.closeToTray) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
}

function showMainWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) {
    createMainWindow();
    return;
  }
  mainWindow.show();
  mainWindow.focus();
  broadcastState();
}

function hideMainWindow() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.hide();
  }
}

function quitApp() {
  isQuitting = true;
  saveUsageSeconds();
  app.quit();
}

function createOverlayWindow(display) {
  const bounds = display.bounds;
  const win = new BrowserWindow({
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    frame: false,
    transparent: true,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    focusable: true,
    hasShadow: false,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.setAlwaysOnTop(true, 'screen-saver');
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  win.setFullScreenable(false);

  win.loadFile(path.join(__dirname, 'index.html'), {
    query: {
      mode: 'overlay',
      duration: String(settings.breakSeconds)
    }
  });

  win.on('closed', () => {
    overlayWindows = overlayWindows.filter((item) => item !== win);
  });

  return win;
}

function showBreakOverlay() {
  if (overlayWindows.length > 0) return;

  state.inBreak = true;
  state.breakEndsAt = Date.now() + settings.breakSeconds * 1000;
  state.lastBreakAt = Date.now();

  const displays = settings.showOnAllDisplays
    ? screen.getAllDisplays()
    : [screen.getPrimaryDisplay()];

  overlayWindows = displays.map(createOverlayWindow);
  broadcastState();

  setTimeout(() => {
    if (state.inBreak && Date.now() >= state.breakEndsAt) {
      closeBreakOverlay('completed');
    }
  }, settings.breakSeconds * 1000 + 300);
}

function closeBreakOverlay(reason = 'dismissed') {
  for (const win of overlayWindows) {
    if (!win.isDestroyed()) win.close();
  }
  overlayWindows = [];

  if (state.inBreak) {
    scheduleNextReminder();
  }

  state.inBreak = false;
  state.breakEndsAt = 0;
  BrowserWindow.getAllWindows().forEach((win) => {
    if (!win.isDestroyed()) {
      win.webContents.send('break:closed', { reason });
    }
  });
  broadcastState();
}

function setRunning(running) {
  state.running = Boolean(running);
  if (state.running && !state.inBreak && state.nextReminderAt <= Date.now()) {
    scheduleNextReminder();
  }
  broadcastState();
}

function applyLoginSetting() {
  try {
    app.setLoginItemSettings({
      openAtLogin: settings.launchAtLogin,
      path: app.getPath('exe')
    });
  } catch {
    // Some development environments deny login-item changes. The setting is
    // still saved, and packaged apps can apply it with normal OS permissions.
  }
}

function assetLabel(role) {
  return role === 'walk' ? 'walking cat material' : 'resting cat material';
}

async function importCatAsset(role) {
  assertCatAssetRole(role);

  const dialogOptions = {
    title: `Choose ${assetLabel(role)}`,
    properties: ['openFile'],
    filters: [
      {
        name: 'Cat images and animations',
        extensions: catAssetDialogExtensions()
      }
    ]
  };
  const parentWindow = mainWindow && !mainWindow.isDestroyed() ? mainWindow : null;
  const result = parentWindow
    ? await dialog.showOpenDialog(parentWindow, dialogOptions)
    : await dialog.showOpenDialog(dialogOptions);

  if (result.canceled || result.filePaths.length === 0) {
    return publicState();
  }

  const destinationPath = copyCatAsset({
    sourcePath: result.filePaths[0],
    role,
    userDataPath: app.getPath('userData')
  });

  settings = normalizeSettings({
    ...settings,
    catAssets: {
      ...settings.catAssets,
      [role]: destinationPath
    }
  }, {
    fileExists: fs.existsSync
  });
  saveSettings();
  broadcastState();
  return publicState();
}

function resetCatAsset(role) {
  assertCatAssetRole(role);

  settings = normalizeSettings({
    ...settings,
    catAssets: {
      ...settings.catAssets,
      [role]: null
    }
  }, {
    fileExists: fs.existsSync
  });
  saveSettings();
  broadcastState();
  return publicState();
}

function trayIcon() {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
      <rect width="32" height="32" rx="8" fill="#f6a13a"/>
      <path d="M8 13 6 6l7 4h6l7-4-2 7c2 2 3 4 3 7 0 6-5 9-11 9S5 26 5 20c0-3 1-5 3-7Z" fill="#ffbd5b"/>
      <circle cx="12" cy="18" r="2" fill="#38200c"/>
      <circle cx="20" cy="18" r="2" fill="#38200c"/>
      <path d="M15 21h2l-1 1.4L15 21Z" fill="#7d3c16"/>
      <path d="M11 24c2 1.4 8 1.4 10 0" stroke="#7d3c16" stroke-width="1.6" fill="none" stroke-linecap="round"/>
    </svg>
  `;
  return nativeImage.createFromDataURL(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`);
}

function updateTrayMenu() {
  if (!tray) return;

  const currentState = publicState();
  const seconds = currentState.secondsUntilReminder;
  const minutes = Math.floor(seconds / 60);
  const rest = String(seconds % 60).padStart(2, '0');
  const label = state.inBreak
    ? `Break: ${currentState.breakSecondsLeft}s left`
    : state.running
      ? `Next break: ${minutes}:${rest}`
      : 'Paused';

  tray.setToolTip(`Cat Break Reminder - ${label}`);
  tray.setContextMenu(Menu.buildFromTemplate([
    { label, enabled: false },
    { type: 'separator' },
    { label: 'Show Window', click: showMainWindow },
    { label: 'Hide Window', click: hideMainWindow },
    {
      label: state.running ? 'Pause' : 'Resume',
      click: () => setRunning(!state.running)
    },
    {
      label: 'Test Reminder',
      click: showBreakOverlay
    },
    {
      label: 'Reset Timer',
      click: () => scheduleNextReminder()
    },
    { type: 'separator' },
    {
      label: 'Quit Cat Break Reminder',
      click: quitApp
    }
  ]));
}

function createTray() {
  tray = new Tray(trayIcon());
  tray.on('click', showMainWindow);
  updateTrayMenu();
}

function createApplicationMenu() {
  const template = [
    {
      label: 'Cat Break Reminder',
      submenu: [
        { label: 'Show Window', accelerator: 'CmdOrCtrl+,', click: showMainWindow },
        { label: 'Hide Window', accelerator: 'CmdOrCtrl+H', click: hideMainWindow },
        { type: 'separator' },
        {
          label: state.running ? 'Pause Timer' : 'Resume Timer',
          accelerator: 'CmdOrCtrl+P',
          click: () => setRunning(!state.running)
        },
        { label: 'Reset Timer', accelerator: 'CmdOrCtrl+R', click: () => scheduleNextReminder() },
        { label: 'Test Reminder', accelerator: 'CmdOrCtrl+T', click: showBreakOverlay },
        { type: 'separator' },
        { label: 'Quit', accelerator: 'CmdOrCtrl+Q', click: quitApp }
      ]
    }
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function registerIpc() {
  ipcMain.handle('app:getState', () => publicState());

  ipcMain.handle('timer:pause', () => {
    setRunning(false);
    return publicState();
  });

  ipcMain.handle('timer:resume', () => {
    setRunning(true);
    return publicState();
  });

  ipcMain.handle('timer:reset', () => {
    scheduleNextReminder();
    return publicState();
  });

  ipcMain.handle('timer:test', () => {
    showBreakOverlay();
    return publicState();
  });

  ipcMain.handle('window:hide', () => {
    hideMainWindow();
    return publicState();
  });

  ipcMain.handle('app:quit', () => {
    quitApp();
    return publicState();
  });

  ipcMain.handle('break:dismiss', () => {
    closeBreakOverlay('dismissed');
    return publicState();
  });

  ipcMain.handle('settings:update', (_event, partial) => {
    const previousWorkMinutes = settings.workMinutes;
    const previousLaunchAtLogin = settings.launchAtLogin;
    settings = normalizeSettings({ ...settings, ...partial }, {
      fileExists: fs.existsSync
    });
    usageClock.updateWorkMinutes(settings.workMinutes);
    saveSettings();
    if (previousLaunchAtLogin !== settings.launchAtLogin) {
      applyLoginSetting();
    }

    if (previousWorkMinutes !== settings.workMinutes && !state.inBreak) {
      scheduleNextReminder();
    }

    broadcastState();
    return publicState();
  });

  ipcMain.handle('asset:importCat', (_event, role) => importCatAsset(role));

  ipcMain.handle('asset:resetCat', (_event, role) => resetCatAsset(role));
}

app.on('second-instance', showMainWindow);

app.whenReady().then(() => {
  loadSettings();
  loadUsageSeconds();
  refreshNextReminderEstimate();
  registerIpc();
  if (settings.launchAtLogin) {
    applyLoginSetting();
  }
  createTray();
  createApplicationMenu();
  createMainWindow();
  startTicking();
});

app.on('activate', showMainWindow);

app.on('before-quit', () => {
  isQuitting = true;
  saveUsageSeconds();
});

app.on('window-all-closed', () => {
  // Keep the timer alive in the tray/menu bar after the main window is closed.
});
