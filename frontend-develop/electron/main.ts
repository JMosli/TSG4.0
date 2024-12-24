import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

function createWindow() {
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const mainWindow = new BrowserWindow({
        width: 1920,
        height: 1080,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true,
            contextIsolation: false,
        },
        resizable: false
    });

    if (process.env.NODE_ENV === 'development') {
        mainWindow.loadURL('http://localhost:3001');
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});
