import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  getDbStatus: () => ipcRenderer.invoke('get-db-status'),
  dbQuery: (payload: { sql: string, params?: any[] }) => ipcRenderer.invoke('db-query', payload),
  dbRun: (payload: { sql: string, params?: any[] }) => ipcRenderer.invoke('db-run', payload),
  selectFile: () => ipcRenderer.invoke('select-file'),
  saveFileDialog: (payload: { defaultName: string, extensions: string[] }) => ipcRenderer.invoke('save-file-dialog', payload),
  writeFile: (payload: { filePath: string, buffer: ArrayBuffer }) => ipcRenderer.invoke('write-file', payload),
  generateDocx: (payload: { filePath: string, data: any, config: any }) => ipcRenderer.invoke('generate-docx', payload),
  openFile: (filePath: string) => ipcRenderer.invoke('open-file', filePath),
})
