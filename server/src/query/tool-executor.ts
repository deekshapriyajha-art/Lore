import { retrieveRelevantChunks } from './retriever'
import { getAllDocuments, getDocumentById } from '../db/documents'
import { createIngestionJob } from '../db/jobs'
import { runIngestionPipeline } from '../ingestion/pipeline'
import logger from '../lib/logger'

export interface ToolResult {
    success: boolean,
    data?: unknown,
    error?: string
}

/**
 * Executes a tool call made by the model.
 * Maps tool names to actual functions and returns results.
 */
export async function executeTool(
    name: string,
    args: Record<string, unknown>
): Promise<ToolResult> {
    logger.info({ tool: name, args }, 'Executing tools');

    try {
        switch (name) {
            case 'search_knowledge_base': {
                const query = args.query as string
                const topK = (args.top_k as number) ?? 5
                const chunks = await retrieveRelevantChunks(query, Math.min(topK, 10));

                if (chunks.length === 0) {
                    return {
                        success: true,
                        data: {
                            message: 'No relevant results found in knowledge base',
                            results: []
                        }
                    }
                }

                return {
                    success: true,
                    data: {
                        results: chunks.map(c => ({
                            content: c.content,
                            heading: c.heading,
                            title: c.title,
                            source_url: c.source_url,
                            similarity: c.similarity
                        }))
                    }
                }
            }

            case 'ingest_repository': {
                const url = args.url as string;
                if (!url.includes('github.com')) {
                    return {
                        success: false,
                        error: 'Only github URLs are supported'
                    }
                }

                const jobId = await createIngestionJob(url);
                await runIngestionPipeline({ sourceUrl: url, forceRefresh: false }, jobId);

                return {
                    success: true,
                    data: {
                        message: `Successfully ingested ${url}`,
                        jobId
                    }
                }
            }

            case 'get_document_list': {
                const docs = await getAllDocuments();
                return {
                    success: true,
                    data: {
                        documents: docs.map((d: any) => ({
                            title: d.title,
                            source_url: d.source_url,
                            status: d.status,
                            chunk_count: d.chunk_count,
                            created_at: d.created_at
                        }))
                    }
                }
            }

            case 'summarize_document': {
                const title = args.title as string;
                const docs = await getAllDocuments();
                const doc = (docs as any[]).find(d => d.title.toLowerCase() === title.toLowerCase());

                if (!doc) {
                    return {
                        success: false,
                        error: `No document found with title ${title}`
                    }
                }

                return {
                    success: true,
                    data: {
                        title: doc.title,
                        source_url: doc.source_url,
                        summary: doc.summary,
                        chunk_count: doc.chunk_count
                    }
                }

            }

            default: {
                return {
                    success: false,
                    error: `Unknown tool ${name}`
                }
            }

        }
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        logger.error({ tool: name, error: message }, 'Tool execution failed')
        return { success: false, error: message }
    }
}