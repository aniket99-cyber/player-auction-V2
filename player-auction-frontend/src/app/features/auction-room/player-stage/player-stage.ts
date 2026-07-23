import { Component, input, output } from '@angular/core';
import { Player } from '../../../core/models';
import { WheelOfFortune } from './wheel-of-fortune';
import { PlayerCard } from './player-card';

@Component({
  selector: 'app-player-stage',
  imports: [WheelOfFortune, PlayerCard],
  templateUrl: './player-stage.html',
  styleUrl: './player-stage.scss',
})
export class PlayerStage {
  readonly player = input<Player | null>(null);
  readonly isRevealing = input.required<boolean>();
  readonly revealSettled = output<void>();
}
