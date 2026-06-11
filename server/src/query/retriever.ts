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
    fts_rank: number
    combined_score: number
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
        `WITH vector_search AS(
            SELECT
            c.id,
            c.content,
            c.heading,
            c.chunk_index,
            c.document_id,
            d.title,
            d.source_url,
            1 - (e.vector <=> $1::vector) AS similarity,
            ROW_NUMBER() OVER (ORDER BY e.vector <=> $1::vector ASC) AS vector_rank
            FROM embeddings e
            JOIN chunks c ON c.id = e.chunk_id
            JOIN documents d ON d.id = c.document_id
            WHERE d.status = 'ready'
            ORDER BY e.vector <=> $1::vector ASC
            LIMIT 20
        ),
        fts_search AS (
            SELECT
            c.id,
            ts_rank_cd(c.fts, query) AS fts_rank,
            ROW_NUMBER() OVER (ORDER BY ts_rank_cd(c.fts, query) DESC) AS fts_rank_num
            FROM chunks c
            JOIN documents d ON d.id = c.document_id,
            plainto_tsquery('english', $2) query
            WHERE d.status = 'ready'
                AND c.fts @@ plainto_tsquery('english', $2)
            ORDER BY fts_rank DESC
            LIMIT 20
            ),
        combined AS (
            SELECT
                v.id,
                v.content,
                v.heading,
                v.chunk_index,
                v.document_id,
                v.title,
                v.source_url,
                v.similarity,
                COALESCE(f.fts_rank, 0) AS fts_rank,
                -- Reciprocal Rank Fusion scoring
                (1.0 / (60 + v.vector_rank)) +
                COALESCE(1.0 / (60 + f.fts_rank_num), 0) AS combined_score
            FROM vector_search v
            LEFT JOIN fts_search f ON f.id = v.id

       UNION
            SELECT
            c.id,
            c.content,
            c.heading,
            c.chunk_index,
            c.document_id,
            d.title,
            d.source_url,
            0 AS similarity,
            f.fts_rank,
            1.0 / (60 + f.fts_rank_num) AS combined_score
        FROM fts_search f
        JOIN chunks c ON c.id = f.id
        JOIN documents d ON d.id = c.document_id
        WHERE f.id NOT IN (SELECT id FROM vector_search)
        )
        SELECT DISTINCT ON (id)
        id,
        content,
        heading,
        chunk_index,
        document_id,
        title,
        source_url,
        similarity,
        fts_rank,
        combined_score
        FROM combined
        ORDER BY id, combined_score DESC
        LIMIT $3`,
        [JSON.stringify(questionVector), question, topK]
    )

    const sorted = (rows as any[])
        .map(row => ({
            ...row,
            similarity: parseFloat(row.similarity),
            fts_rank: parseFloat(row.fts_rank),
            combined_score: parseFloat(row.combined_score)
        }))
        .sort((a, b) => b.combined_score - a.combined_score)

    return sorted as RetrievedChunk[]

}