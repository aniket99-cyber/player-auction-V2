import { NextFunction, Request, Response } from 'express';
import { ApiError } from '@utils/ApiError';
import { logger } from '@utils/logger';

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({ success: false, message: `Route not found: ${req.originalUrl}` });
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ApiError) {
    if (!err.isOperational) {
      logger.error(err.message, { stack: err.stack });
    }
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      details: err.details,
    });
    return;
  }

  logger.error('Unhandled error', { message: err.message, stack: err.stack });
  res.status(500).json({ success: false, message: 'Internal server error' });
}
