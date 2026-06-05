import { IngestForm } from './IngestForm'
import { DocumentList } from './DocumentList'

export const AdminPanel = () => {
    return (
        <div className="flex flex-col h-full overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 bg-white">
                <h1 className="text-xl font-bold text-gray-900">Admin</h1>
                <p className="text-sm text-gray-500">Manage your knowledge base</p>
            </div>

            <div className="flex-1 p-6 max-w-3xl mx-auto w-full flex flex-col gap-6">
                <IngestForm />
                <DocumentList />
            </div>
        </div>
    )
}