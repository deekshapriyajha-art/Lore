import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import logger from './lib/logger';
import { ingestRouter } from './routes/ingest';
import { retrieveRelevantChunks } from './query/retriever'
import { queryRouter } from './routes/query';
import { errorHandler } from './middleware/errorHandler';
import { generalLimiter } from './middleware/rateLimiter';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

app.use(generalLimiter)

app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'lore-api' })
});

app.use('/api', ingestRouter);
app.use('/api', queryRouter);

app.use(errorHandler);

app.listen(PORT, () => {
    logger.info({ port: PORT }, 'Lore API is running');
});