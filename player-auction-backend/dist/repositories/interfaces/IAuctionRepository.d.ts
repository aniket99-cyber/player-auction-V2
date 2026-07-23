import { IAuction } from '@models/Auction.model';
import { IRepository } from '@repositories/interfaces/IRepository';
export interface IAuctionRepository extends IRepository<IAuction> {
    setCurrentBid(auctionId: string, amount: number, teamId: string): Promise<IAuction | null>;
    advanceToNextPlayer(auctionId: string, nextPlayerId: string | null): Promise<IAuction | null>;
}
