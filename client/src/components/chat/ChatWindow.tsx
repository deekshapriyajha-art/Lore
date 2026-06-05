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
    const { messages, isLoading, sendQuestion, clearMessages } = useStream()
    const bottomRef = useRef<HTMLDivElement>(null)
    const [suggestions, setSuggestions] = useState<string[]>([])

    useEffect(() => {
        const fetchSuggestions = async () => {
            try {
                const { data } = await api.get<Document[]>(endpoints.documents)
                const readyDocs = data.filter(d => d.status === 'ready')

                // Build suggestions from known questions for each doc
                const allSuggestions: string[] = []
                for (const doc of readyDocs) {
                    const questions = QUESTIONS_BY_TITLE[doc.title]
                    if (questions) {
                        allSuggestions.push(...questions)
                    }
                }

                // Deduplicate and take first 4
                const unique = [...new Set(allSuggestions)].slice(0, 4)

                // Fallback if nothing matched
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
                {messages.length > 0 && (
                    <button
                        onClick={clearMessages}
                        className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        Clear chat
                    </button>
                )}
            </div>

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
                                {
                                    suggestions.map(suggestion => (
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