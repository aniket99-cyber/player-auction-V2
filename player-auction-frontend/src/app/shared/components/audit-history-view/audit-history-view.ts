import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { TeamService } from '../../../features/teams/services/team.service';
import { PlayerService } from '../../../features/players/services/player.service';
import { AuditLogEntry } from '../../../core/models';

export type AuditableEntityType = 'team' | 'player';

export interface AuditHistoryRouteData {
  entityType: AuditableEntityType;
  backPath: string;
}

@Component({
  selector: 'app-audit-history-view',
  imports: [DatePipe, RouterLink, MatIconModule, MatButtonModule],
  templateUrl: './audit-history-view.html',
  styleUrl: './audit-history-view.scss',
})
export class AuditHistoryView implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly teamService = inject(TeamService);
  private readonly playerService = inject(PlayerService);

  readonly entityId = signal<string | null>(null);
  readonly entries = signal<AuditLogEntry[]>([]);
  readonly isLoading = signal(true);
  readonly backPath = signal('/');

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    const { entityType, backPath } = this.route.snapshot.data as AuditHistoryRouteData;

    this.entityId.set(id);
    this.backPath.set(backPath);
    if (!id) return;

    const fetch$ = entityType === 'team' ? this.teamService.auditHistory(id) : this.playerService.auditHistory(id);

    fetch$.subscribe((entries) => {
      this.entries.set(entries);
      this.isLoading.set(false);
    });
  }

  iconFor(action: string): string {
    if (action.includes('deleted')) return 'delete';
    if (action.includes('created')) return 'add_circle';
    if (action.includes('restored')) return 'restore';
    return 'edit';
  }
}
