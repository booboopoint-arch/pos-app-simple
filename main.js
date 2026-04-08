const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const fs = require('fs')

// 2重起動防止
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })

let mainWindow

// ウィンドウ状態保存ファイル
const windowStatePath = path.join(__dirname, 'window-state.json')

function loadWindowState() {
  try {
    if (fs.existsSync(windowStatePath)) {
      return JSON.parse(fs.readFileSync(windowStatePath, 'utf8'))
    }
  } catch(e) {}
  return {}
}

function saveWindowState(state) {
  try {
    fs.writeFileSync(windowStatePath, JSON.stringify(state), 'utf8')
  } catch(e) {}
}

function createWindow() {
  const state = loadWindowState()

  mainWindow = new BrowserWindow({
    width:  state.main ? state.main.width  : 1400,
    height: state.main ? state.main.height : 900,
    x:      state.main && state.main.x !== undefined ? state.main.x : undefined,
    y:      state.main && state.main.y !== undefined ? state.main.y : undefined,
    title: '八兵衛 POS',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  })
  mainWindow.loadFile('pos_menu.html')
  mainWindow.setMenuBarVisibility(false)
  if (state.main && state.main.maximized) mainWindow.maximize()

  mainWindow.on('focus', () => { mainWindow.webContents.focus() })

  function saveMainState() {
    const s = loadWindowState()
    if (mainWindow.isMaximized()) {
      s.main = Object.assign(s.main || {}, { maximized: true })
    } else {
      const b = mainWindow.getBounds()
      s.main = { x: b.x, y: b.y, width: b.width, height: b.height, maximized: false }
    }
    saveWindowState(s)
  }
  mainWindow.on('resize', saveMainState)
  mainWindow.on('move',   saveMainState)

  mainWindow.on('close', () => {
    saveMainState()
    app.quit()
  })

  ipcMain.on('save-csv', (event, { filename, csv }) => {
    const salesDir = path.join(__dirname, 'sales')
    if (!fs.existsSync(salesDir)) fs.mkdirSync(salesDir)
    const savePath = path.join(salesDir, filename)
    fs.writeFileSync(savePath, '\uFEFF' + csv, 'utf8')
    event.reply('save-csv-done', savePath)
  })

  ipcMain.on('append-csv', (event, { filename, csv, date }) => {
    const salesDir = path.join(__dirname, 'sales')
    if (!fs.existsSync(salesDir)) fs.mkdirSync(salesDir)
    const savePath = path.join(salesDir, filename)
    if (fs.existsSync(savePath)) {
      const lines = csv.split('\n').slice(1).join('\n')
      fs.appendFileSync(savePath, lines, 'utf8')
    } else {
      fs.writeFileSync(savePath, '\uFEFF' + csv, 'utf8')
    }
    event.reply('append-csv-done', savePath)
  })

  // シャットダウン
  ipcMain.on('shutdown', () => {
    const { exec } = require('child_process')
    exec('shutdown /s /t 0')
  })

  // フォルダ選択ダイアログ
  ipcMain.handle('select-folder', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
      title: 'バックアップ先フォルダを選択'
    })
    return result.canceled ? null : result.filePaths[0]
  })

  // バックアップ保存
  ipcMain.handle('save-backup', async (event, { folderPath, filename, json }) => {
    try {
      const savePath = path.join(folderPath, filename)
      fs.writeFileSync(savePath, json, 'utf8')
      return true
    } catch(e) { return false }
  })

  // ジャーナル随時書き込み（会計のたびに即座にファイルへ追記）
  ipcMain.on('append-journal', (event, { month, rows }) => {
    try {
      const salesDir = path.join(__dirname, 'sales')
      if (!fs.existsSync(salesDir)) fs.mkdirSync(salesDir)
      const savePath = path.join(salesDir, 'journal_' + month + '.csv')
      if (!fs.existsSync(savePath)) {
        fs.writeFileSync(savePath, '\uFEFF' + '日時,注文番号,商品名,金額,会計合計\n', 'utf8')
      }
      fs.appendFileSync(savePath, rows, 'utf8')
      event.reply('append-journal-done', savePath)
    } catch(e) {
      event.reply('append-journal-done', null)
    }
  })
}

  app.whenReady().then(createWindow)

  app.on('before-quit', () => {
    app.isQuitting = true
  })

  app.on('window-all-closed', () => {
    app.quit()
  })
}
