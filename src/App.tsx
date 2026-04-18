import React, { useState, useEffect } from 'react'
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
  FileSearch
} from 'lucide-react'

// Tipagem para a API do Electron exposta no preload
declare global {
  interface Window {
    electronAPI: {
      getDbStatus: () => Promise<string>;
      dbQuery: (payload: { sql: string, params?: any[] }) => Promise<{ success: boolean, data?: any[], error?: string }>;
      dbRun: (payload: { sql: string, params?: any[] }) => Promise<{ success: boolean, error?: string }>;
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

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('Dashboard')
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  
  // Estados para o módulo de Pessoas
  const [pessoas, setPessoas] = useState<Pessoa[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPessoa, setSelectedPessoa] = useState<Pessoa | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formData, setFormData] = useState<Pessoa>({
    nome: '', cpf: '', telefone: '', endereco: '', email: '', orgao: '', observacoes: '', criado_em: '', atualizado_em: ''
  })

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    fetchPessoas()

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const fetchPessoas = async () => {
    const result = await window.electronAPI.dbQuery({ 
      sql: 'SELECT * FROM pessoas ORDER BY nome ASC' 
    })
    if (result.success && result.data) {
      setPessoas(result.data)
    }
  }

  const handleSavePessoa = async (e: React.FormEvent) => {
    e.preventDefault()
    const now = new Date().toISOString()
    
    if (formData.id) {
      // Update
      await window.electronAPI.dbRun({
        sql: `UPDATE pessoas SET 
          nome = ?, cpf = ?, telefone = ?, endereco = ?, email = ?, orgao = ?, observacoes = ?, atualizado_em = ?
          WHERE id = ?`,
        params: [formData.nome, formData.cpf, formData.telefone, formData.endereco, formData.email, formData.orgao, formData.observacoes, now, formData.id]
      })
    } else {
      // Insert
      await window.electronAPI.dbRun({
        sql: `INSERT INTO pessoas (nome, cpf, telefone, endereco, email, orgao, observacoes, criado_em, atualizado_em)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        params: [formData.nome, formData.cpf, formData.telefone, formData.endereco, formData.email, formData.orgao, formData.observacoes, now, now]
      })
    }
    
    setIsFormOpen(false)
    setFormData({ nome: '', cpf: '', telefone: '', endereco: '', email: '', orgao: '', observacoes: '', criado_em: '', atualizado_em: '' })
    fetchPessoas()
    if (selectedPessoa) {
      // Atualizar a pessoa selecionada se estiver editando no dossiê
      const updated = await window.electronAPI.dbQuery({ sql: 'SELECT * FROM pessoas WHERE id = ?', params: [formData.id] })
      if (updated.success && updated.data?.[0]) setSelectedPessoa(updated.data[0])
    }
  }

  const handleDeletePessoa = async (id: number) => {
    if (confirm('Tem certeza que deseja excluir esta pessoa e seu dossiê?')) {
      await window.electronAPI.dbRun({ sql: 'DELETE FROM pessoas WHERE id = ?', params: [id] })
      setSelectedPessoa(null)
      fetchPessoas()
    }
  }

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

  const filteredPessoas = pessoas.filter(p => 
    p.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.orgao?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const renderPessoas = () => {
    if (selectedPessoa) {
      return (
        <div className="p-8 animate-in fade-in duration-300">
          <button 
            onClick={() => setSelectedPessoa(null)}
            className="flex items-center gap-2 text-text-secondary hover:text-primary-btn mb-6 transition-colors"
          >
            <ArrowLeft size={20} /> Voltar para a lista
          </button>

          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-bold text-text-main">{selectedPessoa.nome}</h1>
              <p className="text-text-secondary flex items-center gap-2 mt-1">
                <Building2 size={16} /> {selectedPessoa.orgao || 'Sem órgão/empresa'}
              </p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => { setFormData(selectedPessoa); setIsFormOpen(true); }}
                className="flex items-center gap-2 px-4 py-2 bg-primary-btn text-white rounded-lg hover:opacity-90 transition-opacity"
              >
                <Edit size={18} /> Editar Dados
              </button>
              <button 
                onClick={() => handleDeletePessoa(selectedPessoa.id!)}
                className="flex items-center gap-2 px-4 py-2 bg-error-expired text-white rounded-lg hover:opacity-90 transition-opacity"
              >
                <Trash2 size={18} /> Excluir
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-8">
            {/* Coluna de Dados */}
            <div className="col-span-1 space-y-6">
              <div className="bg-surface-card p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="font-bold mb-4 flex items-center gap-2 text-sidebar-bg">
                  <User size={18} /> Informações de Contato
                </h3>
                <div className="space-y-4 text-sm">
                  <div className="flex items-start gap-3">
                    <Mail className="text-text-secondary shrink-0" size={16} />
                    <div>
                      <p className="text-xs text-text-secondary uppercase font-bold">E-mail</p>
                      <p>{selectedPessoa.email || 'Não informado'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="text-text-secondary shrink-0" size={16} />
                    <div>
                      <p className="text-xs text-text-secondary uppercase font-bold">Telefone</p>
                      <p>{selectedPessoa.telefone || 'Não informado'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="text-text-secondary shrink-0" size={16} />
                    <div>
                      <p className="text-xs text-text-secondary uppercase font-bold">Endereço</p>
                      <p>{selectedPessoa.endereco || 'Não informado'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <FileSearch className="text-text-secondary shrink-0" size={16} />
                    <div>
                      <p className="text-xs text-text-secondary uppercase font-bold">CPF</p>
                      <p>{selectedPessoa.cpf || 'Não informado'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-surface-card p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="font-bold mb-2 text-sidebar-bg">Observações</h3>
                <p className="text-sm text-text-secondary whitespace-pre-wrap">
                  {selectedPessoa.observacoes || 'Nenhuma observação cadastrada.'}
                </p>
              </div>
            </div>

            {/* Coluna de Vínculos */}
            <div className="col-span-2 space-y-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <FileText size={18} className="text-primary-btn" /> Protocolos
                </h3>
                <div className="py-8 text-center border-2 border-dashed border-gray-100 rounded-lg">
                  <p className="text-text-secondary italic">Nenhum protocolo vinculado a este dossiê.</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <h3 className="font-bold mb-4 flex items-center gap-2">
                    <Inbox size={18} className="text-deadline-alert" /> Documentos Recebidos
                  </h3>
                  <div className="py-6 text-center border-2 border-dashed border-gray-100 rounded-lg">
                    <p className="text-text-secondary text-sm italic">Nenhum documento.</p>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <h3 className="font-bold mb-4 flex items-center gap-2">
                    <FilePlus size={18} className="text-success" /> Documentos Gerados
                  </h3>
                  <div className="py-6 text-center border-2 border-dashed border-gray-100 rounded-lg">
                    <p className="text-text-secondary text-sm italic">Nenhum documento.</p>
                  </div>
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
          <div>
            <h1 className="text-2xl font-bold text-text-main">Pessoas / Dossiês</h1>
            <p className="text-text-secondary">Gerencie os cadastros e acesse os dossiês completos.</p>
          </div>
          <button 
            onClick={() => {
              setFormData({ nome: '', cpf: '', telefone: '', endereco: '', email: '', orgao: '', observacoes: '', criado_em: '', atualizado_em: '' });
              setIsFormOpen(true);
            }}
            className="flex items-center gap-2 bg-primary-btn text-white px-6 py-3 rounded-lg font-bold hover:opacity-90 transition-opacity shadow-md"
          >
            <Plus size={20} /> Nova Pessoa
          </button>
        </div>

        <div className="mb-6 relative shrink-0">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={20} />
          <input 
            type="text" 
            placeholder="Buscar por nome ou órgão..."
            className="w-full pl-12 pr-4 py-3 bg-surface-card border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-btn/20 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto pr-2">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPessoas.map(pessoa => (
              <div 
                key={pessoa.id}
                onClick={() => setSelectedPessoa(pessoa)}
                className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-primary-btn/30 cursor-pointer transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-surface-card rounded-full flex items-center justify-center text-primary-btn group-hover:bg-primary-btn group-hover:text-white transition-colors">
                    <User size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-text-main truncate">{pessoa.nome}</h3>
                    <p className="text-xs text-text-secondary truncate">{pessoa.orgao || 'Sem órgão vinculado'}</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center text-xs text-text-secondary">
                  <span>{pessoa.email || 'Sem e-mail'}</span>
                  <span className="text-primary-btn font-bold opacity-0 group-hover:opacity-100 transition-opacity">Ver Dossiê →</span>
                </div>
              </div>
            ))}
            {filteredPessoas.length === 0 && (
              <div className="col-span-full py-20 text-center">
                <Users size={48} className="mx-auto text-gray-200 mb-4" />
                <p className="text-text-secondary">Nenhuma pessoa encontrada.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const renderContent = () => {
    if (activeTab === 'Dashboard') {
      return (
        <div className="p-8">
          <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Protocolos em aberto', value: 0, color: 'border-primary-btn' },
              { label: 'Prazos vencendo', value: 0, color: 'border-deadline-alert' },
              { label: 'Prazos vencidos', value: 0, color: 'border-error-expired' },
              { label: 'Concluídos no mês', value: 0, color: 'border-success' },
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
    
    if (activeTab === 'Pessoas / Dossiês') {
      return renderPessoas()
    }

    return (
      <div className="p-8 flex items-center justify-center h-full">
        <p className="text-text-secondary text-lg">Seção {activeTab} em desenvolvimento.</p>
      </div>
    )
  }

  return (
    <div className="flex h-screen w-full overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar-bg text-white flex flex-col shrink-0">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-xl font-bold tracking-wider text-white">SAD</h2>
          <p className="text-xs text-white/50">Solução Administrativa Digital</p>
        </div>
        <nav className="flex-1 overflow-y-auto py-4">
          {menuItems.map((item) => (
            <button
              key={item.name}
              onClick={() => { setActiveTab(item.name); setSelectedPessoa(null); }}
              className={`w-full flex items-center gap-3 px-6 py-3 transition-colors cursor-pointer ${
                activeTab === item.name 
                ? 'bg-active-highlight text-white' 
                : 'text-white/70 hover:bg-white/5 hover:text-white'
              }`}
            >
              {item.icon}
              <span className="text-sm font-medium">{item.name}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col bg-main-bg overflow-hidden">
        {/* Topbar */}
        <header className="h-16 border-b border-gray-200 flex items-center justify-between px-8 shrink-0">
          <div className="text-sm font-medium text-text-secondary">
            {activeTab} {selectedPessoa ? `> Dossiê: ${selectedPessoa.nome}` : ''}
          </div>
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${
              isOnline ? 'bg-success/10 text-success' : 'bg-error-expired/10 text-error-expired'
            }`}>
              {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
              {isOnline ? 'ONLINE' : 'OFFLINE'}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {renderContent()}
        </div>
      </main>

      {/* Modal Formulário */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-surface-card">
              <h2 className="text-xl font-bold text-sidebar-bg">
                {formData.id ? 'Editar Pessoa' : 'Nova Pessoa'}
              </h2>
              <button onClick={() => setIsFormOpen(false)} className="text-text-secondary hover:text-text-main">✕</button>
            </div>
            <form onSubmit={handleSavePessoa} className="p-8 overflow-y-auto space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1">Nome Completo *</label>
                  <input 
                    required
                    className="w-full p-3 bg-surface-card border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-btn/20 outline-none"
                    value={formData.nome}
                    onChange={e => setFormData({...formData, nome: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1">CPF</label>
                  <input 
                    className="w-full p-3 bg-surface-card border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-btn/20 outline-none"
                    value={formData.cpf}
                    onChange={e => setFormData({...formData, cpf: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1">Telefone</label>
                  <input 
                    className="w-full p-3 bg-surface-card border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-btn/20 outline-none"
                    value={formData.telefone}
                    onChange={e => setFormData({...formData, telefone: e.target.value})}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1">E-mail</label>
                  <input 
                    type="email"
                    className="w-full p-3 bg-surface-card border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-btn/20 outline-none"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1">Órgão / Empresa</label>
                  <input 
                    className="w-full p-3 bg-surface-card border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-btn/20 outline-none"
                    value={formData.orgao}
                    onChange={e => setFormData({...formData, orgao: e.target.value})}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1">Endereço</label>
                  <input 
                    className="w-full p-3 bg-surface-card border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-btn/20 outline-none"
                    value={formData.endereco}
                    onChange={e => setFormData({...formData, endereco: e.target.value})}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1">Observações</label>
                  <textarea 
                    rows={3}
                    className="w-full p-3 bg-surface-card border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-btn/20 outline-none resize-none"
                    value={formData.observacoes}
                    onChange={e => setFormData({...formData, observacoes: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-6 py-3 text-text-secondary font-bold hover:text-text-main"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-8 py-3 bg-primary-btn text-white rounded-lg font-bold hover:opacity-90 shadow-lg"
                >
                  Salvar Pessoa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
