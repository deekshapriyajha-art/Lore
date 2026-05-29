import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { runIngestionPipeline } from '../ingestion/pipeline'
import { createIngestionJob } from '../db/jobs'
import { getJobById } from '../db/jobs'
import { getAllDocuments, getDocumentById, deleteDocumentById } from '../db/documents'
import { ingestLimiter } from '../middleware/rateLimiter'

export const ingestRouter = Router()

const IngestSchema = z.object({
    sourceUrl: z.string().url().includes('github.com'),
    forceRefresh: z.boolean().optional().default(false)
})

interface IdParam {
    id: string
}

// /api/ingest 
ingestRouter.post('/ingest', ingestLimiter, async (req: Request, res: Response) => {
    const result = IngestSchema.safeParse(req.body)
    if (!result.success) {
        return res.status(422).json({ error: result.error.flatten() })
    }

    const { sourceUrl, forceRefresh } = result.data
    const jobId = await createIngestionJob(sourceUrl)

    res.status(202).json({ jobId, message: 'Ingestion started', sourceUrl })

    runIngestionPipeline({ sourceUrl, forceRefresh }, jobId).catch(() => { })
})

// /api/jobs/:id 
ingestRouter.get('/jobs/:id', async (req: Request<IdParam>, res: Response) => {
    const job = await getJobById(req.params.id)
    if (!job) return res.status(404).json({ error: 'Job not found' })
    res.json(job)
})

// /api/documents 
ingestRouter.get('/documents', async (req: Request, res: Response) => {
    const docs = await getAllDocuments()
    res.json(docs)
})

// /api/documents/:id t
ingestRouter.get('/documents/:id', async (req: Request<IdParam>, res: Response) => {
    const doc = await getDocumentById(req.params.id)
    if (!doc) return res.status(404).json({ error: 'Document not found' })
    res.json(doc)
})

// /api/documents/:id 
ingestRouter.delete('/documents/:id', async (req: Request<IdParam>, res: Response) => {
    await deleteDocumentById(req.params.id)
    res.json({ message: 'Document deleted' })
})