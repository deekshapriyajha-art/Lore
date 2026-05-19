import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import logger from './lib/logger';
import { ingestRouter } from './routes/ingest';

console.log('ingestRouter:', ingestRouter);
const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

app.use((req, _res, next) => {
    console.log(`→ ${req.method} ${req.url} | body: ${JSON.stringify(req.body)}`)
    next()
})

app.post('/test-post', (_req, res) => {
    res.json({ works: true })
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'lore-api' })
});

app.use('/api', ingestRouter);
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`)
    next()
})
app.listen(PORT, () => {
    logger.info({ port: PORT }, 'Lore API is running');
});