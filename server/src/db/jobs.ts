import pool from './pool'
import { JobRow } from '../types/ingestion'

export async function createIngestionJob(sourceUrl: string): Promise<string> {
    const { rows } = await pool.query(
        `INSERT INTO ingestion_jobs (source_url, status)
     VALUES ($1, 'queued')
     RETURNING id`,
        [sourceUrl]
    )
    return rows[0].id as string
}
export async function getJobById(id: string): Promise<JobRow | null> {
    const { rows } = await pool.query(
        `SELECT * FROM ingestion_jobs where id = $1`,
        [id]
    )
    return rows[0] ?? null
}

export async function updateJobStatus(
    id: string,
    status: 'running' | 'done' | 'failed',
    opts?: { error?: string; documentId?: string }
): Promise<void> {
    await pool.query(
        `UPDATE ingestion_jobs
     SET status      = $1,
         error       = $2,
         document_id = COALESCE($3::uuid, document_id),
         started_at  = CASE WHEN $1 = 'running' THEN NOW() ELSE started_at END,
         finished_at = CASE WHEN $1 IN ('done','failed') THEN NOW() ELSE finished_at END
     WHERE id = $4`,
        [status, opts?.error ?? null, opts?.documentId ?? null, id]
    )
}

export async function getJobsByStatus(status: string): Promise<JobRow[]> {
    const { rows } = await pool.query(
        `SELECT * FROM ingestion_jobs WHERE status = $1 ORDER BY created_at DESC`,
        [status]
    )
    return rows
}