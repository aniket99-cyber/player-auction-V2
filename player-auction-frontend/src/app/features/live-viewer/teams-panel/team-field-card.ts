import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { Owner, Player, Team } from '../../../core/models';
import { OwnerService } from '../../owners/services/owner.service';
import { FormationView } from '../../../shared/components/formation-view/formation-view';

@Component({
  selector: 'app-team-field-card',
  imports: [FormationView],
  templateUrl: './team-field-card.html',
  styleUrl: './team-field-card.scss',
})
export class TeamFieldCard {
  private readonly ownerService = inject(OwnerService);

  readonly team = input.required<Team>();
  readonly roster = input.required<Player[]>();
  readonly isActive = input(false);

  readonly isExpanded = signal(false);
  readonly owner = signal<Owner | null>(null);

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

  constructor() {
    effect(() => {
      const teamId = this.team().id;
      this.ownerService.getByTeam(teamId).subscribe((owner) => this.owner.set(owner));
    });
  }

  toggleExpanded(): void {
    this.isExpanded.set(!this.isExpanded());
  }
}
