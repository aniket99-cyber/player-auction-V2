import { IPlayer } from '@models/Player.model';
import { PlayerAuctionStatus } from '@constants/enums';
import { BaseRepository } from '@repositories/implementations/BaseRepository';
import { IPlayerRepository } from '@repositories/interfaces/IPlayerRepository';
export declare class PlayerRepository extends BaseRepository<IPlayer> implements IPlayerRepository {
    constructor();
    findByAuctionStatus(status: PlayerAuctionStatus): Promise<IPlayer[]>;
    markSold(playerId: string, teamId: string, finalPrice: number): Promise<IPlayer | null>;
    markUnsold(playerId: string): Promise<IPlayer | null>;
}
