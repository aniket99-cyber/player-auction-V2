import { IBidIncrementRule, ISettings } from '@models/Settings.model';

export interface ISettingsRepository {
  /** Returns the singleton settings document, creating it with defaults on first access. */
  getOrCreate(): Promise<ISettings>;
  update(data: {
    defaultTeamBudget?: number;
    requiredPlayersPerTeam?: number;
    defaultBidIncrementRules?: IBidIncrementRule[];
  }): Promise<ISettings>;
}
