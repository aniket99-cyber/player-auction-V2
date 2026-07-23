import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Captain, CreateCaptainRequest, PaginatedResult, UpdateCaptainRequest } from '../../../core/models';

@Injectable({ providedIn: 'root' })
export class CaptainService {
  private readonly api = inject(ApiService);

  list(page = 1, limit = 50): Observable<PaginatedResult<Captain>> {
    return this.api.get<PaginatedResult<Captain>>('/captains', { page, limit });
  }

  getById(id: string): Observable<Captain> {
    return this.api.get<Captain>(`/captains/${id}`);
  }

  getByTeam(teamId: string): Observable<Captain | null> {
    return this.api.get<Captain | null>(`/captains/team/${teamId}`);
  }

  create(payload: CreateCaptainRequest): Observable<Captain> {
    return this.api.post<Captain>('/captains', payload);
  }

  update(id: string, payload: UpdateCaptainRequest): Observable<Captain> {
    return this.api.patch<Captain>(`/captains/${id}`, payload);
  }

  delete(id: string): Observable<void> {
    return this.api.delete<void>(`/captains/${id}`);
  }
}
