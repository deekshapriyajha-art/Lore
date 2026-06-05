import { useState, useCallback } from "react";
import { Message, Source } from "../types";

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function useStream() {
    const [messages, setMessages] = useState<Message[]>([])
    const [isLoading, setIsLoading] = useState(false)

    const sendQuestion = useCallback(async (question: string) => {

        const userMessage: Message = {
            id: crypto.randomUUID(),
            role: 'user',
            content: question
        }

        const assistantMessage: Message = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: '',
            isStreaming: true
        }

        setMessages(prev => [...prev, userMessage, assistantMessage])
        setIsLoading(true)

        try {
            const response = await fetch(`${BASE_URL}/api/query`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question })
            })

            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status}`)
            }

            const reader = response.body!.getReader()
            const decoder = new TextDecoder()

            while (true) {
                const { done, value } = await reader.read()

                if (done) break

                const chunk = decoder.decode(value)
                const lines = chunk.split('\n').filter(line => line.startsWith('data:'))

                for (const line of lines) {
                    try {
                        const data = JSON.parse(line.replace('data:', '').trim())

                        if (data.type === 'token') {
                            setMessages(prev => prev.map(msg => msg.id === assistantMessage.id ?
                                { ...msg, content: msg.content + data.text } :
                                msg
                            ))
                        }

                        if (data.type === 'sources') {
                            setMessages(prev => prev.map(msg =>
                                msg.id === assistantMessage.id ?
                                    { ...msg, sources: data.sources as Source[] } :
                                    msg
                            ))
                        }

                        if (data.type === 'done') {
                            setMessages(prev => prev.map(msg =>
                                msg.id === assistantMessage.id ?
                                    { ...msg, isStreaming: false }
                                    : msg
                            ))
                        }
                    } catch {
                        //skip
                    }
                }
            }

        } catch (err) {
            setMessages(prev => prev.map(msg =>
                msg.id === assistantMessage.id
                    ? {
                        ...msg,
                        content: 'Sorry, something went wrong. Please try again.',
                        isStreaming: false
                    }
                    : msg
            ))
        } finally {
            setIsLoading(false)
        }
    }, [])

    const clearMessages = useCallback(() => {
        setMessages([])
    }, [])

    return { messages, isLoading, sendQuestion, clearMessages }
}