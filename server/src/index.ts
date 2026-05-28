import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import logger from './lib/logger';
import { ingestRouter } from './routes/ingest';
import { retrieveRelevantChunks } from './query/retriever'
import { queryRouter } from './routes/query';
import { errorHandler } from './middleware/errorHandler';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

// Temporary test route
app.get('/test-retriever', async (req, res) => {
    try {
        const question = (req.query.q as string) || 'How do I add middleware in Express?'

        logger.info({ question }, 'Testing retriever')

        const chunks = await retrieveRelevantChunks(question, 5)

        res.json({
            question,
            totalChunks: chunks.length,
            chunks: chunks.map(chunk => ({
                title: chunk.title,
                heading: chunk.heading,
                sourceUrl: chunk.source_url,
                similarity: chunk.similarity,
                preview: chunk.content.slice(0, 150) + '...'   // first 150 chars only
            }))
        })
    } catch (err) {
        logger.error({ error: err instanceof Error ? err.message : err }, 'Retriever test failed')
        res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' })
    }
})

app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'lore-api' })
});

app.use('/api', ingestRouter);
app.use('/api', queryRouter);

app.use(errorHandler);

app.listen(PORT, () => {
    logger.info({ port: PORT }, 'Lore API is running');
});