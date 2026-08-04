import { ITeam } from '@models/Team.model';
import { IRepository } from '@repositories/interfaces/IRepository';

export interface ITeamRepository extends IRepository<ITeam> {
  deductBudget(teamId: string, amount: number): Promise<ITeam | null>;
  addPlayer(teamId: string, playerId: string): Promise<ITeam | null>;
  findByIdIncludingDeleted(id: string): Promise<ITeam | null>;
  findDeleted(): Promise<ITeam[]>;
  softDelete(id: string, deletedBy: string): Promise<ITeam | null>;
  restore(id: string): Promise<ITeam | null>;
  bulkUpdateStatus(ids: string[], isDeleted: boolean): Promise<number>;
  addRetention(
    teamId: string,
    entry: {
      player: string;
      retentionPrice: number;
      retentionOrder: number;
      approvedBy: string;
    },
  ): Promise<ITeam | null>;
  /**
   * Restarts every team for a new auction: keeps `captain` and `retentions`
   * as-is, resets `players` to just the captain + retained player ids, and
   * restores `remainingBudget` to `totalBudget` minus the sum of retention
   * prices (captains cost nothing).
   */
  resetForAuction(): Promise<number>;
  /** Full wipe: clears captain, retentions, players, and restores remainingBudget to totalBudget. */
  resetAll(): Promise<number>;
}
