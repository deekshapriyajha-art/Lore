import { OpenAI } from "openai";
import { Response } from 'express';
import logger from "../lib/logger";

const MODEL = "gpt-4o-mini";

export async function streamResponse(
    systemPrompt: string,
    question: string,
    res: Response
): Promise<void> {
    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
    })

    logger.info({ model: MODEL }, 'Calling OpenAI API')

    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.flushHeaders()

    const stream = await openai.chat.completions.create({
        model: MODEL,
        max_tokens: 1024,
        stream: true,
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: question }
        ]
    })

    for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content
        if (text) {
            res.write(`data:${JSON.stringify({ type: 'token', text })}\n\n`)
        }
    }
    logger.info('Response complete')
}