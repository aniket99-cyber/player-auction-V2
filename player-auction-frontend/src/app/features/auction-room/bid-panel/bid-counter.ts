import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-bid-counter',
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './bid-counter.html',
  styleUrl: './bid-counter.scss',
})
export class BidCounter {
  readonly isAdmin = input.required<boolean>();
  readonly nextValidBidAmount = input.required<number>();
  readonly isBiddingOpen = input.required<boolean>();
  readonly hasCurrentBid = input.required<boolean>();
  readonly rejectionMessage = input<string | null>(null);

  readonly bumpBid = output<void>();
  readonly undoBid = output<void>();
  readonly finalize = output<void>();
}
