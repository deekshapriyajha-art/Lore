import { marked, Token } from 'marked'
import { Chunk } from '../types/ingestion'

const MAX_TOKENS = 400
const OVERLAP_TOKENS = 60

interface Section {
    heading: string | null
    content: string
}

function splitBySections(raw: string): Section[] {
    const tokens = marked.lexer(raw)
    const sections: Section[] = []
    let currentHeading: string | null = null
    let currentLines: string[] = []

    for (const token of tokens) {
        if (token.type === 'heading' && (token as any).depth <= 2) {
            if (currentLines.length) {
                sections.push({ heading: currentHeading, content: currentLines.join('\n') })
            }
            currentHeading = (token as any).text
            currentLines = []
        } else {
            currentLines.push((token as any).raw ?? '')
        }
    }

    if (currentLines.length) {
        sections.push({ heading: currentHeading, content: currentLines.join('\n') })
    }

    return sections
}

function slidingWindowChunk(
    text: string,
    heading: string | null
): Omit<Chunk, 'chunkIndex'>[] {
    const words = text.trim().split(/\s+/).filter(Boolean)
    if (!words.length) return []

    const chunks: Omit<Chunk, 'chunkIndex'>[] = []
    let start = 0

    while (start < words.length) {
        const end = Math.min(start + MAX_TOKENS, words.length)
        const content = words.slice(start, end).join(' ')

        chunks.push({
            content: heading ? `## ${heading}\n\n${content}` : content,
            heading,
            tokenCount: end - start
        })

        if (end === words.length) break
        start = end - OVERLAP_TOKENS
    }

    return chunks
}

export function chunkDocument(raw: string): Chunk[] {
    const sections = splitBySections(raw)
    const allChunks: Omit<Chunk, 'chunkIndex'>[] = []

    for (const section of sections) {
        const sectionChunks = slidingWindowChunk(section.content, section.heading)
        allChunks.push(...sectionChunks)
    }

    return allChunks.map((c, i) => ({ ...c, chunkIndex: i }))
}