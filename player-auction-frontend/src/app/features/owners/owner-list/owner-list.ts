import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { OwnerService } from '../services/owner.service';
import { TeamService } from '../../teams/services/team.service';
import { ConfirmDialog } from '../../../shared/components/confirm-dialog';
import { Owner, Team } from '../../../core/models';

@Component({
  selector: 'app-owner-list',
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './owner-list.html',
  styleUrl: './owner-list.scss',
})
export class OwnerList implements OnInit {
  private readonly ownerService = inject(OwnerService);
  private readonly teamService = inject(TeamService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly owners = signal<Owner[]>([]);
  readonly teams = signal<Team[]>([]);
  readonly isLoading = signal(true);

  readonly ownersWithTeam = computed(() =>
    this.owners().map((owner) => ({
      owner,
      team: this.teams().find((t) => t.id === owner.team),
    })),
  );

  ngOnInit(): void {
    this.fetch();
  }

  create(): void {
    this.router.navigate(['/owners/new']);
  }

  edit(owner: Owner): void {
    this.router.navigate(['/owners', owner.id, 'edit']);
  }

  delete(owner: Owner): void {
    const dialogRef = this.dialog.open(ConfirmDialog, {
      data: {
        title: 'Delete owner?',
        message: `Delete "${owner.name}"? This cannot be undone.`,
        confirmLabel: 'Delete',
        isDestructive: true,
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.ownerService.delete(owner.id).subscribe(() => {
        this.snackBar.open('Owner deleted', 'Close', { duration: 3000 });
        this.fetch();
      });
    });
  }

  private fetch(): void {
    this.isLoading.set(true);
    this.ownerService.list().subscribe((result) => {
      this.owners.set(result.data);
      this.teamService.list({ page: 1, limit: 100 }).subscribe((teamResult) => {
        this.teams.set(teamResult.data);
        this.isLoading.set(false);
      });
    });
  }
}
