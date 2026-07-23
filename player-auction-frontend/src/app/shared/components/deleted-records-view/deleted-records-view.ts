import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TeamService } from '../../../features/teams/services/team.service';
import { PlayerService } from '../../../features/players/services/player.service';

export type DeletableEntityType = 'team' | 'player';

export interface DeletableRecord {
  id: string;
  name: string;
  deletedAt?: string;
}

export interface DeletedRecordsRouteData {
  entityType: DeletableEntityType;
  backPath: string;
  entityLabel: string;
}

@Component({
  selector: 'app-deleted-records-view',
  imports: [DatePipe, RouterLink, MatButtonModule, MatIconModule],
  templateUrl: './deleted-records-view.html',
  styleUrl: './deleted-records-view.scss',
})
export class DeletedRecordsView implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly snackBar = inject(MatSnackBar);
  private readonly teamService = inject(TeamService);
  private readonly playerService = inject(PlayerService);

  private entityType!: DeletableEntityType;

  readonly records = signal<DeletableRecord[]>([]);
  readonly isLoading = signal(true);
  readonly backPath = signal('/');
  readonly entityLabel = signal('records');

  ngOnInit(): void {
    const data = this.route.snapshot.data as DeletedRecordsRouteData;
    this.entityType = data.entityType;
    this.backPath.set(data.backPath);
    this.entityLabel.set(data.entityLabel);
    this.fetch();
  }

  restore(record: DeletableRecord): void {
    this.restoreCall(record.id).subscribe(() => {
      this.snackBar.open(`"${record.name}" restored`, 'Close', { duration: 3000 });
      this.fetch();
    });
  }

  private fetch(): void {
    this.isLoading.set(true);
    this.listDeletedCall().subscribe((records) => {
      this.records.set(records);
      this.isLoading.set(false);
    });
  }

  private listDeletedCall(): Observable<DeletableRecord[]> {
    return this.entityType === 'team' ? this.teamService.listDeleted() : this.playerService.listDeleted();
  }

  private restoreCall(id: string): Observable<unknown> {
    return this.entityType === 'team' ? this.teamService.restore(id) : this.playerService.restore(id);
  }
}
