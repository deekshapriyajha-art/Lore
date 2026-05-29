import rateLimit from 'express-rate-limit';

export const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: ' Too many requests. Please try again later' },
    standardHeaders: true,
    legacyHeaders: false
})

/**
 * Query Limit, 20 queries allowed in 15 minutes
 */
export const queryLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { error: 'Query limit reached. Please try after some time' },
    standardHeaders: true,
    legacyHeaders: false
})

/**
 * Ingestion Limit. 10 ingestion allowed in one hour
 */
export const ingestLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10,
    message: { error: 'Ingestion limit reached. Please try after some time' },
    standardHeaders: true,
    legacyHeaders: false
})