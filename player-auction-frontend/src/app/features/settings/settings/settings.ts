import { Component, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ResetSessionDialog } from '../reset-session-dialog/reset-session-dialog';
import { SessionResetSummary } from '../services/admin.service';

@Component({
  selector: 'app-settings',
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
})
export class Settings {
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  openResetDialog(): void {
    this.dialog
      .open<ResetSessionDialog, unknown, SessionResetSummary | undefined>(ResetSessionDialog, {
        width: '480px',
      })
      .afterClosed()
      .subscribe((summary) => {
        if (!summary) return;
        const total = summary.auctions + summary.teams + summary.players + summary.owners + summary.captains;
        this.snackBar.open(`Session reset — ${total} records cleared`, 'Close', { duration: 5000 });
      });
  }
}
