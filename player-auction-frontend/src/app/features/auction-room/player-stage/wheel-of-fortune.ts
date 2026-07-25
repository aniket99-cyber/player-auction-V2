import {
  AfterViewInit,
  Component,
  ElementRef,
  effect,
  input,
  output,
  viewChild,
} from '@angular/core';
import gsap from 'gsap';
import { Player } from '../../../core/models';

@Component({
  selector: 'app-wheel-of-fortune',
  imports: [],
  templateUrl: './wheel-of-fortune.html',
  styleUrl: './wheel-of-fortune.scss',
})
export class WheelOfFortune implements AfterViewInit {
  // The player is already server-determined by the time this component spins —
  // this is a scripted reveal animation, never a client-side random draw
  // (design decision: every viewer must land on the identical player).
  readonly player = input.required<Player>();
  readonly isRevealing = input.required<boolean>();
  readonly settled = output<void>();

  private readonly cardRef = viewChild.required<ElementRef<HTMLDivElement>>('card');

  constructor() {
    effect(() => {
      if (this.isRevealing()) {
        this.playReveal();
      }
    });
  }

  ngAfterViewInit(): void {
    if (this.isRevealing()) {
      this.playReveal();
    }
  }

  private playReveal(): void {
    const el = this.cardRef().nativeElement;

    const timeline = gsap.timeline({
      onComplete: () => this.settled.emit(),
    });

    timeline
      .set(el, { rotationY: 0, opacity: 0, scale: 0.8 })
      .to(el, { opacity: 1, duration: 0.3, ease: 'power1.out' })
      .to(el, {
        rotationY: 1080,
        duration: 3,
        ease: 'power4.out',
      })
      .to(
        el,
        {
          scale: 1.08,
          duration: 0.25,
          yoyo: true,
          repeat: 1,
          ease: 'power2.inOut',
        },
        '-=0.4',
      );
  }
}
