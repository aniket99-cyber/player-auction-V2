import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { UserRole } from './core/models';

export const routes: Routes = [
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
      },
    ],
  },
  {
    // Public Live Viewer — deliberately outside the guarded shell and the
    // authGuard: anyone with the link can watch, no account required.
    path: 'watch/:auctionId',
    loadComponent: () =>
      import('./features/live-viewer/live-viewer/live-viewer').then((m) => m.LiveViewer),
  },
  {
    path: '',
    loadComponent: () => import('./layout/shell/shell').then((m) => m.Shell),
    canActivate: [authGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard',
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'players',
        loadComponent: () =>
          import('./features/players/player-list/player-list').then((m) => m.PlayerList),
      },
      {
        path: 'players/deleted',
        loadComponent: () =>
          import('./shared/components/deleted-records-view/deleted-records-view').then(
            (m) => m.DeletedRecordsView,
          ),
        data: { entityType: 'player', backPath: '/players', entityLabel: 'Players' },
      },
      {
        path: 'players/new',
        loadComponent: () =>
          import('./features/players/player-form/player-form').then((m) => m.PlayerForm),
      },
      {
        path: 'players/:id',
        loadComponent: () =>
          import('./features/players/player-detail/player-detail').then((m) => m.PlayerDetail),
      },
      {
        path: 'players/:id/edit',
        loadComponent: () =>
          import('./features/players/player-form/player-form').then((m) => m.PlayerForm),
      },
      {
        path: 'players/:id/audit-history',
        loadComponent: () =>
          import('./shared/components/audit-history-view/audit-history-view').then(
            (m) => m.AuditHistoryView,
          ),
        data: { entityType: 'player', backPath: '/players' },
      },
      {
        path: 'teams',
        loadComponent: () =>
          import('./features/teams/team-list/team-list').then((m) => m.TeamList),
      },
      {
        path: 'teams/deleted',
        loadComponent: () =>
          import('./shared/components/deleted-records-view/deleted-records-view').then(
            (m) => m.DeletedRecordsView,
          ),
        data: { entityType: 'team', backPath: '/teams', entityLabel: 'Teams' },
      },
      {
        path: 'teams/new',
        loadComponent: () => import('./features/teams/team-form/team-form').then((m) => m.TeamForm),
      },
      {
        path: 'teams/:id',
        loadComponent: () =>
          import('./features/teams/team-detail/team-detail').then((m) => m.TeamDetail),
      },
      {
        path: 'teams/:id/edit',
        loadComponent: () => import('./features/teams/team-form/team-form').then((m) => m.TeamForm),
      },
      {
        path: 'teams/:id/audit-history',
        loadComponent: () =>
          import('./shared/components/audit-history-view/audit-history-view').then(
            (m) => m.AuditHistoryView,
          ),
        data: { entityType: 'team', backPath: '/teams' },
      },
      {
        path: 'auction-room/:auctionId',
        loadComponent: () =>
          import('./features/auction-room/auction-room/auction-room').then((m) => m.AuctionRoom),
      },
      {
        path: 'auctions',
        loadComponent: () =>
          import('./features/auctions/auction-list/auction-list').then((m) => m.AuctionList),
      },
      {
        path: 'auctions/new',
        loadComponent: () =>
          import('./features/auctions/auction-form/auction-form').then((m) => m.AuctionForm),
      },
      {
        path: 'owners',
        loadComponent: () => import('./features/owners/owner-list/owner-list').then((m) => m.OwnerList),
      },
      {
        path: 'owners/new',
        loadComponent: () => import('./features/owners/owner-form/owner-form').then((m) => m.OwnerForm),
      },
      {
        path: 'owners/:id/edit',
        loadComponent: () => import('./features/owners/owner-form/owner-form').then((m) => m.OwnerForm),
      },
      {
        path: 'settings',
        canActivate: [roleGuard([UserRole.ADMIN])],
        loadComponent: () =>
          import('./features/settings/settings/settings').then((m) => m.Settings),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
