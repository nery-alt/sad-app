import React, { useState, useEffect, useMemo } from 'react'
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Inbox, 
  FilePlus, 
  Calendar, 
  CheckSquare, 
  Search, 
  Settings,
  Wifi,
  WifiOff,
  Plus,
  ArrowLeft,
  Edit,
  Trash2,
  User,
  Building2,
  Mail,
  Phone,
  MapPin,
  FileSearch,
  Clock,
  AlertCircle,
  CheckCircle2,
  History,
  Send
} from 'lucide-react'

declare global {
  interface Window {
    electronAPI: {
      getDbStatus: () => Promise<string>;
      dbQuery: (payload: { sql: string, params?: any[] }) => Promise<{ success: boolean, data?: any[], error?: string }>;
      dbRun: (payload: { sql: string, params?: any[] }) => Promise<{ success: boolean, error?: string, lastInsertRowid?: number }>;
    }
  }
}

interface Pessoa {
  id?: number;
  nome: string;
  cpf: string;
  telefone: string;
  endereco: string;
  email: string;
  orgao: string;
  observacoes: string;
  criado_em: string;
  atualizado_em: string;
}

interface Movimentacao {
  data: string;
  texto: string;
}

interface Protocolo {
  id?: number;
  pessoa_id: number;
  numero: string;
  assunto: string;
  descricao: string;
  data_entrada: string;
  prazo: string;
  status: 'aberto' | 'em_andamento' | 'concluido';
  historico: string; // JSON string
  criado_em: string;
  atualizado_em: string;
  // Campo virtual para join
  pessoa_nome?: string;
}

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('Dashboard')
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  
  // Estados Pessoas
  const [pessoas, setPessoas] = useState<Pessoa[]>([])
  const [searchPessoa, setSearchPessoa] = useState('')
  const [selectedPessoa, setSelectedPessoa] = useState<Pessoa | null>(null)
  const [isPessoaFormOpen, setIsPessoaFormOpen] = useState(false)
  const [pessoaFormData, setPessoaFormData] = useState<Pessoa>({
    nome: '', cpf: '', telefone: '', endereco: '', email: '', orgao: '', observacoes: '', criado_em: '', atualizado_em: ''
  })

  // Estados Protocolos
  const [protocolos, setProtocolos] = useState<Protocolo[]>([])
  const [searchProtocolo, setSearchProtocolo] = useState('')
  const [selectedProtocolo, setSelectedProtocolo] = useState<Protocolo | null>(null)
  const [isProtocoloFormOpen, setIsProtocoloFormOpen] = useState(false)
  const [protocoloFormData, setProtocoloFormData] = useState<Partial<Protocolo>>({
    pessoa_id: 0, numero: '', assunto: '', descricao: '', data_entrada: new Date().toISOString().split('T')[0], prazo: '', status: 'aberto', historico: '[]'
  })
  const [novaMovimentacao, setNovaMovimentacao] = useState('')

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    fetchData()

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
  }

  // Handlers Pessoas
  const handleSavePessoa = async (e: React.FormEvent) => {
    e.preventDefault()
    const now = new Date().toISOString()
    if (pessoaFormData.id) {
      await window.electronAPI.dbRun({
        sql: `UPDATE pessoas SET nome=?, cpf=?, telefone=?, endereco=?, email=?, orgao=?, observacoes=?, atualizado_em=? WHERE id=?`,
        params: [pessoaFormData.nome, pessoaFormData.cpf, pessoaFormData.telefone, pessoaFormData.endereco, pessoaFormData.email, pessoaFormData.orgao, pessoaFormData.observacoes, now, pessoaFormData.id]
      })
    } else {
      await window.electronAPI.dbRun({
        sql: `INSERT INTO pessoas (nome, cpf, telefone, endereco, email, orgao, observacoes, criado_em, atualizado_em) VALUES (?,?,?,?,?,?,?,?,?)`,
        params: [pessoaFormData.nome, pessoaFormData.cpf, pessoaFormData.telefone, pessoaFormData.endereco, pessoaFormData.email, pessoaFormData.orgao, pessoaFormData.observacoes, now, now]
      })
    }
    setIsPessoaFormOpen(false)
    fetchData()
    if (selectedPessoa) {
      const updated = await window.electronAPI.dbQuery({ sql: 'SELECT * FROM pessoas WHERE id = ?', params: [pessoaFormData.id] })
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

  // Handlers Protocolos
  const handleSaveProtocolo = async (e: React.FormEvent) => {
    e.preventDefault()
    const now = new Date().toISOString()
    if (protocoloFormData.id) {
      await window.electronAPI.dbRun({
        sql: `UPDATE protocolos SET pessoa_id=?, numero=?, assunto=?, descricao=?, data_entrada=?, prazo=?, status=?, atualizado_em=? WHERE id=?`,
        params: [protocoloFormData.pessoa_id, protocoloFormData.numero, protocoloFormData.assunto, protocoloFormData.descricao, protocoloFormData.data_entrada, protocoloFormData.prazo, protocoloFormData.status, now, protocoloFormData.id]
      })
    } else {
      await window.electronAPI.dbRun({
        sql: `INSERT INTO protocolos (pessoa_id, numero, assunto, descricao, data_entrada, prazo, status, historico, criado_em, atualizado_em) VALUES (?,?,?,?,?,?,?,?,?,?)`,
        params: [protocoloFormData.pessoa_id, protocoloFormData.numero, protocoloFormData.assunto, protocoloFormData.descricao, protocoloFormData.data_entrada, protocoloFormData.prazo, protocoloFormData.status, '[]', now, now]
      })
    }
    setIsProtocoloFormOpen(false)
    fetchData()
    if (selectedProtocolo) {
      const updated = await window.electronAPI.dbQuery({ 
        sql: 'SELECT pr.*, p.nome as pessoa_nome FROM protocolos pr LEFT JOIN pessoas p ON pr.pessoa_id = p.id WHERE pr.id = ?', 
        params: [protocoloFormData.id] 
      })
      if (updated.success && updated.data?.[0]) setSelectedProtocolo(updated.data[0])
    }
  }

  const handleAddMovimentacao = async () => {
    if (!selectedProtocolo || !novaMovimentacao.trim()) return
    const historico: Movimentacao[] = JSON.parse(selectedProtocolo.historico || '[]')
    historico.unshift({ data: new Date().toISOString(), texto: novaMovimentacao })
    
    await window.electronAPI.dbRun({
      sql: `UPDATE protocolos SET historico = ?, atualizado_em = ? WHERE id = ?`,
      params: [JSON.stringify(historico), new Date().toISOString(), selectedProtocolo.id]
    })
    
    setNovaMovimentacao('')
    const updated = await window.electronAPI.dbQuery({ 
      sql: 'SELECT pr.*, p.nome as pessoa_nome FROM protocolos pr LEFT JOIN pessoas p ON pr.pessoa_id = p.id WHERE pr.id = ?', 
      params: [selectedProtocolo.id] 
    })
    if (updated.success && updated.data?.[0]) setSelectedProtocolo(updated.data[0])
    fetchData()
  }

  const updateProtocoloStatus = async (newStatus: string) => {
    if (!selectedProtocolo) return
    await window.electronAPI.dbRun({
      sql: `UPDATE protocolos SET status = ?, atualizado_em = ? WHERE id = ?`,
      params: [newStatus, new Date().toISOString(), selectedProtocolo.id]
    })
    const updated = await window.electronAPI.dbQuery({ 
      sql: 'SELECT pr.*, p.nome as pessoa_nome FROM protocolos pr LEFT JOIN pessoas p ON pr.pessoa_id = p.id WHERE pr.id = ?', 
      params: [selectedProtocolo.id] 
    })
    if (updated.success && updated.data?.[0]) setSelectedProtocolo(updated.data[0])
    fetchData()
  }

  // Helpers
  const getPrazoStatus = (prazo: string) => {
    if (!prazo) return null
    const today = new Date()
    const deadline = new Date(prazo)
    const diffTime = deadline.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) return { label: 'Vencido', color: 'text-error-expired bg-error-expired/10' }
    if (diffDays <= 3) return { label: 'Vencendo', color: 'text-deadline-alert bg-deadline-alert/10' }
    return { label: 'No prazo', color: 'text-success bg-success/10' }
  }

  const filteredPessoas = useMemo(() => pessoas.filter(p => 
    p.nome.toLowerCase().includes(searchPessoa.toLowerCase()) || 
    p.orgao?.toLowerCase().includes(searchPessoa.toLowerCase())
  ), [pessoas, searchPessoa])

  const filteredProtocolos = useMemo(() => protocolos.filter(pr => 
    pr.numero.toLowerCase().includes(searchProtocolo.toLowerCase()) || 
    pr.pessoa_nome?.toLowerCase().includes(searchProtocolo.toLowerCase()) ||
    pr.assunto.toLowerCase().includes(searchProtocolo.toLowerCase())
  ), [protocolos, searchProtocolo])

  const pessoaProtocolos = useMemo(() => {
    if (!selectedPessoa) return []
    return protocolos.filter(pr => pr.pessoa_id === selectedPessoa.id)
  }, [protocolos, selectedPessoa])

  // Menu Items Definition
  const menuItems = [
    { name: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Pessoas / Dossiês', icon: <Users size={20} /> },
    { name: 'Protocolos', icon: <FileText size={20} /> },
    { name: 'Documentos Recebidos', icon: <Inbox size={20} /> },
    { name: 'Documentos Gerados', icon: <FilePlus size={20} /> },
    { name: 'Agenda', icon: <Calendar size={20} /> },
    { name: 'Tarefas', icon: <CheckSquare size={20} /> },
    { name: 'Busca Global', icon: <Search size={20} /> },
    { name: 'Configurações', icon: <Settings size={20} /> },
  ]

  // Renderers
  const renderDashboard = () => {
    const stats = {
      aberto: protocolos.filter(p => p.status === 'aberto' || p.status === 'em_andamento').length,
      vencendo: protocolos.filter(p => {
        const s = getPrazoStatus(p.prazo)
        return s?.label === 'Vencendo' && p.status !== 'concluido'
      }).length,
      vencidos: protocolos.filter(p => {
        const s = getPrazoStatus(p.prazo)
        return s?.label === 'Vencido' && p.status !== 'concluido'
      }).length,
      concluidos: protocolos.filter(p => {
        const d = new Date(p.atualizado_em)
        const now = new Date()
        return p.status === 'concluido' && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      }).length
    }

    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Protocolos em aberto', value: stats.aberto, color: 'border-primary-btn' },
            { label: 'Prazos vencendo', value: stats.vencendo, color: 'border-deadline-alert' },
            { label: 'Prazos vencidos', value: stats.vencidos, color: 'border-error-expired' },
            { label: 'Concluídos no mês', value: stats.concluidos, color: 'border-success' },
          ].map((card, idx) => (
            <div key={idx} className={`bg-surface-card p-6 rounded-lg shadow-sm border-l-4 ${card.color}`}>
              <p className="text-text-secondary text-sm font-medium">{card.label}</p>
              <p className="text-3xl font-bold mt-2">{card.value}</p>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderPessoas = () => {
    if (selectedPessoa) {
      return (
        <div className="p-8 animate-in fade-in duration-300 h-full overflow-y-auto">
          <button onClick={() => setSelectedPessoa(null)} className="flex items-center gap-2 text-text-secondary hover:text-primary-btn mb-6 transition-colors">
            <ArrowLeft size={20} /> Voltar para a lista
          </button>
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-bold text-text-main">{selectedPessoa.nome}</h1>
              <p className="text-text-secondary flex items-center gap-2 mt-1"><Building2 size={16} /> {selectedPessoa.orgao || 'Sem órgão/empresa'}</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setPessoaFormData(selectedPessoa); setIsPessoaFormOpen(true); }} className="flex items-center gap-2 px-4 py-2 bg-primary-btn text-white rounded-lg hover:opacity-90 transition-opacity"><Edit size={18} /> Editar Dados</button>
              <button onClick={() => handleDeletePessoa(selectedPessoa.id!)} className="flex items-center gap-2 px-4 py-2 bg-error-expired text-white rounded-lg hover:opacity-90 transition-opacity"><Trash2 size={18} /> Excluir</button>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-8">
            <div className="col-span-1 space-y-6">
              <div className="bg-surface-card p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="font-bold mb-4 flex items-center gap-2 text-sidebar-bg"><User size={18} /> Informações</h3>
                <div className="space-y-4 text-sm">
                  <div className="flex items-start gap-3"><Mail className="text-text-secondary shrink-0" size={16} /><div><p className="text-xs text-text-secondary uppercase font-bold">E-mail</p><p>{selectedPessoa.email || 'Não informado'}</p></div></div>
                  <div className="flex items-start gap-3"><Phone className="text-text-secondary shrink-0" size={16} /><div><p className="text-xs text-text-secondary uppercase font-bold">Telefone</p><p>{selectedPessoa.telefone || 'Não informado'}</p></div></div>
                  <div className="flex items-start gap-3"><MapPin className="text-text-secondary shrink-0" size={16} /><div><p className="text-xs text-text-secondary uppercase font-bold">Endereço</p><p>{selectedPessoa.endereco || 'Não informado'}</p></div></div>
                  <div className="flex items-start gap-3"><FileSearch className="text-text-secondary shrink-0" size={16} /><div><p className="text-xs text-text-secondary uppercase font-bold">CPF</p><p>{selectedPessoa.cpf || 'Não informado'}</p></div></div>
                </div>
              </div>
              <div className="bg-surface-card p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="font-bold mb-2 text-sidebar-bg">Observações</h3>
                <p className="text-sm text-text-secondary whitespace-pre-wrap">{selectedPessoa.observacoes || 'Nenhuma observação.'}</p>
              </div>
            </div>
            <div className="col-span-2 space-y-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="font-bold mb-4 flex items-center gap-2"><FileText size={18} className="text-primary-btn" /> Protocolos Vinculados</h3>
                {pessoaProtocolos.length > 0 ? (
                  <div className="space-y-3">
                    {pessoaProtocolos.map(pr => (
                      <div key={pr.id} onClick={() => { setSelectedProtocolo(pr); setActiveTab('Protocolos'); }} className="p-4 border border-gray-100 rounded-lg hover:border-primary-btn/30 cursor-pointer transition-all flex justify-between items-center">
                        <div>
                          <p className="font-bold text-sm">{pr.numero} - {pr.assunto}</p>
                          <p className="text-xs text-text-secondary">Entrada: {pr.data_entrada}</p>
                        </div>
                        <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${pr.status === 'concluido' ? 'bg-success/10 text-success' : 'bg-primary-btn/10 text-primary-btn'}`}>
                          {pr.status.replace('_', ' ')}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center border-2 border-dashed border-gray-100 rounded-lg">
                    <p className="text-text-secondary italic">Nenhum protocolo vinculado a este dossiê.</p>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <h3 className="font-bold mb-4 flex items-center gap-2"><Inbox size={18} className="text-deadline-alert" /> Documentos Recebidos</h3>
                  <div className="py-6 text-center border-2 border-dashed border-gray-100 rounded-lg"><p className="text-text-secondary text-sm italic">Nenhum documento.</p></div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <h3 className="font-bold mb-4 flex items-center gap-2"><FilePlus size={18} className="text-success" /> Documentos Gerados</h3>
                  <div className="py-6 text-center border-2 border-dashed border-gray-100 rounded-lg"><p className="text-text-secondary text-sm italic">Nenhum documento.</p></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }
    return (
      <div className="p-8 flex flex-col h-full overflow-hidden">
        <div className="flex justify-between items-center mb-8 shrink-0">
          <div><h1 className="text-2xl font-bold text-text-main">Pessoas / Dossiês</h1><p className="text-text-secondary">Gerencie os cadastros e acesse os dossiês completos.</p></div>
          <button onClick={() => { setPessoaFormData({ nome: '', cpf: '', telefone: '', endereco: '', email: '', orgao: '', observacoes: '', criado_em: '', atualizado_em: '' }); setIsPessoaFormOpen(true); }} className="flex items-center gap-2 bg-primary-btn text-white px-6 py-3 rounded-lg font-bold hover:opacity-90 transition-opacity shadow-md"><Plus size={20} /> Nova Pessoa</button>
        </div>
        <div className="mb-6 relative shrink-0">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={20} />
          <input type="text" placeholder="Buscar por nome ou órgão..." className="w-full pl-12 pr-4 py-3 bg-surface-card border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-btn/20 transition-all" value={searchPessoa} onChange={(e) => setSearchPessoa(e.target.value)} />
        </div>
        <div className="flex-1 overflow-y-auto pr-2">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPessoas.map(pessoa => (
              <div key={pessoa.id} onClick={() => setSelectedPessoa(pessoa)} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-primary-btn/30 cursor-pointer transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-surface-card rounded-full flex items-center justify-center text-primary-btn group-hover:bg-primary-btn group-hover:text-white transition-colors shrink-0"><User size={24} /></div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-text-main break-words leading-tight">{pessoa.nome}</h3>
                    <p className="text-xs text-text-secondary truncate mt-1">{pessoa.orgao || 'Sem órgão vinculado'}</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center text-xs text-text-secondary">
                  <span className="truncate max-w-[150px]">{pessoa.email || 'Sem e-mail'}</span>
                  <span className="text-primary-btn font-bold opacity-0 group-hover:opacity-100 transition-opacity shrink-0">Ver Dossiê →</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const renderProtocolos = () => {
    if (selectedProtocolo) {
      const pStatus = getPrazoStatus(selectedProtocolo.prazo)
      const historico: Movimentacao[] = JSON.parse(selectedProtocolo.historico || '[]')

      return (
        <div className="p-8 animate-in fade-in duration-300 h-full overflow-y-auto">
          <button onClick={() => setSelectedProtocolo(null)} className="flex items-center gap-2 text-text-secondary hover:text-primary-btn mb-6 transition-colors">
            <ArrowLeft size={20} /> Voltar para a lista
          </button>
          <div className="flex justify-between items-start mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="bg-primary-btn text-white text-xs font-bold px-2 py-1 rounded">PROTOCOLO</span>
                <h1 className="text-3xl font-bold text-text-main">{selectedProtocolo.numero}</h1>
              </div>
              <p className="text-xl text-text-secondary font-medium">{selectedProtocolo.assunto}</p>
              <button 
                onClick={() => {
                  const p = pessoas.find(p => p.id === selectedProtocolo.pessoa_id)
                  if (p) { setSelectedPessoa(p); setActiveTab('Pessoas / Dossiês'); }
                }}
                className="text-primary-btn hover:underline text-sm font-bold mt-2 flex items-center gap-1"
              >
                <User size={14} /> {selectedProtocolo.pessoa_nome}
              </button>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setProtocoloFormData(selectedProtocolo); setIsProtocoloFormOpen(true); }} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-text-main rounded-lg hover:bg-gray-50 transition-colors"><Edit size={18} /> Editar</button>
              <div className="flex bg-gray-100 p-1 rounded-lg">
                {(['aberto', 'em_andamento', 'concluido'] as const).map(s => (
                  <button 
                    key={s}
                    onClick={() => updateProtocoloStatus(s)}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${selectedProtocolo.status === s ? 'bg-white shadow-sm text-primary-btn' : 'text-text-secondary hover:text-text-main'}`}
                  >
                    {s.replace('_', ' ').toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-8">
            <div className="col-span-2 space-y-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="font-bold mb-4 flex items-center gap-2"><AlertCircle size={18} className="text-primary-btn" /> Detalhes e Descrição</h3>
                <p className="text-text-main whitespace-pre-wrap bg-surface-card p-4 rounded-lg border border-gray-50">
                  {selectedProtocolo.descricao || 'Nenhuma descrição detalhada.'}
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="font-bold mb-4 flex items-center gap-2"><History size={18} className="text-primary-btn" /> Histórico de Movimentações</h3>
                <div className="flex gap-2 mb-6">
                  <input 
                    type="text" 
                    placeholder="Adicionar nova movimentação..." 
                    className="flex-1 p-3 bg-surface-card border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-btn/20 outline-none"
                    value={novaMovimentacao}
                    onChange={e => setNovaMovimentacao(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && handleAddMovimentacao()}
                  />
                  <button onClick={handleAddMovimentacao} className="bg-primary-btn text-white p-3 rounded-lg hover:opacity-90"><Send size={20} /></button>
                </div>
                <div className="space-y-4">
                  {historico.map((m, i) => (
                    <div key={i} className="flex gap-4 items-start">
                      <div className="w-2 h-2 bg-primary-btn rounded-full mt-2 shrink-0"></div>
                      <div>
                        <p className="text-xs font-bold text-text-secondary">{new Date(m.data).toLocaleString('pt-BR')}</p>
                        <p className="text-sm text-text-main mt-1">{m.texto}</p>
                      </div>
                    </div>
                  ))}
                  {historico.length === 0 && <p className="text-center text-text-secondary italic py-4">Nenhuma movimentação registrada.</p>}
                </div>
              </div>
            </div>

            <div className="col-span-1 space-y-6">
              <div className="bg-surface-card p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="font-bold mb-4 flex items-center gap-2 text-sidebar-bg"><Clock size={18} /> Prazos e Datas</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-text-secondary uppercase font-bold">Data de Entrada</p>
                    <p className="font-medium">{selectedProtocolo.data_entrada}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-secondary uppercase font-bold">Prazo Final</p>
                    <p className={`font-bold text-lg ${pStatus?.color.split(' ')[0] || ''}`}>{selectedProtocolo.prazo || 'Sem prazo definido'}</p>
                    {pStatus && <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded mt-1 inline-block ${pStatus.color}`}>{pStatus.label}</span>}
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                {selectedProtocolo.status === 'concluido' ? <CheckCircle2 size={40} className="text-success" /> : <Clock size={40} className="text-primary-btn animate-pulse" />}
                <div>
                  <p className="text-xs text-text-secondary uppercase font-bold">Status Atual</p>
                  <p className="font-bold text-lg uppercase">{selectedProtocolo.status.replace('_', ' ')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="p-8 flex flex-col h-full overflow-hidden">
        <div className="flex justify-between items-center mb-8 shrink-0">
          <div><h1 className="text-2xl font-bold text-text-main">Protocolos</h1><p className="text-text-secondary">Acompanhe e gerencie todos os processos administrativos.</p></div>
          <button onClick={() => { setProtocoloFormData({ pessoa_id: 0, numero: '', assunto: '', descricao: '', data_entrada: new Date().toISOString().split('T')[0], prazo: '', status: 'aberto', historico: '[]' }); setIsProtocoloFormOpen(true); }} className="flex items-center gap-2 bg-primary-btn text-white px-6 py-3 rounded-lg font-bold hover:opacity-90 transition-opacity shadow-md"><Plus size={20} /> Novo Protocolo</button>
        </div>
        <div className="mb-6 relative shrink-0">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={20} />
          <input type="text" placeholder="Buscar por número, assunto ou pessoa..." className="w-full pl-12 pr-4 py-3 bg-surface-card border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-btn/20 transition-all" value={searchProtocolo} onChange={(e) => setSearchProtocolo(e.target.value)} />
        </div>
        <div className="flex-1 overflow-y-auto pr-2">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-surface-card text-xs font-bold text-text-secondary uppercase">
                <tr>
                  <th className="px-6 py-4">Número</th>
                  <th className="px-6 py-4">Pessoa</th>
                  <th className="px-6 py-4">Assunto</th>
                  <th className="px-6 py-4">Prazo</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredProtocolos.map(pr => {
                  const pStatus = getPrazoStatus(pr.prazo)
                  return (
                    <tr key={pr.id} onClick={() => setSelectedProtocolo(pr)} className="hover:bg-gray-50 cursor-pointer transition-colors group">
                      <td className="px-6 py-4 font-bold text-primary-btn">{pr.numero}</td>
                      <td className="px-6 py-4 text-sm">{pr.pessoa_nome}</td>
                      <td className="px-6 py-4 text-sm font-medium">{pr.assunto}</td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${pStatus?.color || 'bg-gray-100 text-gray-400'}`}>{pr.prazo || 'S/ PRAZO'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${pr.status === 'concluido' ? 'bg-success/10 text-success' : 'bg-primary-btn/10 text-primary-btn'}`}>{pr.status.replace('_', ' ')}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {filteredProtocolos.length === 0 && <div className="py-20 text-center"><FileText size={48} className="mx-auto text-gray-200 mb-4" /><p className="text-text-secondary">Nenhum protocolo encontrado.</p></div>}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen w-full overflow-hidden font-sans">
      <aside className="w-64 bg-sidebar-bg text-white flex flex-col shrink-0">
        <div className="p-6 border-b border-white/10"><h2 className="text-xl font-bold tracking-wider text-white">SAD</h2><p className="text-xs text-white/50">Solução Administrativa Digital</p></div>
        <nav className="flex-1 overflow-y-auto py-4">
          {menuItems.map((item) => (
            <button key={item.name} onClick={() => { setActiveTab(item.name); setSelectedPessoa(null); setSelectedProtocolo(null); }} className={`w-full flex items-center gap-3 px-6 py-3 transition-colors cursor-pointer ${activeTab === item.name ? 'bg-active-highlight text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}>
              {item.icon}<span className="text-sm font-medium">{item.name}</span>
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 flex flex-col bg-main-bg overflow-hidden">
        <header className="h-16 border-b border-gray-200 flex items-center justify-between px-8 shrink-0">
          <div className="text-sm font-medium text-text-secondary">
            {activeTab} 
            {selectedPessoa ? ` > Dossiê: ${selectedPessoa.nome}` : ''}
            {selectedProtocolo ? ` > Protocolo: ${selectedProtocolo.numero}` : ''}
          </div>
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${isOnline ? 'bg-success/10 text-success' : 'bg-error-expired/10 text-error-expired'}`}>
              {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}{isOnline ? 'ONLINE' : 'OFFLINE'}
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-hidden">
          {activeTab === 'Dashboard' && renderDashboard()}
          {activeTab === 'Pessoas / Dossiês' && renderPessoas()}
          {activeTab === 'Protocolos' && renderProtocolos()}
          {!['Dashboard', 'Pessoas / Dossiês', 'Protocolos'].includes(activeTab) && (
            <div className="p-8 flex items-center justify-center h-full"><p className="text-text-secondary text-lg">Seção {activeTab} em desenvolvimento.</p></div>
          )}
        </div>
      </main>

      {/* Modal Pessoa */}
      {isPessoaFormOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-surface-card"><h2 className="text-xl font-bold text-sidebar-bg">{pessoaFormData.id ? 'Editar Pessoa' : 'Nova Pessoa'}</h2><button onClick={() => setIsPessoaFormOpen(false)} className="text-text-secondary hover:text-text-main">✕</button></div>
            <form onSubmit={handleSavePessoa} className="p-8 overflow-y-auto space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2"><label className="block text-xs font-bold text-text-secondary uppercase mb-1">Nome Completo *</label><input required className="w-full p-3 bg-surface-card border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-btn/20 outline-none" value={pessoaFormData.nome} onChange={e => setPessoaFormData({...pessoaFormData, nome: e.target.value})} /></div>
                <div><label className="block text-xs font-bold text-text-secondary uppercase mb-1">CPF</label><input className="w-full p-3 bg-surface-card border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-btn/20 outline-none" value={pessoaFormData.cpf} onChange={e => setPessoaFormData({...pessoaFormData, cpf: e.target.value})} /></div>
                <div><label className="block text-xs font-bold text-text-secondary uppercase mb-1">Telefone</label><input className="w-full p-3 bg-surface-card border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-btn/20 outline-none" value={pessoaFormData.telefone} onChange={e => setPessoaFormData({...pessoaFormData, telefone: e.target.value})} /></div>
                <div className="col-span-2"><label className="block text-xs font-bold text-text-secondary uppercase mb-1">E-mail</label><input type="email" className="w-full p-3 bg-surface-card border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-btn/20 outline-none" value={pessoaFormData.email} onChange={e => setPessoaFormData({...pessoaFormData, email: e.target.value})} /></div>
                <div className="col-span-2"><label className="block text-xs font-bold text-text-secondary uppercase mb-1">Órgão / Empresa</label><input className="w-full p-3 bg-surface-card border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-btn/20 outline-none" value={pessoaFormData.orgao} onChange={e => setPessoaFormData({...pessoaFormData, orgao: e.target.value})} /></div>
                <div className="col-span-2"><label className="block text-xs font-bold text-text-secondary uppercase mb-1">Endereço</label><input className="w-full p-3 bg-surface-card border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-btn/20 outline-none" value={pessoaFormData.endereco} onChange={e => setPessoaFormData({...pessoaFormData, endereco: e.target.value})} /></div>
                <div className="col-span-2"><label className="block text-xs font-bold text-text-secondary uppercase mb-1">Observações</label><textarea rows={3} className="w-full p-3 bg-surface-card border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-btn/20 outline-none resize-none" value={pessoaFormData.observacoes} onChange={e => setPessoaFormData({...pessoaFormData, observacoes: e.target.value})} /></div>
              </div>
              <div className="flex justify-end gap-4 pt-4"><button type="button" onClick={() => setIsPessoaFormOpen(false)} className="px-6 py-3 text-text-secondary font-bold hover:text-text-main">Cancelar</button><button type="submit" className="px-8 py-3 bg-primary-btn text-white rounded-lg font-bold hover:opacity-90 shadow-lg">Salvar Pessoa</button></div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Protocolo */}
      {isProtocoloFormOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-surface-card"><h2 className="text-xl font-bold text-sidebar-bg">{protocoloFormData.id ? 'Editar Protocolo' : 'Novo Protocolo'}</h2><button onClick={() => setIsProtocoloFormOpen(false)} className="text-text-secondary hover:text-text-main">✕</button></div>
            <form onSubmit={handleSaveProtocolo} className="p-8 overflow-y-auto space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1">Pessoa Vinculada *</label>
                  <select 
                    required 
                    className="w-full p-3 bg-surface-card border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-btn/20 outline-none"
                    value={protocoloFormData.pessoa_id}
                    onChange={e => setProtocoloFormData({...protocoloFormData, pessoa_id: Number(e.target.value)})}
                  >
                    <option value="">Selecione uma pessoa...</option>
                    {pessoas.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                  </select>
                </div>
                <div><label className="block text-xs font-bold text-text-secondary uppercase mb-1">Número do Protocolo *</label><input required className="w-full p-3 bg-surface-card border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-btn/20 outline-none" value={protocoloFormData.numero} onChange={e => setProtocoloFormData({...protocoloFormData, numero: e.target.value})} /></div>
                <div><label className="block text-xs font-bold text-text-secondary uppercase mb-1">Assunto *</label><input required className="w-full p-3 bg-surface-card border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-btn/20 outline-none" value={protocoloFormData.assunto} onChange={e => setProtocoloFormData({...protocoloFormData, assunto: e.target.value})} /></div>
                <div><label className="block text-xs font-bold text-text-secondary uppercase mb-1">Data de Entrada</label><input type="date" className="w-full p-3 bg-surface-card border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-btn/20 outline-none" value={protocoloFormData.data_entrada} onChange={e => setProtocoloFormData({...protocoloFormData, data_entrada: e.target.value})} /></div>
                <div><label className="block text-xs font-bold text-text-secondary uppercase mb-1">Prazo Final</label><input type="date" className="w-full p-3 bg-surface-card border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-btn/20 outline-none" value={protocoloFormData.prazo} onChange={e => setProtocoloFormData({...protocoloFormData, prazo: e.target.value})} /></div>
                <div className="col-span-2"><label className="block text-xs font-bold text-text-secondary uppercase mb-1">Descrição Detalhada</label><textarea rows={4} className="w-full p-3 bg-surface-card border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-btn/20 outline-none resize-none" value={protocoloFormData.descricao} onChange={e => setProtocoloFormData({...protocoloFormData, descricao: e.target.value})} /></div>
              </div>
              <div className="flex justify-end gap-4 pt-4"><button type="button" onClick={() => setIsProtocoloFormOpen(false)} className="px-6 py-3 text-text-secondary font-bold hover:text-text-main">Cancelar</button><button type="submit" className="px-8 py-3 bg-primary-btn text-white rounded-lg font-bold hover:opacity-90 shadow-lg">Salvar Protocolo</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
