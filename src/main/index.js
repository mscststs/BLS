import { app, BrowserWindow, Menu, ipcMain } from 'electron'
import { fork } from 'child_process';
import eve from "../tools/events.js";


/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
}

let mainWindow
const winURL = process.env.NODE_ENV === 'development'
  ? `http://localhost:9080`
  : `file://${__dirname}/index.html`

function createWindow() {
  /**
   * Initial window options
   */
  Menu.setApplicationMenu(null);
  mainWindow = new BrowserWindow({
    height: 700,
    useContentSize: true,
    width: 1200,
    minWidth: 850,//最小窗口宽度
    minHeight: 400,//最小窗口高度
    fullscreenable: false,//禁止最大化
  })
  ipcMain.on("DevTools", () => {
    mainWindow.webContents.openDevTools();
  })

  mainWindow.loadURL(winURL)

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

/**
 * Auto Updater
 *
 * Uncomment the following code below and install `electron-updater` to
 * support auto updating. Code Signing with a valid certificate is required.
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-electron-builder.html#auto-updating
 */

/*
import { autoUpdater } from 'electron-updater'

autoUpdater.on('update-downloaded', () => {
  autoUpdater.quitAndInstall()
})

app.on('ready', () => {
  if (process.env.NODE_ENV === 'production') autoUpdater.checkForUpdates()
})
 */



 /* ipc与eve绑定的进程间通信中介 */
ipcMain.on("MainMessageTranslate",(event,key,...args)=>{
  eve.emit(key,...args);
});
eve.on("ipc",(key,...args)=>{
  mainWindow.webContents.send("renderMessageTranslate",key,...args);
  return false;
});

