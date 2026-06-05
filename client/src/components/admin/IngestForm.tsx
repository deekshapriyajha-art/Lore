import { useState } from 'react'
import { useDocuments } from '../../hooks/useDocuments'

export const IngestForm = () => {
    const [url, setUrl] = useState('')
    const [status, setStatus] = useState<'idle' | 'loading' | 'polling' | 'done' | 'failed'>('idle')
    const [message, setMessage] = useState('')
    const { ingestUrl, pollJob, fetchDocuments } = useDocuments()

    const handleIngest = async () => {
        if (!url.trim()) return
        setStatus('loading')
        setMessage('Starting ingestion...')

        try {
            const job = await ingestUrl(url.trim())
            setStatus('polling')
            setMessage('Ingestion running...')

            const interval = setInterval(async () => {
                const updated = await pollJob((job as any).jobId)

                if (updated.status === 'done') {
                    clearInterval(interval)
                    setStatus('done')
                    setMessage('Ingestion complete!')
                    setUrl('')
                    fetchDocuments()
                    setTimeout(() => setStatus('idle'), 3000)
                }

                if (updated.status === 'failed') {
                    clearInterval(interval)
                    setStatus('failed')
                    setMessage(`Failed: ${updated.error}`)
                }
            }, 2000)
        } catch (err) {
            setStatus('failed')
            setMessage('Failed to start ingestion')
        }
    }

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-1">Ingest Repository</h2>
            <p className="text-sm text-gray-500 mb-4">
                Add a GitHub repository or markdown file to the knowledge base
            </p>

            <div className="flex gap-3">
                <input
                    type="text"
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    placeholder="https://github.com/owner/repo"
                    disabled={status === 'loading' || status === 'polling'}
                    className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            disabled:opacity-50 disabled:cursor-not-allowed"
                    onKeyDown={e => e.key === 'Enter' && handleIngest()}
                />
                <button
                    onClick={handleIngest}
                    disabled={!url.trim() || status === 'loading' || status === 'polling'}
                    className="px-5 py-2.5 rounded-lg bg-gray-800 text-white text-sm font-medium
            hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors flex items-center gap-2"
                >
                    {(status === 'loading' || status === 'polling') && (
                        <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    )}
                    {status === 'loading' || status === 'polling' ? 'Ingesting...' : 'Ingest'}
                </button>
            </div>

            {message && (
                <p className={`mt-3 text-sm ${status === 'done' ? 'text-green-600' :
                    status === 'failed' ? 'text-red-500' :
                        'text-gray-500'
                    }`}>
                    {status === 'done' && '✓ '}
                    {status === 'failed' && '✗ '}
                    {message}
                </p>
            )}
        </div>
    )
}