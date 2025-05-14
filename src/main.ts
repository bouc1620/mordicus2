/// <reference types="@electron-forge/plugin-vite/forge-vite-env" />

import { app, BrowserWindow } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';

if (started) {
  app.quit();
}

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 1040, // 1500,
    height: 840,
    icon: path.join(
      __dirname,
      `../renderer/${MAIN_WINDOW_VITE_NAME}/icons/icon.ico`,
    ),
    resizable: false,
    maximizable: false,
    autoHideMenuBar: true,
    webPreferences: {
      devTools: false, // true,
    },
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }

  mainWindow.webContents.openDevTools();
  mainWindow.removeMenu();
};

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
