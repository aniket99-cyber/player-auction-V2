import { IBid } from '@models/Bid.model';
import { IRepository } from '@repositories/interfaces/IRepository';
export interface IBidRepository extends IRepository<IBid> {
    findByAuctionAndPlayer(auctionId: string, playerId: string): Promise<IBid[]>;
    findHighestBid(auctionId: string, playerId: string): Promise<IBid | null>;
}
