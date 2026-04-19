import React, { useState, useMemo } from 'react'
import { Plus, CheckSquare, Trash2, Search, Flag } from 'lucide-react'
import { Tarefa } from '../types'

interface TarefasProps {
  tarefas: Tarefa[]
  onSaveTarefa: (tarefa: Tarefa) => void
  onToggleStatus: (id: number, status: string) => void
  onDeleteTarefa: (id: number) => void
  formatDate: (dateStr: string) => string
  getPrazoStatus: (prazo: string) => { label: string; color: string } | null
}

export const Tarefas: React.FC<TarefasProps> = ({
  tarefas,
  onSaveTarefa,
  onToggleStatus,
  onDeleteTarefa,
  formatDate,
  getPrazoStatus,
}) => {
  const [searchTarefa, setSearchTarefa] = useState('')
  const [filterStatus, setFilterStatus] = useState('todos')
  const [filterPrioridade, setFilterPrioridade] = useState('todos')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formData, setFormData] = useState<Tarefa>({
    titulo: '', descricao: '', prioridade: 'media', prazo: '', status: 'pendente', criado_em: '', atualizado_em: ''
  })

  const filteredTarefas = useMemo(() => tarefas.filter(t => {
    const matchSearch = t.titulo.toLowerCase().includes(searchTarefa.toLowerCase())
    const matchStatus = filterStatus === 'todos' || t.status === filterStatus
    const matchPrioridade = filterPrioridade === 'todos' || t.prioridade === filterPrioridade
    return matchSearch && matchStatus && matchPrioridade
  }), [tarefas, searchTarefa, filterStatus, filterPrioridade])

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    onSaveTarefa(formData)
    setIsFormOpen(false)
  }

  const getPrioridadeColor = (prioridade: string) => {
    if (prioridade === 'alta') return 'bg-error-expired/10 text-error-expired'
    if (prioridade === 'media') return 'bg-deadline-alert/10 text-deadline-alert'
    return 'bg-success/10 text-success'
  }

  return (
    <div className="p-4 flex flex-col h-full overflow-hidden">
      <div className="flex justify-between items-center mb-8 shrink-0">
        <div><h1 className="text-2xl font-bold">Tarefas</h1><p className="text-text-secondary">Gerencie suas atividades e prazos.</p></div>
        <button onClick={() => { setFormData({ titulo: '', descricao: '', prioridade: 'media', prazo: '', status: 'pendente', criado_em: '', atualizado_em: '' }); setIsFormOpen(true); }} className="flex items-center gap-2 bg-primary-btn text-white px-6 py-3 rounded-lg font-bold hover:opacity-90 shadow-md"><Plus size={20} /> Nova Tarefa</button>
      </div>
      <div className="mb-6 space-y-4 shrink-0">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={20} />
          <input type="text" placeholder="Buscar tarefa..." className="w-full pl-12 pr-4 py-3 bg-surface-card border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-btn/20" value={searchTarefa} onChange={(e) => setSearchTarefa(e.target.value)} />
        </div>
        <div className="flex gap-4">
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 bg-surface-card border border-gray-200 rounded-lg text-sm font-bold">
            <option value="todos">Todos os Status</option>
            <option value="pendente">Pendente</option>
            <option value="em_andamento">Em Andamento</option>
            <option value="concluida">Concluída</option>
          </select>
          <select value={filterPrioridade} onChange={(e) => setFilterPrioridade(e.target.value)} className="px-3 py-2 bg-surface-card border border-gray-200 rounded-lg text-sm font-bold">
            <option value="todos">Todas as Prioridades</option>
            <option value="alta">Alta</option>
            <option value="media">Média</option>
            <option value="baixa">Baixa</option>
          </select>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto pr-2">
        <div className="space-y-3">
          {filteredTarefas.map(t => {
            const prazoStatus = getPrazoStatus(t.prazo)
            return (
              <div key={t.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex items-center gap-4 group">
                <button onClick={() => onToggleStatus(t.id!, t.status)} className={`p-2 rounded-lg shrink-0 transition-colors ${t.status === 'concluida' ? 'bg-success/10 text-success' : 'bg-gray-100 text-text-secondary hover:bg-primary-btn/10 hover:text-primary-btn'}`}>
                  <CheckSquare size={20} />
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`font-bold text-sm ${t.status === 'concluida' ? 'line-through text-text-secondary' : 'text-text-main'}`}>{t.titulo}</p>
                  <p className="text-xs text-text-secondary truncate mt-1">{t.descricao}</p>
                  <p className="text-xs text-text-secondary mt-2">{t.pessoa_nome || 'Sem vínculo'}</p>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${getPrioridadeColor(t.prioridade)}`}>{t.prioridade.toUpperCase()}</span>
                  {t.prazo && <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${prazoStatus?.color || 'bg-gray-100 text-gray-400'}`}>{formatDate(t.prazo)}</span>}
                  <button onClick={() => onDeleteTarefa(t.id!)} className="p-2 text-error-expired hover:bg-error-expired/10 rounded"><Trash2 size={18} /></button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
