import { Component, computed, input, signal } from '@angular/core';
import { Player, Team } from '../../../core/models';
import { FormationView } from '../../../shared/components/formation-view/formation-view';

@Component({
  selector: 'app-team-field-card',
  imports: [FormationView],
  templateUrl: './team-field-card.html',
  styleUrl: './team-field-card.scss',
})
export class TeamFieldCard {
  readonly team = input.required<Team>();
  readonly roster = input.required<Player[]>();
  readonly isActive = input(false);

  readonly isExpanded = signal(false);

  readonly captainName = computed(() => {
    const captainId = this.team().captain;
    if (!captainId) return null;
    return this.roster().find((p) => p.id === captainId)?.name ?? null;
  });

  readonly budgetUsedPercent = computed(() => {
    const t = this.team();
    if (t.totalBudget === 0) return 0;
    return Math.round(((t.totalBudget - t.remainingBudget) / t.totalBudget) * 100);
  });

  toggleExpanded(): void {
    this.isExpanded.set(!this.isExpanded());
  }
}
