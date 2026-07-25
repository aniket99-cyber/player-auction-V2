import { Request, Response } from 'express';
import { AuctionService } from '@services/auction.service';
import { IAuctionRepository } from '@repositories/interfaces/IAuctionRepository';
import { IBidRepository } from '@repositories/interfaces/IBidRepository';
import { IPlayerRepository } from '@repositories/interfaces/IPlayerRepository';
import { PlayerRepository } from '@repositories/implementations/PlayerRepository';
import { ApiResponse } from '@utils/ApiResponse';
import { ApiError } from '@utils/ApiError';
import { AuctionSelectionMode, AuctionStatus, PlayerAuctionStatus } from '@constants/enums';

export class AuctionController {
  constructor(
    private readonly auctionService: AuctionService,
    private readonly auctionRepository: IAuctionRepository,
    private readonly bidRepository: IBidRepository,
    private readonly playerRepository: IPlayerRepository = new PlayerRepository(),
  ) {}

  list = async (req: Request, res: Response): Promise<void> => {
    const { page = '1', limit = '20', status } = req.query as Record<string, string>;
    const filter = status ? { status: status as AuctionStatus } : {};

    const result = await this.auctionRepository.findPaginated(filter, {
      page: Number(page),
      limit: Number(limit),
    });

    res.status(200).json(new ApiResponse('Auctions retrieved', result));
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const auction = await this.auctionRepository.findById(req.params.id);
    if (!auction) {
      throw ApiError.notFound('Auction not found');
    }
    res.status(200).json(new ApiResponse('Auction retrieved', auction));
  };

  create = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw ApiError.unauthorized();

    // Automatically exclude any Captain, Retained, or Sold players from entering the auction queue
    let playerQueue = req.body.playerQueue;
    if (Array.isArray(playerQueue) && playerQueue.length > 0) {
      const eligiblePlayers = await this.playerRepository.findMany({
        _id: { $in: playerQueue },
        auctionStatus: { $in: [PlayerAuctionStatus.PENDING, PlayerAuctionStatus.UNSOLD] },
      } as never);
      const eligibleSet = new Set(eligiblePlayers.map((p) => p._id.toString()));
      playerQueue = playerQueue.filter((id: string) => eligibleSet.has(id));
    }

    const auction = await this.auctionRepository.create({
      ...req.body,
      playerQueue,
      createdBy: req.user.sub,
      selectionMode: req.body.selectionMode ?? AuctionSelectionMode.SEQUENTIAL,
    } as never);

    res.status(201).json(new ApiResponse('Auction created', auction));
  };

  updateQueue = async (req: Request, res: Response): Promise<void> => {
    const auction = await this.auctionRepository.updateById(req.params.id, {
      playerQueue: req.body.playerQueue,
    } as never);
    if (!auction) {
      throw ApiError.notFound('Auction not found');
    }
    res.status(200).json(new ApiResponse('Queue updated', auction));
  };

  start = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw ApiError.unauthorized();
    await this.auctionService.startAuction(req.params.id, req.user.sub);
    res.status(200).json(new ApiResponse('Auction started'));
  };

  pause = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw ApiError.unauthorized();
    await this.auctionService.pauseAuction(req.params.id, req.user.sub);
    res.status(200).json(new ApiResponse('Auction paused'));
  };

  resume = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw ApiError.unauthorized();
    await this.auctionService.resumeAuction(req.params.id, req.user.sub);
    res.status(200).json(new ApiResponse('Auction resumed'));
  };

  next = async (req: Request, res: Response): Promise<void> => {
    await this.auctionService.advanceToNextManually(req.params.id);
    res.status(200).json(new ApiResponse('Advanced to next player'));
  };

  skip = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw ApiError.unauthorized();
    await this.auctionService.skipPlayer(req.params.id, req.user.sub);
    res.status(200).json(new ApiResponse('Player skipped'));
  };

  finalize = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw ApiError.unauthorized();
    await this.auctionService.enterFinalizing(req.params.id, req.user.sub);
    res.status(200).json(new ApiResponse('Finalizing — pick the winning team'));
  };

  confirmSale = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw ApiError.unauthorized();
    const teamId = (req.body.teamId as string | null | undefined) ?? null;
    await this.auctionService.confirmSale(req.params.id, req.user.sub, teamId);
    res.status(200).json(new ApiResponse(teamId ? 'Player sold' : 'Player marked unsold'));
  };

  startNextRound = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw ApiError.unauthorized();
    await this.auctionService.startNextRound(req.params.id, req.user.sub);
    res.status(200).json(new ApiResponse('Next round started'));
  };

  bidHistory = async (req: Request, res: Response): Promise<void> => {
    let playerId = req.query.playerId as string | undefined;

    if (!playerId) {
      const auction = await this.auctionRepository.findById(req.params.id);
      if (!auction?.currentPlayer) {
        res.status(200).json(new ApiResponse('Bid history retrieved', []));
        return;
      }
      playerId = auction.currentPlayer.toString();
    }

    const bids = await this.bidRepository.findByAuctionAndPlayer(req.params.id, playerId);
    res.status(200).json(new ApiResponse('Bid history retrieved', bids));
  };
}
