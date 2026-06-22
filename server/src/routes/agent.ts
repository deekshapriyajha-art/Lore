import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { runAgentLoop } from '../query/agent'
import { queryLimiter } from '../middleware/rateLimiter'
import logger from '../lib/logger'

export const agentRouter = Router()

const AgentSchema = z.object({
    question: z.string().min(3).max(1000)
})

agentRouter.post('/agent', queryLimiter, async (req: Request, res: Response) => {
    const result = AgentSchema.safeParse(req.body)
    if (!result.success) {
        return res.status(422).json({ error: result.error.flatten() })
    }

    const { question } = result.data
    logger.info({ question }, 'Agent query received')

    try {
        await runAgentLoop(question, res)
        logger.info({ question }, 'Agent query complete')
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        logger.error({ question, error: message }, 'Agent query failed')
        if (!res.headersSent) {
            res.status(500).json({ error: message })
        }
    }
})