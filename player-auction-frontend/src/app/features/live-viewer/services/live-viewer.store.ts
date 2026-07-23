import { Injectable, computed, signal } from '@angular/core';
import { Player } from '../../../core/models';

export interface ActivityEntry {
  id: string;
  player: Player;
  outcome: 'SOLD' | 'UNSOLD';
  teamId?: string;
  finalPrice?: number;
  at: number;
}

const MAX_ACTIVITY = 15;

// All counts here are scoped to what this viewer has witnessed live since
// connecting — Player records don't reference the auction they were sold
// in, so there's no accurate way to query historical totals for "this
// auction" specifically. Only `remainingInPool` (read from the auction
// document's live playerQueue) is an all-time-accurate, server-authoritative
// number regardless of when the viewer joined.
@Injectable({ providedIn: 'root' })
export class LiveViewerStore {
  readonly remainingInPool = signal(0);
  readonly soldThisSession = signal(0);
  readonly unsoldThisSession = signal(0);
  readonly activity = signal<ActivityEntry[]>([]);
  readonly roster = signal<Player[]>([]);

  readonly totalResolvedThisSession = computed(() => this.soldThisSession() + this.unsoldThisSession());

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

  recordSold(player: Player, teamId: string, finalPrice: number): void {
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
    this.soldThisSession.set(0);
    this.unsoldThisSession.set(0);
    this.activity.set([]);
    this.roster.set([]);
  }

  private pushActivity(entry: ActivityEntry): void {
    this.activity.update((list) => [entry, ...list].slice(0, MAX_ACTIVITY));
  }
}
