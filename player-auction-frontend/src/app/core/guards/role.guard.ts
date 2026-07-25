import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models';

export function roleGuard(allowedRoles: UserRole[]): CanActivateFn {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const user = authService.currentUser();
    if (user && allowedRoles.includes(user.role)) {
      return true;
    }

    router.navigate(['/']);
    return false;
  };
}
