import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SocketService } from '../../../core/services/socket.service';
import { AuthService } from '../../../core/services/auth.service';
import { Bid } from '../../../core/models';

const AUCTION_NAMESPACE = '/auction';

@Component({
  selector: 'app-auction-room',
  imports: [],
  templateUrl: './auction-room.html',
  styleUrl: './auction-room.scss',
})
export class AuctionRoom implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly socketService = inject(SocketService);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  readonly connected = this.socketService.isConnected(AUCTION_NAMESPACE);
  readonly latestBid = signal<Bid | null>(null);

  ngOnInit(): void {
    const auctionId = this.route.snapshot.paramMap.get('auctionId');
    const token = this.authService.getAccessToken();

    if (!auctionId || !token) {
      return;
    }

    this.socketService.connect(AUCTION_NAMESPACE, token);
    this.socketService.emit(AUCTION_NAMESPACE, 'auction:join', auctionId);

    this.socketService
      .on<Bid>(AUCTION_NAMESPACE, 'bid:placed')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((bid) => this.latestBid.set(bid));

    this.destroyRef.onDestroy(() => {
      this.socketService.emit(AUCTION_NAMESPACE, 'auction:leave', auctionId);
    });
  }
}
