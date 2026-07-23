import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';

export interface SessionResetSummary {
  auctions: number;
  teams: number;
  players: number;
  owners: number;
  captains: number;
  bids: number;
  auditLogs: number;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly api = inject(ApiService);

  /** Permanently wipes all Teams, Players, Owners, Captains, Auctions, Bids and audit logs. User accounts are preserved. */
  resetSession(): Observable<SessionResetSummary> {
    return this.api.post<SessionResetSummary>('/admin/reset-session', {});
  }
}
