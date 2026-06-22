import { ChatCompletionTool } from 'openai/resources'

/**
 * Tool definitions sent to the model.
 * The model reads these descriptions and decides when to call each one.
 */
export const LORE_TOOLS: ChatCompletionTool[] = [
    {
        type: 'function',
        function: {
            name: 'search_knowledge_base',
            description: `Search the knowledge base for information relevant to a question.
        Use this when the user asks a question about any ingested repository or documentation.
        Returns the most relevant chunks with source citations.`,
            parameters: {
                type: 'object',
                properties: {
                    query: {
                        type: 'string',
                        description: 'The search query — rephrase the user question as a clear search query'
                    },
                    top_k: {
                        type: 'number',
                        description: 'Number of results to return (default 5, max 10)'
                    }
                },
                required: ['query']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'ingest_repository',
            description: `Ingest a new GitHub repository or markdown file into the knowledge base.
        Use this when the user asks about a repo that isn't in the knowledge base yet,
        or when they explicitly ask to add a new repository.`,
            parameters: {
                type: 'object',
                properties: {
                    url: {
                        type: 'string',
                        description: 'The GitHub URL to ingest'
                    }
                },
                required: ['url']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'get_document_list',
            description: `Get a list of all documents currently in the knowledge base.
        Use this when the user asks what repos or docs are available,
        or to check if a specific repo has been ingested.`,
            parameters: {
                type: 'object',
                properties: {}
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'summarize_document',
            description: `Get a summary of a specific document by its title.
        Use this when the user asks for an overview of a specific repo or doc.`,
            parameters: {
                type: 'object',
                properties: {
                    title: {
                        type: 'string',
                        description: 'The title of the document to summarize'
                    }
                },
                required: ['title']
            }
        }
    }
]