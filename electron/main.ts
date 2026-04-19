import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron'
import path from 'path'
import fs from 'fs'
import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel } from 'docx'

const Database = require('better-sqlite3')

let mainWindow: BrowserWindow | null = null
let db: any = null
const dbPath = path.join(app.getPath('userData'), 'sad_database.db')

function initDatabase() {
  try {
    db = new Database(dbPath)
    console.log('Database initialized at:', dbPath)

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

      CREATE TABLE IF NOT EXISTS protocolos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pessoa_id INTEGER,
        numero TEXT NOT NULL,
        assunto TEXT NOT NULL,
        descricao TEXT,
        data_entrada TEXT,
        prazo TEXT,
        status TEXT,
        historico TEXT,
        criado_em TEXT,
        atualizado_em TEXT,
        FOREIGN KEY (pessoa_id) REFERENCES pessoas(id)
      );

      CREATE TABLE IF NOT EXISTS documentos_recebidos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pessoa_id INTEGER,
        protocolo_id INTEGER,
        nome TEXT NOT NULL,
        tipo TEXT,
        caminho TEXT NOT NULL,
        descricao TEXT,
        data_recebimento TEXT,
        criado_em TEXT,
        FOREIGN KEY (pessoa_id) REFERENCES pessoas(id),
        FOREIGN KEY (protocolo_id) REFERENCES protocolos(id)
      );

      CREATE TABLE IF NOT EXISTS documentos_gerados (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pessoa_id INTEGER,
        protocolo_id INTEGER,
        tipo TEXT,
        titulo TEXT NOT NULL,
        conteudo TEXT,
        caminho TEXT,
        data_geracao TEXT,
        criado_em TEXT,
        FOREIGN KEY (pessoa_id) REFERENCES pessoas(id),
        FOREIGN KEY (protocolo_id) REFERENCES protocolos(id)
      );

      CREATE TABLE IF NOT EXISTS tarefas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        titulo TEXT NOT NULL,
        descricao TEXT,
        prioridade TEXT,
        prazo TEXT,
        status TEXT,
        pessoa_id INTEGER,
        protocolo_id INTEGER,
        criado_em TEXT,
        atualizado_em TEXT,
        FOREIGN KEY (pessoa_id) REFERENCES pessoas(id),
        FOREIGN KEY (protocolo_id) REFERENCES protocolos(id)
      );

      CREATE TABLE IF NOT EXISTS agenda (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        titulo TEXT NOT NULL,
        descricao TEXT,
        data TEXT NOT NULL,
        horario TEXT,
        pessoa_id INTEGER,
        protocolo_id INTEGER,
        realizado INTEGER DEFAULT 0,
        criado_em TEXT,
        FOREIGN KEY (pessoa_id) REFERENCES pessoas(id),
        FOREIGN KEY (protocolo_id) REFERENCES protocolos(id)
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

// IPC Handlers - Database
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
    const result = stmt.run(params)
    return { success: true, lastInsertRowid: result.lastInsertRowid }
  } catch (error: any) {
    console.error('DB Run Error:', error)
    return { success: false, error: error.message }
  }
})

// IPC Handlers - Files & Dialogs
ipcMain.handle('select-file', async () => {
  if (!mainWindow) return null
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'Documentos e Imagens', extensions: ['pdf', 'docx', 'doc', 'jpg', 'jpeg', 'png'] }
    ]
  })
  
  if (result.canceled || result.filePaths.length === 0) return null
  
  const filePath = result.filePaths[0]
  const fileName = path.basename(filePath)
  const fileExt = path.extname(filePath).toLowerCase().replace('.', '')
  
  return {
    path: filePath,
    name: fileName,
    type: fileExt
  }
})

ipcMain.handle('save-file-dialog', async (event, { defaultName, extensions }) => {
  if (!mainWindow) return null
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: defaultName,
    filters: [{ name: 'Documentos', extensions }]
  })
  
  if (result.canceled || !result.filePath) return null
  return result.filePath
})

ipcMain.handle('generate-docx', async (event, { filePath, data }) => {
  try {
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            text: `SAD - SOLUÇÃO ADMINISTRATIVA DIGITAL`,
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            text: `${data.tipo.toUpperCase()}: ${data.titulo}`,
            heading: HeadingLevel.HEADING_2,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({ text: "" }),
          new Paragraph({
            children: [
              new TextRun({ text: `INTERESSADO: `, bold: true }),
              new TextRun({ text: data.pessoa_nome || "N/A" }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `PROTOCOLO: `, bold: true }),
              new TextRun({ text: data.protocolo_numero || "N/A" }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `DATA: `, bold: true }),
              new TextRun({ text: new Date().toLocaleDateString('pt-BR') }),
            ],
          }),
          new Paragraph({ text: "" }),
          new Paragraph({ text: "------------------------------------------------------------------------------------------------------------------------" }),
          new Paragraph({ text: "" }),
          ...data.conteudo.split('\n').map((line: string) => new Paragraph({ text: line })),
        ],
      }],
    })

    const buffer = await Packer.toBuffer(doc)
    fs.writeFileSync(filePath, buffer)
    return { success: true }
  } catch (error: any) {
    console.error('Generate DOCX Error:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('write-file', async (event, { filePath, buffer }) => {
  try {
    fs.writeFileSync(filePath, Buffer.from(buffer))
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('open-file', async (event, filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      await shell.openPath(filePath)
      return { success: true }
    } else {
      return { success: false, error: 'Arquivo não encontrado no caminho especificado.' }
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})
