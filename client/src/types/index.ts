export interface Message {
    id: string
    role: 'user' | 'assistant'
    content: string
    sources?: Source[]
    isStreaming?: boolean
}

export interface Source {
    title: string
    sourceUrl: string
    heading: string | null
}

export interface Document {
    id: string
    title: string
    source_url: string
    status: 'pending' | 'processing' | 'ready' | 'failed'
    chunk_count: number
    created_at: string
    updated_at: string
}

export interface Job {
    id: string
    source_url: string
    document_id: string | null
    status: 'queued' | 'running' | 'done' | 'failed'
    error: string | null
    started_at: string | null
    finished_at: string | null
    created_at: string
}

export interface ToolCall {
    tool: string
    args: Record<string, unknown>
    status: 'running' | 'done' | 'failed'
}

export interface Message {
    id: string
    role: 'user' | 'assistant'
    content: string
    sources?: Source[]
    toolCalls?: ToolCall[]
    isStreaming?: boolean
}