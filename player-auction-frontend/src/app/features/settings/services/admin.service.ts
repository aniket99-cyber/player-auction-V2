import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { BidIncrementRule } from '../../../core/models';

export interface SessionResetSummary {
  auctions: number;
  teams: number;
  players: number;
  owners: number;
  captains: number;
  bids: number;
  auditLogs: number;
}

export interface Settings {
  id: string;
  defaultTeamBudget: number;
  requiredPlayersPerTeam: number;
  defaultBidIncrementRules: BidIncrementRule[];
}

export interface UpdateSettingsRequest {
  defaultTeamBudget?: number;
  requiredPlayersPerTeam?: number;
  defaultBidIncrementRules?: BidIncrementRule[];
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly api = inject(ApiService);

  /** Permanently wipes all Teams, Players, Owners, Captains, Auctions, Bids and audit logs. User accounts are preserved. */
  resetSession(): Observable<SessionResetSummary> {
    return this.api.post<SessionResetSummary>('/admin/reset-session', {});
  }

  getSettings(): Observable<Settings> {
    return this.api.get<Settings>('/admin/settings');
  }

  updateSettings(payload: UpdateSettingsRequest): Observable<Settings> {
    return this.api.patch<Settings>('/admin/settings', payload);
  }
}
