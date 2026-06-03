import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import helmet from 'helmet';
import logger from './lib/logger';
import { ingestRouter } from './routes/ingest';
import { retrieveRelevantChunks } from './query/retriever'
import { queryRouter } from './routes/query';
import { errorHandler } from './middleware/errorHandler';
import { generalLimiter } from './middleware/rateLimiter';
import { corsMiddleware } from './middleware/cors';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(corsMiddleware);

app.use(express.json());

app.use(generalLimiter)

app.use((req, res, next) => {
    logger.info(`${req.method} ${req.url}`)
    next()
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'lore-api' })
});

app.use('/api', ingestRouter);
app.use('/api', queryRouter);

app.use(errorHandler);

const gracefulShutdown = async (signal: string) => {
    logger.info({ signal }, 'Shutting down gracefully');
    const { default: pool } = await import('./db/pool');
    await pool.end();
    logger.info('DB pool closed');
    process.exit();
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

app.listen(PORT, () => {
    logger.info({ port: PORT }, 'Lore API is running');
});