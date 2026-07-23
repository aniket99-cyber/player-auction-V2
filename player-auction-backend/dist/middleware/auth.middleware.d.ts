import { NextFunction, Request, Response } from 'express';
import { UserRole } from '@constants/enums';
export interface AccessTokenPayload {
    sub: string;
    role: UserRole;
    team?: string;
}
declare module 'express-serve-static-core' {
    interface Request {
        user?: AccessTokenPayload;
    }
}
export declare function authenticate(req: Request, _res: Response, next: NextFunction): void;
export declare function authorize(...allowedRoles: UserRole[]): (req: Request, _res: Response, next: NextFunction) => void;
