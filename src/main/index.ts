import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { autoUpdater } from 'electron-updater'
import icon from '../../resources/icon.png?asset'

function createWindow(): BrowserWindow {
  const mainWindow = new BrowserWindow({
    width: 600,
    height: 600,
    minWidth: 600,
    minHeight: 600,
    resizable: false,
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
    e.preventDefault()
    mainWindow.webContents
      .executeJavaScript("localStorage.removeItem('lmts-auth')")
      .catch(() => {})
      .finally(() => mainWindow.destroy())
  })

  ipcMain.on('window-maximize', () => {
    mainWindow.setResizable(true)
    mainWindow.setMinimumSize(1100, 650)
    mainWindow.maximize()
  })

  ipcMain.on('window-restore-login', () => {
    mainWindow.unmaximize()
    mainWindow.setResizable(false)
    mainWindow.setMinimumSize(600, 600)
    mainWindow.setSize(600, 600)
    mainWindow.center()
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
  })

  // Check for updates 5 seconds after launch (only in packaged app)
  if (app.isPackaged) {
    setTimeout(() => autoUpdater.checkForUpdates(), 5000)
  }
}

ipcMain.on('install-update', () => {
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
