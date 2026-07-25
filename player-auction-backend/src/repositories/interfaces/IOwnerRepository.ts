import { IOwner } from '@models/Owner.model';
import { IRepository } from '@repositories/interfaces/IRepository';

export interface IOwnerRepository extends IRepository<IOwner> {
  findByTeam(teamId: string): Promise<IOwner | null>;
}
