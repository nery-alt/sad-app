import React, { useState, useMemo } from 'react'
import { Plus, ArrowLeft, FileText, Calendar, History, Send, Trash2, Clock, CheckCircle2, AlertCircle, Search } from 'lucide-react'
import { Protocolo, Pessoa, Movimentacao } from '../types'

interface ProtocolosProps {
  protocolos: Protocolo[]
  pessoas: Pessoa[]
  selectedProtocolo: Protocolo | null
  onSelectProtocolo: (protocolo: Protocolo | null) => void
  onSaveProtocolo: (protocolo: Protocolo) => void
  onUpdateStatus: (id: number, status: string) => void
  onAddMovimentacao: (id: number, texto: string) => void
  formatDate: (dateStr: string) => string
  getPrazoStatus: (prazo: string) => { label: string; color: string } | null
}

export const Protocolos: React.FC<ProtocolosProps> = ({
  protocolos,
  pessoas,
  selectedProtocolo,
  onSelectProtocolo,
  onSaveProtocolo,
  onUpdateStatus,
  onAddMovimentacao,
  formatDate,
  getPrazoStatus,
}) => {
  const [searchProtocolo, setSearchProtocolo] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formData, setFormData] = useState<Protocolo>({
    pessoa_id: 0, numero: '', assunto: '', descricao: '', data_entrada: '', prazo: '', status: 'aberto', historico: '[]', criado_em: '', atualizado_em: ''
  })
  const [novaMovimentacao, setNovaMovimentacao] = useState('')

  const filteredProtocolos = useMemo(() => protocolos.filter(p => 
    p.numero.toLowerCase().includes(searchProtocolo.toLowerCase()) ||
    p.assunto.toLowerCase().includes(searchProtocolo.toLowerCase()) ||
    p.pessoa_nome?.toLowerCase().includes(searchProtocolo.toLowerCase())
  ), [protocolos, searchProtocolo])

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    onSaveProtocolo(formData)
    setIsFormOpen(false)
  }

  if (selectedProtocolo) {
    const historico: Movimentacao[] = JSON.parse(selectedProtocolo.historico || '[]')
    const prazoStatus = getPrazoStatus(selectedProtocolo.prazo)

    return (
      <div className="p-4 h-full overflow-y-auto">
        <button onClick={() => onSelectProtocolo(null)} className="flex items-center gap-2 text-primary-btn mb-6 hover:opacity-80">
          <ArrowLeft size={20} /> Voltar para a lista
        </button>
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold">{selectedProtocolo.numero}</h1>
            <p className="text-text-secondary mt-1">{selectedProtocolo.assunto}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 space-y-6">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <h3 className="font-bold mb-4">Informações do Protocolo</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-text-secondary text-xs uppercase font-bold mb-1">Pessoa</p><p className="font-bold">{selectedProtocolo.pessoa_nome}</p></div>
                <div><p className="text-text-secondary text-xs uppercase font-bold mb-1">Data de Entrada</p><p>{formatDate(selectedProtocolo.data_entrada)}</p></div>
                <div className="col-span-2"><p className="text-text-secondary text-xs uppercase font-bold mb-1">Descrição</p><p>{selectedProtocolo.descricao || 'Sem descrição'}</p></div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <h3 className="font-bold mb-4 flex items-center gap-2"><History size={18} /> Histórico de Movimentações</h3>
              <div className="space-y-4 mb-6">
                {historico.length > 0 ? historico.map((mov, idx) => (
                  <div key={idx} className="p-4 border border-gray-100 rounded-lg">
                    <p className="text-xs text-text-secondary uppercase font-bold mb-1">{formatDate(mov.data)}</p>
                    <p className="text-sm">{mov.texto}</p>
                  </div>
                )) : <p className="text-text-secondary italic">Nenhuma movimentação registrada.</p>}
              </div>
              <div className="flex gap-2">
                <input type="text" placeholder="Adicionar movimentação..." className="flex-1 p-2 border border-gray-200 rounded-lg text-sm" value={novaMovimentacao} onChange={(e) => setNovaMovimentacao(e.target.value)} />
                <button onClick={() => { onAddMovimentacao(selectedProtocolo.id!, novaMovimentacao); setNovaMovimentacao(''); }} className="px-3 py-2 bg-primary-btn text-white rounded-lg text-sm font-bold hover:opacity-90"><Send size={16} /></button>
              </div>
            </div>
          </div>
          <div className="col-span-1 space-y-6">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <h3 className="font-bold mb-4">Status</h3>
              <select value={selectedProtocolo.status} onChange={(e) => onUpdateStatus(selectedProtocolo.id!, e.target.value)} className="w-full p-3 border border-gray-200 rounded-lg text-sm mb-4">
                <option value="aberto">Aberto</option>
                <option value="em_andamento">Em Andamento</option>
                <option value="concluido">Concluído</option>
              </select>
              <div className="text-xs font-bold uppercase text-text-secondary mb-2">Prazo</div>
              <div className={`p-4 rounded-lg text-center font-bold ${prazoStatus?.color || 'bg-gray-100 text-gray-400'}`}>
                {formatDate(selectedProtocolo.prazo)}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 flex flex-col h-full overflow-hidden">
      <div className="flex justify-between items-center mb-8 shrink-0">
        <div><h1 className="text-2xl font-bold">Protocolos</h1><p className="text-text-secondary">Gerencie todos os processos administrativos.</p></div>
        <button onClick={() => { setFormData({ pessoa_id: 0, numero: '', assunto: '', descricao: '', data_entrada: '', prazo: '', status: 'aberto', historico: '[]', criado_em: '', atualizado_em: '' }); setIsFormOpen(true); }} className="flex items-center gap-2 bg-primary-btn text-white px-6 py-3 rounded-lg font-bold hover:opacity-90 shadow-md"><Plus size={20} /> Novo Protocolo</button>
      </div>
      <div className="mb-6 relative shrink-0">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={20} />
        <input type="text" placeholder="Buscar por número, assunto ou pessoa..." className="w-full pl-12 pr-4 py-3 bg-surface-card border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-btn/20" value={searchProtocolo} onChange={(e) => setSearchProtocolo(e.target.value)} />
      </div>
      <div className="flex-1 overflow-y-auto pr-2">
        <div className="space-y-3">
          {filteredProtocolos.map(pr => {
            const prazoStatus = getPrazoStatus(pr.prazo)
            return (
              <div key={pr.id} onClick={() => onSelectProtocolo(pr)} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-primary-btn/30 cursor-pointer transition-all flex justify-between items-center group">
                <div className="flex-1">
                  <p className="font-bold text-primary-btn">{pr.numero}</p>
                  <p className="text-sm text-text-main font-medium mt-1">{pr.assunto}</p>
                  <p className="text-xs text-text-secondary mt-2">{pr.pessoa_nome} • Entrada: {formatDate(pr.data_entrada)}</p>
                </div>
                <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className={`text-[10px] font-bold px-3 py-0.5.5 rounded ${prazoStatus?.color || 'bg-gray-100 text-gray-400'}`}>{formatDate(pr.prazo)}</div>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${pr.status === 'concluido' ? 'bg-success/10 text-success' : 'bg-primary-btn/10 text-primary-btn'}`}>{pr.status.replace('_', ' ')}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-surface-card"><h2 className="text-xl font-bold">Novo Protocolo</h2><button onClick={() => setIsFormOpen(false)} className="text-text-secondary hover:text-text-main">✕</button></div>
            <form onSubmit={handleSave} className="p-4 overflow-y-auto space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold text-text-secondary uppercase mb-1">Pessoa *</label><select required className="w-full p-3 bg-surface-card border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-btn/20 outline-none" value={formData.pessoa_id} onChange={e => setFormData({...formData, pessoa_id: parseInt(e.target.value)})}>
                  <option value="">Selecione uma pessoa</option>
                  {pessoas.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                </select></div>
                <div><label className="block text-xs font-bold text-text-secondary uppercase mb-1">Número *</label><input required className="w-full p-3 bg-surface-card border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-btn/20 outline-none" value={formData.numero} onChange={e => setFormData({...formData, numero: e.target.value})} /></div>
                <div className="col-span-2"><label className="block text-xs font-bold text-text-secondary uppercase mb-1">Assunto *</label><input required className="w-full p-3 bg-surface-card border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-btn/20 outline-none" value={formData.assunto} onChange={e => setFormData({...formData, assunto: e.target.value})} /></div>
                <div><label className="block text-xs font-bold text-text-secondary uppercase mb-1">Data de Entrada</label><input type="date" className="w-full p-3 bg-surface-card border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-btn/20 outline-none" value={formData.data_entrada} onChange={e => setFormData({...formData, data_entrada: e.target.value})} /></div>
                <div><label className="block text-xs font-bold text-text-secondary uppercase mb-1">Prazo</label><input type="date" className="w-full p-3 bg-surface-card border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-btn/20 outline-none" value={formData.prazo} onChange={e => setFormData({...formData, prazo: e.target.value})} /></div>
                <div className="col-span-2"><label className="block text-xs font-bold text-text-secondary uppercase mb-1">Descrição</label><textarea rows={3} className="w-full p-3 bg-surface-card border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-btn/20 outline-none resize-none" value={formData.descricao} onChange={e => setFormData({...formData, descricao: e.target.value})} /></div>
              </div>
              <div className="flex justify-end gap-4 pt-4"><button type="button" onClick={() => setIsFormOpen(false)} className="px-6 py-3 text-text-secondary font-bold hover:text-text-main">Cancelar</button><button type="submit" className="px-8 py-3 bg-primary-btn text-white rounded-lg font-bold hover:opacity-90 shadow-lg">Salvar Protocolo</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
