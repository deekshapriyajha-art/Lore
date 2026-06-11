import { marked, Token } from 'marked'
import { ParsedDocument } from '../types/ingestion'

function stripFrontmatter(raw: string): string {

    const yamlFrontmatter = raw.match(/^---[\s\S]*?---\n/)
    if (yamlFrontmatter) {
        return raw.slice(yamlFrontmatter[0].length).trim()
    }

    const tomlFrontmatter = raw.match(/^\+\+\+[\s\S]*?\+\+\+\n/)
    if (tomlFrontmatter) {
        return raw.slice(tomlFrontmatter[0].length).trim()
    }

    raw = raw.replace(/^import\s+.+from\s+['"].+['"]\s*;?\s*$/gm, '').trim()
    return raw
}

/**
 * Extracts title from MDX frontmatter if present.
 */
function extractFrontmatterTitle(raw: string): string | null {
    const match = raw.match(/^---[\s\S]*?title:\s*(.+?)[\s\S]*?---/m)
    return match ? match[1].trim() : null
}

export function parseMarkdown(raw: string, sourceUrl: string): ParsedDocument {
    const frontmatterTitle = extractFrontmatterTitle(raw)
    const cleaned = stripFrontmatter(raw)
    const tokens = marked.lexer(cleaned)

    const h1 = tokens.find(
        (t): t is Extract<Token, { type: 'heading' }> =>
            t.type === 'heading' && (t as any).depth === 1
    )

    const title = frontmatterTitle ?? (h1 as any)?.text ?? inferTitleFromUrl(sourceUrl)

    return {
        title,
        rawContent: cleaned,
        sourceUrl,
        metadata: {
            headings: extractHeadings(tokens),
            hasCodeBlocks: tokens.some((t) => t.type === 'code'),
            wordCount: cleaned.split(/\s+/).length
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