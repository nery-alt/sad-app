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
      db.run(`
        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value TEXT
        );
      `)
      saveDatabase()
      console.log('New database created at:', dbPath)
    }
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

ipcMain.handle('get-db-status', () => {
  return db ? 'Connected (sql.js)' : 'Disconnected'
})
