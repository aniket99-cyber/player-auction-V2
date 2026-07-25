import { IBid } from '@models/Bid.model';
import { IRepository } from '@repositories/interfaces/IRepository';

export interface IBidRepository extends IRepository<IBid> {
  findByAuctionAndPlayer(auctionId: string, playerId: string): Promise<IBid[]>;
  findHighestBid(auctionId: string, playerId: string): Promise<IBid | null>;
  findHighestActiveBid(auctionId: string, playerId: string): Promise<IBid | null>;
  markPreviousActiveAsOutbid(auctionId: string, playerId: string, exceptBidId: string): Promise<void>;
  markStatus(bidId: string, status: string): Promise<IBid | null>;
  markAllForPlayer(auctionId: string, playerId: string, winningBidId: string | null): Promise<void>;
}
