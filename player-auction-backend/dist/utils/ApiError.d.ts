export declare class ApiError extends Error {
    readonly statusCode: number;
    readonly isOperational: boolean;
    readonly details?: unknown;
    constructor(statusCode: number, message: string, details?: unknown, isOperational?: boolean);
    static badRequest(message: string, details?: unknown): ApiError;
    static unauthorized(message?: string): ApiError;
    static forbidden(message?: string): ApiError;
    static notFound(message?: string): ApiError;
    static conflict(message: string): ApiError;
    static internal(message?: string): ApiError;
}
