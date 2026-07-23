import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { SocketService } from '../../../core/services/socket.service';
import { AuthService } from '../../../core/services/auth.service';
import {
  AddRetentionRequest,
  AuditLogEntry,
  CreateTeamRequest,
  ImportResult,
  PaginatedResult,
  Team,
  TeamListQuery,
  UpdateTeamRequest,
} from '../../../core/models';

export const TEAM_NAMESPACE = '/teams';

@Injectable({ providedIn: 'root' })
export class TeamService {
  private readonly api = inject(ApiService);
  private readonly socketService = inject(SocketService);
  private readonly authService = inject(AuthService);

  list(query: TeamListQuery): Observable<PaginatedResult<Team>> {
    return this.api.get<PaginatedResult<Team>>('/teams', { ...query, ids: query.ids?.join(',') });
  }

  getById(id: string): Observable<Team> {
    return this.api.get<Team>(`/teams/${id}`);
  }

  getByIds(ids: string[]): Observable<PaginatedResult<Team>> {
    return this.list({ ids, limit: ids.length || 1 });
  }

  create(payload: CreateTeamRequest): Observable<Team> {
    return this.api.post<Team>('/teams', payload);
  }

  update(id: string, payload: UpdateTeamRequest): Observable<Team> {
    return this.api.patch<Team>(`/teams/${id}`, payload);
  }

  uploadLogo(id: string, file: File): Observable<Team> {
    const formData = new FormData();
    formData.append('logo', file);
    return this.api.postFormData<Team>(`/teams/${id}/logo`, formData);
  }

  addRetention(id: string, payload: AddRetentionRequest): Observable<Team> {
    return this.api.post<Team>(`/teams/${id}/retentions`, payload);
  }

  softDelete(id: string): Observable<void> {
    return this.api.delete<void>(`/teams/${id}`);
  }

  restore(id: string): Observable<Team> {
    return this.api.post<Team>(`/teams/${id}/restore`, {});
  }

  listDeleted(): Observable<Team[]> {
    return this.api.get<Team[]>('/teams/deleted');
  }

  bulkUpdateStatus(teamIds: string[], isDeleted: boolean): Observable<{ modifiedCount: number }> {
    return this.api.patch<{ modifiedCount: number }>('/teams/bulk-status', { teamIds, isDeleted });
  }

  auditHistory(id: string): Observable<AuditLogEntry[]> {
    return this.api.get<AuditLogEntry[]>(`/teams/${id}/audit-history`);
  }

  importCsv(file: File): Observable<ImportResult> {
    const formData = new FormData();
    formData.append('file', file);
    return this.api.postFormData<ImportResult>('/teams/import/csv', formData);
  }

  importExcel(file: File): Observable<ImportResult> {
    const formData = new FormData();
    formData.append('file', file);
    return this.api.postFormData<ImportResult>('/teams/import/excel', formData);
  }

  connectRealtime(): void {
    const token = this.authService.getAccessToken();
    if (!token) {
      return;
    }
    this.socketService.connect(TEAM_NAMESPACE, token);
  }

  disconnectRealtime(): void {
    this.socketService.disconnect(TEAM_NAMESPACE);
  }

  onTeamCreated(): Observable<Team> {
    return this.socketService.on<Team>(TEAM_NAMESPACE, 'team:created');
  }

  onTeamUpdated(): Observable<Team> {
    return this.socketService.on<Team>(TEAM_NAMESPACE, 'team:updated');
  }

  onTeamDeleted(): Observable<{ teamId: string }> {
    return this.socketService.on<{ teamId: string }>(TEAM_NAMESPACE, 'team:deleted');
  }

  onTeamRestored(): Observable<Team> {
    return this.socketService.on<Team>(TEAM_NAMESPACE, 'team:restored');
  }

  onBulkStatusChanged(): Observable<{ teamIds: string[]; isDeleted: boolean }> {
    return this.socketService.on<{ teamIds: string[]; isDeleted: boolean }>(
      TEAM_NAMESPACE,
      'team:bulkStatusChanged',
    );
  }
}
