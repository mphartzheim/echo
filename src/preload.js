const { contextBridge, ipcRenderer } = require('electron');

console.log("Preload script loaded (CommonJS).");

contextBridge.exposeInMainWorld('api', {
  fetchWeather: (lat, lon) => ipcRenderer.invoke('fetch-weather', lat, lon),
  fetchAlerts: (lat, lon) => ipcRenderer.invoke('fetch-alerts', lat, lon),
  loadFavorites: () => ipcRenderer.invoke('load-favorites'),
  saveFavorites: (favorites) => ipcRenderer.invoke('save-favorites', favorites)
});
