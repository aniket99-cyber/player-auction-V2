import { IPlayer } from '@models/Player.model';
import { PlayerAuctionStatus } from '@constants/enums';
import { IRepository } from '@repositories/interfaces/IRepository';

export interface IPlayerRepository extends IRepository<IPlayer> {
  findByAuctionStatus(status: PlayerAuctionStatus): Promise<IPlayer[]>;
  markSold(playerId: string, teamId: string, finalPrice: number): Promise<IPlayer | null>;
  markUnsold(playerId: string): Promise<IPlayer | null>;
  findByIdIncludingDeleted(id: string): Promise<IPlayer | null>;
  findDeleted(): Promise<IPlayer[]>;
  softDelete(id: string, deletedBy: string): Promise<IPlayer | null>;
  restore(id: string): Promise<IPlayer | null>;
  bulkUpdateStatus(ids: string[], isDeleted: boolean): Promise<number>;
  bulkUpdateAuctionStatus(ids: string[], auctionStatus: PlayerAuctionStatus): Promise<number>;
}
