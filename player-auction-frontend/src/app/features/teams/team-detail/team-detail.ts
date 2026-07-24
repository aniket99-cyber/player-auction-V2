import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NgApexchartsModule } from 'ng-apexcharts';
import type { ApexAxisChartSeries, ApexChart, ApexXAxis, ApexDataLabels, ApexStroke, ApexGrid } from 'ng-apexcharts';
import { TeamService } from '../services/team.service';
import { PlayerService } from '../../players/services/player.service';
import { FormationView } from '../../../shared/components/formation-view/formation-view';
import { Player, Team } from '../../../core/models';

interface RoleStatChartOptions {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  dataLabels: ApexDataLabels;
  stroke: ApexStroke;
  grid: ApexGrid;
  colors: string[];
}

// Categorical palette validated against the dark surface (#12161f) via the
// dataviz skill's validator — kept separate from brand-neon accents so
// multi-series charts stay colorblind-safe.
const STAT_CHART_COLORS = ['#3987e5', '#d95926', '#199e70', '#c98500'];

@Component({
  selector: 'app-team-detail',
  imports: [RouterLink, MatTabsModule, MatButtonModule, MatIconModule, NgApexchartsModule, FormationView],
  templateUrl: './team-detail.html',
  styleUrl: './team-detail.scss',
})
export class TeamDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly teamService = inject(TeamService);
  private readonly playerService = inject(PlayerService);

  readonly team = signal<Team | null>(null);
  readonly squad = signal<Player[]>([]);
  readonly isLoading = signal(true);

  isCaptain(player: Player): boolean {
    return this.team()?.captain === player.id;
  }

  readonly budgetUsedPercent = computed(() => {
    const t = this.team();
    if (!t || t.totalBudget === 0) return 0;
    return Math.round(((t.totalBudget - t.remainingBudget) / t.totalBudget) * 100);
  });

  readonly roleStatChartOptions = computed<RoleStatChartOptions>(() => {
    const counts = new Map<string, number>();
    this.squad().forEach((p) => counts.set(p.role, (counts.get(p.role) ?? 0) + 1));

    return {
      series: [{ name: 'Players', data: Array.from(counts.values()) }],
      chart: { type: 'bar', height: 260, toolbar: { show: false }, background: 'transparent' },
      xaxis: { categories: Array.from(counts.keys()), labels: { style: { colors: '#9aa4b8' } } },
      dataLabels: { enabled: false },
      stroke: { width: 0 },
      grid: { borderColor: '#262d3d' },
      colors: STAT_CHART_COLORS,
    };
  });

  ngOnInit(): void {
    const teamId = this.route.snapshot.paramMap.get('id');
    if (!teamId) return;

    this.teamService.getById(teamId).subscribe((team) => {
      this.team.set(team);

      if (team.players.length === 0) {
        this.isLoading.set(false);
        return;
      }

      forkJoin({ squad: this.playerService.getByIds(team.players) }).subscribe(({ squad }) => {
        this.squad.set(squad.data);
        this.isLoading.set(false);
      });
    });
  }
}
