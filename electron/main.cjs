const { app, BrowserWindow, globalShortcut, ipcMain, screen } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow = null;
let isPinned = true;

const NOTEPAD_WIDTH = 380;
const NOTEPAD_HEIGHT = 580;
const MASCOT_WIDTH = 96;
const MASCOT_HEIGHT = 100;

function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;

  // Center window on screen initially
  const x = Math.round((screenWidth - NOTEPAD_WIDTH) / 2);
  const y = Math.round((screenHeight - NOTEPAD_HEIGHT) / 2);

  mainWindow = new BrowserWindow({
    width: NOTEPAD_WIDTH,
    height: NOTEPAD_HEIGHT,
    minWidth: 320,
    minHeight: 420,
    maxWidth: 750,
    maxHeight: 1100,
    x,
    y,
    center: true,
    frame: false,
    transparent: true,
    hasShadow: true,
    resizable: true,
    show: true,
    alwaysOnTop: isPinned,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (isPinned) {
    mainWindow.setAlwaysOnTop(true, 'floating');
    try {
      mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    } catch {}
  }

  // Load production dist or local dev server
  const distIndex = path.join(__dirname, '../dist/index.html');
  const distExists = fs.existsSync(distIndex);

  if (distExists && process.env.VITE_DEV !== 'true') {
    mainWindow.loadFile(distIndex);
  } else {
    mainWindow.loadURL('http://localhost:5173').catch(() => {
      if (distExists) {
        mainWindow.loadFile(distIndex);
      }
    });
  }

  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.show();
    mainWindow.focus();
    app.focus({ steal: true });
  });

  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
    console.error('[IdeaNoter] Failed to load page:', errorCode, errorDescription);
  });

  // Global toggle shortcut: ⌘+Shift+I
  try {
    globalShortcut.register('CommandOrControl+Shift+I', () => {
      if (!mainWindow) return;
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        if (mainWindow.isMinimized()) {
          mainWindow.restore();
        }
        mainWindow.show();
        mainWindow.focus();
        mainWindow.webContents.send('expand-notepad');
      }
    });
  } catch (err) {
    console.error('Shortcut register error:', err);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Window control IPC
ipcMain.on('minimize-window', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('close-window', () => {
  if (mainWindow) mainWindow.close();
});

ipcMain.on('quit-app', () => {
  app.quit();
});

ipcMain.on('toggle-pin', () => {
  if (!mainWindow) return;
  isPinned = !isPinned;
  mainWindow.setAlwaysOnTop(isPinned, isPinned ? 'floating' : 'normal');
  mainWindow.webContents.send('pin-status', isPinned);
});

ipcMain.on('set-always-on-top', (_event, flag) => {
  if (!mainWindow) return;
  isPinned = flag;
  mainWindow.setAlwaysOnTop(isPinned, isPinned ? 'floating' : 'normal');
  mainWindow.webContents.send('pin-status', isPinned);
});

ipcMain.on('move-window-by', (_event, { dx, dy }) => {
  if (!mainWindow) return;
  const [curX, curY] = mainWindow.getPosition();
  mainWindow.setPosition(curX + dx, curY + dy);
});

ipcMain.on('resize-to-mascot', () => {
  if (!mainWindow) return;
  mainWindow.setResizable(true);
  mainWindow.setMinimumSize(80, 80);
  mainWindow.setSize(MASCOT_WIDTH, MASCOT_HEIGHT, true);
});

ipcMain.on('resize-to-notepad', () => {
  if (!mainWindow) return;
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
  const [curX, curY] = mainWindow.getPosition();

  // Keep expanded window fully visible within display boundaries
  const newX = Math.max(10, Math.min(curX, screenWidth - NOTEPAD_WIDTH - 15));
  const newY = Math.max(30, Math.min(curY, screenHeight - NOTEPAD_HEIGHT - 15));

  mainWindow.setMinimumSize(320, 420);
  mainWindow.setPosition(newX, newY, true);
  mainWindow.setSize(NOTEPAD_WIDTH, NOTEPAD_HEIGHT, true);
  mainWindow.show();
  mainWindow.focus();
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }
      mainWindow.show();
      mainWindow.focus();
      mainWindow.webContents.send('expand-notepad');
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
