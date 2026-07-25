import { Component, computed, input } from '@angular/core';
import { Player, PlayerAuctionStatus, Team } from '../../../core/models';

@Component({
  selector: 'app-statistics',
  imports: [],
  templateUrl: './statistics.html',
  styleUrl: './statistics.scss',
})
export class Statistics {
  readonly teams = input.required<Team[]>();
  readonly roster = input.required<Player[]>();

  readonly unsoldPlayers = computed<Player[]>(() =>
    this.roster().filter((p) => p.auctionStatus === PlayerAuctionStatus.UNSOLD),
  );

  readonly pendingPlayers = computed<Player[]>(() =>
    this.roster().filter(
      (p) =>
        p.auctionStatus === PlayerAuctionStatus.PENDING ||
        (!p.auctionStatus && !p.soldTo && !p.isRetained),
    ),
  );
}
