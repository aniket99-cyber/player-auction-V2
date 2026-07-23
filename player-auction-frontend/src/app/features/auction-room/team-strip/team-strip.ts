import { Component, input } from '@angular/core';
import { Team } from '../../../core/models';

@Component({
  selector: 'app-team-strip',
  imports: [],
  templateUrl: './team-strip.html',
  styleUrl: './team-strip.scss',
})
export class TeamStrip {
  readonly teams = input.required<Team[]>();
  readonly highlightedTeamId = input<string | null>(null);

  budgetUsedPercent(team: Team): number {
    if (team.totalBudget === 0) return 0;
    return Math.round(((team.totalBudget - team.remainingBudget) / team.totalBudget) * 100);
  }
}
