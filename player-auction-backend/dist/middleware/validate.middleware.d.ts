import { NextFunction, Request, Response } from 'express';
import { ObjectSchema } from 'joi';
type ValidationTarget = 'body' | 'params' | 'query';
export declare function validate(schema: ObjectSchema, target?: ValidationTarget): (req: Request, _res: Response, next: NextFunction) => void;
export {};
