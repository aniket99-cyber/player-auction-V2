import { IAuctionRepository } from '@repositories/interfaces/IAuctionRepository';
import { IBidRepository } from '@repositories/interfaces/IBidRepository';
import { ITeamRepository } from '@repositories/interfaces/ITeamRepository';
interface PlaceBidInput {
    auctionId: string;
    playerId: string;
    teamId: string;
    amount: number;
    placedBy: string;
}
export declare class BiddingService {
    private readonly auctionRepository;
    private readonly bidRepository;
    private readonly teamRepository;
    constructor(auctionRepository: IAuctionRepository, bidRepository: IBidRepository, teamRepository: ITeamRepository);
    placeBid(input: PlaceBidInput): Promise<void>;
}
export {};
