import { ICaptain } from '@models/Captain.model';
import { IRepository } from '@repositories/interfaces/IRepository';

export interface ICaptainRepository extends IRepository<ICaptain> {
  findByTeam(teamId: string): Promise<ICaptain | null>;
}
