import { Request, Response } from 'express';
import { IOwnerRepository } from '@repositories/interfaces/IOwnerRepository';
import { ApiResponse } from '@utils/ApiResponse';
import { ApiError } from '@utils/ApiError';
import { uploadBufferToCloudinary } from '@config/cloudinary';

export class OwnerController {
  constructor(private readonly ownerRepository: IOwnerRepository) {}

  list = async (req: Request, res: Response): Promise<void> => {
    const { page = '1', limit = '20' } = req.query as Record<string, string>;
    const result = await this.ownerRepository.findPaginated(
      {},
      { page: Number(page), limit: Number(limit) },
    );
    res.status(200).json(new ApiResponse('Owners retrieved', result));
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const owner = await this.ownerRepository.findById(req.params.id);
    if (!owner) throw ApiError.notFound('Owner not found');
    res.status(200).json(new ApiResponse('Owner retrieved', owner));
  };

  getByTeam = async (req: Request, res: Response): Promise<void> => {
    const owner = await this.ownerRepository.findByTeam(req.params.teamId);
    res.status(200).json(new ApiResponse('Owner retrieved', owner));
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const existing = await this.ownerRepository.findByTeam(req.body.team);
    if (existing) {
      throw ApiError.conflict('This team already has an owner — edit the existing record instead');
    }
    const owner = await this.ownerRepository.create(req.body);
    res.status(201).json(new ApiResponse('Owner created', owner));
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const owner = await this.ownerRepository.updateById(req.params.id, req.body);
    if (!owner) throw ApiError.notFound('Owner not found');
    res.status(200).json(new ApiResponse('Owner updated', owner));
  };

  uploadImage = async (req: Request, res: Response): Promise<void> => {
    if (!req.file) throw ApiError.badRequest('No image file provided');

    const { secureUrl, publicId } = await uploadBufferToCloudinary(req.file.buffer, {
      folder: 'owners',
      publicId: req.params.id,
      originalName: req.file.originalname,
    });

    const owner = await this.ownerRepository.updateById(
      req.params.id,
      { imageUrl: secureUrl, imagePublicId: publicId } as never,
    );
    if (!owner) throw ApiError.notFound('Owner not found');
    res.status(200).json(new ApiResponse('Image uploaded', owner));
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    const deleted = await this.ownerRepository.deleteById(req.params.id);
    if (!deleted) throw ApiError.notFound('Owner not found');
    res.status(200).json(new ApiResponse('Owner deleted'));
  };
}
