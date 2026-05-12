import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000
});

pool.on('connect', () => {
    console.log('Connected to lore_db')
});

pool.on('error', (err) => {
    console.error('Unexpected DB error', err)
    process.exit(-1)
});

export default pool;