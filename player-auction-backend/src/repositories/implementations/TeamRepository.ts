import { ITeam, TeamModel } from '@models/Team.model';
import { BaseRepository } from '@repositories/implementations/BaseRepository';
import { ITeamRepository } from '@repositories/interfaces/ITeamRepository';

export class TeamRepository extends BaseRepository<ITeam> implements ITeamRepository {
  constructor() {
    super(TeamModel);
  }

  async deductBudget(teamId: string, amount: number): Promise<ITeam | null> {
    return this.model
      .findOneAndUpdate(
        { _id: teamId, remainingBudget: { $gte: amount } },
        { $inc: { remainingBudget: -amount } },
        { new: true, runValidators: true },
      )
      .exec();
  }

  async addPlayer(teamId: string, playerId: string): Promise<ITeam | null> {
    return this.model
      .findByIdAndUpdate(teamId, { $addToSet: { players: playerId } }, { new: true })
      .exec();
  }

  async findByIdIncludingDeleted(id: string): Promise<ITeam | null> {
    return this.model.findById(id).setOptions({ includeDeleted: true }).exec();
  }

  async findDeleted(): Promise<ITeam[]> {
    return this.model
      .find({ isDeleted: true })
      .setOptions({ includeDeleted: true })
      .sort({ deletedAt: -1 })
      .exec();
  }

  async softDelete(id: string, deletedBy: string): Promise<ITeam | null> {
    return this.model
      .findByIdAndUpdate(
        id,
        { isDeleted: true, deletedAt: new Date(), deletedBy },
        { new: true },
      )
      .setOptions({ includeDeleted: true })
      .exec();
  }

  async restore(id: string): Promise<ITeam | null> {
    return this.model
      .findByIdAndUpdate(
        id,
        { isDeleted: false, $unset: { deletedAt: '', deletedBy: '' } },
        { new: true },
      )
      .setOptions({ includeDeleted: true })
      .exec();
  }

  async bulkUpdateStatus(ids: string[], isDeleted: boolean): Promise<number> {
    const update = isDeleted
      ? { isDeleted: true, deletedAt: new Date() }
      : { isDeleted: false, $unset: { deletedAt: '', deletedBy: '' } };

    const result = await this.model
      .updateMany({ _id: { $in: ids } }, update)
      .setOptions({ includeDeleted: true })
      .exec();

    return result.modifiedCount;
  }

  async addRetention(
    teamId: string,
    entry: { player: string; retentionPrice: number; retentionOrder: number; approvedBy: string },
  ): Promise<ITeam | null> {
    return this.model
      .findOneAndUpdate(
        { _id: teamId, remainingBudget: { $gte: entry.retentionPrice } },
        {
          $push: { retentions: { ...entry, retainedAt: new Date() } },
          $addToSet: { players: entry.player },
          $inc: { remainingBudget: -entry.retentionPrice },
        },
        { new: true, runValidators: true },
      )
      .exec();
  }
}
