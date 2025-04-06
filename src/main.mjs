import { app, BrowserWindow, ipcMain } from 'electron';
import axios from 'axios';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';
import { fileURLToPath } from 'url';

// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getFavoritesPath() {
  // Use a folder in the user's home directory for cross-platform storage.
  const folder = path.join(os.homedir(), '.echo-location-wx');
  // Create the folder if it doesn't exist
  fs.mkdir(folder, { recursive: true }).catch(console.error);
  return path.join(folder, 'favorites.json');
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 1024,
    minWidth: 1280,
    minHeight: 1024,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  win.loadFile(path.join(__dirname, 'index.html'));
}

// IPC handler for fetching weather forecast
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

// IPC handler for fetching active alerts
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

// IPC handler for loading favorites
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

// IPC handler for saving favorites
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

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
