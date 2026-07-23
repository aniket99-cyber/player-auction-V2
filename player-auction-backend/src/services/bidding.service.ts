import { ApiError } from '@utils/ApiError';
import { eventBus } from '@events/EventBus';
import { IAuctionRepository } from '@repositories/interfaces/IAuctionRepository';
import { IBidRepository } from '@repositories/interfaces/IBidRepository';
import { ITeamRepository } from '@repositories/interfaces/ITeamRepository';
import { BidStatus } from '@constants/enums';

interface PlaceBidInput {
  auctionId: string;
  playerId: string;
  teamId: string;
  amount: number;
  placedBy: string;
}

const MIN_INCREMENT = 5;

export class BiddingService {
  constructor(
    private readonly auctionRepository: IAuctionRepository,
    private readonly bidRepository: IBidRepository,
    private readonly teamRepository: ITeamRepository,
  ) {}

  async placeBid(input: PlaceBidInput): Promise<void> {
    const auction = await this.auctionRepository.findById(input.auctionId);
    if (!auction) {
      throw ApiError.notFound('Auction not found');
    }

    if (!auction.currentPlayer || auction.currentPlayer.toString() !== input.playerId) {
      throw ApiError.badRequest('This player is not currently up for bidding');
    }

    const currentAmount = auction.currentBid?.amount ?? 0;
    if (input.amount < currentAmount + MIN_INCREMENT) {
      throw ApiError.badRequest(`Bid must be at least ${currentAmount + MIN_INCREMENT}`);
    }

    const team = await this.teamRepository.findById(input.teamId);
    if (!team || team.remainingBudget < input.amount) {
      throw ApiError.badRequest('Insufficient team budget for this bid');
    }

    const bid = await this.bidRepository.create({
      auction: input.auctionId,
      player: input.playerId,
      team: input.teamId,
      amount: input.amount,
      status: BidStatus.WINNING,
      placedBy: input.placedBy,
    } as never);

    await this.auctionRepository.setCurrentBid(input.auctionId, input.amount, input.teamId);

    eventBus.emit('bid.placed', { auctionId: input.auctionId, bid });
  }
}
