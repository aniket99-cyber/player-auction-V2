import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../../core/services/auth.service';
import { AuctionRoomService } from '../services/auction-room.service';
import { AuctionRoomStore } from '../services/auction-room.store';
import { PlayerService } from '../../players/services/player.service';
import { TeamService } from '../../teams/services/team.service';
import { AuctionPlayerState, AuctionStatus, UserRole } from '../../../core/models';
import { PlayerStage } from '../player-stage/player-stage';
import { CountdownRing } from '../bid-panel/countdown-ring';
import { BidCounter } from '../bid-panel/bid-counter';
import { AdminConsole } from '../admin-console/admin-console';
import { TeamStrip } from '../team-strip/team-strip';
import { FinalizeDialog, FinalizeDialogResult } from '../finalize-dialog/finalize-dialog';

@Component({
  selector: 'app-auction-room',
  imports: [PlayerStage, CountdownRing, BidCounter, AdminConsole, TeamStrip],
  templateUrl: './auction-room.html',
  styleUrl: './auction-room.scss',
})
export class AuctionRoom implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);
  private readonly auctionRoomService = inject(AuctionRoomService);
  private readonly playerService = inject(PlayerService);
  private readonly teamService = inject(TeamService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);

  readonly store = inject(AuctionRoomStore);

  readonly connected = this.auctionRoomService.isConnected();
  readonly currentUser = this.authService.currentUser;
  readonly isAdmin = computed(() => this.currentUser()?.role === UserRole.ADMIN);
  readonly soldFlash = signal(false);

  private auctionId: string | null = null;

  ngOnInit(): void {
    const auctionId = this.route.snapshot.paramMap.get('auctionId');
    if (!auctionId) return;

    this.auctionId = auctionId;
    this.loadInitialState(auctionId);

    this.auctionRoomService.connectRealtime();
    this.auctionRoomService.join(auctionId);
    this.subscribeToRealtimeEvents();

    this.destroyRef.onDestroy(() => {
      this.auctionRoomService.leave(auctionId);
      this.auctionRoomService.disconnectRealtime();
      this.store.reset();
    });
  }

  bumpBid(): void {
    if (!this.auctionId) return;
    this.auctionRoomService.bumpBid(this.auctionId);
  }

  start(): void {
    this.auctionId && this.auctionRoomService.start(this.auctionId).subscribe();
  }

  pause(): void {
    this.auctionId && this.auctionRoomService.pause(this.auctionId).subscribe();
  }

  resume(): void {
    this.auctionId && this.auctionRoomService.resume(this.auctionId).subscribe();
  }

  skip(): void {
    this.auctionId && this.auctionRoomService.skip(this.auctionId).subscribe();
  }

  undoBid(): void {
    if (!this.auctionId) return;
    this.auctionRoomService.undoBid(this.auctionId);
  }

  /** Opens the team-picker; the confirmed decision goes to confirmSale(). */
  finalize(): void {
    if (!this.auctionId) return;
    this.auctionRoomService.finalize(this.auctionId).subscribe(() => this.openFinalizeDialog());
  }

  startNextRound(): void {
    this.auctionId && this.auctionRoomService.startNextRound(this.auctionId).subscribe();
  }

  private openFinalizeDialog(): void {
    const player = this.store.currentPlayer();
    if (!player || !this.auctionId) return;

    const auctionId = this.auctionId;
    this.dialog
      .open<FinalizeDialog, unknown, FinalizeDialogResult>(FinalizeDialog, {
        data: {
          player,
          currentBid: this.store.currentBid(),
          teams: this.store.teams(),
        },
        width: '480px',
      })
      .afterClosed()
      .subscribe((result) => {
        if (!result) return;
        this.auctionRoomService.confirmSale(auctionId, result.teamId).subscribe();
      });
  }

  private loadInitialState(auctionId: string): void {
    this.auctionRoomService
      .getById(auctionId)
      .pipe(
        switchMap((auction) =>
          forkJoin({
            auction: of(auction),
            currentPlayer: auction.currentPlayer
              ? this.playerService.getById(auction.currentPlayer)
              : of(null),
            teams:
              auction.participatingTeams.length > 0
                ? this.teamService.getByIds(auction.participatingTeams)
                : of({ data: [], total: 0, page: 1, limit: 0, totalPages: 1 }),
          }),
        ),
      )
      .subscribe(({ auction, currentPlayer, teams }) => {
        this.store.loadFromAuction(auction, currentPlayer, teams.data);
        if (auction.playerState === AuctionPlayerState.SELECTING) {
          this.store.isRevealing.set(true);
        }
      });
  }

  private subscribeToRealtimeEvents(): void {
    this.auctionRoomService
      .onPlayerSelected()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ player }) => this.store.setPlayerSelected(player));

    this.auctionRoomService
      .onBidBumped()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ amount }) => this.store.applyBidBumped(amount));

    this.auctionRoomService
      .onBidRejected()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ message }) => {
        this.store.applyBidRejected(message);
        this.snackBar.open(message, 'Close', { duration: 4000 });
      });

    this.auctionRoomService
      .onBidUndone()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ amount }) => this.store.applyBidUndone(amount));

    this.auctionRoomService
      .onEnteredFinalizing()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.store.applyEnteredFinalizing();
        if (this.isAdmin()) this.openFinalizeDialog();
      });

    this.auctionRoomService
      .onTimerTick()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ secondsRemaining }) => this.store.applyTimerTick(secondsRemaining));

    this.auctionRoomService
      .onTeamBudgetUpdated()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ teamId, remainingBudget }) =>
        this.store.applyTeamBudgetUpdated(teamId, remainingBudget),
      );

    this.auctionRoomService
      .onPlayerSold()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.flashSold());

    this.auctionRoomService
      .onPlayerUnsold()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.store.applyPlayerSettled());

    this.auctionRoomService
      .onPlayerSkipped()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.store.applyPlayerSettled());

    this.auctionRoomService
      .onAuctionStarted()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.store.setStatus(AuctionStatus.LIVE));

    this.auctionRoomService
      .onAuctionPaused()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.store.setStatus(AuctionStatus.PAUSED));

    this.auctionRoomService
      .onAuctionResumed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.store.setStatus(AuctionStatus.LIVE));

    this.auctionRoomService
      .onAuctionCompleted()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.store.setStatus(AuctionStatus.COMPLETED));

    this.auctionRoomService
      .onAwaitingNextRound()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ round, unsoldCount }) => this.store.applyAwaitingNextRound(round, unsoldCount));

    this.auctionRoomService
      .onRoundStarted()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ round }) => this.store.applyRoundStarted(round));
  }

  private flashSold(): void {
    this.soldFlash.set(true);
    setTimeout(() => {
      this.soldFlash.set(false);
      this.store.applyPlayerSettled();
    }, 1500);
  }

  onRevealSettled(): void {
    this.store.settleReveal();
  }
}
