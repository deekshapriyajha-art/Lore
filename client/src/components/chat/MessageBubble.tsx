import { Message } from '../../types'
import { SourceCard } from './SourceCard'

interface Props {
    message: Message
}

export const MessageBubble = ({ message }: Props) => {
    const isUser = message.role === 'user'

    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
            <div className={`max-w-[80%] ${isUser ? 'order-2' : 'order-1'}`}>

                <div className={`flex items-end gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0
            ${isUser ? 'bg-blue-500 text-white' : 'bg-gray-800 text-white'}`}>
                        {isUser ? 'U' : 'L'}
                    </div>

                    <div className={`px-4 py-3 rounded-2xl
            ${isUser
                            ? 'bg-blue-500 text-white rounded-br-sm'
                            : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm shadow-sm'
                        }`}>
                        <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                            {message.content}
                            {message.isStreaming && (
                                <span className="inline-block w-2 h-4 bg-gray-400 ml-1 animate-pulse rounded-sm" />
                            )}
                        </pre>
                    </div>
                </div>

                {message.sources && message.sources.length > 0 && (
                    <div className="mt-2 ml-10">
                        <p className="text-xs text-gray-400 mb-1">Sources</p>
                        <div className="flex flex-col gap-1">
                            {message.sources.map((source, idx) => (
                                <SourceCard key={idx} source={source} />
                            ))}
                        </div>
                    </div>
                )}

                {message.toolCalls && message.toolCalls.length > 0 && (
                    <div className="mt-2 flex flex-col gap-1">
                        {message.toolCalls.map((tc, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-xs text-gray-400">
                                <span className={`w-2 h-2 rounded-full ${tc.status === 'running' ? 'bg-yellow-400 animate-pulse' :
                                    tc.status === 'done' ? 'bg-green-400' :
                                        'bg-red-400'
                                    }`} />
                                {tc.tool === 'search_knowledge_base' && `Searching for "${tc.args.query}"`}
                                {tc.tool === 'ingest_repository' && `Ingesting ${tc.args.url}`}
                                {tc.tool === 'get_document_list' && 'Getting document list'}
                                {tc.tool === 'summarize_document' && `Summarizing ${tc.args.title}`}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}