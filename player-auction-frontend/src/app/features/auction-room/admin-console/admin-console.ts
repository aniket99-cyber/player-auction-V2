import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuctionStatus } from '../../../core/models';

@Component({
  selector: 'app-admin-console',
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './admin-console.html',
  styleUrl: './admin-console.scss',
})
export class AdminConsole {
  readonly status = input.required<AuctionStatus | null>();
  readonly isBiddingOpen = input.required<boolean>();
  readonly isAwaitingNextRound = input(false);
  readonly round = input(1);
  readonly unsoldCount = input(0);

  readonly start = output<void>();
  readonly pause = output<void>();
  readonly resume = output<void>();
  readonly skip = output<void>();
  readonly startNextRound = output<void>();
}
