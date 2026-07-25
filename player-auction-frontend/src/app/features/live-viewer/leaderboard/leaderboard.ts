import { Component, computed, input } from '@angular/core';
import { Team } from '../../../core/models';

interface RankedTeam extends Team {
  rank: number;
  spent: number;
}

@Component({
  selector: 'app-leaderboard',
  imports: [],
  templateUrl: './leaderboard.html',
  styleUrl: './leaderboard.scss',
})
export class Leaderboard {
  readonly teams = input.required<Team[]>();
  readonly highlightedTeamId = input<string | null>(null);

  readonly ranked = computed<RankedTeam[]>(() => {
    return [...this.teams()]
      .map((team) => ({ ...team, spent: team.totalBudget - team.remainingBudget, rank: 0 }))
      .sort((a, b) => b.spent - a.spent)
      .map((team, index) => ({ ...team, rank: index + 1 }));
  });
}
