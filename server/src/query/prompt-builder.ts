import { RetrievedChunk } from "./retriever";

export interface BuildPrompt {
    systemPrompt: string,
    sources: { title: string, sourceUrl: string, heading: string | null }[]
}

/**
 * 
 * @param chunks Retrieved chunks from pgvector
 * @param question user's question
 * @returns System prompt string and unique source list
 */
export function buildPrompt(
    chunks: RetrievedChunk[],
    question: string
): BuildPrompt {


    const contextBlocks = chunks
        .map((chunk, idx) => {
            const source = chunk.heading
                ? `${chunk.title}-${chunk.heading}`
                : chunk.title
            return `Context ${idx + 1} Source: ${source}\n${chunk.content}`
        })
        .join('\n\n---\n\n')

    const systemPrompt = `You are Lore, an intelligent developer assistant that answers questions about technical documentation and GitHub repositories.
    
    You have been provided with relevant context extracted from documentation. Answer the user's question using ONLY the information in the context below. 

    Rules:
    - Answer only from the provided context
    - If the context does not contain enough information to answer, say "I don't have enough information in the knowledge base to answer that."
    - Be concise and precise
    - Use code examples from the context where relevant
    - Cite which source your answer comes from

    Context:
    ${contextBlocks}

    Question: ${question}`

    //Avoid duplicate source
    const seen = new Set<string>()
    const sources = chunks
        .filter((chunk) => {
            if (seen.has(chunk.source_url)) return false
            seen.add(chunk.source_url)
            return true
        })
        .map((chunk) => ({
            title: chunk.title,
            sourceUrl: chunk.source_url,
            heading: chunk.heading
        }))

    return { systemPrompt, sources }
}