import { IAuction } from '@models/Auction.model';
import { BaseRepository } from '@repositories/implementations/BaseRepository';
import { IAuctionRepository } from '@repositories/interfaces/IAuctionRepository';
export declare class AuctionRepository extends BaseRepository<IAuction> implements IAuctionRepository {
    constructor();
    setCurrentBid(auctionId: string, amount: number, teamId: string): Promise<IAuction | null>;
    advanceToNextPlayer(auctionId: string, nextPlayerId: string | null): Promise<IAuction | null>;
}
