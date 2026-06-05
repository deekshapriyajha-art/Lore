import { useState, KeyboardEvent } from 'react'

interface Props {
    onSend: (question: string) => void
    isLoading: boolean
}

export const InputBar = ({ onSend, isLoading }: Props) => {
    const [input, setInput] = useState('')

    const handleSend = () => {
        if (!input.trim() || isLoading) return
        onSend(input.trim())
        setInput('')
    }

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    return (
        <div className="border-t border-gray-200 bg-white p-4">
            <div className="flex gap-3 items-end max-w-4xl mx-auto">
                <textarea
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask anything about your ingested docs..."
                    rows={1}
                    disabled={isLoading}
                    className="flex-1 resize-none rounded-xl border border-gray-300 px-4 py-3 text-sm
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            disabled:opacity-50 disabled:cursor-not-allowed
            max-h-32 overflow-y-auto"
                    style={{ minHeight: '44px' }}
                />
                <button
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                    className="flex-shrink-0 w-10 h-10 rounded-xl bg-blue-500 hover:bg-blue-600
            disabled:opacity-50 disabled:cursor-not-allowed
            flex items-center justify-center transition-colors"
                >
                    {isLoading
                        ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        : <span className="text-white text-lg">↑</span>
                    }
                </button>
            </div>
            <p className="text-center text-xs text-gray-400 mt-2">
                Press Enter to send · Shift+Enter for new line
            </p>
        </div>
    )
}