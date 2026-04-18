import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'
import fs from 'fs'
import initSqlJs from 'sql.js'

let mainWindow: BrowserWindow | null = null
let db: any = null
const dbPath = path.join(app.getPath('userData'), 'sad_database.sqlite')

async function initDatabase() {
  try {
    const SQL = await initSqlJs()
    
    if (fs.existsSync(dbPath)) {
      const fileBuffer = fs.readFileSync(dbPath)
      db = new SQL.Database(fileBuffer)
      console.log('Database loaded from:', dbPath)
    } else {
      db = new SQL.Database()
      console.log('New database created')
    }

    // Garantir que as tabelas existam
    db.run(`
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
    saveDatabase()
  } catch (err) {
    console.error('Failed to initialize database:', err)
  }
}

function saveDatabase() {
  if (db) {
    const data = db.export()
    const buffer = Buffer.from(data)
    fs.writeFileSync(dbPath, buffer)
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

app.whenReady().then(async () => {
  await initDatabase()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  saveDatabase()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// IPC Handlers
ipcMain.handle('get-db-status', () => {
  return db ? 'Connected (sql.js)' : 'Disconnected'
})

ipcMain.handle('db-query', async (event, { sql, params = [] }) => {
  try {
    const stmt = db.prepare(sql)
    stmt.bind(params)
    const results = []
    while (stmt.step()) {
      results.push(stmt.getAsObject())
    }
    stmt.free()
    return { success: true, data: results }
  } catch (error: any) {
    console.error('DB Query Error:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('db-run', async (event, { sql, params = [] }) => {
  try {
    db.run(sql, params)
    saveDatabase()
    return { success: true }
  } catch (error: any) {
    console.error('DB Run Error:', error)
    return { success: false, error: error.message }
  }
})
