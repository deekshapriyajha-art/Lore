import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { retrieveRelevantChunks } from '../query/retriever'
import { buildPrompt } from '../query/prompt-builder'
import { streamResponse } from '../query/client'
import logger from '../lib/logger'
import { queryLimiter } from '../middleware/rateLimiter'

export const queryRouter = Router();

const QuerySchema = z.object({
    question: z.string().min(3).max(1000)
})

// validates question, calls retriever, builds prompt, streams response back
queryRouter.post('/query', queryLimiter, async (req: Request, res: Response) => {
    const result = QuerySchema.safeParse(req.body);

    if (!result.success) {
        return res.status(422).json({ error: result.error.flatten() })
    }

    const { question } = result.data
    logger.info({ question }, 'Query received')

    try {

        const chunks = await retrieveRelevantChunks(question)

        if (chunks.length === 0) {
            return res.status(200).json({
                answer: 'I could not find any relevant information in the knowledge base.',
                sources: []
            })
        }

        const { systemPrompt, sources } = buildPrompt(chunks, question)
        logger.info({ sourceCount: sources.length }, 'Prompt built')

        await streamResponse(systemPrompt, question, res)

        res.write(`data: ${JSON.stringify({ type: 'sources', sources })}\n\n`)
        res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`)
        res.end()

        logger.info({ question }, 'Query complete')

    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        logger.error({ question, error: message }, 'Query failed')

        if (!res.headersSent) {
            res.status(500).json({ error: message })
        }
    }
})