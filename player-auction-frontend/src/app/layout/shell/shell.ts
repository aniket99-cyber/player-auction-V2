import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
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

  readonly currentUser = this.authService.currentUser;

  readonly navItems = computed<NavItem[]>(() => {
    const isAdmin = this.currentUser()?.role === UserRole.ADMIN;
    return isAdmin ? [...BASE_NAV_ITEMS, ...ADMIN_ONLY_NAV_ITEMS] : BASE_NAV_ITEMS;
  });

  logout(): void {
    this.authService.logout();
  }
}
