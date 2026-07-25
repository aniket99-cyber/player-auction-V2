import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { SocketService } from '../../../core/services/socket.service';
import { AuthService } from '../../../core/services/auth.service';
import {
  AuditLogEntry,
  CreatePlayerRequest,
  PaginatedResult,
  Player,
  PlayerImportResult,
  PlayerListQuery,
  UpdatePlayerRequest,
} from '../../../core/models';

export const PLAYER_NAMESPACE = '/players';

@Injectable({ providedIn: 'root' })
export class PlayerService {
  private readonly api = inject(ApiService);
  private readonly socketService = inject(SocketService);
  private readonly authService = inject(AuthService);

  list(query: PlayerListQuery): Observable<PaginatedResult<Player>> {
    return this.api.get<PaginatedResult<Player>>('/players', {
      ...query,
      ids: query.ids?.join(','),
    });
  }

  getById(id: string): Observable<Player> {
    return this.api.get<Player>(`/players/${id}`);
  }

  getByIds(ids: string[]): Observable<PaginatedResult<Player>> {
    return this.list({ ids, limit: ids.length || 1 });
  }

  create(payload: CreatePlayerRequest): Observable<Player> {
    return this.api.post<Player>('/players', payload);
  }

  update(id: string, payload: UpdatePlayerRequest): Observable<Player> {
    return this.api.patch<Player>(`/players/${id}`, payload);
  }

  uploadImage(id: string, file: File): Observable<Player> {
    const formData = new FormData();
    formData.append('image', file);
    return this.api.postFormData<Player>(`/players/${id}/image`, formData);
  }

  softDelete(id: string): Observable<void> {
    return this.api.delete<void>(`/players/${id}`);
  }

  restore(id: string): Observable<Player> {
    return this.api.post<Player>(`/players/${id}/restore`, {});
  }

  listDeleted(): Observable<Player[]> {
    return this.api.get<Player[]>('/players/deleted');
  }

  bulkUpdateStatus(playerIds: string[], isDeleted: boolean): Observable<{ modifiedCount: number }> {
    return this.api.patch<{ modifiedCount: number }>('/players/bulk-status', {
      playerIds,
      isDeleted,
    });
  }

  bulkUpdateAuctionStatus(
    playerIds: string[],
    auctionStatus: string,
  ): Observable<{ modifiedCount: number }> {
    return this.api.patch<{ modifiedCount: number }>('/players/bulk-auction-status', {
      playerIds,
      auctionStatus,
    });
  }

  auditHistory(id: string): Observable<AuditLogEntry[]> {
    return this.api.get<AuditLogEntry[]>(`/players/${id}/audit-history`);
  }

  importCsv(file: File): Observable<PlayerImportResult> {
    const formData = new FormData();
    formData.append('file', file);
    return this.api.postFormData<PlayerImportResult>('/players/import/csv', formData);
  }

  importExcel(file: File): Observable<PlayerImportResult> {
    const formData = new FormData();
    formData.append('file', file);
    return this.api.postFormData<PlayerImportResult>('/players/import/excel', formData);
  }

  connectRealtime(): void {
    const token = this.authService.getAccessToken();
    if (!token) {
      return;
    }
    this.socketService.connect(PLAYER_NAMESPACE, token);
  }

  disconnectRealtime(): void {
    this.socketService.disconnect(PLAYER_NAMESPACE);
  }

  onPlayerCreated(): Observable<Player> {
    return this.socketService.on<Player>(PLAYER_NAMESPACE, 'player:created');
  }

  onPlayerUpdated(): Observable<Player> {
    return this.socketService.on<Player>(PLAYER_NAMESPACE, 'player:updated');
  }

  onPlayerDeleted(): Observable<{ playerId: string }> {
    return this.socketService.on<{ playerId: string }>(PLAYER_NAMESPACE, 'player:deleted');
  }

  onPlayerRestored(): Observable<Player> {
    return this.socketService.on<Player>(PLAYER_NAMESPACE, 'player:restored');
  }

  onBulkStatusChanged(): Observable<{ playerIds: string[]; isDeleted: boolean }> {
    return this.socketService.on<{ playerIds: string[]; isDeleted: boolean }>(
      PLAYER_NAMESPACE,
      'player:bulkStatusChanged',
    );
  }
}
