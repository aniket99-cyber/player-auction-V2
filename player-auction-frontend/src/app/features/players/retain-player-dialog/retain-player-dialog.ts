import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { TeamService } from '../../teams/services/team.service';
import { Player, Team } from '../../../core/models';

export interface RetainPlayerDialogData {
  player: Player;
}

@Component({
  selector: 'app-retain-player-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
  ],
  templateUrl: './retain-player-dialog.html',
  styleUrl: './retain-player-dialog.scss',
})
export class RetainPlayerDialog implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly teamService = inject(TeamService);
  private readonly dialogRef = inject(MatDialogRef<RetainPlayerDialog, Team | undefined>);
  readonly data = inject<RetainPlayerDialogData>(MAT_DIALOG_DATA);

  readonly teams = signal<Team[]>([]);
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    team: ['', Validators.required],
    retentionPrice: [this.data.player.basePrice, [Validators.required, Validators.min(0)]],
    retentionOrder: [1, [Validators.required, Validators.min(1)]],
  });

  ngOnInit(): void {
    this.teamService.list({ page: 1, limit: 100 }).subscribe((result) => this.teams.set(result.data));
  }

  submit(): void {
    if (this.form.invalid || this.isSubmitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);
    const value = this.form.getRawValue();

    this.teamService
      .addRetention(value.team, {
        playerId: this.data.player.id,
        retentionPrice: Number(value.retentionPrice),
        retentionOrder: Number(value.retentionOrder),
      })
      .subscribe({
        next: (team) => {
          this.isSubmitting.set(false);
          this.dialogRef.close(team);
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.errorMessage.set(
            err.error?.message ?? 'Failed to retain player — check the team has enough budget.',
          );
        },
      });
  }

  cancel(): void {
    this.dialogRef.close(undefined);
  }
}
