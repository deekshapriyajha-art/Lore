import logger from '../lib/logger'
import { IngestionJob } from '../types/ingestion'
import { fetchGitHubContent } from './fetcher'
import { parseMarkdown } from './parser'
import { chunkDocument } from './chunker'
import { embedChunks } from './embedder'
import { upsertDocument, updateDocumentStatus } from '../db/documents'
import { replaceChunks } from '../db/chunks'
import { updateJobStatus } from '../db/jobs'

export async function runIngestionPipeline(
    job: IngestionJob,
    jobId: string
): Promise<void> {
    logger.info({ sourceUrl: job.sourceUrl }, 'Ingestion started')

    try {
        await updateJobStatus(jobId, 'running')

        // Fetch
        const raw = await fetchGitHubContent(job.sourceUrl)
        logger.info({ sourceUrl: job.sourceUrl }, 'Content fetched')

        // Parse
        const parsed = parseMarkdown(raw, job.sourceUrl)
        logger.info({ title: parsed.title }, 'Document parsed')

        // Upsert document
        const documentId = await upsertDocument(parsed)
        logger.info({ documentId }, 'Document upserted')

        // Chunk
        const chunks = chunkDocument(parsed.rawContent)
        logger.info({ chunkCount: chunks.length }, 'Document chunked')

        // Embed
        const embeddedChunks = await embedChunks(chunks)
        logger.info({ chunkCount: embeddedChunks.length }, 'Chunks embedded')

        // Store
        await replaceChunks(documentId, embeddedChunks)
        logger.info({ documentId }, 'Chunks and embeddings stored')

        // Mark ready
        await updateDocumentStatus(documentId, 'ready')
        await updateJobStatus(jobId, 'done', { documentId })

        logger.info({ documentId, sourceUrl: job.sourceUrl }, 'Ingestion complete')
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        logger.error({ sourceUrl: job.sourceUrl, error: message }, 'Ingestion failed')
        await updateJobStatus(jobId, 'failed', { error: message })
        throw err
    }
}