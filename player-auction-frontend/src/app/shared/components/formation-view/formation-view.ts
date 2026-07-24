import { Component, computed, input, signal } from '@angular/core';
import { Player, PlayerRole } from '../../../core/models';

interface FormationRow {
  role: PlayerRole;
  label: string;
  players: Player[];
}

const ROLE_ORDER: { role: PlayerRole; label: string }[] = [
  { role: 'GOALKEEPER' as PlayerRole, label: 'Goalkeeper' },
  { role: 'DEFENDER' as PlayerRole, label: 'Defenders' },
  { role: 'MIDFIELDER' as PlayerRole, label: 'Midfielders' },
  { role: 'FORWARD' as PlayerRole, label: 'Forwards' },
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
  readonly captainId = input<string | undefined>(undefined);
  readonly teamName = input<string | undefined>(undefined);
  readonly ownerName = input<string | undefined>(undefined);
  readonly ownerImage = input<string | undefined>(undefined);
  readonly enableImagePreview = input(false);

  readonly selectedImage = signal<string | null>(null);
  readonly selectedAlt = signal<string>('');

  readonly rows = computed<FormationRow[]>(() => {
    const all = this.players();
    return ROLE_ORDER.map(({ role, label }) => ({
      role,
      label,
      players: all.filter((p) => p.role === role),
    })).filter((row) => row.players.length > 0);
  });

  openImagePreview(imageUrl: string, altText: string): void {
    if (!this.enableImagePreview()) {
      return;
    }

    this.selectedImage.set(imageUrl);
    this.selectedAlt.set(altText);
  }

  closeImagePreview(): void {
    this.selectedImage.set(null);
    this.selectedAlt.set('');
  }
}
