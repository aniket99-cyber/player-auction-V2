import { IOwner, OwnerModel } from '@models/Owner.model';
import { BaseRepository } from '@repositories/implementations/BaseRepository';
import { IOwnerRepository } from '@repositories/interfaces/IOwnerRepository';

export class OwnerRepository extends BaseRepository<IOwner> implements IOwnerRepository {
  constructor() {
    super(OwnerModel);
  }

  async findByTeam(teamId: string): Promise<IOwner | null> {
    return this.model.findOne({ team: teamId }).exec();
  }
}
