import React, { useState, useMemo } from 'react'
import { Plus, ArrowLeft, Edit, Trash2, User, Building2, Mail, Phone, MapPin, FileSearch, FileText, Inbox, FilePlus, Download, ExternalLink, Search } from 'lucide-react'
import { Pessoa, Protocolo, DocumentoRecebido, DocumentoGerado } from '../types'

interface PessoasProps {
  pessoas: Pessoa[]
  protocolos: Protocolo[]
  documentos: DocumentoRecebido[]
  documentosGerados: DocumentoGerado[]
  selectedPessoa: Pessoa | null
  onSelectPessoa: (pessoa: Pessoa | null) => void
  onSavePessoa: (pessoa: Pessoa) => void
  onDeletePessoa: (id: number) => void
  onImportDoc: () => void
  onOpenFile: (path: string) => void
  onDeleteDoc: (id: number) => void
  onDeleteDocGerado: (id: number) => void
  onNewDocGerado: (pessoa: Pessoa) => void
  formatDate: (dateStr: string) => string
}

export const Pessoas: React.FC<PessoasProps> = ({
  pessoas,
  protocolos,
  documentos,
  documentosGerados,
  selectedPessoa,
  onSelectPessoa,
  onSavePessoa,
  onDeletePessoa,
  onImportDoc,
  onOpenFile,
  onDeleteDoc,
  onDeleteDocGerado,
  onNewDocGerado,
  formatDate,
}) => {
  const [searchPessoa, setSearchPessoa] = useState('')
  const [isPessoaFormOpen, setIsPessoaFormOpen] = useState(false)
  const [pessoaFormData, setPessoaFormData] = useState<Pessoa>({
    nome: '', cpf: '', telefone: '', endereco: '', email: '', orgao: '', observacoes: '', criado_em: '', atualizado_em: ''
  })

  const filteredPessoas = useMemo(() => pessoas.filter(p => 
    p.nome.toLowerCase().includes(searchPessoa.toLowerCase()) || 
    p.orgao?.toLowerCase().includes(searchPessoa.toLowerCase())
  ), [pessoas, searchPessoa])

  const pessoaProtocolos = useMemo(() => {
    if (!selectedPessoa) return []
    return protocolos.filter(pr => pr.pessoa_id === selectedPessoa.id)
  }, [protocolos, selectedPessoa])

  const pessoaDocumentos = useMemo(() => {
    if (!selectedPessoa) return []
    return documentos.filter(d => d.pessoa_id === selectedPessoa.id)
  }, [documentos, selectedPessoa])

  const pessoaDocsGerados = useMemo(() => {
    if (!selectedPessoa) return []
    return documentosGerados.filter(dg => dg.pessoa_id === selectedPessoa.id)
  }, [documentosGerados, selectedPessoa])

  const handleSavePessoa = async (e: React.FormEvent) => {
    e.preventDefault()
    onSavePessoa(pessoaFormData)
    setIsPessoaFormOpen(false)
  }

  const getFileIcon = (type: string) => {
    const t = type.toLowerCase()
    if (['jpg', 'jpeg', 'png'].includes(t)) return '🖼️'
    if (t === 'pdf') return '📄'
    if (t === 'docx' || t === 'doc') return '📝'
    return '📋'
  }

  if (selectedPessoa) {
    return (
      <div className="p-8 animate-in fade-in duration-300 h-full overflow-y-auto">
        <button onClick={() => onSelectPessoa(null)} className="flex items-center gap-2 text-text-secondary hover:text-primary-btn mb-6 transition-colors">
          <ArrowLeft size={20} /> Voltar para a lista
        </button>
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-text-main">{selectedPessoa.nome}</h1>
            <p className="text-text-secondary flex items-center gap-2 mt-1"><Building2 size={16} /> {selectedPessoa.orgao || 'Sem órgão/empresa'}</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => { setPessoaFormData(selectedPessoa); setIsPessoaFormOpen(true); }} className="flex items-center gap-2 px-4 py-2 bg-primary-btn text-white rounded-lg hover:opacity-90 transition-opacity"><Edit size={18} /> Editar Dados</button>
            <button onClick={() => onDeletePessoa(selectedPessoa.id!)} className="flex items-center gap-2 px-4 py-2 bg-error-expired text-white rounded-lg hover:opacity-90 transition-opacity"><Trash2 size={18} /> Excluir</button>
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
                    <div key={pr.id} className="p-4 border border-gray-100 rounded-lg hover:border-primary-btn/30 transition-all flex justify-between items-center">
                      <div>
                        <p className="font-bold text-sm">{pr.numero} - {pr.assunto}</p>
                        <p className="text-xs text-text-secondary">Entrada: {formatDate(pr.data_entrada)}</p>
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
            <div className="grid grid-cols-1 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold flex items-center gap-2"><Inbox size={18} className="text-deadline-alert" /> Documentos Recebidos</h3>
                  <button onClick={onImportDoc} className="flex items-center gap-1 text-xs font-bold bg-deadline-alert/10 text-deadline-alert px-3 py-1.5 rounded-lg hover:bg-deadline-alert/20 transition-colors"><Download size={14} /> Importar Documento</button>
                </div>
                {pessoaDocumentos.length > 0 ? (
                  <div className="space-y-3">
                    {pessoaDocumentos.map(doc => (
                      <div key={doc.id} className="p-4 border border-gray-100 rounded-lg flex items-center gap-4 group hover:border-deadline-alert/30 transition-all">
                        <div className="w-10 h-10 bg-surface-card rounded flex items-center justify-center shrink-0 text-lg">{getFileIcon(doc.tipo)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-sm truncate">{doc.nome}</p>
                            {doc.protocolo_numero && <span className="text-[10px] bg-gray-100 text-text-secondary px-1.5 py-0.5 rounded font-bold">PROT: {doc.protocolo_numero}</span>}
                          </div>
                          <p className="text-xs text-text-secondary truncate">{doc.descricao || 'Sem descrição'}</p>
                          <p className="text-[10px] text-text-secondary mt-1 uppercase font-bold">{formatDate(doc.data_recebimento)}</p>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => onOpenFile(doc.caminho)} className="p-2 text-primary-btn hover:bg-primary-btn/10 rounded" title="Abrir Arquivo"><ExternalLink size={18} /></button>
                          <button onClick={() => onDeleteDoc(doc.id!)} className="p-2 text-error-expired hover:bg-error-expired/10 rounded" title="Remover Registro"><Trash2 size={18} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center border-2 border-dashed border-gray-100 rounded-lg"><p className="text-text-secondary text-sm italic">Nenhum documento recebido.</p></div>
                )}
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold flex items-center gap-2"><FilePlus size={18} className="text-success" /> Documentos Gerados</h3>
                  <button onClick={() => onNewDocGerado(selectedPessoa)} className="flex items-center gap-1 text-xs font-bold bg-success/10 text-success px-3 py-1.5 rounded-lg hover:bg-success/20 transition-colors"><Plus size={14} /> Novo Documento</button>
                </div>
                {pessoaDocsGerados.length > 0 ? (
                  <div className="space-y-3">
                    {pessoaDocsGerados.map(dg => (
                      <div key={dg.id} className="p-4 border border-gray-100 rounded-lg flex items-center gap-4 group hover:border-success/30 transition-all">
                        <div className="w-10 h-10 bg-surface-card rounded flex items-center justify-center shrink-0"><FileText className="text-success" size={20} /></div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-sm truncate">{dg.titulo}</p>
                            <span className="text-[10px] bg-success/10 text-success px-1.5 py-0.5 rounded font-bold uppercase">{dg.tipo}</span>
                          </div>
                          <p className="text-xs text-text-secondary truncate">{dg.caminho ? 'Exportado' : 'Rascunho'}</p>
                          <p className="text-[10px] text-text-secondary mt-1 uppercase font-bold">{formatDate(dg.data_geracao)}</p>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {dg.caminho && <button onClick={() => onOpenFile(dg.caminho!)} className="p-2 text-success hover:bg-success/10 rounded" title="Abrir no Word"><ExternalLink size={18} /></button>}
                          <button onClick={() => onDeleteDocGerado(dg.id!)} className="p-2 text-error-expired hover:bg-error-expired/10 rounded" title="Excluir"><Trash2 size={18} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center border-2 border-dashed border-gray-100 rounded-lg"><p className="text-text-secondary text-sm italic">Nenhum documento gerado.</p></div>
                )}
              </div>
            </div>
          </div>
        </div>

        {isPessoaFormOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-surface-card"><h2 className="text-xl font-bold text-sidebar-bg">Editar Pessoa</h2><button onClick={() => setIsPessoaFormOpen(false)} className="text-text-secondary hover:text-text-main">✕</button></div>
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
            <div key={pessoa.id} onClick={() => onSelectPessoa(pessoa)} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-primary-btn/30 cursor-pointer transition-all group">
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

      {isPessoaFormOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-surface-card"><h2 className="text-xl font-bold text-sidebar-bg">Nova Pessoa</h2><button onClick={() => setIsPessoaFormOpen(false)} className="text-text-secondary hover:text-text-main">✕</button></div>
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
    </div>
  )
}
