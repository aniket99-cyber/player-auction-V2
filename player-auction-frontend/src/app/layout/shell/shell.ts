import { Component, computed, inject, ViewChild } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { UserRole } from '../../core/models';

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

const BASE_NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', icon: 'dashboard', route: '/dashboard' },
  { label: 'Players', icon: 'sports_soccer', route: '/players' },
  { label: 'Teams', icon: 'groups', route: '/teams' },
];

const ADMIN_ONLY_NAV_ITEMS: NavItem[] = [
  { label: 'Auctions', icon: 'gavel', route: '/auctions' },
  { label: 'Owners', icon: 'workspace_premium', route: '/owners' },
  { label: 'Settings', icon: 'settings', route: '/settings' },
];

@Component({
  selector: 'app-shell',
  imports: [
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
  ],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell {
  private readonly authService = inject(AuthService);
  private readonly breakpointObserver = inject(BreakpointObserver);

  @ViewChild('sidenav') sidenav!: MatSidenav;

  /** true when viewport ≤ 1024px — sidenav becomes an overlay drawer */
  readonly isHandset = toSignal(
    this.breakpointObserver
      .observe('(max-width: 1024px)')
      .pipe(map((r) => r.matches)),
    { initialValue: false },
  );

  readonly currentUser = this.authService.currentUser;

  readonly navItems = computed<NavItem[]>(() => {
    const isAdmin = this.currentUser()?.role === UserRole.ADMIN;
    return isAdmin ? [...BASE_NAV_ITEMS, ...ADMIN_ONLY_NAV_ITEMS] : BASE_NAV_ITEMS;
  });

  closeIfHandset(): void {
    if (this.isHandset()) {
      this.sidenav.close();
    }
  }

  logout(): void {
    this.authService.logout();
  }
}
