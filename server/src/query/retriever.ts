import OpenAI from 'openai'
import pool from '../db/pool'
import logger from '../lib/logger'

const MODEL = "text-embedding-3-small";

export interface RetrievedChunk {
    id: string
    content: string
    heading: string | null
    chunk_index: number
    document_id: string
    title: string
    source_url: string
    similarity: number
}

/**
 * Embeds the question and retrieves the top-K most similar chunks
 * from pgvector using cosine similarity.
 *
 * @param question - user's question
 * @param topK     - Number of chunks to retrieve (default: 5)
 * @returns Array of relevant chunks with source document info
 */
export async function retrieveRelevantChunks(
    question: string,
    topK = 5
): Promise<RetrievedChunk[]> {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    logger.info({ question }, 'Embedding question');
    const response = await openai.embeddings.create({
        model: MODEL,
        input: question
    })
    const questionVector = response.data[0].embedding
    logger.info('Question embedded');

    const { rows } = await pool.query(
        `SELECT
       c.id,
       c.content,
       c.heading,
       c.chunk_index,
       c.document_id,
       d.title,
       d.source_url,
       1 - (e.vector <=> $1::vector) AS similarity
     FROM embeddings e
     JOIN chunks c ON c.id = e.chunk_id
     JOIN documents d ON d.id = c.document_id
     WHERE d.status = 'ready'
     ORDER BY e.vector <=> $1::vector ASC
     LIMIT $2`,
        [JSON.stringify(questionVector), topK]
    )
    logger.info({ count: rows.length }, 'Chunks retrieved')
    return rows as RetrievedChunk[]
}