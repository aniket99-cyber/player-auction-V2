import { AuctionModel, IAuction } from '@models/Auction.model';
import { BaseRepository } from '@repositories/implementations/BaseRepository';
import { IAuctionRepository } from '@repositories/interfaces/IAuctionRepository';

export class AuctionRepository extends BaseRepository<IAuction> implements IAuctionRepository {
  constructor() {
    super(AuctionModel);
  }

  async setCurrentBid(auctionId: string, amount: number, teamId: string): Promise<IAuction | null> {
    return this.model
      .findByIdAndUpdate(
        auctionId,
        { currentBid: { amount, team: teamId } },
        { new: true, runValidators: true },
      )
      .exec();
  }

  async advanceToNextPlayer(auctionId: string, nextPlayerId: string | null): Promise<IAuction | null> {
    return this.model
      .findByIdAndUpdate(
        auctionId,
        { currentPlayer: nextPlayerId, currentBid: undefined },
        { new: true },
      )
      .exec();
  }
}
