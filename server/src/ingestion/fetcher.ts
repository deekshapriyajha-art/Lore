import axios from 'axios'
import logger from '../lib/logger'

const RAW_BASE = 'https://raw.githubusercontent.com'

/**
 * Gets the default branch of a GitHub repo via API
 */
async function getDefaultBranch(
    owner: string,
    repo: string,
    headers: Record<string, string>
): Promise<string> {
    const { data } = await axios.get(
        `https://api.github.com/repos/${owner}/${repo}`,
        { headers }
    )
    return data.default_branch
}

/**
 * Parses github.com URL into components
 */
function parseGitHubUrl(url: string): {
    owner: string
    repo: string
    branch?: string
    filePath?: string
} {
    if (url.includes('raw.githubusercontent.com')) {
        const match = url.match(
            /raw\.githubusercontent\.com\/([^/]+)\/([^/]+)\/([^/]+)\/(.+)/
        )
        if (!match) throw new Error(`Invalid raw GitHub URL: ${url}`)
        return { owner: match[1], repo: match[2], branch: match[3], filePath: match[4] }
    }

    const blobMatch = url.match(
        /github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)/
    )
    if (blobMatch) {

        return {
            owner: blobMatch[1],
            repo: blobMatch[2],
            branch: blobMatch[3],
            filePath: blobMatch[4]
        }
    }

    const repoMatch = url.match(
        /github\.com\/([^/]+)\/([^/]+)/
    )
    if (repoMatch) {
        return {
            owner: repoMatch[1],
            repo: repoMatch[2]
        }
    }

    throw new Error(`Unsupported GitHub URL: ${url}`)
}

/**
 * Fetches raw markdown content from a GitHub URL.
 * Automatically detects the default branch via GitHub API.
 */
export async function fetchGitHubContent(url: string): Promise<string> {
    const headers: Record<string, string> = {
        'User-Agent': 'Lore-AI/1.0'
    }
    if (process.env.GITHUB_TOKEN) {
        headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`
    }

    const { owner, repo, branch: urlBranch, filePath: urlFilePath } = parseGitHubUrl(url)
    const branch = urlBranch ?? await getDefaultBranch(owner, repo, headers)
    logger.info({ owner, repo, branch }, 'Resolved branch')

    // If a specific file path was given — fetch it directly
    if (urlFilePath) {
        // Try the exact path first, then .mdx variant if .md fails
        const filePathsToTry = [urlFilePath]
        if (urlFilePath.endsWith('.md')) {
            filePathsToTry.push(urlFilePath.replace(/\.md$/, '.mdx'))
        } else if (urlFilePath.endsWith('.mdx')) {
            filePathsToTry.push(urlFilePath.replace(/\.mdx$/, '.md'))
        }

        for (const filePath of filePathsToTry) {
            try {
                const rawUrl = `${RAW_BASE}/${owner}/${repo}/${branch}/${filePath}`
                logger.info({ rawUrl }, 'Fetching URL')
                const { data } = await axios.get<string>(rawUrl, {
                    headers,
                    responseType: 'text'
                })
                logger.info({ filePath }, 'Fetch successful')
                return data
            } catch (err: any) {
                if (err.response?.status === 404) {
                    logger.warn({ filePath }, 'File not found, trying next')
                    continue
                }
                throw err
            }
        }

        throw new Error(`Could not find file ${urlFilePath} in ${owner}/${repo} on branch ${branch}`)
    }
    // No specific file — try common README casings
    const filesToTry = ['README.md', 'Readme.md', 'readme.md']
    for (const filePath of filesToTry) {
        try {
            const rawUrl = `${RAW_BASE}/${owner}/${repo}/${branch}/${filePath}`
            logger.info({ rawUrl }, 'Fetching URL')
            const { data } = await axios.get<string>(rawUrl, { headers, responseType: 'text' })
            logger.info({ filePath }, 'Fetch successful')
            return data
        } catch (err: any) {
            if (err.response?.status === 404) {
                logger.warn({ filePath }, 'File not found, trying next')
                continue
            }
            throw err
        }
    }

    throw new Error(`Could not find README in ${owner}/${repo} on branch ${branch}`)
}

/**
 * Fetches markdown file paths from  GitHub
 */
export async function fetchRepoMarkdownFiles(
    owner: string,
    repo: string,
    branch?: string
): Promise<{ path: string; url: string }[]> {
    const headers: Record<string, string> = { 'User-Agent': 'Lore-AI/1.0' }
    if (process.env.GITHUB_TOKEN) {
        headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`
    }

    const resolvedBranch = branch ?? await getDefaultBranch(owner, repo, headers)
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${resolvedBranch}?recursive=1`

    const { data } = await axios.get(apiUrl, { headers })

    return (data.tree as { path: string; type: string }[])
        .filter((f) => f.type === 'blob' && /\.(md|mdx)$/i.test(f.path))
        .map((f) => ({
            path: f.path,
            url: `${RAW_BASE}/${owner}/${repo}/${resolvedBranch}/${f.path}`
        }))
}