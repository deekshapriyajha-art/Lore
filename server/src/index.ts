import express from 'express';
import dotenv from 'dotenv';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

app.get('/health', (req,res) => {
    res.json({status: 'ok', service: 'lore-api'})
});

app.listen(PORT, () => {
    console.log(`Lore API is running on http://localhost:${PORT} `);
});