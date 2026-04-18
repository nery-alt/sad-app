import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'
import fs from 'fs'

// Usando require para garantir o carregamento correto do módulo nativo
const Database = require('better-sqlite3')

let mainWindow: BrowserWindow | null = null
let db: any = null
const dbPath = path.join(app.getPath('userData'), 'sad_database.db')

function initDatabase() {
  try {
    db = new Database(dbPath)
    console.log('Database initialized at:', dbPath)

    // Garantir que as tabelas existam
    db.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
      );
      
      CREATE TABLE IF NOT EXISTS pessoas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        cpf TEXT,
        telefone TEXT,
        endereco TEXT,
        email TEXT,
        orgao TEXT,
        observacoes TEXT,
        criado_em TEXT,
        atualizado_em TEXT
      );
    `)
  } catch (err) {
    console.error('Failed to initialize database:', err)
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(() => {
  initDatabase()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// IPC Handlers
ipcMain.handle('get-db-status', () => {
  return db ? 'Connected (better-sqlite3)' : 'Disconnected'
})

ipcMain.handle('db-query', async (event, { sql, params = [] }) => {
  try {
    const stmt = db.prepare(sql)
    const results = stmt.all(params)
    return { success: true, data: results }
  } catch (error: any) {
    console.error('DB Query Error:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('db-run', async (event, { sql, params = [] }) => {
  try {
    const stmt = db.prepare(sql)
    stmt.run(params)
    return { success: true }
  } catch (error: any) {
    console.error('DB Run Error:', error)
    return { success: false, error: error.message }
  }
})
