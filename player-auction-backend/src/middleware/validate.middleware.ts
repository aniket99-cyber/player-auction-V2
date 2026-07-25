import { NextFunction, Request, Response } from 'express';
import { ObjectSchema } from 'joi';
import { ApiError } from '@utils/ApiError';

type ValidationTarget = 'body' | 'params' | 'query';

export function validate(schema: ObjectSchema, target: ValidationTarget = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req[target], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const details = error.details.map((d) => d.message);
      throw ApiError.badRequest('Validation failed', details);
    }

    req[target] = value;
    next();
  };
}
