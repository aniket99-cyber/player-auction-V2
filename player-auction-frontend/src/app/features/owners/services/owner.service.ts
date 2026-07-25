import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { CreateOwnerRequest, Owner, PaginatedResult, UpdateOwnerRequest } from '../../../core/models';

@Injectable({ providedIn: 'root' })
export class OwnerService {
  private readonly api = inject(ApiService);

  list(page = 1, limit = 50): Observable<PaginatedResult<Owner>> {
    return this.api.get<PaginatedResult<Owner>>('/owners', { page, limit });
  }

  getById(id: string): Observable<Owner> {
    return this.api.get<Owner>(`/owners/${id}`);
  }

  getByTeam(teamId: string): Observable<Owner | null> {
    return this.api.get<Owner | null>(`/owners/team/${teamId}`);
  }

  create(payload: CreateOwnerRequest): Observable<Owner> {
    return this.api.post<Owner>('/owners', payload);
  }

  update(id: string, payload: UpdateOwnerRequest): Observable<Owner> {
    return this.api.patch<Owner>(`/owners/${id}`, payload);
  }

  uploadImage(id: string, file: File): Observable<Owner> {
    const formData = new FormData();
    formData.append('image', file);
    return this.api.postFormData<Owner>(`/owners/${id}/image`, formData);
  }

  delete(id: string): Observable<void> {
    return this.api.delete<void>(`/owners/${id}`);
  }
}
