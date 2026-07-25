import { BidModel, IBid } from '@models/Bid.model';
import { BidStatus } from '@constants/enums';
import { BaseRepository } from '@repositories/implementations/BaseRepository';
import { IBidRepository } from '@repositories/interfaces/IBidRepository';

export class BidRepository extends BaseRepository<IBid> implements IBidRepository {
  constructor() {
    super(BidModel);
  }

  async findByAuctionAndPlayer(auctionId: string, playerId: string): Promise<IBid[]> {
    return this.model
      .find({ auction: auctionId, player: playerId })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findHighestBid(auctionId: string, playerId: string): Promise<IBid | null> {
    return this.model
      .findOne({ auction: auctionId, player: playerId })
      .sort({ amount: -1 })
      .exec();
  }

  async findHighestActiveBid(auctionId: string, playerId: string): Promise<IBid | null> {
    return this.model
      .findOne({ auction: auctionId, player: playerId, status: BidStatus.ACTIVE })
      .sort({ amount: -1 })
      .exec();
  }

  async markPreviousActiveAsOutbid(
    auctionId: string,
    playerId: string,
    exceptBidId: string,
  ): Promise<void> {
    await this.model
      .updateMany(
        { auction: auctionId, player: playerId, status: BidStatus.ACTIVE, _id: { $ne: exceptBidId } },
        { status: BidStatus.OUTBID },
      )
      .exec();
  }

  async markStatus(bidId: string, status: string): Promise<IBid | null> {
    return this.model.findByIdAndUpdate(bidId, { status }, { new: true }).exec();
  }

  async markAllForPlayer(auctionId: string, playerId: string, winningBidId: string | null): Promise<void> {
    if (winningBidId) {
      await this.model
        .updateOne({ _id: winningBidId }, { status: BidStatus.WINNING })
        .exec();
      await this.model
        .updateMany(
          { auction: auctionId, player: playerId, _id: { $ne: winningBidId }, status: BidStatus.ACTIVE },
          { status: BidStatus.OUTBID },
        )
        .exec();
    } else {
      await this.model
        .updateMany(
          { auction: auctionId, player: playerId, status: BidStatus.ACTIVE },
          { status: BidStatus.OUTBID },
        )
        .exec();
    }
  }
}
