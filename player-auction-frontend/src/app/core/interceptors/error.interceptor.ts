import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const snackBar = inject(MatSnackBar);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const isAuthRoute =
        req.url.includes('/auth/login') ||
        req.url.includes('/auth/register') ||
        req.url.includes('/auth/refresh');

      const isPublicView =
        router.url.startsWith('/live') || router.url.startsWith('/watch');

      // Handle 401 Unauthorized — attempt silent token refresh
      if (error.status === 401 && !isAuthRoute) {
        const refreshToken = authService.getRefreshToken();
        if (refreshToken) {
          return authService.refreshToken().pipe(
            switchMap((tokens) => {
              const retriedReq = req.clone({
                setHeaders: { Authorization: `Bearer ${tokens.accessToken}` },
              });
              return next(retriedReq);
            }),
            catchError((refreshErr) => {
              authService.clearSession();
              if (!isPublicView) {
                router.navigate(['/auth/login']);
                snackBar.open('Session expired. Please log in again.', 'Close', {
                  duration: 5000,
                  panelClass: ['snack-error'],
                });
              }
              return throwError(() => refreshErr);
            }),
          );
        } else if (!isPublicView) {
          authService.clearSession();
          router.navigate(['/auth/login']);
        }
      }

      // Extract backend error message (or validation details array)
      let backendMessage = '';
      if (error.error && typeof error.error === 'object') {
        if (error.error.message) {
          backendMessage = error.error.message;
        } else if (Array.isArray(error.error.details)) {
          backendMessage = error.error.details.join(', ');
        }
      } else if (typeof error.error === 'string') {
        backendMessage = error.error;
      }

      if (!backendMessage && error.message) {
        backendMessage = error.message;
      }

      // Display backend message to the user via Snackbar
      if (backendMessage && !isAuthRoute) {
        snackBar.open(backendMessage, 'Close', {
          duration: 6000,
          panelClass: ['snack-error'],
        });
      }

      return throwError(() => error);
    }),
  );
};

