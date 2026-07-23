import { Request, Response } from 'express';
import { AuthService } from '@services/auth.service';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register: (req: Request, res: Response) => Promise<void>;
    login: (req: Request, res: Response) => Promise<void>;
    refresh: (req: Request, res: Response) => Promise<void>;
    logout: (req: Request, res: Response) => Promise<void>;
}
