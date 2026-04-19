import React, { useState, useEffect } from 'react'
import { Sidebar } from './components/Sidebar'
import { Topbar } from './components/Topbar'
import { Dashboard } from './components/Dashboard'
import { Pessoas } from './components/Pessoas'
import { Protocolos } from './components/Protocolos'
import { DocumentosRecebidos } from './components/DocumentosRecebidos'
import { DocumentosGerados } from './components/DocumentosGerados'
import { Tarefas } from './components/Tarefas'
import { Agenda } from './components/Agenda'
import { BuscaGlobal } from './components/BuscaGlobal'
import { Configuracoes } from './components/Configuracoes'
import { 
  Pessoa, 
  Protocolo, 
  DocumentoRecebido, 
  DocumentoGerado, 
  Tarefa, 
  AgendaItem, 
  Config,
  Movimentacao,
  ElectronAPI 
} from './types'

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('Dashboard')
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  
  // Estados Pessoas
  const [pessoas, setPessoas] = useState<Pessoa[]>([])
  const [selectedPessoa, setSelectedPessoa] = useState<Pessoa | null>(null)
  const [isPessoaFormOpen, setIsPessoaFormOpen] = useState(false)

  // Estados Protocolos
  const [protocolos, setProtocolos] = useState<Protocolo[]>([])
  const [selectedProtocolo, setSelectedProtocolo] = useState<Protocolo | null>(null)

  // Estados Documentos Recebidos
  const [documentos, setDocumentos] = useState<DocumentoRecebido[]>([])

  // Estados Documentos Gerados
  const [documentosGerados, setDocumentosGerados] = useState<DocumentoGerado[]>([])

  // Estados Tarefas
  const [tarefas, setTarefas] = useState<Tarefa[]>([])

  // Estados Agenda
  const [agenda, setAgenda] = useState<AgendaItem[]>([])

  // Estados Configurações
  const [config, setConfig] = useState<Config>({
    nomeUsuario: '', nomeSetor: '', cargo: '', logomarca: '', assinaturaPadrao: '', cidade: '', uf: ''
  })

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    fetchData()
    fetchConfig()

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const fetchData = async () => {
    const resP = await window.electronAPI.dbQuery({ sql: 'SELECT * FROM pessoas ORDER BY nome ASC' })
    if (resP.success && resP.data) setPessoas(resP.data)
    
    const resProt = await window.electronAPI.dbQuery({ 
      sql: `SELECT pr.*, p.nome as pessoa_nome 
            FROM protocolos pr 
            LEFT JOIN pessoas p ON pr.pessoa_id = p.id 
            ORDER BY pr.criado_em DESC` 
    })
    if (resProt.success && resProt.data) setProtocolos(resProt.data)

    const resDocs = await window.electronAPI.dbQuery({
      sql: `SELECT d.*, p.nome as pessoa_nome, pr.numero as protocolo_numero 
            FROM documentos_recebidos d 
            LEFT JOIN pessoas p ON d.pessoa_id = p.id 
            LEFT JOIN protocolos pr ON d.protocolo_id = pr.id 
            ORDER BY d.criado_em DESC`
    })
    if (resDocs.success && resDocs.data) setDocumentos(resDocs.data)

    const resDocsG = await window.electronAPI.dbQuery({
      sql: `SELECT dg.*, p.nome as pessoa_nome, pr.numero as protocolo_numero 
            FROM documentos_gerados dg 
            LEFT JOIN pessoas p ON dg.pessoa_id = p.id 
            LEFT JOIN protocolos pr ON dg.protocolo_id = pr.id 
            ORDER BY dg.criado_em DESC`
    })
    if (resDocsG.success && resDocsG.data) setDocumentosGerados(resDocsG.data)

    const resTarefas = await window.electronAPI.dbQuery({
      sql: `SELECT t.*, p.nome as pessoa_nome, pr.numero as protocolo_numero 
            FROM tarefas t 
            LEFT JOIN pessoas p ON t.pessoa_id = p.id 
            LEFT JOIN protocolos pr ON t.protocolo_id = pr.id 
            ORDER BY t.prazo ASC, t.prioridade DESC`
    })
    if (resTarefas.success && resTarefas.data) setTarefas(resTarefas.data)

    const resAgenda = await window.electronAPI.dbQuery({
      sql: `SELECT a.*, p.nome as pessoa_nome, pr.numero as protocolo_numero 
            FROM agenda a 
            LEFT JOIN pessoas p ON a.pessoa_id = p.id 
            LEFT JOIN protocolos pr ON a.protocolo_id = pr.id 
            ORDER BY a.data ASC, a.horario ASC`
    })
    if (resAgenda.success && resAgenda.data) setAgenda(resAgenda.data)
  }

  const fetchConfig = async () => {
    const res = await window.electronAPI.dbQuery({ sql: 'SELECT * FROM configuracoes' })
    if (res.success && res.data) {
      const newConfig = { ...config }
      res.data.forEach((item: any) => {
        if (item.chave in newConfig) {
          (newConfig as any)[item.chave] = item.valor
        }
      })
      setConfig(newConfig)
    }
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-'
    try {
      const date = new Date(dateStr)
      if (isNaN(date.getTime())) return dateStr
      return date.toLocaleDateString('pt-BR')
    } catch {
      return dateStr
    }
  }

  const getPrazoStatus = (prazo: string) => {
    if (!prazo) return null
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const deadline = new Date(prazo)
    deadline.setHours(0, 0, 0, 0)
    const diffTime = deadline.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) return { label: 'Vencido', color: 'text-error-expired bg-error-expired/10' }
    if (diffDays <= 3) return { label: 'Vencendo', color: 'text-deadline-alert bg-deadline-alert/10' }
    return { label: 'No prazo', color: 'text-success bg-success/10' }
  }

  const handleNavigate = (tab: string) => {
    setActiveTab(tab)
    setSelectedPessoa(null)
    setSelectedProtocolo(null)
  }

  const handleSavePessoa = async (pessoa: Pessoa) => {
    const now = new Date().toISOString()
    if (pessoa.id) {
      await window.electronAPI.dbRun({
        sql: `UPDATE pessoas SET nome=?, cpf=?, telefone=?, endereco=?, email=?, orgao=?, observacoes=?, atualizado_em=? WHERE id=?`,
        params: [pessoa.nome, pessoa.cpf, pessoa.telefone, pessoa.endereco, pessoa.email, pessoa.orgao, pessoa.observacoes, now, pessoa.id]
      })
    } else {
      await window.electronAPI.dbRun({
        sql: `INSERT INTO pessoas (nome, cpf, telefone, endereco, email, orgao, observacoes, criado_em, atualizado_em) VALUES (?,?,?,?,?,?,?,?,?)`,
        params: [pessoa.nome, pessoa.cpf, pessoa.telefone, pessoa.endereco, pessoa.email, pessoa.orgao, pessoa.observacoes, now, now]
      })
    }
    fetchData()
    if (selectedPessoa) {
      const updated = await window.electronAPI.dbQuery({ sql: 'SELECT * FROM pessoas WHERE id = ?', params: [pessoa.id] })
      if (updated.success && updated.data?.[0]) setSelectedPessoa(updated.data[0])
    }
  }

  const handleDeletePessoa = async (id: number) => {
    if (confirm('Excluir esta pessoa e seu dossiê?')) {
      await window.electronAPI.dbRun({ sql: 'DELETE FROM pessoas WHERE id = ?', params: [id] })
      setSelectedPessoa(null)
      fetchData()
    }
  }

  const handleSaveProtocolo = async (protocolo: Protocolo) => {
    const now = new Date().toISOString()
    if (protocolo.id) {
      await window.electronAPI.dbRun({
        sql: `UPDATE protocolos SET pessoa_id=?, numero=?, assunto=?, descricao=?, data_entrada=?, prazo=?, status=?, atualizado_em=? WHERE id=?`,
        params: [protocolo.pessoa_id, protocolo.numero, protocolo.assunto, protocolo.descricao, protocolo.data_entrada, protocolo.prazo, protocolo.status, now, protocolo.id]
      })
    } else {
      await window.electronAPI.dbRun({
        sql: `INSERT INTO protocolos (pessoa_id, numero, assunto, descricao, data_entrada, prazo, status, historico, criado_em, atualizado_em) VALUES (?,?,?,?,?,?,?,?,?,?)`,
        params: [protocolo.pessoa_id, protocolo.numero, protocolo.assunto, protocolo.descricao, protocolo.data_entrada, protocolo.prazo, protocolo.status, '[]', now, now]
      })
    }
    fetchData()
  }

  const handleUpdateProtocoloStatus = async (id: number, newStatus: string) => {
    await window.electronAPI.dbRun({
      sql: `UPDATE protocolos SET status = ?, atualizado_em = ? WHERE id = ?`,
      params: [newStatus, new Date().toISOString(), id]
    })
    fetchData()
  }

  const handleAddMovimentacao = async (id: number, novaMovimentacao: string) => {
    const protocolo = protocolos.find(p => p.id === id)
    if (!protocolo || !novaMovimentacao.trim()) return
    const historico: Movimentacao[] = JSON.parse(protocolo.historico || '[]')
    historico.unshift({ data: new Date().toISOString(), texto: novaMovimentacao })
    
    await window.electronAPI.dbRun({
      sql: `UPDATE protocolos SET historico = ?, atualizado_em = ? WHERE id = ?`,
      params: [JSON.stringify(historico), new Date().toISOString(), id]
    })
    fetchData()
  }

  const handleSaveDocumento = async (documento: DocumentoRecebido) => {
    const now = new Date().toISOString()
    await window.electronAPI.dbRun({
      sql: `INSERT INTO documentos_recebidos (pessoa_id, protocolo_id, nome, tipo, caminho, descricao, data_recebimento, criado_em) VALUES (?,?,?,?,?,?,?,?)`,
      params: [documento.pessoa_id, documento.protocolo_id || null, documento.nome, documento.tipo, documento.caminho, documento.descricao, documento.data_recebimento, now]
    })
    fetchData()
  }

  const handleDeleteDocumento = async (id: number) => {
    if (confirm('Remover o registro deste documento? O arquivo físico não será excluído.')) {
      await window.electronAPI.dbRun({ sql: 'DELETE FROM documentos_recebidos WHERE id = ?', params: [id] })
      fetchData()
    }
  }

  const handleSaveDocumentoGerado = async (documento: DocumentoGerado, exportDoc: boolean = false) => {
    const now = new Date().toISOString()
    let filePath = documento.caminho

    if (exportDoc) {
      const person = pessoas.find(p => p.id === documento.pessoa_id)
      const protocol = protocolos.find(pr => pr.id === documento.protocolo_id)
      
      const savePath = await window.electronAPI.saveFileDialog({
        defaultName: `${documento.tipo}_${documento.titulo.replace(/\s+/g, '_')}.docx`,
        extensions: ['docx']
      })

      if (savePath) {
        const res = await window.electronAPI.generateDocx({
          filePath: savePath,
          data: {
            tipo: documento.tipo,
            titulo: documento.titulo,
            pessoa_nome: person?.nome,
            protocolo_numero: protocol?.numero,
            conteudo: documento.conteudo
          },
          config: config
        })
        
        if (res.success) {
          filePath = savePath
        } else {
          alert('Erro ao gerar documento: ' + res.error)
          return
        }
      } else {
        return
      }
    }

    if (documento.id) {
      await window.electronAPI.dbRun({
        sql: `UPDATE documentos_gerados SET pessoa_id=?, protocolo_id=?, tipo=?, titulo=?, conteudo=?, caminho=?, data_geracao=?, criado_em=? WHERE id=?`,
        params: [documento.pessoa_id, documento.protocolo_id || null, documento.tipo, documento.titulo, documento.conteudo, filePath || null, now, now, documento.id]
      })
    } else {
      await window.electronAPI.dbRun({
        sql: `INSERT INTO documentos_gerados (pessoa_id, protocolo_id, tipo, titulo, conteudo, caminho, data_geracao, criado_em) VALUES (?,?,?,?,?,?,?,?)`,
        params: [documento.pessoa_id, documento.protocolo_id || null, documento.tipo, documento.titulo, documento.conteudo, filePath || null, now, now]
      })
    }

    fetchData()
  }

  const handleDeleteDocumentoGerado = async (id: number) => {
    if (confirm('Excluir este documento gerado?')) {
      await window.electronAPI.dbRun({ sql: 'DELETE FROM documentos_gerados WHERE id = ?', params: [id] })
      fetchData()
    }
  }

  const handleSaveTarefa = async (tarefa: Tarefa) => {
    const now = new Date().toISOString()
    if (tarefa.id) {
      await window.electronAPI.dbRun({
        sql: `UPDATE tarefas SET titulo=?, descricao=?, prioridade=?, prazo=?, status=?, pessoa_id=?, protocolo_id=?, atualizado_em=? WHERE id=?`,
        params: [tarefa.titulo, tarefa.descricao, tarefa.prioridade, tarefa.prazo, tarefa.status, tarefa.pessoa_id || null, tarefa.protocolo_id || null, now, tarefa.id]
      })
    } else {
      await window.electronAPI.dbRun({
        sql: `INSERT INTO tarefas (titulo, descricao, prioridade, prazo, status, pessoa_id, protocolo_id, criado_em, atualizado_em) VALUES (?,?,?,?,?,?,?,?,?)`,
        params: [tarefa.titulo, tarefa.descricao, tarefa.prioridade, tarefa.prazo, tarefa.status, tarefa.pessoa_id || null, tarefa.protocolo_id || null, now, now]
      })
    }
    fetchData()
  }

  const handleToggleTarefaStatus = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === 'concluida' ? 'pendente' : 'concluida'
    await window.electronAPI.dbRun({
      sql: `UPDATE tarefas SET status = ?, atualizado_em = ? WHERE id = ?`,
      params: [newStatus, new Date().toISOString(), id]
    })
    fetchData()
  }

  const handleDeleteTarefa = async (id: number) => {
    if (confirm('Excluir esta tarefa?')) {
      await window.electronAPI.dbRun({ sql: 'DELETE FROM tarefas WHERE id = ?', params: [id] })
      fetchData()
    }
  }

  const handleSaveAgenda = async (item: AgendaItem) => {
    const now = new Date().toISOString()
    if (item.id) {
      await window.electronAPI.dbRun({
        sql: `UPDATE agenda SET titulo=?, descricao=?, data=?, horario=?, pessoa_id=?, protocolo_id=?, realizado=? WHERE id=?`,
        params: [item.titulo, item.descricao, item.data, item.horario, item.pessoa_id || null, item.protocolo_id || null, item.realizado, item.id]
      })
    } else {
      await window.electronAPI.dbRun({
        sql: `INSERT INTO agenda (titulo, descricao, data, horario, pessoa_id, protocolo_id, realizado, criado_em) VALUES (?,?,?,?,?,?,?,?)`,
        params: [item.titulo, item.descricao, item.data, item.horario, item.pessoa_id || null, item.protocolo_id || null, item.realizado, now]
      })
    }
    fetchData()
  }

  const handleToggleAgendaRealizado = async (id: number, currentRealizado: number) => {
    const newVal = currentRealizado === 1 ? 0 : 1
    await window.electronAPI.dbRun({
      sql: `UPDATE agenda SET realizado = ? WHERE id = ?`,
      params: [newVal, id]
    })
    fetchData()
  }

  const handleDeleteAgenda = async (id: number) => {
    if (confirm('Excluir este compromisso?')) {
      await window.electronAPI.dbRun({ sql: 'DELETE FROM agenda WHERE id = ?', params: [id] })
      fetchData()
    }
  }

  const handleSaveConfig = async (newConfig: Config) => {
    for (const [chave, valor] of Object.entries(newConfig)) {
      await window.electronAPI.dbRun({
        sql: 'INSERT OR REPLACE INTO configuracoes (chave, valor) VALUES (?, ?)',
        params: [chave, valor]
      })
    }
    alert('Configurações salvas com sucesso!')
    setConfig(newConfig)
  }

  return (
    <div className="flex h-screen w-full overflow-hidden font-sans">
      <Sidebar activeTab={activeTab} onTabChange={handleNavigate} />

      <main className="flex-1 flex flex-col bg-main-bg overflow-hidden">
        <Topbar 
          activeTab={activeTab} 
          selectedPessoaNome={selectedPessoa?.nome}
          selectedProtocoloNumero={selectedProtocolo?.numero}
          isOnline={isOnline}
        />
        
        <div className="flex-1 overflow-hidden">
          {activeTab === 'Dashboard' && (
            <Dashboard 
              protocolos={protocolos}
              tarefas={tarefas}
              agenda={agenda}
              onSelectProtocolo={setSelectedProtocolo}
              onNavigate={handleNavigate}
              formatDate={formatDate}
              getPrazoStatus={getPrazoStatus}
            />
          )}
          {activeTab === 'Pessoas / Dossiês' && (
            <Pessoas 
              pessoas={pessoas}
              protocolos={protocolos}
              documentos={documentos}
              documentosGerados={documentosGerados}
              selectedPessoa={selectedPessoa}
              onSelectPessoa={setSelectedPessoa}
              onSavePessoa={handleSavePessoa}
              onDeletePessoa={handleDeletePessoa}
              onImportDoc={() => {}}
              onOpenFile={() => {}}
              onDeleteDoc={handleDeleteDocumento}
              onDeleteDocGerado={handleDeleteDocumentoGerado}
              onNewDocGerado={() => {}}
              formatDate={formatDate}
            />
          )}
          {activeTab === 'Protocolos' && (
            <Protocolos 
              protocolos={protocolos}
              pessoas={pessoas}
              selectedProtocolo={selectedProtocolo}
              onSelectProtocolo={setSelectedProtocolo}
              onSaveProtocolo={handleSaveProtocolo}
              onUpdateStatus={handleUpdateProtocoloStatus}
              onAddMovimentacao={handleAddMovimentacao}
              formatDate={formatDate}
              getPrazoStatus={getPrazoStatus}
            />
          )}
          {activeTab === 'Documentos Recebidos' && (
            <DocumentosRecebidos 
              documentos={documentos}
              pessoas={pessoas}
              onOpenFile={() => {}}
              onDeleteDoc={handleDeleteDocumento}
              onSelectPessoa={setSelectedPessoa}
              onNavigate={handleNavigate}
              formatDate={formatDate}
            />
          )}
          {activeTab === 'Documentos Gerados' && (
            <DocumentosGerados 
              documentosGerados={documentosGerados}
              pessoas={pessoas}
              onOpenFile={() => {}}
              onDeleteDocGerado={handleDeleteDocumentoGerado}
              onSelectPessoa={setSelectedPessoa}
              onNavigate={handleNavigate}
              formatDate={formatDate}
            />
          )}
          {activeTab === 'Tarefas' && (
            <Tarefas 
              tarefas={tarefas}
              onSaveTarefa={handleSaveTarefa}
              onToggleStatus={handleToggleTarefaStatus}
              onDeleteTarefa={handleDeleteTarefa}
              formatDate={formatDate}
              getPrazoStatus={getPrazoStatus}
            />
          )}
          {activeTab === 'Agenda' && (
            <Agenda 
              agenda={agenda}
              onSaveAgenda={handleSaveAgenda}
              onToggleRealizado={handleToggleAgendaRealizado}
              onDeleteAgenda={handleDeleteAgenda}
              formatDate={formatDate}
            />
          )}
          {activeTab === 'Busca Global' && (
            <BuscaGlobal 
              pessoas={pessoas}
              protocolos={protocolos}
              documentos={documentos}
              documentosGerados={documentosGerados}
              tarefas={tarefas}
              agenda={agenda}
              onSelectPessoa={setSelectedPessoa}
              onSelectProtocolo={setSelectedProtocolo}
              onNavigate={handleNavigate}
              formatDate={formatDate}
            />
          )}
          {activeTab === 'Configurações' && (
            <Configuracoes 
              config={config}
              onSaveConfig={handleSaveConfig}
            />
          )}
        </div>
      </main>
    </div>
  )
}

export default App
