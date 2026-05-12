import express from 'express';
import dotenv from 'dotenv';
import logger from './lib/logger';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'lore-api' })
});


app.listen(PORT, () => {
    logger.info({ port: PORT }, 'Lore API is running');
});