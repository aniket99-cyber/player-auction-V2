import { Request, Response } from 'express';
import { ICaptainRepository } from '@repositories/interfaces/ICaptainRepository';
import { ApiResponse } from '@utils/ApiResponse';
import { ApiError } from '@utils/ApiError';

export class CaptainController {
  constructor(private readonly captainRepository: ICaptainRepository) {}

  list = async (req: Request, res: Response): Promise<void> => {
    const { page = '1', limit = '20' } = req.query as Record<string, string>;
    const result = await this.captainRepository.findPaginated(
      {},
      { page: Number(page), limit: Number(limit) },
    );
    res.status(200).json(new ApiResponse('Captains retrieved', result));
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const captain = await this.captainRepository.findById(req.params.id);
    if (!captain) throw ApiError.notFound('Captain not found');
    res.status(200).json(new ApiResponse('Captain retrieved', captain));
  };

  getByTeam = async (req: Request, res: Response): Promise<void> => {
    const captain = await this.captainRepository.findByTeam(req.params.teamId);
    res.status(200).json(new ApiResponse('Captain retrieved', captain));
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const existing = await this.captainRepository.findByTeam(req.body.team);
    if (existing) {
      throw ApiError.conflict('This team already has a captain — edit the existing record instead');
    }
    const captain = await this.captainRepository.create(req.body);
    res.status(201).json(new ApiResponse('Captain assigned', captain));
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const captain = await this.captainRepository.updateById(req.params.id, req.body);
    if (!captain) throw ApiError.notFound('Captain not found');
    res.status(200).json(new ApiResponse('Captain updated', captain));
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    const deleted = await this.captainRepository.deleteById(req.params.id);
    if (!deleted) throw ApiError.notFound('Captain not found');
    res.status(200).json(new ApiResponse('Captain removed'));
  };
}
