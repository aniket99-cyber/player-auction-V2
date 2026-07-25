import { Component, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { Player, Team } from '../../../core/models';

export interface FinalizeDialogData {
  player: Player;
  currentBid: { amount: number } | null;
  teams: Team[];
  requiredPlayersPerTeam: number;
}

export interface FinalizeDialogResult {
  teamId: string | null;
}

@Component({
  selector: 'app-finalize-dialog',
  imports: [MatDialogModule, MatButtonModule, MatIconModule, MatRadioModule],
  templateUrl: './finalize-dialog.html',
  styleUrl: './finalize-dialog.scss',
})
export class FinalizeDialog {
  private readonly dialogRef = inject(MatDialogRef<FinalizeDialog, FinalizeDialogResult>);
  readonly data = inject<FinalizeDialogData>(MAT_DIALOG_DATA);

  readonly selectedTeamId = signal<string | null>(null);

  canAfford(team: Team): boolean {
    const amount = this.data.currentBid?.amount ?? 0;
    const hasRoom = team.players.length < this.data.requiredPlayersPerTeam;
    return hasRoom && team.remainingBudget >= amount;
  }

  selectTeam(teamId: string): void {
    this.selectedTeamId.set(teamId);
  }

  confirmSale(): void {
    const teamId = this.selectedTeamId();
    if (!teamId) return;
    this.dialogRef.close({ teamId });
  }

  markUnsold(): void {
    this.dialogRef.close({ teamId: null });
  }

  cancel(): void {
    this.dialogRef.close(undefined);
  }
}
