import pool from './pool'
import { EmbeddedChunk } from '../types/ingestion'

export async function replaceChunks(
    documentId: string,
    chunks: EmbeddedChunk[]
): Promise<void> {
    const client = await pool.connect()
    try {
        await client.query('BEGIN')

        // Delete old chunks — cascades to embeddings automatically
        await client.query(
            `DELETE FROM chunks WHERE document_id = $1`,
            [documentId]
        )

        // Insert new chunks and their embeddings
        for (const chunk of chunks) {
            const { rows } = await client.query(
                `INSERT INTO chunks (document_id, content, chunk_index, heading, token_count)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
                [documentId, chunk.content, chunk.chunkIndex, chunk.heading, chunk.tokenCount]
            )
            const chunkId = rows[0].id as string

            await client.query(
                `INSERT INTO embeddings (chunk_id, vector)
         VALUES ($1, $2)`,
                [chunkId, JSON.stringify(chunk.vector)]
            )
        }

        await client.query('COMMIT')
    } catch (err) {
        await client.query('ROLLBACK')
        throw err
    } finally {
        client.release()
    }
}

export async function getChunksByIds(ids: string[]) {
    const { rows } = await pool.query(
        `SELECT c.*, d.source_url, d.title
     FROM chunks c
     JOIN documents d ON d.id = c.document_id
     WHERE c.id = ANY($1)`,
        [ids]
    )
    return rows
}