import { app, BrowserWindow, ipcMain, Tray, Menu, screen } from 'electron';
import axios from 'axios';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';
import { fileURLToPath } from 'url';

// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let tray = null;
let mainWindow = null;
let isQuiting = false;

function getFavoritesPath() {
  const folder = path.join(os.homedir(), '.echo-location-wx');
  fs.mkdir(folder, { recursive: true }).catch(console.error);
  return path.join(folder, 'favorites.json');
}

function createWindow() {
  // Set up window options without hardcoding x and y yet
  let windowOptions = {
    width: 1280,
    height: 1024,
    minWidth: 1280,
    minHeight: 1024,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  };

  // Get the primary display
  const primaryDisplay = screen.getPrimaryDisplay();
  const { x, y, width, height } = primaryDisplay.workArea;

  // Calculate center position based on primary display work area
  windowOptions.x = x + Math.floor((width - windowOptions.width) / 2);
  windowOptions.y = y + Math.floor((height - windowOptions.height) / 2);

  // Create the main window with computed options
  mainWindow = new BrowserWindow(windowOptions);

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Handle minimize-to-tray
  mainWindow.on('minimize', (event) => {
    event.preventDefault();
    mainWindow.hide();
  });

  // Set up tray icon and menu
  const iconPath = path.join(__dirname, '../assets/icons/Grimace28.png');
  tray = new Tray(iconPath);
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show App',
      click: () => {
        mainWindow.show();
      }
    },
    {
      label: 'Quit',
      click: () => {
        isQuiting = true;
        app.quit();
      }
    }
  ]);
  tray.setToolTip('Echo Location WX');
  tray.setContextMenu(contextMenu);

  tray.on('double-click', () => {
    mainWindow.show();
  });
}

// IPC handlers (unchanged)
ipcMain.handle('fetch-weather', async (event, lat, lon) => {
  try {
    const pointUrl = `https://api.weather.gov/points/${lat},${lon}`;
    const pointResponse = await axios.get(pointUrl);
    const forecastUrl = pointResponse.data.properties.forecast;
    const forecastResponse = await axios.get(forecastUrl);
    return forecastResponse.data.properties.periods;
  } catch (error) {
    console.error('Error fetching forecast:', error);
    return [];
  }
});

ipcMain.handle('fetch-alerts', async (event, lat, lon) => {
  try {
    const alertsUrl = `https://api.weather.gov/alerts/active?point=${lat},${lon}`;
    const alertsResponse = await axios.get(alertsUrl);
    return alertsResponse.data.features;
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return [];
  }
});

ipcMain.handle('load-favorites', async () => {
  const filePath = getFavoritesPath();
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error("Error loading favorites:", err);
    return [];
  }
});

ipcMain.handle('save-favorites', async (event, favorites) => {
  const filePath = getFavoritesPath();
  try {
    await fs.writeFile(filePath, JSON.stringify(favorites, null, 2), 'utf8');
    return { status: "success" };
  } catch (err) {
    console.error("Error saving favorites:", err);
    return { status: "error", error: err.message };
  }
});

// App lifecycle
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('before-quit', () => {
  isQuiting = true;
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
