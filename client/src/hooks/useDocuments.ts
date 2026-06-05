import { useState, useEffect, useCallback } from "react";
import { api, endpoints } from "../lib/api";
import { Document, Job } from "../types";

export function useDocuments() {
    const [documents, setDocuments] = useState<Document[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchDocuments = useCallback(async () => {
        try {
            setIsLoading(true)
            const { data } = await api.get<Document[]>(endpoints.documents)
            setDocuments(data)
        } catch (err) {
            setError('Failed to fetch documents')
        } finally {
            setIsLoading(false)
        }
    }, [])

    const ingestUrl = useCallback(async (sourceUrl: string): Promise<Job> => {
        const { data } = await api.post<Job>(endpoints.ingest, { sourceUrl })
        return data
    }, [])

    const pollJob = useCallback(async (jobId: string): Promise<Job> => {
        const { data } = await api.get<Job>(endpoints.job(jobId))
        return data
    }, [])
    const deleteDocuments = useCallback(async (id: string) => {
        await api.delete(endpoints.document(id))
        setDocuments(prev => prev.filter(doc => doc.id !== id))
    }, [])

    useEffect(() => {
        fetchDocuments()
    }, [fetchDocuments])

    return { documents, isLoading, error, fetchDocuments, ingestUrl, pollJob, deleteDocuments }
}