import { Request, Response } from 'express';
import { QueryFilter } from 'mongoose';
import { TeamService } from '@services/team.service';
import { TeamImportService } from '@services/team-import.service';
import { ITeamRepository } from '@repositories/interfaces/ITeamRepository';
import { IUserRepository } from '@repositories/interfaces/IUserRepository';
import { ITeam } from '@models/Team.model';
import { ApiResponse } from '@utils/ApiResponse';
import { ApiError } from '@utils/ApiError';
import { uploadBufferToCloudinary } from '@config/cloudinary';

export class TeamController {
  constructor(
    private readonly teamService: TeamService,
    private readonly teamImportService: TeamImportService,
    private readonly teamRepository: ITeamRepository,
    private readonly userRepository: IUserRepository,
  ) {}

  list = async (req: Request, res: Response): Promise<void> => {
    const { page = '1', limit = '20', search, season, ids, sortBy, sortOrder } = req.query as Record<
      string,
      string
    >;

    const filter: QueryFilter<ITeam> = {};
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }
    if (season) {
      filter.season = season;
    }
    if (ids) {
      filter._id = { $in: ids.split(',') };
    }

    const result = await this.teamRepository.findPaginated(filter, {
      page: Number(page),
      limit: Number(limit),
      sortBy,
      sortOrder: sortOrder as 'asc' | 'desc' | undefined,
    });

    const withOwnerNames = await this.attachOwnerNames(result.data);
    res.status(200).json(new ApiResponse('Teams retrieved', { ...result, data: withOwnerNames }));
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const team = await this.teamRepository.findById(req.params.id);
    if (!team) {
      throw ApiError.notFound('Team not found');
    }
    const [withOwnerName] = await this.attachOwnerNames([team]);
    res.status(200).json(new ApiResponse('Team retrieved', withOwnerName));
  };

  private async attachOwnerNames(
    teams: ITeam[],
  ): Promise<Array<Record<string, unknown> & { ownerName?: string }>> {
    if (teams.length === 0) return [];

    const ownerIds = [...new Set(teams.filter((t) => t.owner).map((t) => t.owner!.toString()))];
    const owners =
      ownerIds.length > 0 ? await this.userRepository.findMany({ _id: { $in: ownerIds } } as never) : [];
    const ownerNameById = new Map(owners.map((o) => [o._id.toString(), o.name]));

    return teams.map((team) => ({
      ...team.toObject(),
      ownerName: team.owner ? ownerNameById.get(team.owner.toString()) : undefined,
    }));
  }

  create = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw ApiError.unauthorized();
    const team = await this.teamService.createTeam(req.body, req.user.sub);
    res.status(201).json(new ApiResponse('Team created', team));
  };

  update = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw ApiError.unauthorized();
    const team = await this.teamService.updateTeam(req.params.id, req.body, req.user.sub);
    res.status(200).json(new ApiResponse('Team updated', team));
  };

  uploadLogo = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw ApiError.unauthorized();
    if (!req.file) {
      throw ApiError.badRequest('No image file provided');
    }

    const { secureUrl, publicId } = await uploadBufferToCloudinary(req.file.buffer, {
      folder: 'teams',
      publicId: req.params.id,
      originalName: req.file.originalname,
    });

    const team = await this.teamService.updateTeam(
      req.params.id,
      { logoUrl: secureUrl, logoPublicId: publicId },
      req.user.sub,
    );
    res.status(200).json(new ApiResponse('Logo uploaded', team));
  };

  addRetention = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw ApiError.unauthorized();
    const team = await this.teamService.addRetention({
      teamId: req.params.id,
      playerId: req.body.playerId,
      retentionPrice: Number(req.body.retentionPrice),
      retentionOrder: Number(req.body.retentionOrder),
      approvedBy: req.user.sub,
    });
    res.status(200).json(new ApiResponse('Retention added', team));
  };


  softDelete = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw ApiError.unauthorized();
    await this.teamService.softDeleteTeam(req.params.id, req.user.sub);
    res.status(200).json(new ApiResponse('Team deleted'));
  };

  restore = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw ApiError.unauthorized();
    const team = await this.teamService.restoreTeam(req.params.id, req.user.sub);
    res.status(200).json(new ApiResponse('Team restored', team));
  };

  listDeleted = async (_req: Request, res: Response): Promise<void> => {
    const teams = await this.teamService.listDeletedTeams();
    res.status(200).json(new ApiResponse('Deleted teams retrieved', teams));
  };

  bulkUpdateStatus = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw ApiError.unauthorized();
    const modifiedCount = await this.teamService.bulkUpdateStatus(
      req.body.teamIds,
      req.body.isDeleted,
      req.user.sub,
    );
    res.status(200).json(new ApiResponse('Bulk update applied', { modifiedCount }));
  };

  auditHistory = async (req: Request, res: Response): Promise<void> => {
    const history = await this.teamService.getAuditHistory(req.params.id);
    res.status(200).json(new ApiResponse('Audit history retrieved', history));
  };

  importCsv = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw ApiError.unauthorized();
    if (!req.file) {
      throw ApiError.badRequest('No CSV file provided');
    }
    const result = await this.teamImportService.importFromCsv(req.file.buffer, req.user.sub);
    res.status(201).json(new ApiResponse(`${result.imported} teams imported`, result));
  };

  importExcel = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw ApiError.unauthorized();
    if (!req.file) {
      throw ApiError.badRequest('No Excel file provided');
    }
    const result = await this.teamImportService.importFromExcel(req.file.buffer, req.user.sub);
    res.status(201).json(new ApiResponse(`${result.imported} teams imported`, result));
  };
}
