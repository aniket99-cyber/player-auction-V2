import { ITeam } from '@models/Team.model';
import { IRepository } from '@repositories/interfaces/IRepository';
export interface ITeamRepository extends IRepository<ITeam> {
    deductBudget(teamId: string, amount: number): Promise<ITeam | null>;
    addPlayer(teamId: string, playerId: string): Promise<ITeam | null>;
}
