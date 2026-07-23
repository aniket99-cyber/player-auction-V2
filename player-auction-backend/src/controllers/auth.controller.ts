import { Request, Response } from 'express';
import { AuthService } from '@services/auth.service';
import { ApiResponse } from '@utils/ApiResponse';
import { ApiError } from '@utils/ApiError';

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  register = async (req: Request, res: Response): Promise<void> => {
    const result = await this.authService.register(req.body);
    res.status(201).json(new ApiResponse('Registration successful', result));
  };

  login = async (req: Request, res: Response): Promise<void> => {
    const result = await this.authService.login(req.body);
    res.status(200).json(new ApiResponse('Login successful', result));
  };

  refresh = async (req: Request, res: Response): Promise<void> => {
    const { refreshToken } = req.body;
    const tokens = await this.authService.refresh(refreshToken);
    res.status(200).json(new ApiResponse('Token refreshed', tokens));
  };

  logout = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw ApiError.unauthorized();
    }
    await this.authService.logout(req.user.sub);
    res.status(200).json(new ApiResponse('Logout successful'));
  };
}
