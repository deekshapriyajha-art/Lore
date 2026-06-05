import { useState } from 'react'
import { ChatWindow } from './components/chat/ChatWindow'
import { AdminPanel } from './components/admin/AdminPanel'

type Tab = 'chat' | 'admin'

const App = () => {
    const [activeTab, setActiveTab] = useState<Tab>('chat')

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            <nav className="flex border-b border-gray-200 bg-white px-4">
                {(['chat', 'admin'] as Tab[]).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors capitalize
              ${activeTab === tab
                                ? 'border-gray-800 text-gray-800'
                                : 'border-transparent text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        {tab === 'chat' ? '💬 Chat' : '⚙️ Admin'}
                    </button>
                ))}
            </nav>

            <main className="flex-1 overflow-hidden">
                {activeTab === 'chat' && <ChatWindow />}
                {activeTab === 'admin' && <AdminPanel />}
            </main>
        </div>
    )
}

export default App