const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('catBreak', {
  getState: () => ipcRenderer.invoke('app:getState'),
  pause: () => ipcRenderer.invoke('timer:pause'),
  resume: () => ipcRenderer.invoke('timer:resume'),
  reset: () => ipcRenderer.invoke('timer:reset'),
  test: () => ipcRenderer.invoke('timer:test'),
  hideWindow: () => ipcRenderer.invoke('window:hide'),
  quit: () => ipcRenderer.invoke('app:quit'),
  dismissBreak: () => ipcRenderer.invoke('break:dismiss'),
  updateSettings: (settings) => ipcRenderer.invoke('settings:update', settings),
  importCatAsset: (role) => ipcRenderer.invoke('asset:importCat', role),
  resetCatAsset: (role) => ipcRenderer.invoke('asset:resetCat', role),
  onState: (callback) => {
    const listener = (_event, state) => callback(state);
    ipcRenderer.on('app:state', listener);
    return () => ipcRenderer.removeListener('app:state', listener);
  },
  onBreakClosed: (callback) => {
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on('break:closed', listener);
    return () => ipcRenderer.removeListener('break:closed', listener);
  }
});
