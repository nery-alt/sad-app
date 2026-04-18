import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  getDbStatus: () => ipcRenderer.invoke('get-db-status'),
  dbQuery: (payload: { sql: string, params?: any[] }) => ipcRenderer.invoke('db-query', payload),
  dbRun: (payload: { sql: string, params?: any[] }) => ipcRenderer.invoke('db-run', payload),
  selectFile: () => ipcRenderer.invoke('select-file'),
  openFile: (filePath: string) => ipcRenderer.invoke('open-file', filePath),
})
