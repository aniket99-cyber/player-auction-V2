import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

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
        path: 'teams',
        loadComponent: () =>
          import('./features/teams/team-list/team-list').then((m) => m.TeamList),
      },
      {
        path: 'teams/deleted',
        loadComponent: () =>
          import('./features/teams/deleted-teams/deleted-teams').then((m) => m.DeletedTeams),
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
          import('./features/teams/team-audit-history/team-audit-history').then(
            (m) => m.TeamAuditHistory,
          ),
      },
      {
        path: 'auction-room/:auctionId',
        loadComponent: () =>
          import('./features/auction-room/auction-room/auction-room').then((m) => m.AuctionRoom),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
