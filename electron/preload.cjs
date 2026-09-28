const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  resizeToMascot: () => ipcRenderer.send('resize-to-mascot'),
  resizeToNotepad: () => ipcRenderer.send('resize-to-notepad'),
  setAlwaysOnTop: (flag) => ipcRenderer.send('set-always-on-top', flag),
  setWindowOpacity: (opacity) => ipcRenderer.send('set-window-opacity', opacity),
  closeWindow: () => ipcRenderer.send('close-window'),
});
