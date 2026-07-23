import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { TeamService } from '../services/team.service';
import { AuditLogEntry } from '../../../core/models';

@Component({
  selector: 'app-team-audit-history',
  imports: [DatePipe, RouterLink, MatIconModule, MatButtonModule],
  templateUrl: './team-audit-history.html',
  styleUrl: './team-audit-history.scss',
})
export class TeamAuditHistory implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly teamService = inject(TeamService);

  readonly teamId = signal<string | null>(null);
  readonly entries = signal<AuditLogEntry[]>([]);
  readonly isLoading = signal(true);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.teamId.set(id);
    if (!id) return;

    this.teamService.auditHistory(id).subscribe((entries) => {
      this.entries.set(entries);
      this.isLoading.set(false);
    });
  }
}
