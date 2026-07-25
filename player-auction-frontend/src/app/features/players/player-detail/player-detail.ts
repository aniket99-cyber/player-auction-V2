import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { StatusBadge } from '../../../shared/components/status-badge/status-badge';
import { PlayerService } from '../services/player.service';
import { Player } from '../../../core/models';

interface StatTile {
  label: string;
  value: number | string;
}

@Component({
  selector: 'app-player-detail',
  imports: [RouterLink, MatButtonModule, MatIconModule, StatusBadge],
  templateUrl: './player-detail.html',
  styleUrl: './player-detail.scss',
})
export class PlayerDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly playerService = inject(PlayerService);

  readonly player = signal<Player | null>(null);
  readonly isLoading = signal(true);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.playerService.getById(id).subscribe((player) => {
      this.player.set(player);
      this.isLoading.set(false);
    });
  }

  statTiles(player: Player): StatTile[] {
    const stats = player.stats ?? {};
    return [
      { label: 'Appearances', value: stats.appearances ?? 0 },
      { label: 'Goals', value: stats.goals ?? '—' },
      { label: 'Assists', value: stats.assists ?? '—' },
    ];
  }

  back(): void {
    this.router.navigate(['/players']);
  }
}
