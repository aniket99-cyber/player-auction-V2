import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuctionService } from '../services/auction.service';
import { Auction } from '../../../core/models';

@Component({
  selector: 'app-auction-list',
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './auction-list.html',
  styleUrl: './auction-list.scss',
})
export class AuctionList implements OnInit {
  private readonly auctionService = inject(AuctionService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  readonly auctions = signal<Auction[]>([]);
  readonly isLoading = signal(true);

  ngOnInit(): void {
    this.fetch();
  }

  create(): void {
    this.router.navigate(['/auctions/new']);
  }

  openConsole(auction: Auction): void {
    this.router.navigate(['/auction-room', auction.id]);
  }

  copyViewerLink(auction: Auction): void {
    const url = `${window.location.origin}/watch/${auction.id}`;
    navigator.clipboard.writeText(url).then(() => {
      this.snackBar.open('Viewer link copied', 'Close', { duration: 3000 });
    });
  }

  private fetch(): void {
    this.isLoading.set(true);
    this.auctionService.list().subscribe((result) => {
      this.auctions.set(result.data);
      this.isLoading.set(false);
    });
  }
}
