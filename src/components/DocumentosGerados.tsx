import React, { useState, useMemo } from 'react'
import { FilePlus, ExternalLink, Trash2, Search } from 'lucide-react'
import { DocumentoGerado, Pessoa } from '../types'

interface DocumentosGeradosProps {
  documentosGerados: DocumentoGerado[]
  pessoas: Pessoa[]
  onOpenFile: (path: string) => void
  onDeleteDocGerado: (id: number) => void
  onSelectPessoa: (pessoa: Pessoa) => void
  onNavigate: (tab: string) => void
  formatDate: (dateStr: string) => string
}

export const DocumentosGerados: React.FC<DocumentosGeradosProps> = ({
  documentosGerados,
  pessoas,
  onOpenFile,
  onDeleteDocGerado,
  onSelectPessoa,
  onNavigate,
  formatDate,
}) => {
  const [searchDoc, setSearchDoc] = useState('')

  const filteredDocs = useMemo(() => documentosGerados.filter(d => 
    d.titulo.toLowerCase().includes(searchDoc.toLowerCase()) ||
    d.tipo.toLowerCase().includes(searchDoc.toLowerCase()) ||
    d.pessoa_nome?.toLowerCase().includes(searchDoc.toLowerCase())
  ), [documentosGerados, searchDoc])

  return (
    <div className="p-8 flex flex-col h-full overflow-hidden">
      <div className="mb-8 shrink-0"><h1 className="text-2xl font-bold">Documentos Gerados</h1><p className="text-text-secondary">Todos os documentos criados no sistema.</p></div>
      <div className="mb-6 relative shrink-0">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={20} />
        <input type="text" placeholder="Buscar por título, tipo ou pessoa..." className="w-full pl-12 pr-4 py-3 bg-surface-card border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-btn/20" value={searchDoc} onChange={(e) => setSearchDoc(e.target.value)} />
      </div>
      <div className="flex-1 overflow-y-auto pr-2">
        <div className="space-y-3">
          {filteredDocs.map(doc => (
            <div key={doc.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex items-center gap-4 group">
              <div className="w-12 h-12 bg-surface-card rounded flex items-center justify-center shrink-0"><FilePlus className="text-success" size={24} /></div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm">{doc.titulo}</p>
                <p className="text-xs text-text-secondary truncate">{doc.pessoa_nome} • {doc.tipo.toUpperCase()} • {doc.caminho ? 'Exportado' : 'Rascunho'}</p>
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {doc.caminho && <button onClick={() => onOpenFile(doc.caminho!)} className="p-2 text-success hover:bg-success/10 rounded" title="Abrir"><ExternalLink size={18} /></button>}
                <button onClick={() => onDeleteDocGerado(doc.id!)} className="p-2 text-error-expired hover:bg-error-expired/10 rounded" title="Excluir"><Trash2 size={18} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
