import { useEffect, useRef, useState } from 'react'
import { useStream } from '../../hooks/useStream'
import { MessageBubble } from './MessageBubble'
import { InputBar } from './InputBar'
import { api, endpoints } from '../../lib/api'
import { Document } from '../../types'

const QUESTIONS_BY_TITLE: Record<string, string[]> = {
    'axios': ['How do I make a POST request with axios?', 'How do I handle errors in axios?', 'How do I cancel a request in axios?'],
    'zod': ['How do I validate an email with zod?', 'How do I parse an object schema with zod?', 'How do I handle validation errors in zod?'],
    'README': ['How do I add middleware in Express?', 'How do I handle errors in Express?', 'How do I define routes in Express?'],
    'Readme': ['How do I add middleware in Express?', 'How do I handle errors in Express?', 'How do I define routes in Express?'],
    'error-handling': ['How do I handle errors in Express?', 'How do I create a custom error handler?'],
    'routing': ['How do I define routes in Express?', 'How do I use route parameters?'],
    'using-middleware': ['How do I add middleware in Express?', 'What is application-level middleware?']
}

export const ChatWindow = () => {
    const [mode, setMode] = useState<'rag' | 'agent'>('rag')
    const ragStream = useStream('/api/query')
    const agentStream = useStream('/api/agent')
    const { messages, isLoading, sendQuestion, clearMessages } = mode === 'agent' ? agentStream : ragStream
    const bottomRef = useRef<HTMLDivElement>(null)
    const [suggestions, setSuggestions] = useState<string[]>([])

    useEffect(() => {
        const fetchSuggestions = async () => {
            try {
                const { data } = await api.get<Document[]>(endpoints.documents)
                const readyDocs = data.filter(d => d.status === 'ready')

                const allSuggestions: string[] = []
                for (const doc of readyDocs) {
                    const questions = QUESTIONS_BY_TITLE[doc.title]
                    if (questions) {
                        allSuggestions.push(...questions)
                    }
                }

                const unique = [...new Set(allSuggestions)].slice(0, 4)

                if (unique.length === 0) {
                    setSuggestions(readyDocs.slice(0, 3).map(d =>
                        `What is ${d.title} and how do I get started?`
                    ))
                } else {
                    setSuggestions(unique)
                }
            } catch {
                setSuggestions([
                    'How do I make a POST request with axios?',
                    'How do I handle errors in axios?'
                ])
            }
        }
        fetchSuggestions()
    }, [])

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    return (
        <div className="flex flex-col h-full">

            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Lore</h1>
                    <p className="text-sm text-gray-500">Ask questions about your docs</p>
                </div>
                <div className="flex items-center gap-3">

                    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                        <button
                            onClick={() => setMode('rag')}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${mode === 'rag'
                                ? 'bg-white text-gray-800 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            RAG
                        </button>
                        <button
                            onClick={() => setMode('agent')}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${mode === 'agent'
                                ? 'bg-white text-gray-800 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            🤖 Agent
                        </button>
                    </div>

                    {messages.length > 0 && (
                        <button
                            onClick={clearMessages}
                            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            Clear chat
                        </button>
                    )}
                </div>
            </div>

            {mode === 'agent' && (
                <div className="px-6 py-2 bg-amber-50 border-b border-amber-100">
                    <p className="text-xs text-amber-700">
                        🤖 Agent mode — can search multiple times, ingest new repos, and reason across steps
                    </p>
                </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-6">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="w-16 h-16 rounded-2xl bg-gray-800 flex items-center justify-center text-white text-2xl font-bold mb-4">
                            L
                        </div>
                        <h2 className="text-xl font-semibold text-gray-800 mb-2">
                            Welcome to Lore
                        </h2>
                        <p className="text-gray-500 max-w-sm">
                            Ask any question about your ingested GitHub repositories and documentation.
                        </p>
                        {suggestions.length > 0 && (
                            <div className="mt-6 flex flex-col gap-2 w-full max-w-sm">
                                {suggestions.map(suggestion => (
                                    <button
                                        key={suggestion}
                                        onClick={() => sendQuestion(suggestion)}
                                        className="text-left px-4 py-3 rounded-xl border border-gray-200
                      hover:border-blue-300 hover:bg-blue-50 text-sm text-gray-600
                      transition-colors"
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="max-w-4xl mx-auto">
                        {messages.map(message => (
                            <MessageBubble key={message.id} message={message} />
                        ))}
                        <div ref={bottomRef} />
                    </div>
                )}
            </div>

            <InputBar onSend={sendQuestion} isLoading={isLoading} />
        </div>
    )
}