import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { AdminService, SessionResetSummary } from '../services/admin.service';

const CONFIRM_PHRASE = 'RESET';

@Component({
  selector: 'app-reset-session-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  templateUrl: './reset-session-dialog.html',
  styleUrl: './reset-session-dialog.scss',
})
export class ResetSessionDialog {
  private readonly fb = inject(FormBuilder);
  private readonly adminService = inject(AdminService);
  private readonly dialogRef = inject(MatDialogRef<ResetSessionDialog, SessionResetSummary | undefined>);

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

    this.adminService.resetSession().subscribe({
      next: (summary) => {
        this.isSubmitting.set(false);
        this.dialogRef.close(summary);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err.error?.message ?? 'Failed to reset the session');
      },
    });
  }

  cancel(): void {
    this.dialogRef.close(undefined);
  }
}
