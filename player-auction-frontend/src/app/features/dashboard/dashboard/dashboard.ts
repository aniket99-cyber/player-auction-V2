import { Component, OnInit, inject, signal } from '@angular/core';
import { NgApexchartsModule } from 'ng-apexcharts';
import { of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AuctionService } from '../../auctions/services/auction.service';
import { PlayerService } from '../../players/services/player.service';
import { TeamService } from '../../teams/services/team.service';
import { Auction, AuctionStatus, Player, PlayerAuctionStatus, Team } from '../../../core/models';
import type {
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexDataLabels,
  ApexStroke,
  ApexGrid,
} from 'ng-apexcharts';

interface SpendChartOptions {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  dataLabels: ApexDataLabels;
  stroke: ApexStroke;
  grid: ApexGrid;
  colors: string[];
}

@Component({
  selector: 'app-dashboard',
  imports: [NgApexchartsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  private readonly auctionService = inject(AuctionService);
  private readonly teamService = inject(TeamService);
  private readonly playerService = inject(PlayerService);

  readonly totalPlayers = signal(0);
  readonly playersSold = signal(0);
  readonly playersRetained = signal(0);
  readonly activeTeams = signal(0);
  readonly totalSpend = signal(0);

  readonly spendChartOptions = signal<SpendChartOptions>({
    series: [
      {
        name: 'Budget Spent',
        data: [],
      },
    ],
    chart: {
      type: 'area',
      height: 280,
      toolbar: { show: false },
      background: 'transparent',
    },
    xaxis: {
      categories: [],
      labels: { style: { colors: '#9aa4b8' } },
    },
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 3 },
    grid: { borderColor: '#262d3d' },
    colors: ['#2fd0ff'],
  });

  ngOnInit(): void {
    this.loadDashboardMetrics();
  }

  private loadDashboardMetrics(): void {
    this.auctionService
      .list(1, 1, AuctionStatus.LIVE)
      .pipe(
        switchMap((auctionPage) => {
          const auction = auctionPage.data[0];
          if (!auction) {
            return of(null);
          }

          return this.teamService.getByIds(auction.participatingTeams).pipe(
            switchMap((teamsPage) => {
              const teams = teamsPage.data;
              const playerIds = [
                ...new Set([
                  ...auction.playerQueue,
                  ...auction.unsoldThisRound,
                  ...(auction.currentPlayer ? [auction.currentPlayer] : []),
                  ...teams.flatMap((team) => team.players),
                  ...teams.flatMap((team) => team.retentions.map((entry) => entry.player)),
                ]),
              ];

              if (playerIds.length === 0) {
                return of({ auction, teams, players: [] as Player[] });
              }

              return this.playerService.getByIds(playerIds).pipe(
                switchMap((playersPage) =>
                  of({ auction, teams, players: playersPage.data }),
                ),
              );
            }),
          );
        }),
      )
      .subscribe((result) => {
        if (!result) {
          this.setDashboardEmpty();
          return;
        }

        this.applyDashboardMetrics(result.auction, result.teams, result.players);
      });
  }

  private applyDashboardMetrics(auction: Auction, teams: Team[], players: Player[]): void {
    const soldCount = players.filter((p) => p.auctionStatus === PlayerAuctionStatus.SOLD).length;
    const retainedCount = players.filter(
      (p) => p.auctionStatus === PlayerAuctionStatus.RETAINED || p.isRetained,
    ).length;

    this.totalPlayers.set(players.length);
    this.playersSold.set(soldCount);
    this.playersRetained.set(retainedCount);
    this.activeTeams.set(teams.length);
    this.totalSpend.set(
      teams.reduce((sum, team) => sum + Math.max(0, team.totalBudget - team.remainingBudget), 0),
    );
    this.spendChartOptions.update((options) => ({
      ...options,
      series: [{ name: 'Budget Spent', data: teams.map((team) => Math.max(0, team.totalBudget - team.remainingBudget)) }],
      xaxis: {
        ...options.xaxis,
        categories: teams.map((team) => team.shortName),
      },
    }));
  }

  private setDashboardEmpty(): void {
    this.totalPlayers.set(0);
    this.playersSold.set(0);
    this.playersRetained.set(0);
    this.activeTeams.set(0);
    this.totalSpend.set(0);
    this.spendChartOptions.update((options) => ({
      ...options,
      series: [{ name: 'Budget Spent', data: [] }],
      xaxis: { ...options.xaxis, categories: [] },
    }));
  }
}
