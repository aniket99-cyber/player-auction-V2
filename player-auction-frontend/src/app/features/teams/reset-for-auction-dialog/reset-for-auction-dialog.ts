import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { TeamService } from '../services/team.service';

const CONFIRM_PHRASE = 'RESET';

@Component({
  selector: 'app-reset-for-auction-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  templateUrl: './reset-for-auction-dialog.html',
  styleUrl: './reset-for-auction-dialog.scss',
})
export class ResetForAuctionDialog {
  private readonly fb = inject(FormBuilder);
  private readonly teamService = inject(TeamService);
  private readonly dialogRef = inject(MatDialogRef<ResetForAuctionDialog, { modifiedCount: number } | undefined>);

  readonly confirmPhrase = CONFIRM_PHRASE;
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    confirmation: ['', [Validators.required, this.matchesPhraseValidator]],
  });

  private matchesPhraseValidator(control: { value: string }): Record<string, boolean> | null {
    return control.value === CONFIRM_PHRASE ? null : { mismatch: true };
  }

  submit(): void {
    if (this.form.invalid || this.isSubmitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    this.teamService.resetForAuction().subscribe({
      next: (summary) => {
        this.isSubmitting.set(false);
        this.dialogRef.close(summary);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err.error?.message ?? 'Failed to reset teams for auction');
      },
    });
  }

  cancel(): void {
    this.dialogRef.close(undefined);
  }
}
