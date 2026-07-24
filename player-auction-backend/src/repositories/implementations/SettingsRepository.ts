import { IBidIncrementRule, ISettings, SettingsModel } from '@models/Settings.model';
import { ISettingsRepository } from '@repositories/interfaces/ISettingsRepository';

export class SettingsRepository implements ISettingsRepository {
  async getOrCreate(): Promise<ISettings> {
    const existing = await SettingsModel.findOne({}).exec();
    if (existing) {
      if (existing.requiredPlayersPerTeam == null) {
        existing.requiredPlayersPerTeam = 4;
        await existing.save();
      }
      return existing;
    }

    const created = new SettingsModel({});
    return created.save();
  }

  async update(data: {
    defaultTeamBudget?: number;
    requiredPlayersPerTeam?: number;
    defaultBidIncrementRules?: IBidIncrementRule[];
  }): Promise<ISettings> {
    const updated = await SettingsModel.findOneAndUpdate({}, data, {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    }).exec();
    // findOneAndUpdate with upsert:true always returns a document, but the
    // Mongoose type still reports it as possibly-null.
    return updated as ISettings;
  }
}
