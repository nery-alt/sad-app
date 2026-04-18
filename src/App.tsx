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
  WifiOff
} from 'lucide-react'

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('Dashboard')
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

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
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <p className="text-text-secondary text-lg">Seção {activeTab} em desenvolvimento.</p>
      </div>
    )
  }

  return (
    <div className="flex h-screen w-full overflow-hidden">
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
              onClick={() => setActiveTab(item.name)}
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
            {activeTab}
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
        <div className="flex-1 overflow-y-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  )
}

export default App
