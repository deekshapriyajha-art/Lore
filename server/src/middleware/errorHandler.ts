import { Request, Response, NextFunction } from "express";
import logger from "../lib/logger";

export class AppError extends Error {
    constructor(
        public statusCode: number,
        message: string
    ) {
        super(message);
        this.name = 'App Error'
    }
}

export function errorHandler(
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
): void {
    // CORS error
    if (err.message.startsWith('CORS:')) {
        res.status(403).json({ error: 'Origin not allowed' })
        return
    }
    if (err instanceof AppError) {
        logger.warn({
            statusCode: err.statusCode,
            message: err.message,
            path: req.path
        }, 'Application Error');

        res.status(err.statusCode).json({ error: err.message });
        return;
    }

    if (err.name == 'ZodError') {
        res.status(422).json({
            error: 'Validation failed',
            details: err.message
        })
        return
    }

    logger.error({
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method
    }, 'Unexpected error')

    res.status(500).json({
        error: 'Internal server error'
    })

}