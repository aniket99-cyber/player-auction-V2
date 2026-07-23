import { Component, DestroyRef, ElementRef, OnInit, inject, viewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import gsap from 'gsap';
import { AuctionRoomService } from '../../auction-room/services/auction-room.service';
import { AuctionRoomStore } from '../../auction-room/services/auction-room.store';
import { LiveViewerStore } from '../services/live-viewer.store';
import { PlayerService } from '../../players/services/player.service';
import { TeamService } from '../../teams/services/team.service';
import { PlayerStage } from '../../auction-room/player-stage/player-stage';
import { CountdownRing } from '../../auction-room/bid-panel/countdown-ring';
import { Leaderboard } from '../leaderboard/leaderboard';
import { AuctionProgress } from '../auction-progress/auction-progress';
import { LatestActivity } from '../latest-activity/latest-activity';
import { TeamsPanel } from '../teams-panel/teams-panel';
import { Statistics } from '../statistics/statistics';

@Component({
  selector: 'app-live-viewer',
  imports: [
    PlayerStage,
    CountdownRing,
    Leaderboard,
    AuctionProgress,
    LatestActivity,
    TeamsPanel,
    Statistics,
  ],
  templateUrl: './live-viewer.html',
  styleUrl: './live-viewer.scss',
})
export class LiveViewer implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly auctionRoomService = inject(AuctionRoomService);
  private readonly playerService = inject(PlayerService);
  private readonly teamService = inject(TeamService);
  private readonly destroyRef = inject(DestroyRef);

  readonly store = inject(AuctionRoomStore);
  readonly viewerStore = inject(LiveViewerStore);
  readonly connected = this.auctionRoomService.isConnected();

  private readonly rootRef = viewChild<ElementRef<HTMLElement>>('root');

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
      this.viewerStore.reset();
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
        this.viewerStore.setRemainingInPool(auction.playerQueue.length);

        const allPlayerIds = teams.data.flatMap((t) => t.players);
        if (allPlayerIds.length > 0) {
          this.playerService.getByIds(allPlayerIds).subscribe((result) => {
            this.viewerStore.setRoster(result.data);
          });
        }

        this.playEntranceAnimation();
      });
  }

  private subscribeToRealtimeEvents(): void {
    this.auctionRoomService
      .onPlayerSelected()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ player }) => {
        this.store.setPlayerSelected(player);
        this.viewerStore.onPlayerDrawnFromPool();
      });

    this.auctionRoomService
      .onBidBumped()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ amount }) => this.store.applyBidBumped(amount));

    this.auctionRoomService
      .onBidUndone()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ amount }) => this.store.applyBidUndone(amount));

    this.auctionRoomService
      .onEnteredFinalizing()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.store.applyEnteredFinalizing());

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
      .subscribe(({ player, teamId, finalPrice }) => {
        this.viewerStore.recordSold(player, teamId, finalPrice);
        this.viewerStore.upsertRosterPlayer(player);
        this.store.addPlayerToTeam(teamId, player.id);
        setTimeout(() => this.store.applyPlayerSettled(), 1500);
      });

    this.auctionRoomService
      .onPlayerUnsold()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ player }) => {
        this.viewerStore.recordUnsold(player);
        this.store.applyPlayerSettled();
      });

    this.auctionRoomService
      .onPlayerSkipped()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.viewerStore.onPlayerRequeuedBySkip();
        this.store.applyPlayerSettled();
      });
  }

  private playEntranceAnimation(): void {
    const el = this.rootRef()?.nativeElement;
    if (!el) return;

    gsap.fromTo(
      el.querySelectorAll('.live-viewer__section'),
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: 'power2.out' },
    );
  }
}
