import { Component, DestroyRef, ElementRef, OnInit, inject, signal, viewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import gsap from 'gsap';
import { AuctionService } from '../../auctions/services/auction.service';
import { AuctionRoomService } from '../../auction-room/services/auction-room.service';
import { AuctionRoomStore } from '../../auction-room/services/auction-room.store';
import { LiveViewerStore } from '../services/live-viewer.store';
import { PlayerService } from '../../players/services/player.service';
import { TeamService } from '../../teams/services/team.service';
import { AdminService } from '../../settings/services/admin.service';
import { PlayerAuctionStatus } from '../../../core/models';
import { PlayerStage } from '../../auction-room/player-stage/player-stage';
import { Leaderboard } from '../leaderboard/leaderboard';
import { AuctionProgress } from '../auction-progress/auction-progress';
import { LatestActivity } from '../latest-activity/latest-activity';
import { TeamsPanel } from '../teams-panel/teams-panel';
import { Statistics } from '../statistics/statistics';

interface LiveAnnouncement {
  title: string;
  body: string;
  playerImage?: string;
  teamLogo?: string;
  teamName: string;
  outcome: 'SOLD' | 'UNSOLD';
}

@Component({
  selector: 'app-live-viewer',
  imports: [PlayerStage, Leaderboard, AuctionProgress, LatestActivity, TeamsPanel, Statistics],
  templateUrl: './live-viewer.html',
  styleUrl: './live-viewer.scss',
})
export class LiveViewer implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly auctionService = inject(AuctionService);
  private readonly auctionRoomService = inject(AuctionRoomService);
  private readonly playerService = inject(PlayerService);
  private readonly teamService = inject(TeamService);
  private readonly adminService = inject(AdminService);
  private readonly destroyRef = inject(DestroyRef);

  readonly store = inject(AuctionRoomStore);
  readonly viewerStore = inject(LiveViewerStore);
  readonly connected = this.auctionRoomService.isConnected();
  readonly highlightedTeamId = signal<string | null>(null);
  readonly announcement = signal<LiveAnnouncement | null>(null);

  readonly hasActiveAuction = signal(false);
  readonly isLoading = signal(true);

  private readonly rootRef = viewChild<ElementRef<HTMLElement>>('root');

  private currentAuctionId: string | null = null;
  private announcementTimer: ReturnType<typeof window.setTimeout> | null = null;

  ngOnInit(): void {
    this.auctionRoomService.connectRealtime();
    this.subscribeToActiveRoomChanges();

    const paramAuctionId = this.route.snapshot.paramMap.get('auctionId');
    if (paramAuctionId) {
      this.hasActiveAuction.set(true);
      this.connectToAuction(paramAuctionId);
    } else {
      this.fetchActiveAuction();
    }

    this.destroyRef.onDestroy(() => {
      if (this.announcementTimer) {
        clearTimeout(this.announcementTimer);
        this.announcementTimer = null;
      }
      this.announcement.set(null);
      if (this.currentAuctionId) {
        this.auctionRoomService.leave(this.currentAuctionId);
      }
      this.auctionRoomService.disconnectRealtime();
      this.store.reset();
      this.viewerStore.reset();
    });
  }

  private fetchActiveAuction(): void {
    this.isLoading.set(true);
    this.auctionService.getActive().subscribe({
      next: (activeAuction) => {
        if (activeAuction && activeAuction.id) {
          this.hasActiveAuction.set(true);
          this.connectToAuction(activeAuction.id);
        } else {
          this.hasActiveAuction.set(false);
          this.isLoading.set(false);
        }
      },
      error: () => {
        this.hasActiveAuction.set(false);
        this.isLoading.set(false);
      },
    });
  }

  private connectToAuction(auctionId: string): void {
    if (this.currentAuctionId && this.currentAuctionId !== auctionId) {
      this.auctionRoomService.leave(this.currentAuctionId);
      this.store.reset();
      this.viewerStore.reset();
    }

    this.currentAuctionId = auctionId;
    this.loadInitialState(auctionId);
    this.auctionRoomService.join(auctionId);
    this.subscribeToRealtimeEvents();
  }

  private subscribeToActiveRoomChanges(): void {
    this.auctionRoomService
      .onActiveAuctionChanged()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ activeAuctionId }) => {
        if (activeAuctionId) {
          this.hasActiveAuction.set(true);
          this.connectToAuction(activeAuctionId);
        } else {
          if (this.currentAuctionId) {
            this.auctionRoomService.leave(this.currentAuctionId);
            this.currentAuctionId = null;
          }
          this.store.reset();
          this.viewerStore.reset();
          this.hasActiveAuction.set(false);
          this.isLoading.set(false);
        }
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
            settings: this.adminService.getSettings(),
          }),
        ),
      )
      .subscribe({
        next: ({ auction, currentPlayer, teams, settings }) => {
          this.store.loadFromAuction(auction, currentPlayer, teams.data, settings.requiredPlayersPerTeam);
          this.viewerStore.setRemainingInPool(auction.playerQueue.length);

          const allPlayerIds = [
            ...new Set([
              ...auction.playerQueue,
              ...auction.unsoldThisRound,
              ...(auction.currentPlayer ? [auction.currentPlayer] : []),
              ...teams.data.flatMap((t) => t.players),
              ...teams.data.flatMap((t) => t.retentions.map((entry) => entry.player)),
            ]),
          ];

          if (allPlayerIds.length > 0) {
            this.playerService.getByIds(allPlayerIds).subscribe((result) => {
              this.viewerStore.setRoster(result.data);
              this.viewerStore.setAuctionTotals(result.data);
            });
          }

          this.isLoading.set(false);
          this.playEntranceAnimation();
        },
        error: () => {
          this.isLoading.set(false);
        },
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
      .onTeamBudgetUpdated()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ teamId, remainingBudget }) =>
        this.store.applyTeamBudgetUpdated(teamId, remainingBudget),
      );

    this.auctionRoomService
      .onPlayerSold()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ player, teamId, finalPrice }) => {
        const soldPlayer = {
          ...player,
          soldTo: teamId,
          soldPrice: finalPrice,
          auctionStatus: PlayerAuctionStatus.SOLD,
        };
        this.viewerStore.recordSold(soldPlayer, teamId, finalPrice);
        this.viewerStore.upsertRosterPlayer(soldPlayer);
        this.store.addPlayerToTeam(teamId, player.id);
        this.highlightedTeamId.set(teamId);
        const team = this.store.teams().find((entry) => entry.id === teamId);
        this.showAnnouncement({
          title: player.name,
          body: `${player.name} is sold to ${team?.name ?? 'the selected team'} at ${finalPrice}`,
          playerImage: player.imageUrl,
          teamLogo: team?.logoUrl,
          teamName: team?.name ?? 'Selected Team',
          outcome: 'SOLD',
        });
        this.playSoldAnimation(teamId);
        setTimeout(() => {
          this.store.applyPlayerSettled();
          this.highlightedTeamId.set(null);
        }, 1500);
      });

    this.auctionRoomService
      .onPlayerUnsold()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ player }) => {
        this.viewerStore.recordUnsold(player);
        this.showAnnouncement({
          title: player.name,
          body: `${player.name} remains unsold in this round.`,
          playerImage: player.imageUrl,
          teamName: 'No Team',
          outcome: 'UNSOLD',
        });
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

  private showAnnouncement(announcement: LiveAnnouncement): void {
    if (this.announcementTimer) {
      clearTimeout(this.announcementTimer);
      this.announcementTimer = null;
    }

    this.announcement.set(announcement);
    this.playAnnouncementAnimation();
    this.announcementTimer = window.setTimeout(() => {
      this.announcement.set(null);
      this.announcementTimer = null;
    }, 2800);
  }

  private playAnnouncementAnimation(): void {
    const root = this.rootRef()?.nativeElement;
    if (!root) return;

    const panel = root.querySelector('.live-viewer__announcement');
    const playerMedia = root.querySelector('.live-viewer__announcement-player');
    const teamBadge = root.querySelector('.live-viewer__announcement-team');

    if (!panel) return;

    gsap.fromTo(
      panel,
      { x: -260, opacity: 0, scale: 0.95 },
      { x: 0, opacity: 1, scale: 1, duration: 0.7, ease: 'back.out(1.4)' },
    );

    if (playerMedia) {
      gsap.fromTo(
        playerMedia,
        { x: -70, opacity: 0, scale: 0.9 },
        { x: 0, opacity: 1, scale: 1, duration: 0.6, ease: 'power3.out' },
      );
    }

    if (teamBadge) {
      gsap.fromTo(
        teamBadge,
        { x: 70, opacity: 0, scale: 0.88 },
        { x: 0, opacity: 1, scale: 1, duration: 0.6, ease: 'back.out(1.3)' },
      );
    }
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

  private playSoldAnimation(teamId: string): void {
    const root = this.rootRef()?.nativeElement;
    if (!root) return;

    const playerCard = root.querySelector('.player-card');
    const teamCard = root.querySelector(`.team-field-card--active`);

    if (playerCard) {
      gsap.fromTo(
        playerCard,
        { scale: 1, opacity: 1 },
        { scale: 1.05, opacity: 0.92, duration: 0.3, yoyo: true, repeat: 1, ease: 'power1.inOut' },
      );
    }

    if (teamCard) {
      gsap.fromTo(
        teamCard,
        { boxShadow: '0 0 0 rgba(255,255,255,0)', y: 0 },
        { boxShadow: '0 0 28px rgba(92, 201, 255, 0.35)', y: -4, duration: 0.45, ease: 'power2.out' },
      );
    }
  }
}
