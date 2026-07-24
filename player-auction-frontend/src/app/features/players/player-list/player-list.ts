import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';
import { PlayerService } from '../services/player.service';
import { TeamService } from '../../teams/services/team.service';
import { ConfirmDialog } from '../../../shared/components/confirm-dialog';
import { ImportDialog } from '../../../shared/components/import-dialog/import-dialog';
import { StatusBadge } from '../../../shared/components/status-badge/status-badge';
import { RetainPlayerDialog } from '../retain-player-dialog/retain-player-dialog';
import { CaptainAssignmentDialog } from '../captain-assignment-dialog/captain-assignment-dialog';
import {
  PaginatedResult,
  Player,
  PlayerAuctionStatus,
  PlayerImportResult,
  PlayerRole,
  Team,
} from '../../../core/models';

@Component({
  selector: 'app-player-list',
  imports: [
    MatTableModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatPaginatorModule,
    MatMenuModule,
    StatusBadge,
  ],
  templateUrl: './player-list.html',
  styleUrl: './player-list.scss',
})
export class PlayerList implements OnInit {
  private readonly playerService = inject(PlayerService);
  private readonly teamService = inject(TeamService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  private readonly searchInput$ = new Subject<string>();

  readonly roleOptions = Object.values(PlayerRole);
  readonly statusOptions = Object.values(PlayerAuctionStatus);

  readonly displayedColumns = [
    'select',
    'photo',
    'name',
    'role',
    'country',
    'basePrice',
    'status',
    'actions',
  ];

  readonly players = signal<Player[]>([]);
  readonly captainPlayerIds = signal<Set<string>>(new Set());
  readonly total = signal(0);
  readonly page = signal(0);
  readonly pageSize = signal(20);
  readonly isLoading = signal(true);
  readonly searchTerm = signal('');
  readonly roleFilter = signal<string | null>(null);
  readonly countryFilter = signal<string | null>(null);
  readonly statusFilter = signal<string | null>(null);
  readonly selectedIds = signal<Set<string>>(new Set());

  readonly hasSelection = computed(() => this.selectedIds().size > 0);
  readonly selectedCount = computed(() => this.selectedIds().size);
  readonly allVisibleSelected = computed(() => {
    const players = this.players();
    return players.length > 0 && players.every((p) => this.selectedIds().has(p.id));
  });

  ngOnInit(): void {
    this.playerService.connectRealtime();

    this.searchInput$
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((term) => {
        this.searchTerm.set(term);
        this.page.set(0);
        this.fetchPlayers();
      });

    this.loadCaptainAssignments();
    this.fetchPlayers();
    this.subscribeToRealtimeUpdates();

    this.destroyRef.onDestroy(() => this.playerService.disconnectRealtime());
  }

  onSearchChange(value: string): void {
    this.searchInput$.next(value);
  }

  onRoleFilterChange(role: string | null): void {
    this.roleFilter.set(role);
    this.page.set(0);
    this.fetchPlayers();
  }

  onCountryFilterChange(value: string): void {
    this.countryFilter.set(value || null);
    this.page.set(0);
    this.fetchPlayers();
  }

  onStatusFilterChange(status: string | null): void {
    this.statusFilter.set(status);
    this.page.set(0);
    this.fetchPlayers();
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.roleFilter.set(null);
    this.countryFilter.set(null);
    this.statusFilter.set(null);
    this.page.set(0);
    this.fetchPlayers();
  }

  onPageChange(event: PageEvent): void {
    this.page.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.fetchPlayers();
  }

  toggleSelectAllVisible(): void {
    const next = new Set(this.selectedIds());
    if (this.allVisibleSelected()) {
      this.players().forEach((p) => next.delete(p.id));
    } else {
      this.players().forEach((p) => next.add(p.id));
    }
    this.selectedIds.set(next);
  }

  toggleSelect(playerId: string): void {
    const next = new Set(this.selectedIds());
    if (next.has(playerId)) {
      next.delete(playerId);
    } else {
      next.add(playerId);
    }
    this.selectedIds.set(next);
  }

  isSelected(playerId: string): boolean {
    return this.selectedIds().has(playerId);
  }

  clearSelection(): void {
    this.selectedIds.set(new Set());
  }

  registerPlayer(): void {
    this.router.navigate(['/players/new']);
  }

  openImportDialog(): void {
    const dialogRef = this.dialog.open<
      ImportDialog<PlayerImportResult>,
      unknown,
      PlayerImportResult | undefined
    >(ImportDialog, {
      width: '520px',
      data: {
        title: 'Import Players',
        hint: 'Upload a CSV or Excel file with columns: name, role, country, basePrice. Optional: age, passingYear, previousTeam, appearances, goals, assists. All rows must be valid — if any row fails, nothing is imported.',
        importCsv: (file: File) => this.playerService.importCsv(file),
        importExcel: (file: File) => this.playerService.importExcel(file),
      },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.fetchPlayers();
      }
    });
  }

  openDeletedPlayers(): void {
    this.router.navigate(['/players/deleted']);
  }

  viewPlayer(player: Player): void {
    this.router.navigate(['/players', player.id]);
  }

  editPlayer(player: Player): void {
    this.router.navigate(['/players', player.id, 'edit']);
  }

  retainPlayer(player: Player): void {
    const dialogRef = this.dialog.open(RetainPlayerDialog, {
      width: '440px',
      data: { player },
    });

    dialogRef.afterClosed().subscribe((team) => {
      if (!team) return;
      this.snackBar.open(`"${player.name}" retained to ${team.name}`, 'Close', { duration: 4000 });
      this.fetchPlayers();
    });
  }

  markAsCaptain(player: Player): void {
    // Load all teams first
    this.teamService
      .list({ page: 1, limit: 1000 })
      .subscribe({
        next: (result) => {
          const teams = result.data;
          if (teams.length === 0) {
            this.snackBar.open('No teams available', 'Close', { duration: 4000 });
            return;
          }

          // Open dialog to select team
          const dialogRef = this.dialog.open(CaptainAssignmentDialog, {
            width: '480px',
            data: {
              team: teams[0],
              allTeams: teams,
              selectedPlayer: player,
            },
          });

          dialogRef.afterClosed().subscribe((team: Team | null) => {
            if (!team) return;
            this.teamService.setCaptain(team.id, player.id).subscribe(() => {
              this.snackBar.open(`${player.name} assigned as captain to ${team.name}`, 'Close', {
                duration: 4000,
              });
              this.loadCaptainAssignments();
              this.fetchPlayers();
            });
          });
        },
      });
  }

  deletePlayer(player: Player): void {
    const dialogRef = this.dialog.open(ConfirmDialog, {
      data: {
        title: 'Delete player?',
        message: `Delete "${player.name}"? It can be restored later from Deleted Players.`,
        confirmLabel: 'Delete',
        isDestructive: true,
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.playerService.softDelete(player.id).subscribe(() => {
        this.snackBar
          .open(`"${player.name}" deleted`, 'Undo', { duration: 6000 })
          .onAction()
          .subscribe(() => this.playerService.restore(player.id).subscribe());
        this.fetchPlayers();
      });
    });
  }

  bulkDelete(): void {
    const ids = Array.from(this.selectedIds());
    const dialogRef = this.dialog.open(ConfirmDialog, {
      data: {
        title: `Delete ${ids.length} players?`,
        message: 'These players can be restored later from Deleted Players.',
        confirmLabel: 'Delete',
        isDestructive: true,
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.playerService.bulkUpdateStatus(ids, true).subscribe(({ modifiedCount }) => {
        this.snackBar.open(`${modifiedCount} players deleted`, 'Close', { duration: 4000 });
        this.clearSelection();
        this.fetchPlayers();
      });
    });
  }

  bulkMarkUnsold(): void {
    const ids = Array.from(this.selectedIds());
    this.playerService
      .bulkUpdateAuctionStatus(ids, PlayerAuctionStatus.UNSOLD)
      .subscribe(({ modifiedCount }) => {
        this.snackBar.open(`${modifiedCount} players marked unsold`, 'Close', { duration: 4000 });
        this.clearSelection();
        this.fetchPlayers();
      });
  }

  bulkExport(): void {
    const ids = this.selectedIds();
    const rows = this.players().filter((p) => ids.has(p.id));
    const csv = this.toCsv(rows);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'players-export.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  private toCsv(players: Player[]): string {
    const header = 'name,role,country,age,basePrice,auctionStatus';
    const lines = players.map(
      (p) => `${p.name},${p.role},${p.country},${p.age ?? ''},${p.basePrice},${p.auctionStatus}`,
    );
    return [header, ...lines].join('\n');
  }

  private loadCaptainAssignments(): void {
    this.teamService.list({ page: 1, limit: 1000 }).subscribe({
      next: (result) => {
        const captainIds = new Set<string>(
          result.data
            .map((team) => team.captain)
            .filter((captainId): captainId is string => Boolean(captainId)),
        );
        this.captainPlayerIds.set(captainIds);
      },
      error: () => this.captainPlayerIds.set(new Set()),
    });
  }

  isCaptain(player: Player): boolean {
    return this.captainPlayerIds().has(player.id) || player.auctionStatus === PlayerAuctionStatus.CAPTAIN;
  }

  displayStatus(player: Player): PlayerAuctionStatus {
    return this.isCaptain(player) ? PlayerAuctionStatus.CAPTAIN : player.auctionStatus;
  }

  private fetchPlayers(): void {
    this.isLoading.set(true);
    this.playerService
      .list({
        page: this.page() + 1,
        limit: this.pageSize(),
        search: this.searchTerm() || undefined,
        role: this.roleFilter() ?? undefined,
        country: this.countryFilter() ?? undefined,
        auctionStatus: this.statusFilter() ?? undefined,
      })
      .subscribe({
        next: (result: PaginatedResult<Player>) => {
          this.players.set(result.data);
          this.total.set(result.total);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      });
  }

  private subscribeToRealtimeUpdates(): void {
    this.playerService
      .onPlayerCreated()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.fetchPlayers());

    this.playerService
      .onPlayerUpdated()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((updated) => {
        this.players.update((list) => list.map((p) => (p.id === updated.id ? updated : p)));
      });

    this.playerService
      .onPlayerDeleted()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.fetchPlayers());

    this.playerService
      .onPlayerRestored()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.fetchPlayers());

    this.playerService
      .onBulkStatusChanged()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.fetchPlayers());
  }
}
