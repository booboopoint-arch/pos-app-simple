const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  saveCsv: (filename, csv) => {
    ipcRenderer.send('save-csv', { filename, csv })
    return new Promise(resolve => {
      ipcRenderer.once('save-csv-done', (event, savePath) => resolve(savePath))
    })
  },
  appendCsv: (filename, csv, date) => {
    ipcRenderer.send('append-csv', { filename, csv, date })
    return new Promise(resolve => {
      ipcRenderer.once('append-csv-done', (event, savePath) => resolve(savePath))
    })
  },
  appendJournal: (month, rows) => {
    ipcRenderer.send('append-journal', { month, rows })
    return new Promise(resolve => {
      ipcRenderer.once('append-journal-done', (event, savePath) => resolve(savePath))
    })
  },
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  saveBackup: (folderPath, filename, json) => ipcRenderer.invoke('save-backup', { folderPath, filename, json }),
  shutdown: () => ipcRenderer.send('shutdown')
})
