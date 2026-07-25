import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
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
  readonly requiredPlayersPerTeam = input<number>(0);
  readonly isExpanded = input(false);

  readonly toggled = output<void>();
  readonly owner = signal<Owner | null>(null);

  readonly captainName = computed(() => {
    const captainId = this.team().captain;
    if (!captainId) return null;
    return this.roster().find((p) => p.id === captainId)?.name ?? null;
  });

  readonly playerCount = computed(() => {
    return this.team().players?.length ?? this.roster().length;
  });

  readonly squadCountText = computed(() => {
    const count = this.playerCount();
    const req = this.requiredPlayersPerTeam();
    return req > 0 ? `${count}/${req}` : `${count}`;
  });

  readonly isSquadFull = computed(() => {
    const req = this.requiredPlayersPerTeam();
    return req > 0 && this.playerCount() >= req;
  });

  constructor() {
    effect(() => {
      const teamId = this.team().id || (this.team() as any)._id;
      if (teamId) {
        this.ownerService.getByTeam(teamId).subscribe((owner) => this.owner.set(owner));
      }
    });
  }

  toggleExpanded(): void {
    this.toggled.emit();
  }
}
