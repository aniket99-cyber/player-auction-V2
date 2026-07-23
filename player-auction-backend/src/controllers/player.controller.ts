import { Request, Response } from 'express';
import { QueryFilter } from 'mongoose';
import { PlayerService } from '@services/player.service';
import { PlayerImportService } from '@services/player-import.service';
import { IPlayerRepository } from '@repositories/interfaces/IPlayerRepository';
import { IPlayer } from '@models/Player.model';
import { PlayerAuctionStatus, PlayerRole } from '@constants/enums';
import { ApiResponse } from '@utils/ApiResponse';
import { ApiError } from '@utils/ApiError';
import { uploadBufferToCloudinary } from '@config/cloudinary';

export class PlayerController {
  constructor(
    private readonly playerService: PlayerService,
    private readonly playerImportService: PlayerImportService,
    private readonly playerRepository: IPlayerRepository,
  ) {}

  list = async (req: Request, res: Response): Promise<void> => {
    const {
      page = '1',
      limit = '20',
      search,
      role,
      country,
      auctionStatus,
      ids,
      minAge,
      maxAge,
      passingYear,
      minBasePrice,
      maxBasePrice,
      sortBy,
      sortOrder,
    } = req.query as Record<string, string>;

    const filter: QueryFilter<IPlayer> = {};
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }
    if (role) {
      filter.role = role as PlayerRole;
    }
    if (country) {
      filter.country = country;
    }
    if (auctionStatus) {
      filter.auctionStatus = auctionStatus as PlayerAuctionStatus;
    }
    if (ids) {
      filter._id = { $in: ids.split(',') };
    }
    if (passingYear) {
      filter.passingYear = Number(passingYear);
    }
    if (minAge || maxAge) {
      filter.age = {
        ...(minAge ? { $gte: Number(minAge) } : {}),
        ...(maxAge ? { $lte: Number(maxAge) } : {}),
      };
    }
    if (minBasePrice || maxBasePrice) {
      filter.basePrice = {
        ...(minBasePrice ? { $gte: Number(minBasePrice) } : {}),
        ...(maxBasePrice ? { $lte: Number(maxBasePrice) } : {}),
      };
    }

    const result = await this.playerRepository.findPaginated(filter, {
      page: Number(page),
      limit: Number(limit),
      sortBy,
      sortOrder: sortOrder as 'asc' | 'desc' | undefined,
    });

    res.status(200).json(new ApiResponse('Players retrieved', result));
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const player = await this.playerRepository.findById(req.params.id);
    if (!player) {
      throw ApiError.notFound('Player not found');
    }
    res.status(200).json(new ApiResponse('Player retrieved', player));
  };

  create = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw ApiError.unauthorized();
    const player = await this.playerService.createPlayer(req.body, req.user.sub);
    res.status(201).json(new ApiResponse('Player registered', player));
  };

  update = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw ApiError.unauthorized();
    const player = await this.playerService.updatePlayer(req.params.id, req.body, req.user.sub);
    res.status(200).json(new ApiResponse('Player updated', player));
  };

  uploadImage = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw ApiError.unauthorized();
    if (!req.file) {
      throw ApiError.badRequest('No image file provided');
    }

    const imageUrl = await uploadBufferToCloudinary(req.file.buffer, {
      folder: 'player-auction/player-images',
      publicId: req.params.id,
    });

    const player = await this.playerService.updatePlayer(req.params.id, { imageUrl }, req.user.sub);
    res.status(200).json(new ApiResponse('Image uploaded', player));
  };

  softDelete = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw ApiError.unauthorized();
    await this.playerService.softDeletePlayer(req.params.id, req.user.sub);
    res.status(200).json(new ApiResponse('Player deleted'));
  };

  restore = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw ApiError.unauthorized();
    const player = await this.playerService.restorePlayer(req.params.id, req.user.sub);
    res.status(200).json(new ApiResponse('Player restored', player));
  };

  listDeleted = async (_req: Request, res: Response): Promise<void> => {
    const players = await this.playerService.listDeletedPlayers();
    res.status(200).json(new ApiResponse('Deleted players retrieved', players));
  };

  bulkUpdateStatus = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw ApiError.unauthorized();
    const modifiedCount = await this.playerService.bulkUpdateStatus(
      req.body.playerIds,
      req.body.isDeleted,
      req.user.sub,
    );
    res.status(200).json(new ApiResponse('Bulk update applied', { modifiedCount }));
  };

  bulkUpdateAuctionStatus = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw ApiError.unauthorized();
    const modifiedCount = await this.playerService.bulkUpdateAuctionStatus(
      req.body.playerIds,
      req.body.auctionStatus,
      req.user.sub,
    );
    res.status(200).json(new ApiResponse('Bulk status update applied', { modifiedCount }));
  };

  auditHistory = async (req: Request, res: Response): Promise<void> => {
    const history = await this.playerService.getAuditHistory(req.params.id);
    res.status(200).json(new ApiResponse('Audit history retrieved', history));
  };

  importCsv = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw ApiError.unauthorized();
    if (!req.file) {
      throw ApiError.badRequest('No CSV file provided');
    }
    const result = await this.playerImportService.importFromCsv(req.file.buffer, req.user.sub);
    res.status(201).json(new ApiResponse(`${result.imported} players imported`, result));
  };

  importExcel = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw ApiError.unauthorized();
    if (!req.file) {
      throw ApiError.badRequest('No Excel file provided');
    }
    const result = await this.playerImportService.importFromExcel(req.file.buffer, req.user.sub);
    res.status(201).json(new ApiResponse(`${result.imported} players imported`, result));
  };
}
