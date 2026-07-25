import { AuctionModel, IAuction } from '@models/Auction.model';
import { AuctionPlayerState, AuctionStatus } from '@constants/enums';
import { BaseRepository } from '@repositories/implementations/BaseRepository';
import { IAuctionRepository } from '@repositories/interfaces/IAuctionRepository';

export class AuctionRepository extends BaseRepository<IAuction> implements IAuctionRepository {
  constructor() {
    super(AuctionModel);
  }

  async bumpCurrentBid(
    auctionId: string,
    newAmount: number,
    previousAmount: number | null,
  ): Promise<IAuction | null> {
    const update: Record<string, unknown> =
      previousAmount === null
        ? { currentBid: { amount: newAmount }, $unset: { previousBidAmount: '' } }
        : { currentBid: { amount: newAmount }, previousBidAmount: previousAmount };

    return this.model.findByIdAndUpdate(auctionId, update, { new: true, runValidators: true }).exec();
  }

  async restorePreviousBid(auctionId: string, previousAmount: number | null): Promise<IAuction | null> {
    if (previousAmount === null) {
      return this.model
        .findByIdAndUpdate(
          auctionId,
          { $unset: { currentBid: '', previousBidAmount: '' } },
          { new: true },
        )
        .exec();
    }
    return this.model
      .findByIdAndUpdate(
        auctionId,
        { currentBid: { amount: previousAmount }, $unset: { previousBidAmount: '' } },
        { new: true, runValidators: true },
      )
      .exec();
  }

  async clearCurrentBid(auctionId: string): Promise<IAuction | null> {
    return this.model
      .findByIdAndUpdate(auctionId, { $unset: { currentBid: '', previousBidAmount: '' } }, { new: true })
      .exec();
  }

  async advanceToNextPlayer(
    auctionId: string,
    nextPlayerId: string | null,
    playerState: AuctionPlayerState | null,
  ): Promise<IAuction | null> {
    return this.model
      .findByIdAndUpdate(
        auctionId,
        {
          currentPlayer: nextPlayerId,
          playerState,
          $unset: { currentBid: '' },
        },
        { new: true },
      )
      .exec();
  }

  async setStatus(auctionId: string, status: AuctionStatus): Promise<IAuction | null> {
    const extra: Record<string, unknown> = { status };
    if (status === AuctionStatus.LIVE) extra.startedAt = new Date();
    if (status === AuctionStatus.COMPLETED) extra.completedAt = new Date();

    return this.model.findByIdAndUpdate(auctionId, extra, { new: true }).exec();
  }

  async setPlayerState(auctionId: string, playerState: AuctionPlayerState | null): Promise<IAuction | null> {
    return this.model
      .findByIdAndUpdate(auctionId, { playerState }, { new: true })
      .exec();
  }

  async removeFromQueue(auctionId: string, playerId: string): Promise<IAuction | null> {
    return this.model
      .findByIdAndUpdate(auctionId, { $pull: { playerQueue: playerId } }, { new: true })
      .exec();
  }

  async requeuePlayer(auctionId: string, playerId: string): Promise<IAuction | null> {
    return this.model
      .findByIdAndUpdate(auctionId, { $addToSet: { playerQueue: playerId } }, { new: true })
      .exec();
  }

  async addUnsoldThisRound(auctionId: string, playerId: string): Promise<IAuction | null> {
    return this.model
      .findByIdAndUpdate(auctionId, { $addToSet: { unsoldThisRound: playerId } }, { new: true })
      .exec();
  }

  async startNextRound(auctionId: string): Promise<IAuction | null> {
    const auction = await this.model.findById(auctionId).exec();
    if (!auction) return null;

    return this.model
      .findByIdAndUpdate(
        auctionId,
        {
          playerQueue: auction.unsoldThisRound,
          unsoldThisRound: [],
          round: auction.round + 1,
          playerState: null,
        },
        { new: true },
      )
      .exec();
  }
}
