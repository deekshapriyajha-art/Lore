export interface IngestionJob {
    sourceUrl: string
    forceRefresh?: boolean
}

export interface ParsedDocument {
    title: string
    rawContent: string
    metadata: Record<string, unknown>
    sourceUrl: string
}

export interface Chunk {
    content: string
    chunkIndex: number
    heading: string | null
    tokenCount: number
}

export interface EmbeddedChunk extends Chunk {
    vector: number[]
}

export interface DocumentRow {
    id: string
    source_url: string
    title: string
    raw_content: string
    metadata: Record<string, unknown>
    status: 'pending' | 'processing' | 'ready' | 'failed'
    created_at: Date
    updated_at: Date
}

export interface ChunkRow {
    id: string
    document_id: string
    content: string
    chunk_index: number
    heading: string | null
    token_count: number
    created_at: Date
}

export interface JobRow {
    id: string
    source_url: string
    document_id: string | null
    status: 'queued' | 'running' | 'done' | 'failed'
    error: string | null
    started_at: Date | null
    finished_at: Date | null
    created_at: Date
}