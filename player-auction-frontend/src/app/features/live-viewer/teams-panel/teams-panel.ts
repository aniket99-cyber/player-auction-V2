import { Component, input } from '@angular/core';
import { Player, Team } from '../../../core/models';
import { TeamFieldCard } from './team-field-card';

@Component({
  selector: 'app-teams-panel',
  imports: [TeamFieldCard],
  templateUrl: './teams-panel.html',
  styleUrl: './teams-panel.scss',
})
export class TeamsPanel {
  readonly teams = input.required<Team[]>();
  readonly roster = input.required<Player[]>();
  readonly activeTeamId = input<string | null>(null);

  rosterFor(team: Team): Player[] {
    const ids = new Set(team.players);
    return this.roster().filter((p) => ids.has(p.id));
  }
}
