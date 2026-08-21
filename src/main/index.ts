import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { autoUpdater } from 'electron-updater'
import icon from '../../resources/icon.png?asset'

// Set right before quitAndInstall() so the window-close interception below
// steps aside — quitAndInstall needs the app to exit promptly so the NSIS
// installer can replace the running app's files; delaying that close with
// our own async cleanup was silently starving the installer handoff, which
// is why "downloaded" updates weren't actually landing after restart.
let isInstallingUpdate = false

function createWindow(): BrowserWindow {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    resizable: true,
    center: true,
    show: false,
    autoHideMenuBar: true,
    titleBarStyle: 'default',
    title: 'LMTS - Laoag Legislative Management & Tracking System',
    icon,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      webSecurity: false
    }
  })
  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools()
  }
  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.on('close', (e) => {
    if (isInstallingUpdate) return
    e.preventDefault()
    mainWindow.webContents
      .executeJavaScript("localStorage.removeItem('lmts-auth')")
      .catch(() => {})
      .finally(() => mainWindow.destroy())
  })

  ipcMain.on('window-maximize', () => {
    mainWindow.maximize()
  })

  ipcMain.on('window-restore-login', () => {
    mainWindow.unmaximize()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return mainWindow
}

function setupAutoUpdater(mainWindow: BrowserWindow): void {
  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('update-available', (info) => {
    mainWindow.webContents.send('update-available', info.version)
  })

  autoUpdater.on('update-downloaded', () => {
    mainWindow.webContents.send('update-downloaded')
  })

  autoUpdater.on('error', (err) => {
    console.error('[AutoUpdater]', err.message)
    mainWindow.webContents.send('update-error', err.message)
  })

  // Check for updates 5 seconds after launch (only in packaged app)
  if (app.isPackaged) {
    setTimeout(() => autoUpdater.checkForUpdates(), 5000)
  }
}

ipcMain.on('install-update', () => {
  isInstallingUpdate = true
  autoUpdater.quitAndInstall()
})

app.whenReady().then(() => {
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.laoag.lmts')
  }

  ipcMain.on('ping', () => console.log('pong'))

  const win = createWindow()
  setupAutoUpdater(win)

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
