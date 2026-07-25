import { Component, computed, input } from '@angular/core';
import { Player } from '../../../core/models';

@Component({
  selector: 'app-player-card',
  imports: [],
  templateUrl: './player-card.html',
  styleUrl: './player-card.scss',
})
export class PlayerCard {
  readonly player = input.required<Player>();

  // Simple rarity tier keyed to base price — gold/premium foil is a visual
  // cue only, no functional difference in bidding.
  readonly rarityTier = computed<'standard' | 'silver' | 'gold'>(() => {
    const price = this.player().basePrice;
    if (price >= 200) return 'gold';
    if (price >= 100) return 'silver';
    return 'standard';
  });
}
