import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const api = axios.create({
    baseURL: BASE_URL,
    headers: { "Content-Type": 'application/json' }
})

export const endpoints = {
    ingest: '/api/ingest',
    job: (id: string) => `/api/jobs/${id}`,
    documents: '/api/documents',
    document: (id: string) => `/api/documents/${id}`,
    query: '/api/query'
}
