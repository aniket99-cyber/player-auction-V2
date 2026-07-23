import { Component, computed, input } from '@angular/core';
import { Player, PlayerRole } from '../../../core/models';

interface FormationRow {
  role: PlayerRole;
  label: string;
  players: Player[];
}

const ROLE_ORDER: { role: PlayerRole; label: string }[] = [
  { role: 'WICKET_KEEPER' as PlayerRole, label: 'Wicket Keeper' },
  { role: 'BATSMAN' as PlayerRole, label: 'Batsmen' },
  { role: 'ALL_ROUNDER' as PlayerRole, label: 'All-Rounders' },
  { role: 'BOWLER' as PlayerRole, label: 'Bowlers' },
];

@Component({
  selector: 'app-formation-view',
  imports: [],
  templateUrl: './formation-view.html',
  styleUrl: './formation-view.scss',
})
export class FormationView {
  readonly players = input.required<Player[]>();
  readonly primaryColor = input<string>('#2fd0ff');

  readonly rows = computed<FormationRow[]>(() => {
    const all = this.players();
    return ROLE_ORDER.map(({ role, label }) => ({
      role,
      label,
      players: all.filter((p) => p.role === role),
    })).filter((row) => row.players.length > 0);
  });
}
