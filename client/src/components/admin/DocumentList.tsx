import { useDocuments } from "../../hooks/useDocuments"
import { Document } from '../../types'

const statusColors: Record<Document['status'], string> = {
    pending: 'bg-gray-100 text-gray-600',
    processing: 'bg-yellow-100 text-yellow-700',
    ready: 'bg-green-100 text-green-700',
    failed: 'bg-red-100 text-red-600'
}

export const DocumentList = () => {
    const { documents, isLoading, deleteDocuments, fetchDocuments } = useDocuments()

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <span className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    if (documents.length === 0) {
        return (
            <div className="text-center py-12 text-gray-400">
                <p className="text-lg mb-1">No documents yet</p>
                <p className="text-sm">Ingest a GitHub repo above to get started</p>
            </div>
        )
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">
                    Knowledge Base
                    <span className="ml-2 text-sm font-normal text-gray-400">
                        {documents.length} {documents.length === 1 ? 'document' : 'documents'}
                    </span>
                </h2>
                <button
                    onClick={fetchDocuments}
                    className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
                >
                    Refresh
                </button>
            </div>

            <div className="flex flex-col gap-3">
                {documents.map(doc => (
                    <div
                        key={doc.id}
                        className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between"
                    >
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-gray-800 truncate">{doc.title}</span>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${statusColors[doc.status]}`}>
                                    {doc.status}
                                </span>
                            </div>
                            <a
                                href={doc.source_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-500 hover:underline truncate block"
                            >
                                {doc.source_url}
                            </a>
                            <p className="text-xs text-gray-400 mt-1">
                                {doc.chunk_count} chunks · Added {new Date(doc.created_at).toLocaleDateString()}
                            </p>
                        </div>

                        <button
                            onClick={() => deleteDocuments(doc.id)}
                            className="ml-4 flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center
                text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                            title="Delete document"
                        >
                            ✕
                        </button>
                    </div>
                ))}
            </div>
        </div >
    )
}