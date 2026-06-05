import { Source } from "../../types";

interface Props {
    source: Source
}

export const SourceCard = ({ source }: Props) => {
    return (
        <a
            href={source.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-2 p-2 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors text-sm"
        >
            <span className="text-blue-500 mt-0.5">📄</span>
            <div className="min-w-0">
                <div className="font-medium text-gray-800 truncate">{source.title}</div>
                {source.heading && (
                    <div className="text-gray-500 text-xs truncate">{source.heading}</div>
                )}
            </div>
        </a>
    )
}