import { Request, Response } from 'express';
import { SessionResetService } from '@services/session-reset.service';
import { ISettingsRepository } from '@repositories/interfaces/ISettingsRepository';
import { ApiResponse } from '@utils/ApiResponse';
import { ApiError } from '@utils/ApiError';

export class AdminController {
  constructor(
    private readonly sessionResetService: SessionResetService,
    private readonly settingsRepository: ISettingsRepository,
  ) {}

  resetSession = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw ApiError.unauthorized();

    const summary = await this.sessionResetService.resetSession(req.user.sub);
    res.status(200).json(new ApiResponse('Session reset — all auction data has been cleared', summary));
  };

  getSettings = async (_req: Request, res: Response): Promise<void> => {
    const settings = await this.settingsRepository.getOrCreate();
    res.status(200).json(new ApiResponse('Settings retrieved', settings));
  };

  updateSettings = async (req: Request, res: Response): Promise<void> => {
    const settings = await this.settingsRepository.update(req.body);
    res.status(200).json(new ApiResponse('Settings updated', settings));
  };
}
