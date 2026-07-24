import { Injectable, computed, signal } from '@angular/core';
import { Player, PlayerAuctionStatus } from '../../../core/models';

export interface ActivityEntry {
  id: string;
  player: Player;
  outcome: 'SOLD' | 'UNSOLD';
  teamId?: string;
  finalPrice?: number;
  at: number;
}

const MAX_ACTIVITY = 15;

@Injectable({ providedIn: 'root' })
export class LiveViewerStore {
  readonly remainingInPool = signal(0);
  readonly soldCount = signal(0);
  readonly unsoldCount = signal(0);
  readonly retainedCount = signal(0);
  readonly soldThisSession = signal(0);
  readonly unsoldThisSession = signal(0);
  readonly activity = signal<ActivityEntry[]>([]);
  readonly roster = signal<Player[]>([]);

  readonly totalResolvedThisSession = computed(() => this.soldThisSession() + this.unsoldThisSession());
  readonly totalResolved = computed(() => this.soldCount() + this.unsoldCount());

  rosterFor(playerIds: string[]): Player[] {
    const ids = new Set(playerIds);
    return this.roster().filter((p) => ids.has(p.id));
  }

  setRoster(players: Player[]): void {
    this.roster.set(players);
  }

  upsertRosterPlayer(player: Player): void {
    this.roster.update((list) => {
      const exists = list.some((p) => p.id === player.id);
      return exists ? list.map((p) => (p.id === player.id ? player : p)) : [...list, player];
    });
  }

  setAuctionTotals(players: Player[]): void {
    const sold = players.filter(
      (p) => p.auctionStatus === PlayerAuctionStatus.SOLD || p.auctionStatus === PlayerAuctionStatus.RETAINED,
    ).length;
    const unsold = players.filter((p) => p.auctionStatus === PlayerAuctionStatus.UNSOLD).length;
    const retained = players.filter(
      (p) => p.auctionStatus === PlayerAuctionStatus.RETAINED || p.isRetained,
    ).length;

    this.soldCount.set(sold);
    this.unsoldCount.set(unsold);
    this.retainedCount.set(retained);
  }

  recordSold(player: Player, teamId: string, finalPrice: number): void {
    this.soldCount.update((n) => n + 1);
    this.soldThisSession.update((n) => n + 1);
    this.pushActivity({
      id: `${player.id}-${Date.now()}`,
      player,
      outcome: 'SOLD',
      teamId,
      finalPrice,
      at: Date.now(),
    });
  }

  recordUnsold(player: Player): void {
    this.unsoldCount.update((n) => n + 1);
    this.unsoldThisSession.update((n) => n + 1);
    this.pushActivity({
      id: `${player.id}-${Date.now()}`,
      player,
      outcome: 'UNSOLD',
      at: Date.now(),
    });
  }

  setRemainingInPool(count: number): void {
    this.remainingInPool.set(count);
  }

  // The pool shrinks the moment the server draws the next player (queue pop
  // happens at selection time, not at sold/unsold) and grows again if that
  // player is skipped (requeued) — so these two events are the only ones
  // that should ever move this counter.
  onPlayerDrawnFromPool(): void {
    this.remainingInPool.update((n) => Math.max(0, n - 1));
  }

  onPlayerRequeuedBySkip(): void {
    this.remainingInPool.update((n) => n + 1);
  }

  reset(): void {
    this.remainingInPool.set(0);
    this.soldCount.set(0);
    this.unsoldCount.set(0);
    this.retainedCount.set(0);
    this.soldThisSession.set(0);
    this.unsoldThisSession.set(0);
    this.activity.set([]);
    this.roster.set([]);
  }

  private pushActivity(entry: ActivityEntry): void {
    this.activity.update((list) => [entry, ...list].slice(0, MAX_ACTIVITY));
  }
}
