const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  closeWindow: () => ipcRenderer.send('close-window'),
  quitApp: () => ipcRenderer.send('quit-app'),
  togglePin: () => ipcRenderer.send('toggle-pin'),
  setAlwaysOnTop: (flag) => ipcRenderer.send('set-always-on-top', flag),
  moveWindowBy: (dx, dy) => ipcRenderer.send('move-window-by', { dx, dy }),
  resizeToMascot: () => ipcRenderer.send('resize-to-mascot'),
  resizeToNotepad: () => ipcRenderer.send('resize-to-notepad'),
  onPinChanged: (callback) => {
    ipcRenderer.on('pin-status', (_event, value) => callback(value));
  },
});
