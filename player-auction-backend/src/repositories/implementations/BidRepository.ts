import { BidModel, IBid } from '@models/Bid.model';
import { BaseRepository } from '@repositories/implementations/BaseRepository';
import { IBidRepository } from '@repositories/interfaces/IBidRepository';

export class BidRepository extends BaseRepository<IBid> implements IBidRepository {
  constructor() {
    super(BidModel);
  }

  async findByAuctionAndPlayer(auctionId: string, playerId: string): Promise<IBid[]> {
    return this.model
      .find({ auction: auctionId, player: playerId })
      .sort({ amount: -1 })
      .exec();
  }

  async findHighestBid(auctionId: string, playerId: string): Promise<IBid | null> {
    return this.model
      .findOne({ auction: auctionId, player: playerId })
      .sort({ amount: -1 })
      .exec();
  }
}
