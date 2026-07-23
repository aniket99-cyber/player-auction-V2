import { randomInt } from 'node:crypto';
import { ApiError } from '@utils/ApiError';
import { logger } from '@utils/logger';
import { eventBus } from '@events/EventBus';
import { IAuction } from '@models/Auction.model';
import { IPlayer } from '@models/Player.model';
import { AuctionPlayerState, AuctionSelectionMode, AuctionStatus, PlayerAuctionStatus, UserRole } from '@constants/enums';
import { IAuctionRepository } from '@repositories/interfaces/IAuctionRepository';
import { ITeamRepository } from '@repositories/interfaces/ITeamRepository';
import { IPlayerRepository } from '@repositories/interfaces/IPlayerRepository';
import { IAuditLogRepository } from '@repositories/interfaces/IAuditLogRepository';

// Timings tuned to match the client's GSAP animation timeline (design §16):
// the wheel-spin/reveal runs ~3.5-4s before bidding opens, and a brief
// settling delay lets the sold/unsold animation play before the next player.
const SELECTION_ANIMATION_MS = 4000;
const SETTLING_DELAY_MS = 2500;

export class AuctionService {
  private readonly pendingTimeouts = new Map<string, NodeJS.Timeout>();
  // How many players entered the *current* round's queue — used to detect
  // "this round sold nobody" (unsoldThisRound.length reaches this same
  // number) so the round-repeat loop has a hard stopping condition instead
  // of cycling forever on players nobody can afford or wants.
  private readonly roundStartQueueSize = new Map<string, number>();

  constructor(
    private readonly auctionRepository: IAuctionRepository,
    private readonly teamRepository: ITeamRepository,
    private readonly playerRepository: IPlayerRepository,
    private readonly auditLogRepository: IAuditLogRepository,
  ) {}

  async startAuction(auctionId: string, actorId: string): Promise<void> {
    const auction = await this.requireAuction(auctionId);

    if (auction.status === AuctionStatus.LIVE) return; // idempotent, matches REST convention

    if (![AuctionStatus.DRAFT, AuctionStatus.SCHEDULED].includes(auction.status)) {
      throw ApiError.badRequest(`Cannot start an auction with status ${auction.status}`);
    }
    if (auction.participatingTeams.length === 0) {
      throw ApiError.badRequest('Cannot start an auction with no participating teams');
    }
    if (auction.playerQueue.length === 0) {
      throw ApiError.badRequest('Cannot start an auction with an empty player queue');
    }

    await this.auctionRepository.setStatus(auctionId, AuctionStatus.LIVE);
    await this.auditLogRepository.record({
      actor: actorId,
      action: 'auction.started',
      entityType: 'Auction',
      entityId: auctionId,
    });

    this.roundStartQueueSize.set(auctionId, auction.playerQueue.length);
    eventBus.emit('auction.started', { auctionId });
    await this.selectNextPlayer(auctionId);
  }

  async pauseAuction(auctionId: string, actorId: string): Promise<void> {
    const auction = await this.requireAuction(auctionId);

    if (auction.status === AuctionStatus.PAUSED) return; // idempotent
    if (auction.status !== AuctionStatus.LIVE) {
      throw ApiError.badRequest('Only a live auction can be paused');
    }

    this.clearPendingTimeout(auctionId);
    await this.auctionRepository.setStatus(auctionId, AuctionStatus.PAUSED);

    await this.auditLogRepository.record({
      actor: actorId,
      action: 'auction.paused',
      entityType: 'Auction',
      entityId: auctionId,
    });

    eventBus.emit('auction.paused', { auctionId });
  }

  async resumeAuction(auctionId: string, actorId: string): Promise<void> {
    const auction = await this.requireAuction(auctionId);

    if (auction.status === AuctionStatus.LIVE) return; // idempotent
    if (auction.status !== AuctionStatus.PAUSED) {
      throw ApiError.badRequest('Only a paused auction can be resumed');
    }

    await this.auctionRepository.setStatus(auctionId, AuctionStatus.LIVE);

    await this.auditLogRepository.record({
      actor: actorId,
      action: 'auction.resumed',
      entityType: 'Auction',
      entityId: auctionId,
    });

    eventBus.emit('auction.resumed', { auctionId });

    // Bidding has no timer to resume — it just re-opens for bumps. SELECTING
    // still has the reveal-animation timeout to restart. FINALIZING has
    // nothing to restart either way; the admin still has to confirm a
    // winning team or unsold.
    if (auction.playerState === AuctionPlayerState.SELECTING && auction.currentPlayer) {
      this.scheduleSelectionTimeout(auctionId, auction.currentPlayer.toString());
    }
  }

  async selectNextPlayer(auctionId: string): Promise<IPlayer | null> {
    const auction = await this.requireAuction(auctionId);

    if (auction.playerQueue.length === 0) {
      await this.handleQueueExhausted(auctionId, auction);
      return null;
    }

    const nextPlayerId =
      auction.selectionMode === AuctionSelectionMode.RANDOM
        ? auction.playerQueue[randomInt(auction.playerQueue.length)].toString()
        : auction.playerQueue[0].toString();

    await this.auctionRepository.removeFromQueue(auctionId, nextPlayerId);
    await this.auctionRepository.advanceToNextPlayer(auctionId, nextPlayerId, AuctionPlayerState.SELECTING);
    await this.playerRepository.bulkUpdateAuctionStatus([nextPlayerId], PlayerAuctionStatus.IN_BIDDING);

    const player = await this.playerRepository.findById(nextPlayerId);
    if (!player) {
      throw ApiError.internal(`Selected player ${nextPlayerId} not found`);
    }

    eventBus.emit('auction.playerSelected', { auctionId, player, selectionMode: auction.selectionMode });

    this.scheduleSelectionTimeout(auctionId, nextPlayerId);

    return player;
  }

  async skipPlayer(auctionId: string, actorId: string): Promise<void> {
    const auction = await this.requireAuction(auctionId);

    if (!auction.currentPlayer) {
      throw ApiError.badRequest('No current player to skip');
    }

    const playerId = auction.currentPlayer.toString();
    this.clearPendingTimeout(auctionId);

    // Skip reverts to PENDING (not UNSOLD) — semantically "never got to
    // bid on this one," distinct from a player that went through bidding
    // and received no bids at all.
    await this.playerRepository.bulkUpdateAuctionStatus([playerId], PlayerAuctionStatus.PENDING);
    await this.auctionRepository.requeuePlayer(auctionId, playerId);
    await this.auctionRepository.advanceToNextPlayer(auctionId, null, null);

    const player = await this.playerRepository.findById(playerId);
    if (player) {
      eventBus.emit('player.skipped', { auctionId, player });
    }

    await this.auditLogRepository.record({
      actor: actorId,
      action: 'auction.playerSkipped',
      entityType: 'Auction',
      entityId: auctionId,
      after: { playerId },
    });

    await this.selectNextPlayer(auctionId);
  }

  /**
   * Admin-only: bumps the running bid counter by the increment for the
   * current price tier. No team is attached — every team is bidding
   * verbally in the room, and the admin is just tracking the number going
   * up. A team is chosen only once, at confirmSale().
   */
  async bumpBid(auctionId: string, _actorId: string, actorRole: UserRole): Promise<void> {
    if (actorRole !== UserRole.ADMIN) {
      throw ApiError.forbidden('Only the admin can increase the bid');
    }

    const auction = await this.requireAuction(auctionId);

    if (auction.status !== AuctionStatus.LIVE) {
      throw ApiError.badRequest('Auction is not live');
    }
    if (auction.playerState !== AuctionPlayerState.IN_BIDDING || !auction.currentPlayer) {
      throw ApiError.badRequest('No player is currently open for bidding');
    }

    const player = await this.playerRepository.findById(auction.currentPlayer.toString());
    if (!player) {
      throw ApiError.notFound('Player not found');
    }

    const previousAmount = auction.currentBid?.amount ?? null;
    const newAmount = this.getNextValidBidAmount(auction, player);

    await this.auctionRepository.bumpCurrentBid(auctionId, newAmount, previousAmount);

    eventBus.emit('auction.bidBumped', { auctionId, amount: newAmount });
  }

  /** Single-level undo: restores whatever the bid counter was before the last bump. */
  async undoBump(auctionId: string, actorId: string): Promise<void> {
    const auction = await this.requireAuction(auctionId);

    if (auction.playerState !== AuctionPlayerState.IN_BIDDING || !auction.currentPlayer) {
      throw ApiError.badRequest('No active bidding to undo');
    }
    if (auction.currentBid?.amount == null) {
      throw ApiError.badRequest('No bid to undo');
    }

    const previousAmount = auction.previousBidAmount ?? null;
    await this.auctionRepository.restorePreviousBid(auctionId, previousAmount);

    await this.auditLogRepository.record({
      actor: actorId,
      action: 'bid.undone',
      entityType: 'Auction',
      entityId: auctionId,
      before: { amount: auction.currentBid.amount },
      after: { amount: previousAmount },
    });

    eventBus.emit('auction.bidUndone', { auctionId, amount: previousAmount });
  }

  /**
   * Opens the finalize step — the admin clicks Finalize whenever they're
   * ready to close bidding on the current player (there's no timer forcing
   * this). Does NOT decide sold/unsold by itself; the admin still has to
   * pick a team (or Unsold) via confirmSale().
   */
  async enterFinalizing(auctionId: string, actorId: string): Promise<void> {
    const auction = await this.requireAuction(auctionId);

    if (auction.playerState !== AuctionPlayerState.IN_BIDDING || !auction.currentPlayer) {
      throw ApiError.badRequest('No active bidding to finalize');
    }

    this.clearPendingTimeout(auctionId);
    await this.auctionRepository.setPlayerState(auctionId, AuctionPlayerState.FINALIZING);

    await this.auditLogRepository.record({
      actor: actorId,
      action: 'auction.enteredFinalizing',
      entityType: 'Auction',
      entityId: auctionId,
      after: { currentBid: auction.currentBid?.amount != null ? auction.currentBid : null },
    });

    eventBus.emit('auction.enteredFinalizing', {
      auctionId,
      currentBid: auction.currentBid?.amount != null ? auction.currentBid : null,
    });
  }

  /**
   * The admin's actual decision: sell the current player to `teamId`, or
   * pass `null` to mark unsold. This is the only place team assignment
   * happens in the whole bidding flow. If nobody ever bumped the bid,
   * selling to a team charges the player's base price instead of blocking
   * the sale.
   */
  async confirmSale(auctionId: string, actorId: string, teamId: string | null): Promise<void> {
    const auction = await this.requireAuction(auctionId);

    if (auction.playerState !== AuctionPlayerState.FINALIZING || !auction.currentPlayer) {
      throw ApiError.badRequest('No player is awaiting finalization');
    }

    const playerId = auction.currentPlayer.toString();
    const player = await this.playerRepository.findById(playerId);
    if (!player) {
      throw ApiError.notFound('Player not found');
    }

    if (teamId) {
      if (!auction.participatingTeams.some((t) => t.toString() === teamId)) {
        throw ApiError.badRequest('Team is not participating in this auction');
      }

      const amount = auction.currentBid?.amount ?? player.basePrice;
      const updatedTeam = await this.teamRepository.deductBudget(teamId, amount);
      if (!updatedTeam) {
        throw ApiError.badRequest('That team cannot afford this bid — pick another team or mark unsold');
      }

      await this.teamRepository.addPlayer(teamId, playerId);
      await this.playerRepository.markSold(playerId, teamId, amount);

      await this.auditLogRepository.record({
        actor: actorId,
        action: 'auction.playerSold',
        entityType: 'Auction',
        entityId: auctionId,
        after: { playerId, teamId, amount },
      });

      const soldPlayer = await this.playerRepository.findById(playerId);
      eventBus.emit('player.sold', {
        auctionId,
        player: soldPlayer ?? player,
        teamId,
        finalPrice: amount,
      });
      eventBus.emit('auction.teamBudgetUpdated', {
        auctionId,
        teamId,
        remainingBudget: updatedTeam.remainingBudget,
      });
    } else {
      await this.settleUnsold(auctionId, playerId);
    }

    await this.auctionRepository.advanceToNextPlayer(auctionId, null, null);

    if (auction.settings.autoAdvance) {
      this.scheduleNextPlayerAfterSettling(auctionId);
    }
  }

  async advanceToNextManually(auctionId: string): Promise<void> {
    const auction = await this.requireAuction(auctionId);
    if (auction.currentPlayer) {
      throw ApiError.badRequest('Finalize or skip the current player before advancing');
    }
    await this.selectNextPlayer(auctionId);
  }

  async completeAuction(auctionId: string): Promise<void> {
    this.clearPendingTimeout(auctionId);
    this.roundStartQueueSize.delete(auctionId);
    await this.auctionRepository.setStatus(auctionId, AuctionStatus.COMPLETED);
    eventBus.emit('auction.completed', { auctionId });
  }

  /**
   * Admin-triggered continuation: moves everyone unsold in the round just
   * finished back into the queue as a fresh round, per the confirmed design
   * (rounds never auto-start — the admin explicitly calls this).
   */
  async startNextRound(auctionId: string, actorId: string): Promise<void> {
    const auction = await this.requireAuction(auctionId);

    if (auction.playerState !== AuctionPlayerState.AWAITING_NEXT_ROUND) {
      throw ApiError.badRequest('No round is awaiting confirmation to start');
    }
    if (auction.unsoldThisRound.length === 0) {
      throw ApiError.badRequest('No unsold players to carry into the next round');
    }

    const unsoldPlayerIds = auction.unsoldThisRound.map((id) => id.toString());

    // Back to PENDING so they're biddable again — they're currently UNSOLD
    // from the round that just ended.
    await this.playerRepository.bulkUpdateAuctionStatus(unsoldPlayerIds, PlayerAuctionStatus.PENDING);

    const updated = await this.auctionRepository.startNextRound(auctionId);
    if (!updated) {
      throw ApiError.internal('Failed to start next round');
    }

    this.roundStartQueueSize.set(auctionId, updated.playerQueue.length);

    await this.auditLogRepository.record({
      actor: actorId,
      action: 'auction.roundStarted',
      entityType: 'Auction',
      entityId: auctionId,
      after: { round: updated.round, playerCount: updated.playerQueue.length },
    });

    eventBus.emit('auction.roundStarted', { auctionId, round: updated.round });

    await this.selectNextPlayer(auctionId);
  }

  private async handleQueueExhausted(auctionId: string, auction: IAuction): Promise<void> {
    if (auction.unsoldThisRound.length === 0) {
      // Every player in this round was sold (or the auction never had any
      // unsold carryover) — genuinely done.
      await this.completeAuction(auctionId);
      return;
    }

    const roundSize = this.roundStartQueueSize.get(auctionId) ?? 0;
    if (auction.unsoldThisRound.length >= roundSize) {
      // The entire round sold nobody — further rounds would just repeat the
      // same outcome forever, so stop rather than loop indefinitely.
      logger.info('Round sold nobody — stopping auction instead of offering another round', {
        auctionId,
        round: auction.round,
        unsoldCount: auction.unsoldThisRound.length,
      });
      await this.completeAuction(auctionId);
      return;
    }

    this.clearPendingTimeout(auctionId);
    await this.auctionRepository.setPlayerState(auctionId, AuctionPlayerState.AWAITING_NEXT_ROUND);

    eventBus.emit('auction.awaitingNextRound', {
      auctionId,
      round: auction.round,
      unsoldCount: auction.unsoldThisRound.length,
    });
  }

  private async settleUnsold(auctionId: string, playerId: string): Promise<void> {
    await this.playerRepository.markUnsold(playerId);
    await this.auctionRepository.addUnsoldThisRound(auctionId, playerId);
    const player = await this.playerRepository.findById(playerId);
    if (player) {
      eventBus.emit('player.unsold', { auctionId, player });
    }
  }

  private getNextValidBidAmount(auction: IAuction, player: IPlayer): number {
    if (auction.currentBid?.amount == null) {
      return player.basePrice;
    }
    return auction.currentBid.amount + this.getIncrement(auction.bidIncrementRules, auction.currentBid.amount);
  }

  private getIncrement(rules: Array<{ upTo: number; increment: number }>, amount: number): number {
    const sorted = [...rules].sort((a, b) => a.upTo - b.upTo);
    const rule = sorted.find((r) => amount < r.upTo);
    return rule ? rule.increment : (sorted[sorted.length - 1]?.increment ?? 1);
  }

  private scheduleSelectionTimeout(auctionId: string, playerId: string): void {
    this.clearPendingTimeout(auctionId);
    const timeout = setTimeout(() => {
      this.beginBidding(auctionId, playerId).catch((err) =>
        logger.error('Failed to begin bidding after selection', { auctionId, playerId, err }),
      );
    }, SELECTION_ANIMATION_MS);
    this.pendingTimeouts.set(auctionId, timeout);
  }

  private scheduleNextPlayerAfterSettling(auctionId: string): void {
    this.clearPendingTimeout(auctionId);
    const timeout = setTimeout(() => {
      this.selectNextPlayer(auctionId).catch((err) =>
        logger.error('Failed to select next player after settling', { auctionId, err }),
      );
    }, SETTLING_DELAY_MS);
    this.pendingTimeouts.set(auctionId, timeout);
  }

  private async beginBidding(auctionId: string, playerId: string): Promise<void> {
    const auction = await this.auctionRepository.findById(auctionId);
    if (!auction || auction.status !== AuctionStatus.LIVE) return;
    if (!auction.currentPlayer || auction.currentPlayer.toString() !== playerId) return;

    await this.auctionRepository.setPlayerState(auctionId, AuctionPlayerState.IN_BIDDING);
  }

  private clearPendingTimeout(auctionId: string): void {
    const timeout = this.pendingTimeouts.get(auctionId);
    if (timeout) clearTimeout(timeout);
    this.pendingTimeouts.delete(auctionId);
  }

  /**
   * Clears every in-memory timer this service holds, regardless of auction
   * ID — used by a full session reset, where the underlying Auction
   * documents are about to be deleted out from under any scheduled
   * callbacks (which would otherwise fire against now-nonexistent auctions).
   */
  clearAllInMemoryState(): void {
    for (const timeout of this.pendingTimeouts.values()) {
      clearTimeout(timeout);
    }
    this.pendingTimeouts.clear();
    this.roundStartQueueSize.clear();
  }

  private async requireAuction(auctionId: string): Promise<IAuction> {
    const auction = await this.auctionRepository.findById(auctionId);
    if (!auction) {
      throw ApiError.notFound('Auction not found');
    }
    return auction;
  }
}
