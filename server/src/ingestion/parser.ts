import { marked, Token } from 'marked'
import { ParsedDocument } from '../types/ingestion'

export function parseMarkdown(raw: string, sourceUrl: string): ParsedDocument {
    const tokens = marked.lexer(raw)

    const h1 = tokens.find(
        (t): t is Extract<Token, { type: 'heading' }> =>
            t.type === 'heading' && (t as any).depth === 1
    )

    const title = (h1 as any)?.text ?? inferTitleFromUrl(sourceUrl)

    return {
        title,
        rawContent: raw,
        sourceUrl,
        metadata: {
            headings: extractHeadings(tokens),
            hasCodeBlocks: tokens.some((t) => t.type === 'code'),
            wordCount: raw.split(/\s+/).length
        }
    }
}

function extractHeadings(tokens: Token[]): string[] {
    return tokens
        .filter(
            (t): t is Extract<Token, { type: 'heading' }> => t.type === 'heading'
        )
        .map((t) => `${'#'.repeat((t as any).depth)} ${(t as any).text}`)
}

function inferTitleFromUrl(url: string): string {
    const parts = url.split('/')
    const file = parts[parts.length - 1].replace(/\.(md|mdx)$/i, '')
    return file === 'README' ? parts[parts.length - 2] ?? 'Untitled' : file
}