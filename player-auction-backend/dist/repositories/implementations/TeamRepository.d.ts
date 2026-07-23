import { ITeam } from '@models/Team.model';
import { BaseRepository } from '@repositories/implementations/BaseRepository';
import { ITeamRepository } from '@repositories/interfaces/ITeamRepository';
export declare class TeamRepository extends BaseRepository<ITeam> implements ITeamRepository {
    constructor();
    deductBudget(teamId: string, amount: number): Promise<ITeam | null>;
    addPlayer(teamId: string, playerId: string): Promise<ITeam | null>;
}
