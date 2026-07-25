import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable, map, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models';

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

type QueryParams = Record<string, string | number | boolean | undefined | null>;

export interface ApiRequestOptions {
  showSuccessToast?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly snackBar = inject(MatSnackBar);
  private readonly baseUrl = environment.apiUrl;

  get<T>(path: string, params?: QueryParams): Observable<T> {
    return this.http
      .get<ApiResponse<T>>(`${this.baseUrl}${path}`, { params: this.toHttpParams(params) })
      .pipe(map((res) => this.normalizeResponseData(res.data) as T));
  }

  post<T>(path: string, body: unknown, options?: ApiRequestOptions): Observable<T> {
    return this.http
      .post<ApiResponse<T>>(`${this.baseUrl}${path}`, body)
      .pipe(
        tap((res) => this.handleSuccessToast(res, options)),
        map((res) => this.normalizeResponseData(res.data) as T),
      );
  }

  postFormData<T>(path: string, formData: FormData, options?: ApiRequestOptions): Observable<T> {
    return this.http
      .post<ApiResponse<T>>(`${this.baseUrl}${path}`, formData)
      .pipe(
        tap((res) => this.handleSuccessToast(res, options)),
        map((res) => this.normalizeResponseData(res.data) as T),
      );
  }

  patch<T>(path: string, body: unknown, options?: ApiRequestOptions): Observable<T> {
    return this.http
      .patch<ApiResponse<T>>(`${this.baseUrl}${path}`, body)
      .pipe(
        tap((res) => this.handleSuccessToast(res, options)),
        map((res) => this.normalizeResponseData(res.data) as T),
      );
  }

  delete<T>(path: string, options?: ApiRequestOptions): Observable<T> {
    return this.http
      .delete<ApiResponse<T>>(`${this.baseUrl}${path}`)
      .pipe(
        tap((res) => this.handleSuccessToast(res, options)),
        map((res) => this.normalizeResponseData(res.data) as T),
      );
  }

  private handleSuccessToast<T>(res: ApiResponse<T>, options?: ApiRequestOptions): void {
    if (options?.showSuccessToast && res?.message) {
      this.snackBar.open(res.message, 'Close', { duration: 3500, panelClass: ['snack-success'] });
    }
  }


  private normalizeResponseData<T>(data: T): T {
    if (Array.isArray(data)) {
      return data.map((item) => this.normalizeResponseData(item)) as T;
    }

    if (!isRecord(data)) {
      return data;
    }

    const normalized = { ...data } as Record<string, unknown>;
    for (const [key, value] of Object.entries(normalized)) {
      if (key === 'imageUrl' && typeof value === 'string') {
        normalized[key] = this.normalizeImageUrl(value);
        continue;
      }

      if (isRecord(value) || Array.isArray(value)) {
        normalized[key] = this.normalizeResponseData(value);
      }
    }

    return normalized as T;
  }

  private normalizeImageUrl(value: string): string {
    const trimmed = value.trim();
    if (!trimmed) {
      return value;
    }

    if (/^(https?:)?\/\//i.test(trimmed) || trimmed.startsWith('data:')) {
      return trimmed;
    }

    if (trimmed.startsWith('/')) {
      return trimmed;
    }

    return `${this.baseUrl.replace(/\/api\/v1$/, '')}/${trimmed}`;
  }

  private toHttpParams(params?: QueryParams): HttpParams {
    let httpParams = new HttpParams();
    if (!params) {
      return httpParams;
    }
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null || value === '') {
        continue;
      }
      httpParams = httpParams.set(key, String(value));
    }
    return httpParams;
  }
}
