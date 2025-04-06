import { app, BrowserWindow } from 'electron'
import path from 'path'

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 1024,
    webPreferences: {
      nodeIntegration: true,  // Allow Node.js in the renderer
      contextIsolation: false,  // Disable isolation for simplicity
    }
  })

  win.loadFile('src/index.html')  // Load index.html
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
