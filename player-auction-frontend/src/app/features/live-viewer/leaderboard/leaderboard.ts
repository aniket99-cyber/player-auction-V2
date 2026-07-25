import { Component, computed, input } from '@angular/core';
import { Player, Team } from '../../../core/models';

export interface RankedPlayer extends Player {
  rank: number;
  teamName?: string;
  teamLogoUrl?: string;
  teamShortName?: string;
  teamPrimaryColor?: string;
}

@Component({
  selector: 'app-leaderboard',
  imports: [],
  templateUrl: './leaderboard.html',
  styleUrl: './leaderboard.scss',
})
export class Leaderboard {
  readonly roster = input<Player[]>([]);
  readonly teams = input<Team[]>([]);
  readonly highlightedPlayerId = input<string | null>(null);

  readonly ranked = computed<RankedPlayer[]>(() => {
    const teamsMap = new Map(this.teams().map((t) => [t.id, t]));

    const soldPlayers = this.roster().filter(
      (p) => p.soldPrice !== undefined && p.soldPrice !== null && p.soldPrice > 0,
    );

    return [...soldPlayers]
      .sort((a, b) => (b.soldPrice ?? 0) - (a.soldPrice ?? 0))
      .map((player, index) => {
        const team = player.soldTo ? teamsMap.get(player.soldTo) : undefined;
        return {
          ...player,
          rank: index + 1,
          teamName: team?.name,
          teamLogoUrl: team?.logoUrl,
          teamShortName: team?.shortName,
          teamPrimaryColor: team?.primaryColor ?? '#2fd0ff',
        };
      });
  });
}
