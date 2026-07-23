import { Component, ElementRef, effect, input, viewChild } from '@angular/core';
import gsap from 'gsap';

@Component({
  selector: 'app-auction-progress',
  imports: [],
  templateUrl: './auction-progress.html',
  styleUrl: './auction-progress.scss',
})
export class AuctionProgress {
  readonly remainingInPool = input.required<number>();
  readonly soldThisSession = input.required<number>();
  readonly unsoldThisSession = input.required<number>();

  private readonly soldValueRef = viewChild<ElementRef<HTMLElement>>('soldValue');
  private readonly unsoldValueRef = viewChild<ElementRef<HTMLElement>>('unsoldValue');

  private isFirstSoldRun = true;
  private isFirstUnsoldRun = true;

  constructor() {
    effect(() => {
      this.soldThisSession();
      if (this.isFirstSoldRun) {
        this.isFirstSoldRun = false;
        return;
      }
      this.pulse(this.soldValueRef());
    });
    effect(() => {
      this.unsoldThisSession();
      if (this.isFirstUnsoldRun) {
        this.isFirstUnsoldRun = false;
        return;
      }
      this.pulse(this.unsoldValueRef());
    });
  }

  private pulse(ref: ElementRef<HTMLElement> | undefined): void {
    if (!ref) return;
    gsap.fromTo(ref.nativeElement, { scale: 1.4 }, { scale: 1, duration: 0.4, ease: 'back.out(3)' });
  }
}
