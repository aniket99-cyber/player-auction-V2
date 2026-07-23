import { IBid } from '@models/Bid.model';
import { BaseRepository } from '@repositories/implementations/BaseRepository';
import { IBidRepository } from '@repositories/interfaces/IBidRepository';
export declare class BidRepository extends BaseRepository<IBid> implements IBidRepository {
    constructor();
    findByAuctionAndPlayer(auctionId: string, playerId: string): Promise<IBid[]>;
    findHighestBid(auctionId: string, playerId: string): Promise<IBid | null>;
}
