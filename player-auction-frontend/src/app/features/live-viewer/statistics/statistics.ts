import { Component, computed, input, signal } from '@angular/core';
import { Player, PlayerAuctionStatus, Team } from '../../../core/models';

const PAGE_SIZE = 5;

@Component({
  selector: 'app-statistics',
  imports: [],
  templateUrl: './statistics.html',
  styleUrl: './statistics.scss',
})
export class Statistics {
  readonly teams = input.required<Team[]>();
  readonly roster = input.required<Player[]>();

  readonly pageSize = PAGE_SIZE;

  readonly unsoldPage = signal(1);
  readonly pendingPage = signal(1);

  readonly unsoldPlayers = computed<Player[]>(() => {
    return this.roster().filter(
      (p) => p.auctionStatus === PlayerAuctionStatus.UNSOLD,
    );
  });

  readonly pendingPlayers = computed<Player[]>(() => {
    return this.roster().filter(
      (p) =>
        p.auctionStatus === PlayerAuctionStatus.PENDING ||
        (!p.auctionStatus && !p.soldTo && !p.isRetained),
    );
  });

  readonly totalUnsoldPages = computed(() => {
    return Math.max(1, Math.ceil(this.unsoldPlayers().length / PAGE_SIZE));
  });

  readonly totalPendingPages = computed(() => {
    return Math.max(1, Math.ceil(this.pendingPlayers().length / PAGE_SIZE));
  });

  readonly paginatedUnsold = computed<Player[]>(() => {
    const page = Math.min(this.unsoldPage(), this.totalUnsoldPages());
    const start = (page - 1) * PAGE_SIZE;
    return this.unsoldPlayers().slice(start, start + PAGE_SIZE);
  });

  readonly paginatedPending = computed<Player[]>(() => {
    const page = Math.min(this.pendingPage(), this.totalPendingPages());
    const start = (page - 1) * PAGE_SIZE;
    return this.pendingPlayers().slice(start, start + PAGE_SIZE);
  });

  prevUnsoldPage(): void {
    this.unsoldPage.update((p) => Math.max(1, p - 1));
  }

  nextUnsoldPage(): void {
    this.unsoldPage.update((p) => Math.min(this.totalUnsoldPages(), p + 1));
  }

  prevPendingPage(): void {
    this.pendingPage.update((p) => Math.max(1, p - 1));
  }

  nextPendingPage(): void {
    this.pendingPage.update((p) => Math.min(this.totalPendingPages(), p + 1));
  }
}
