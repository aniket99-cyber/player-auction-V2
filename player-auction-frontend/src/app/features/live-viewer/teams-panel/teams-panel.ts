import { Component, effect, input, signal } from '@angular/core';
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
  readonly requiredPlayersPerTeam = input<number>(0);

  readonly expandedTeamId = signal<string | null>(null);

  constructor() {
    effect(
      () => {
        const activeId = this.activeTeamId();
        if (activeId) {
          this.expandedTeamId.set(activeId);
        }
      },
      { allowSignalWrites: true },
    );
  }

  getTeamId(team: Team): string {
    return team.id || (team as any)._id || '';
  }

  isExpanded(team: Team): boolean {
    const id = this.getTeamId(team);
    return !!id && this.expandedTeamId() === id;
  }

  toggleTeam(team: Team): void {
    const id = this.getTeamId(team);
    if (!id) return;
    if (this.expandedTeamId() === id) {
      this.expandedTeamId.set(null);
    } else {
      this.expandedTeamId.set(id);
    }
  }

  rosterFor(team: Team): Player[] {
    const ids = new Set(team.players);
    return this.roster().filter((p) => ids.has(p.id));
  }
}
