import OpenAI from 'openai'
import { Response } from 'express'
import { LORE_TOOLS } from './tools'
import { executeTool } from './tool-executor'
import logger from '../lib/logger'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const MODEL = 'gpt-4o-mini'
const MAX_ITERATIONS = 5

const SYSTEM_PROMPT = `You are Lore, an intelligent developer assistant with access to a knowledge base of GitHub repositories and technical documentation.

You have tools to search the knowledge base, ingest new repositories, list available documents, and summarize specific docs.

Guidelines:
- Always search the knowledge base before answering technical questions
- If a repo isn't in the knowledge base and the user asks about it, offer to ingest it
- Cite your sources by mentioning the document title and section
- If the knowledge base doesn't have relevant information, say so clearly
- For complex questions, search multiple times with different queries
- Be concise and precise in your answers`

/**
 * Agent query loop — model calls tools until it has enough information to answer, then streams the final response.
 */
export async function runAgentLoop(
    question: string,
    res: Response
): Promise<void> {
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.flushHeaders()

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: question }
    ];

    let iterations = 0;

    while (iterations < MAX_ITERATIONS) {
        iterations++
        logger.info({ iteration: iterations }, 'Agent iteration');

        const response = await openai.chat.completions.create({
            model: MODEL,
            messages,
            tools: LORE_TOOLS,
            tool_choice: 'auto'
        });

        const message = response.choices[0].message;

        if (!message.tool_calls || message.tool_calls.length === 0) {
            const content = message.content ?? '';

            const streamResponse = openai.chat.completions.create({
                model: MODEL,
                messages: [...messages, { role: 'assistant', content }],
                stream: true
            });

            const finalStream = await openai.chat.completions.create({
                model: MODEL,
                messages,
                tools: LORE_TOOLS,
                tool_choice: 'none',
                stream: true
            });

            for await (const chunk of finalStream) {
                const text = chunk.choices[0]?.delta?.content;
                if (text) {
                    res.write(`data: ${JSON.stringify({ type: 'token', text })}\n\n`)
                }
            }
            break
        }

        messages.push({ role: 'assistant', content: null, tool_calls: message.tool_calls });

        for (const toolCall of message.tool_calls) {
            if (toolCall.type !== 'function') continue
            const toolName = toolCall.function.name
            const toolArgs = JSON.parse(toolCall.function.arguments)

            res.write(`data: {JSON.stringify({
                type: 'tool_call',
                tool: toolName,
                args: toolArgs
                })}\n\n`);

            const result = await executeTool(toolName, toolArgs);

            messages.push({
                role: 'tool',
                tool_call_id: toolCall.id,
                content: JSON.stringify(result.data ?? result.error)
            });

            res.write(`data: ${JSON.stringify({
                type: 'tool_result',
                tool: toolName,
                success: result.success
            })}\n\n`)
        }
    }
    const sources = extractSources(messages);
    res.write(`data: ${JSON.stringify({ type: 'sources', sources })}\n\n`)
    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`)
    res.end()
}

function extractSources(
    messages: OpenAI.Chat.ChatCompletionMessageParam[]
): { title: string; sourceUrl: string; heading: string | null }[] {
    const sources: { title: string; sourceUrl: string; heading: string | null }[] = []
    const seen = new Set<string>()

    for (const msg of messages) {
        if (msg.role !== 'tool') continue
        try {
            const data = JSON.parse(msg.content as string)
            if (data?.results) {
                for (const r of data.results) {
                    if (r.source_url && !seen.has(r.source_url)) {
                        seen.add(r.source_url)
                        sources.push({
                            title: r.title ?? r.source_url,
                            sourceUrl: r.source_url,
                            heading: r.heading ?? null
                        })
                    }
                }
            }
        } catch {
            // skip wrong results
        }
    }

    return sources
}
