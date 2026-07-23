import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { SocketService } from '../../../core/services/socket.service';
import { AuthService } from '../../../core/services/auth.service';
import { Auction, Player } from '../../../core/models';

export const AUCTION_NAMESPACE = '/auction';

export interface PlayerSelectedPayload {
  player: Player;
  selectionMode: string;
}

export interface PlayerSoldPayload {
  player: Player;
  teamId: string;
  finalPrice: number;
}

export interface EnteredFinalizingPayload {
  currentBid: { amount: number } | null;
}

export interface TeamBudgetUpdatedPayload {
  teamId: string;
  remainingBudget: number;
}

export interface BidRejectedPayload {
  message: string;
}

@Injectable({ providedIn: 'root' })
export class AuctionRoomService {
  private readonly api = inject(ApiService);
  private readonly socketService = inject(SocketService);
  private readonly authService = inject(AuthService);

  getById(auctionId: string): Observable<Auction> {
    return this.api.get<Auction>(`/auctions/${auctionId}`);
  }

  start(auctionId: string): Observable<void> {
    return this.api.post<void>(`/auctions/${auctionId}/start`, {});
  }

  pause(auctionId: string): Observable<void> {
    return this.api.post<void>(`/auctions/${auctionId}/pause`, {});
  }

  resume(auctionId: string): Observable<void> {
    return this.api.post<void>(`/auctions/${auctionId}/resume`, {});
  }

  skip(auctionId: string): Observable<void> {
    return this.api.post<void>(`/auctions/${auctionId}/skip`, {});
  }

  /** Stops the timer and opens the team-picker — does not decide sold/unsold by itself. */
  finalize(auctionId: string): Observable<void> {
    return this.api.post<void>(`/auctions/${auctionId}/finalize`, {});
  }

  /** The actual decision: sell to `teamId`, or pass `null` to mark unsold. */
  confirmSale(auctionId: string, teamId: string | null): Observable<void> {
    return this.api.post<void>(`/auctions/${auctionId}/confirm-sale`, { teamId });
  }

  startNextRound(auctionId: string): Observable<void> {
    return this.api.post<void>(`/auctions/${auctionId}/start-next-round`, {});
  }

  connectRealtime(): void {
    // Token is optional here — the /auction namespace admits anonymous
    // read-only connections for the public Live Viewer. An authenticated
    // caller still gets their token attached so admin bid actions work.
    const token = this.authService.getAccessToken() ?? undefined;
    this.socketService.connect(AUCTION_NAMESPACE, token);
  }

  disconnectRealtime(): void {
    this.socketService.disconnect(AUCTION_NAMESPACE);
  }

  join(auctionId: string): void {
    this.socketService.emit(AUCTION_NAMESPACE, 'auction:join', auctionId);
  }

  leave(auctionId: string): void {
    this.socketService.emit(AUCTION_NAMESPACE, 'auction:leave', auctionId);
  }

  /** Admin-only: bumps the running bid counter by one tier increment. */
  bumpBid(auctionId: string): void {
    this.socketService.emit(AUCTION_NAMESPACE, 'bid:bump', auctionId);
  }

  undoBid(auctionId: string): void {
    this.socketService.emit(AUCTION_NAMESPACE, 'bid:undo', auctionId);
  }

  isConnected() {
    return this.socketService.isConnected(AUCTION_NAMESPACE);
  }

  onBidBumped(): Observable<{ amount: number }> {
    return this.socketService.on<{ amount: number }>(AUCTION_NAMESPACE, 'bid:bumped');
  }

  onBidRejected(): Observable<BidRejectedPayload> {
    return this.socketService.on<BidRejectedPayload>(AUCTION_NAMESPACE, 'bid:rejected');
  }

  onBidUndone(): Observable<{ amount: number | null }> {
    return this.socketService.on<{ amount: number | null }>(AUCTION_NAMESPACE, 'bid:undone');
  }

  onEnteredFinalizing(): Observable<EnteredFinalizingPayload> {
    return this.socketService.on<EnteredFinalizingPayload>(AUCTION_NAMESPACE, 'auction:enteredFinalizing');
  }

  onPlayerSelected(): Observable<PlayerSelectedPayload> {
    return this.socketService.on<PlayerSelectedPayload>(AUCTION_NAMESPACE, 'auction:playerSelected');
  }

  onTimerTick(): Observable<{ secondsRemaining: number }> {
    return this.socketService.on<{ secondsRemaining: number }>(AUCTION_NAMESPACE, 'auction:timerTick');
  }

  onPlayerSold(): Observable<PlayerSoldPayload> {
    return this.socketService.on<PlayerSoldPayload>(AUCTION_NAMESPACE, 'player:sold');
  }

  onPlayerUnsold(): Observable<{ player: Player }> {
    return this.socketService.on<{ player: Player }>(AUCTION_NAMESPACE, 'player:unsold');
  }

  onPlayerSkipped(): Observable<{ player: Player }> {
    return this.socketService.on<{ player: Player }>(AUCTION_NAMESPACE, 'player:skipped');
  }

  onTeamBudgetUpdated(): Observable<TeamBudgetUpdatedPayload> {
    return this.socketService.on<TeamBudgetUpdatedPayload>(AUCTION_NAMESPACE, 'auction:teamBudgetUpdated');
  }

  onAuctionStarted(): Observable<void> {
    return this.socketService.on<void>(AUCTION_NAMESPACE, 'auction:started');
  }

  onAuctionPaused(): Observable<void> {
    return this.socketService.on<void>(AUCTION_NAMESPACE, 'auction:paused');
  }

  onAuctionResumed(): Observable<void> {
    return this.socketService.on<void>(AUCTION_NAMESPACE, 'auction:resumed');
  }

  onAuctionCompleted(): Observable<void> {
    return this.socketService.on<void>(AUCTION_NAMESPACE, 'auction:completed');
  }

  onAwaitingNextRound(): Observable<{ round: number; unsoldCount: number }> {
    return this.socketService.on<{ round: number; unsoldCount: number }>(
      AUCTION_NAMESPACE,
      'auction:awaitingNextRound',
    );
  }

  onRoundStarted(): Observable<{ round: number }> {
    return this.socketService.on<{ round: number }>(AUCTION_NAMESPACE, 'auction:roundStarted');
  }
}
