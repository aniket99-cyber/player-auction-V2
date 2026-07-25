import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap, throwError } from 'rxjs';
import { ApiService } from './api.service';
import { AuthResponse, AuthTokens, User, UserRole } from '../models';

const ACCESS_TOKEN_KEY = 'auction_access_token';
const REFRESH_TOKEN_KEY = 'auction_refresh_token';
const USER_KEY = 'auction_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);
  private autoRefreshTimer: ReturnType<typeof setInterval> | null = null;

  private readonly currentUserSignal = signal<User | null>(this.readStoredUser());

  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isAuthenticated = computed(() => this.currentUserSignal() !== null);
  readonly isAdmin = computed(() => this.currentUserSignal()?.role === UserRole.ADMIN);

  constructor() {
    if (this.readStoredUser()) {
      this.startAutoRefresh();
    }
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.api
      .post<AuthResponse>('/auth/login', { email, password })
      .pipe(tap((res) => this.persistSession(res)));
  }

  register(name: string, email: string, password: string): Observable<AuthResponse> {
    return this.api
      .post<AuthResponse>('/auth/register', { name, email, password })
      .pipe(tap((res) => this.persistSession(res)));
  }

  refreshToken(): Observable<AuthTokens> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }
    return this.api
      .post<AuthTokens>('/auth/refresh', { refreshToken })
      .pipe(tap((tokens) => this.updateTokens(tokens)));
  }

  logout(): void {
    this.api.post('/auth/logout', {}).subscribe();
    this.clearSession();
  }

  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  updateTokens(tokens: AuthTokens): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  }

  clearSession(): void {
    this.stopAutoRefresh();
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.currentUserSignal.set(null);
  }

  private persistSession(res: AuthResponse): void {
    this.updateTokens(res);
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    this.currentUserSignal.set(res.user);
    this.startAutoRefresh();
  }

  private readStoredUser(): User | null {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  }

  private startAutoRefresh(): void {
    this.stopAutoRefresh();
    // Silently refresh token every 10 minutes to maintain admin/user session active
    this.autoRefreshTimer = setInterval(() => {
      if (this.isAuthenticated() && this.getRefreshToken()) {
        this.refreshToken().subscribe({
          error: () => this.stopAutoRefresh(),
        });
      }
    }, 10 * 60 * 1000);
  }

  private stopAutoRefresh(): void {
    if (this.autoRefreshTimer) {
      clearInterval(this.autoRefreshTimer);
      this.autoRefreshTimer = null;
    }
  }
}

