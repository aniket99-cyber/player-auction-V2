import { Injectable, computed, signal } from '@angular/core';
import { Auction, AuctionPlayerState, AuctionStatus, BidIncrementRule, Player, Team } from '../../../core/models';

@Injectable({ providedIn: 'root' })
export class AuctionRoomStore {
  readonly auctionId = signal<string | null>(null);
  readonly auctionStatus = signal<AuctionStatus | null>(null);
  readonly playerState = signal<AuctionPlayerState | null>(null);
  readonly bidIncrementRules = signal<BidIncrementRule[]>([]);
  readonly participatingTeamIds = signal<string[]>([]);
  readonly requiredPlayersPerTeam = signal<number>(0);

  readonly currentPlayer = signal<Player | null>(null);
  readonly currentBid = signal<{ amount: number } | null>(null);
  readonly teams = signal<Team[]>([]);
  readonly lastRejection = signal<{ message: string } | null>(null);
  readonly isRevealing = signal(false); // true during the wheel-spin window
  readonly round = signal(1);
  readonly awaitingNextRoundUnsoldCount = signal(0);

  readonly isLive = computed(() => this.auctionStatus() === AuctionStatus.LIVE);
  readonly isPaused = computed(() => this.auctionStatus() === AuctionStatus.PAUSED);
  readonly isCompleted = computed(() => this.auctionStatus() === AuctionStatus.COMPLETED);
  readonly isBiddingOpen = computed(
    () => this.isLive() && this.playerState() === AuctionPlayerState.IN_BIDDING,
  );
  readonly isFinalizing = computed(() => this.playerState() === AuctionPlayerState.FINALIZING);

  /**
   * IDs of teams that still need more players but can no longer afford the
   * current bid — i.e. they are effectively locked out of this player.
   */
  readonly lockedOutTeamIds = computed<Set<string>>(() => {
    const bid = this.currentBid();
    const required = this.requiredPlayersPerTeam();
    if (!bid || required === 0) return new Set<string>();
    const locked = new Set<string>();
    for (const team of this.teams()) {
      const needsMorePlayers = team.players.length < required;
      const cantAfford = team.remainingBudget < bid.amount;
      if (needsMorePlayers && cantAfford) locked.add(team.id);
    }
    return locked;
  });

  readonly isAwaitingNextRound = computed(
    () => this.playerState() === AuctionPlayerState.AWAITING_NEXT_ROUND,
  );

  readonly nextValidBidAmount = computed(() => {
    const player = this.currentPlayer();
    if (!player) return 0;

    const bid = this.currentBid();
    if (!bid) return player.basePrice;

    const rules = [...this.bidIncrementRules()].sort((a, b) => a.upTo - b.upTo);
    const rule = rules.find((r) => bid.amount < r.upTo);
    const increment = rule ? rule.increment : (rules[rules.length - 1]?.increment ?? 1);
    return bid.amount + increment;
  });

  loadFromAuction(auction: Auction, currentPlayer: Player | null, teams: Team[], requiredPlayersPerTeam?: number): void {
    this.auctionId.set(auction.id);
    this.auctionStatus.set(auction.status);
    this.playerState.set(auction.playerState ?? null);
    this.bidIncrementRules.set(auction.bidIncrementRules);
    this.participatingTeamIds.set(auction.participatingTeams);
    this.currentPlayer.set(currentPlayer);
    this.currentBid.set(auction.currentBid?.amount != null ? auction.currentBid : null);
    this.teams.set(teams);
    this.round.set(auction.round);
    this.awaitingNextRoundUnsoldCount.set(auction.unsoldThisRound.length);
    if (requiredPlayersPerTeam != null) this.requiredPlayersPerTeam.set(requiredPlayersPerTeam);
  }

  setPlayerSelected(player: Player): void {
    this.currentPlayer.set(player);
    this.currentBid.set(null);
    this.playerState.set(AuctionPlayerState.SELECTING);
    this.isRevealing.set(true);
  }

  settleReveal(): void {
    this.isRevealing.set(false);
    this.playerState.set(AuctionPlayerState.IN_BIDDING);
  }

  applyBidBumped(amount: number): void {
    this.currentBid.set({ amount });
    this.lastRejection.set(null);
  }

  applyBidRejected(message: string): void {
    this.lastRejection.set({ message });
  }

  applyBidUndone(amount: number | null): void {
    this.currentBid.set(amount === null ? null : { amount });
  }

  applyEnteredFinalizing(): void {
    this.playerState.set(AuctionPlayerState.FINALIZING);
  }

  applyTeamBudgetUpdated(teamId: string, remainingBudget: number): void {
    this.teams.update((teams) =>
      teams.map((t) => (t.id === teamId ? { ...t, remainingBudget } : t)),
    );
  }

  addPlayerToTeam(teamId: string, playerId: string): void {
    this.teams.update((teams) =>
      teams.map((t) =>
        t.id === teamId && !t.players.includes(playerId)
          ? { ...t, players: [...t.players, playerId] }
          : t,
      ),
    );
  }

  applyPlayerSettled(): void {
    this.currentPlayer.set(null);
    this.currentBid.set(null);
    this.playerState.set(null);
  }

  setStatus(status: AuctionStatus): void {
    this.auctionStatus.set(status);
  }

  applyAwaitingNextRound(round: number, unsoldCount: number): void {
    this.playerState.set(AuctionPlayerState.AWAITING_NEXT_ROUND);
    this.round.set(round);
    this.awaitingNextRoundUnsoldCount.set(unsoldCount);
  }

  applyRoundStarted(round: number): void {
    this.round.set(round);
    this.awaitingNextRoundUnsoldCount.set(0);
  }

  reset(): void {
    this.auctionId.set(null);
    this.auctionStatus.set(null);
    this.playerState.set(null);
    this.currentPlayer.set(null);
    this.currentBid.set(null);
    this.teams.set([]);
    this.lastRejection.set(null);
    this.isRevealing.set(false);
    this.round.set(1);
    this.awaitingNextRoundUnsoldCount.set(0);
    this.requiredPlayersPerTeam.set(0);
  }
}
