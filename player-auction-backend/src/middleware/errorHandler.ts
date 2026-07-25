import { NextFunction, Request, Response } from 'express';
import { Error as MongooseError } from 'mongoose';
import { MulterError } from 'multer';
import { ApiError } from '@utils/ApiError';
import { logger } from '@utils/logger';

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({ success: false, message: `Route not found: ${req.originalUrl}` });
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  // Mongoose invalid ObjectId / cast failure → 400
  if (err instanceof MongooseError.CastError) {
    res.status(400).json({
      success: false,
      message: `Invalid value for field "${err.path}": "${err.value}" is not a valid ${err.kind}.`,
    });
    return;
  }

  // Mongoose validation errors → 422
  if (err instanceof MongooseError.ValidationError) {
    const details = Object.values(err.errors).map((e) => e.message);
    res.status(422).json({
      success: false,
      message: 'Validation failed',
      details,
    });
    return;
  }

  // Multer file upload errors (wrong mime type, file too large, etc.) → 400
  if (err instanceof MulterError) {
    const message =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'File is too large. Maximum allowed size exceeded.'
        : `File upload error: ${err.message}`;
    res.status(400).json({ success: false, message });
    return;
  }

  // Known operational API errors
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
