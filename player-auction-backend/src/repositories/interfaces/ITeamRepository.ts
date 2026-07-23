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
}
