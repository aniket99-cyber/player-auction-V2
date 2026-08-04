import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { AuctionService } from '../services/auction.service';
import { ConfirmDialog } from '../../../shared/components/confirm-dialog';
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
  private readonly dialog = inject(MatDialog);

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

  toggleActive(auction: Auction): void {
    if (auction.isActive) {
      this.auctionService.deactivate(auction.id).subscribe({
        next: () => {
          this.snackBar.open(`"${auction.name}" is now inactive`, 'Close', { duration: 3000 });
          this.fetch();
        },
        error: () => {
          this.snackBar.open('Failed to deactivate auction', 'Close', { duration: 3000 });
        },
      });
    } else {
      this.auctionService.activate(auction.id).subscribe({
        next: () => {
          this.snackBar.open(`"${auction.name}" is now ACTIVE for live view`, 'Close', { duration: 3000 });
          this.fetch();
        },
        error: () => {
          this.snackBar.open('Failed to activate auction', 'Close', { duration: 3000 });
        },
      });
    }
  }

  deleteAuction(auction: Auction): void {
    const dialogRef = this.dialog.open(ConfirmDialog, {
      data: {
        title: 'Delete auction room?',
        message: `Permanently delete "${auction.name}"? This cannot be undone.`,
        confirmLabel: 'Delete',
        isDestructive: true,
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.auctionService.delete(auction.id).subscribe({
        next: () => {
          this.snackBar.open(`"${auction.name}" deleted`, 'Close', { duration: 4000 });
          this.fetch();
        },
        error: (err) => {
          this.snackBar.open(err.error?.message || 'Failed to delete auction', 'Close', { duration: 4000 });
        },
      });
    });
  }

  copyViewerLink(): void {
    const url = `${window.location.origin}/live`;
    navigator.clipboard.writeText(url).then(() => {
      this.snackBar.open('Live Viewer link copied to clipboard', 'Close', { duration: 3000 });
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
