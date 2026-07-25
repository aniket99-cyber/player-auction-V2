import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
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
import { MatTooltipModule } from '@angular/material/tooltip';
import { TeamService } from '../services/team.service';
import { ConfirmDialog } from '../../../shared/components/confirm-dialog';
import { ImportDialog } from '../../../shared/components/import-dialog/import-dialog';
import { ImportResult, PaginatedResult, Team } from '../../../core/models';
import {
  CaptainAssignmentDialog,
  CaptainAssignmentDialogResult,
} from '../../players/captain-assignment-dialog/captain-assignment-dialog';

@Component({
  selector: 'app-team-list',
  imports: [
    DatePipe,
    MatTableModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatPaginatorModule,
    MatMenuModule,
    MatTooltipModule,
  ],
  templateUrl: './team-list.html',
  styleUrl: './team-list.scss',
})
export class TeamList implements OnInit {
  private readonly teamService = inject(TeamService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  private readonly searchInput$ = new Subject<string>();

  readonly displayedColumns = ['select', 'logo', 'name', 'season', 'budget', 'squad', 'updated', 'actions'];

  readonly teams = signal<Team[]>([]);
  readonly total = signal(0);
  readonly page = signal(0);
  readonly pageSize = signal(20);
  readonly isLoading = signal(true);
  readonly searchTerm = signal('');
  readonly seasonFilter = signal<string | null>(null);
  readonly selectedIds = signal<Set<string>>(new Set());

  readonly hasSelection = computed(() => this.selectedIds().size > 0);
  readonly selectedCount = computed(() => this.selectedIds().size);
  readonly allVisibleSelected = computed(() => {
    const teams = this.teams();
    return teams.length > 0 && teams.every((t) => this.selectedIds().has(t.id));
  });

  ngOnInit(): void {
    this.teamService.connectRealtime();

    this.searchInput$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((term) => {
        this.searchTerm.set(term);
        this.page.set(0);
        this.fetchTeams();
      });

    this.fetchTeams();
    this.subscribeToRealtimeUpdates();

    this.destroyRef.onDestroy(() => this.teamService.disconnectRealtime());
  }

  onSearchChange(value: string): void {
    this.searchInput$.next(value);
  }

  onSeasonFilterChange(season: string | null): void {
    this.seasonFilter.set(season);
    this.page.set(0);
    this.fetchTeams();
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.seasonFilter.set(null);
    this.page.set(0);
    this.fetchTeams();
  }

  onPageChange(event: PageEvent): void {
    this.page.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.fetchTeams();
  }

  toggleSelectAllVisible(): void {
    const next = new Set(this.selectedIds());
    if (this.allVisibleSelected()) {
      this.teams().forEach((t) => next.delete(t.id));
    } else {
      this.teams().forEach((t) => next.add(t.id));
    }
    this.selectedIds.set(next);
  }

  toggleSelect(teamId: string): void {
    const next = new Set(this.selectedIds());
    if (next.has(teamId)) {
      next.delete(teamId);
    } else {
      next.add(teamId);
    }
    this.selectedIds.set(next);
  }

  isSelected(teamId: string): boolean {
    return this.selectedIds().has(teamId);
  }

  clearSelection(): void {
    this.selectedIds.set(new Set());
  }

  createTeam(): void {
    this.router.navigate(['/teams/new']);
  }

  openImportDialog(): void {
    const dialogRef = this.dialog.open<ImportDialog<ImportResult>, unknown, ImportResult | undefined>(
      ImportDialog,
      {
        width: '520px',
        data: {
          title: 'Import Teams',
          hint: 'Upload a CSV or Excel file with columns: name, shortName, totalBudget, season. Optional: ownerId, primaryColor, secondaryColor. All rows must be valid — if any row fails, nothing is imported.',
          importCsv: (file: File) => this.teamService.importCsv(file),
          importExcel: (file: File) => this.teamService.importExcel(file),
        },
      },
    );
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.fetchTeams();
      }
    });
  }

  openDeletedTeams(): void {
    this.router.navigate(['/teams/deleted']);
  }

  viewTeam(team: Team): void {
    this.router.navigate(['/teams', team.id]);
  }

  assignCaptain(team: Team): void {
    this.teamService.list({ page: 1, limit: 1000 }).subscribe({
      next: (result) => {
        const dialogRef = this.dialog.open(CaptainAssignmentDialog, {
          width: '520px',
          data: {
            team,
            allTeams: result.data,
          },
        });

        dialogRef.afterClosed().subscribe((res: CaptainAssignmentDialogResult | null) => {
          if (!res || !res.team || !res.player) return;
          const targetTeamId = typeof res.team === 'string' ? res.team : (res.team.id || (res.team as any)._id);
          const targetPlayerId = typeof res.player === 'string' ? res.player : (res.player.id || (res.player as any)._id);

          this.teamService.setCaptain(targetTeamId, targetPlayerId).subscribe({
            next: () => {
              this.snackBar.open(`${res.player.name} assigned as captain to ${res.team.name}`, 'Close', {
                duration: 4000,
              });
              this.fetchTeams();
            },
            error: (err) => {
              this.snackBar.open(err.error?.message || 'Failed to assign captain', 'Close', { duration: 4000 });
            },
          });
        });
      },
    });
  }

  editTeam(team: Team): void {
    this.router.navigate(['/teams', team.id, 'edit']);
  }

  deleteTeam(team: Team): void {
    const dialogRef = this.dialog.open(ConfirmDialog, {
      data: {
        title: 'Delete team?',
        message: `Delete "${team.name}"? It can be restored later from Deleted Teams.`,
        confirmLabel: 'Delete',
        isDestructive: true,
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.teamService.softDelete(team.id).subscribe(() => {
        this.snackBar.open(`"${team.name}" deleted`, 'Undo', { duration: 6000 })
          .onAction()
          .subscribe(() => this.teamService.restore(team.id).subscribe());
        this.fetchTeams();
      });
    });
  }

  bulkDelete(): void {
    const ids = Array.from(this.selectedIds());
    const dialogRef = this.dialog.open(ConfirmDialog, {
      data: {
        title: `Delete ${ids.length} teams?`,
        message: 'These teams can be restored later from Deleted Teams.',
        confirmLabel: 'Delete',
        isDestructive: true,
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.teamService.bulkUpdateStatus(ids, true).subscribe(({ modifiedCount }) => {
        this.snackBar.open(`${modifiedCount} teams deleted`, 'Close', { duration: 4000 });
        this.clearSelection();
        this.fetchTeams();
      });
    });
  }

  bulkExport(): void {
    const ids = this.selectedIds();
    const rows = this.teams().filter((t) => ids.has(t.id));
    const csv = this.toCsv(rows);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'teams-export.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  private toCsv(teams: Team[]): string {
    const header = 'name,shortName,season,totalBudget,remainingBudget,squadSize';
    const lines = teams.map(
      (t) => `${t.name},${t.shortName},${t.season},${t.totalBudget},${t.remainingBudget},${t.players.length}`,
    );
    return [header, ...lines].join('\n');
  }

  private fetchTeams(): void {
    this.isLoading.set(true);
    this.teamService
      .list({
        page: this.page() + 1,
        limit: this.pageSize(),
        search: this.searchTerm() || undefined,
        season: this.seasonFilter() ?? undefined,
      })
      .subscribe({
        next: (result: PaginatedResult<Team>) => {
          this.teams.set(result.data);
          this.total.set(result.total);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      });
  }

  private subscribeToRealtimeUpdates(): void {
    this.teamService
      .onTeamCreated()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.fetchTeams());

    this.teamService
      .onTeamUpdated()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((updated) => {
        this.teams.update((list) => list.map((t) => (t.id === updated.id ? updated : t)));
      });

    this.teamService
      .onTeamDeleted()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.fetchTeams());

    this.teamService
      .onTeamRestored()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.fetchTeams());

    this.teamService
      .onBulkStatusChanged()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.fetchTeams());
  }
}
