import { ICaptain, CaptainModel } from '@models/Captain.model';
import { BaseRepository } from '@repositories/implementations/BaseRepository';
import { ICaptainRepository } from '@repositories/interfaces/ICaptainRepository';

export class CaptainRepository extends BaseRepository<ICaptain> implements ICaptainRepository {
  constructor() {
    super(CaptainModel);
  }

  async findByTeam(teamId: string): Promise<ICaptain | null> {
    return this.model.findOne({ team: teamId }).exec();
  }
}
