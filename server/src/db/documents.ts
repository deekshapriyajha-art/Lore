import pool from './pool'
import { ParsedDocument, DocumentRow, ChunkRow } from '../types/ingestion'

/**
 * 
 * @param doc document to upsert
 * @returns document UUID
 * This function takes document as param and inserts or updates it if source_url already exists and returns id
 */
export async function upsertDocument(doc: ParsedDocument): Promise<string> {
    const { rows } = await pool.query(
        `INSERT INTO documents (source_url, title, raw_content, metadata, status)
     VALUES ($1, $2, $3, $4, 'processing')
     ON CONFLICT (source_url) DO UPDATE
       SET title       = EXCLUDED.title,
           raw_content = EXCLUDED.raw_content,
           metadata    = EXCLUDED.metadata,
           status      = 'processing',
           updated_at  = NOW()
     RETURNING id`,
        [doc.sourceUrl, doc.title, doc.rawContent, JSON.stringify(doc.metadata)]
    )
    return rows[0].id as string
}

/**
 * 
 * @returns all documents along with its chunk count
 * This function fetches all documents ordered by newest first. Also counts how many chunks each document has.
 */
export async function getAllDocuments(): Promise<DocumentRow[]> {
    const { rows } = await pool.query(
        `SELECT d.*, COUNT(c.id)::int AS chunk_count
     FROM documents d
     LEFT JOIN chunks c ON c.document_id = d.id
     GROUP BY d.id
     ORDER BY d.created_at DESC`
    )
    return rows
}

/**
 * 
 * @param id document id
 * @returns document by its id
 * This function fetches a document by its id
 */
export async function getDocumentById(id: string): Promise<DocumentRow | null> {
    const { rows } = await pool.query(
        `SELECT * FROM documents WHERE id = $1`,
        [id]
    )
    return rows[0] ?? null
}

/**
 * 
 * @param id document id
 * @returns chunks for a document filtered by its id and in order by chunk_index
 */
export async function getChunksByDocumentId(id: string): Promise<ChunkRow[]> {
    const { rows } = await pool.query(
        `SELECT * FROM chunks WHERE document_id = $1 ORDER BY chunk_index`,
        [id]
    )
    return rows
}

/**
 * 
 * @param id document id
 * This function deletes document by its id
 */
export async function deleteDocumentById(id: string): Promise<void> {
    await pool.query(`DELETE FROM documents WHERE id = $1`, [id])
}

/**
 * 
 * @param id document id
 * @param status status of document from creation to embedding
 * This function updates the status column on a document and updated_at column with the current time.
 */
export async function updateDocumentStatus(
    id: string,
    status: 'pending' | 'processing' | 'ready' | 'failed'
): Promise<void> {
    await pool.query(
        `UPDATE documents SET status = $1, updated_at = NOW() WHERE id = $2`,
        [status, id]
    )
}