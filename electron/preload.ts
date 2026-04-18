import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  getDbStatus: () => ipcRenderer.invoke('get-db-status'),
})
