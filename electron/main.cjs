const { app, BrowserWindow, globalShortcut, ipcMain, screen } = require('electron');
const path = require('path');

let mainWindow = null;

function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;

  // Initial notepad size
  const winWidth = 380;
  const winHeight = 520;
  // Position near bottom-right corner
  const x = Math.max(20, screenWidth - winWidth - 30);
  const y = Math.max(40, screenHeight - winHeight - 30);

  mainWindow = new BrowserWindow({
    width: winWidth,
    height: winHeight,
    x,
    y,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    hasShadow: false,
    resizable: true,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    type: 'panel',
    skipTaskbar: false,
  });

  // Keep floating on top of all macOS apps/spaces
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  mainWindow.setAlwaysOnTop(true, 'floating');

  const devUrl = 'http://localhost:5174';
  mainWindow.loadURL(devUrl).catch(() => {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  });

  // Global shortcut to show/hide notepad from anywhere
  globalShortcut.register('CommandOrControl+Shift+I', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC handler: Shrink to Mascot icon at the corner
ipcMain.on('resize-to-mascot', () => {
  if (!mainWindow) return;
  const bounds = mainWindow.getBounds();
  const mascotWidth = 92;
  const mascotHeight = 100;
  // Keep anchored to current bottom-right or current position
  mainWindow.setBounds({
    x: bounds.x + (bounds.width - mascotWidth),
    y: bounds.y + (bounds.height - mascotHeight),
    width: mascotWidth,
    height: mascotHeight,
  }, true);
});

// IPC handler: Expand to full notepad
ipcMain.on('resize-to-notepad', () => {
  if (!mainWindow) return;
  const bounds = mainWindow.getBounds();
  const notepadWidth = 380;
  const notepadHeight = 520;
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;

  let newX = bounds.x - (notepadWidth - bounds.width);
  let newY = bounds.y - (notepadHeight - bounds.height);

  // Keep within visible screen
  newX = Math.max(20, Math.min(newX, screenWidth - notepadWidth - 20));
  newY = Math.max(30, Math.min(newY, screenHeight - notepadHeight - 20));

  mainWindow.setBounds({
    x: newX,
    y: newY,
    width: notepadWidth,
    height: notepadHeight,
  }, true);
});

ipcMain.on('set-always-on-top', (event, flag) => {
  if (mainWindow) {
    mainWindow.setAlwaysOnTop(flag, 'floating');
  }
});

ipcMain.on('set-window-opacity', (event, opacity) => {
  if (mainWindow) {
    mainWindow.setOpacity(opacity);
  }
});

ipcMain.on('close-window', () => {
  if (mainWindow) mainWindow.hide();
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else if (mainWindow) {
      mainWindow.show();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
