import { NextFunction, Request, Response } from 'express';
type AsyncRouteHandler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;
export declare function asyncHandler(handler: AsyncRouteHandler): (req: Request, res: Response, next: NextFunction) => void;
export {};
