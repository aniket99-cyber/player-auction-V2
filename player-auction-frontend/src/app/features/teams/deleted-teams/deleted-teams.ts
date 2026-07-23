import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TeamService } from '../services/team.service';
import { Team } from '../../../core/models';

@Component({
  selector: 'app-deleted-teams',
  imports: [DatePipe, RouterLink, MatButtonModule, MatIconModule],
  templateUrl: './deleted-teams.html',
  styleUrl: './deleted-teams.scss',
})
export class DeletedTeams implements OnInit {
  private readonly teamService = inject(TeamService);
  private readonly snackBar = inject(MatSnackBar);

  readonly teams = signal<Team[]>([]);
  readonly isLoading = signal(true);

  ngOnInit(): void {
    this.fetch();
  }

  restore(team: Team): void {
    this.teamService.restore(team.id).subscribe(() => {
      this.snackBar.open(`"${team.name}" restored`, 'Close', { duration: 3000 });
      this.fetch();
    });
  }

  private fetch(): void {
    this.isLoading.set(true);
    this.teamService.listDeleted().subscribe((teams) => {
      this.teams.set(teams);
      this.isLoading.set(false);
    });
  }
}
