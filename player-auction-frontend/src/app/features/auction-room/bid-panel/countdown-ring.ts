import { Component, computed, input } from '@angular/core';

const RADIUS = 42;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

@Component({
  selector: 'app-countdown-ring',
  imports: [],
  templateUrl: './countdown-ring.html',
  styleUrl: './countdown-ring.scss',
})
export class CountdownRing {
  readonly secondsRemaining = input.required<number>();
  readonly totalSeconds = input.required<number>();

  readonly radius = RADIUS;
  readonly circumference = CIRCUMFERENCE;

  readonly progressOffset = computed(() => {
    const total = this.totalSeconds() || 1;
    const fraction = Math.max(0, Math.min(1, this.secondsRemaining() / total));
    return this.circumference * (1 - fraction);
  });

  readonly isCritical = computed(() => this.secondsRemaining() <= 5 && this.secondsRemaining() > 0);
}
