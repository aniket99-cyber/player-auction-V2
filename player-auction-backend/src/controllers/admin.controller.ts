import { Request, Response } from 'express';
import { SessionResetService } from '@services/session-reset.service';
import { ApiResponse } from '@utils/ApiResponse';
import { ApiError } from '@utils/ApiError';

export class AdminController {
  constructor(private readonly sessionResetService: SessionResetService) {}

  resetSession = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw ApiError.unauthorized();

    const summary = await this.sessionResetService.resetSession(req.user.sub);
    res.status(200).json(new ApiResponse('Session reset — all auction data has been cleared', summary));
  };
}
