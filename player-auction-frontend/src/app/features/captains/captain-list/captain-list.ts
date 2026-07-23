import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CaptainService } from '../services/captain.service';
import { TeamService } from '../../teams/services/team.service';
import { PlayerService } from '../../players/services/player.service';
import { ConfirmDialog } from '../../../shared/components/confirm-dialog';
import { Captain, Player, Team } from '../../../core/models';

@Component({
  selector: 'app-captain-list',
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './captain-list.html',
  styleUrl: './captain-list.scss',
})
export class CaptainList implements OnInit {
  private readonly captainService = inject(CaptainService);
  private readonly teamService = inject(TeamService);
  private readonly playerService = inject(PlayerService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly captains = signal<Captain[]>([]);
  readonly teams = signal<Team[]>([]);
  readonly players = signal<Player[]>([]);
  readonly isLoading = signal(true);

  readonly captainsWithDetails = computed(() =>
    this.captains().map((captain) => ({
      captain,
      team: this.teams().find((t) => t.id === captain.team),
      player: this.players().find((p) => p.id === captain.player),
    })),
  );

  ngOnInit(): void {
    this.fetch();
  }

  create(): void {
    this.router.navigate(['/captains/new']);
  }

  edit(captain: Captain): void {
    this.router.navigate(['/captains', captain.id, 'edit']);
  }

  delete(captain: Captain): void {
    const dialogRef = this.dialog.open(ConfirmDialog, {
      data: {
        title: 'Remove captain?',
        message: 'This cannot be undone.',
        confirmLabel: 'Remove',
        isDestructive: true,
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.captainService.delete(captain.id).subscribe(() => {
        this.snackBar.open('Captain removed', 'Close', { duration: 3000 });
        this.fetch();
      });
    });
  }

  private fetch(): void {
    this.isLoading.set(true);
    this.captainService.list().subscribe((result) => {
      this.captains.set(result.data);

      this.teamService.list({ page: 1, limit: 100 }).subscribe((teamResult) => {
        this.teams.set(teamResult.data);

        const playerIds = result.data.map((c) => c.player);
        if (playerIds.length > 0) {
          this.playerService.getByIds(playerIds).subscribe((playerResult) => {
            this.players.set(playerResult.data);
            this.isLoading.set(false);
          });
        } else {
          this.isLoading.set(false);
        }
      });
    });
  }
}
