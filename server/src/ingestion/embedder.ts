import OpenAI from 'openai'
import { Chunk, EmbeddedChunk } from '../types/ingestion'

const MODEL = 'text-embedding-3-small'
const BATCH_SIZE = 100

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export async function embedChunks(chunks: Chunk[]): Promise<EmbeddedChunk[]> {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const results: EmbeddedChunk[] = []

    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
        const batch = chunks.slice(i, i + BATCH_SIZE)

        const response = await openai.embeddings.create({
            model: MODEL,
            input: batch.map((c) => c.content)
        })

        const embedded = batch.map((chunk, idx) => ({
            ...chunk,
            vector: response.data[idx].embedding
        }))

        results.push(...embedded)

        if (i + BATCH_SIZE < chunks.length) {
            await sleep(200)
        }
    }

    return results
}