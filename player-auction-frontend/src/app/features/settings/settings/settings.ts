import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ResetSessionDialog } from '../reset-session-dialog/reset-session-dialog';
import { AdminService, SessionResetSummary } from '../services/admin.service';

@Component({
  selector: 'app-settings',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
})
export class Settings implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly adminService = inject(AdminService);

  readonly isLoading = signal(true);
  readonly isSavingBudget = signal(false);
  readonly isSavingTiers = signal(false);

  readonly budgetForm = this.fb.nonNullable.group({
    defaultTeamBudget: [1000, [Validators.required, Validators.min(0)]],
  });

  readonly tiersForm = this.fb.nonNullable.group({
    tiers: this.fb.array<ReturnType<typeof this.createTierGroup>>([]),
  });

  get tiers() {
    return this.tiersForm.controls.tiers;
  }

  ngOnInit(): void {
    this.adminService.getSettings().subscribe((settings) => {
      this.budgetForm.patchValue({ defaultTeamBudget: settings.defaultTeamBudget });
      settings.defaultBidIncrementRules
        .sort((a, b) => a.upTo - b.upTo)
        .forEach((rule) => this.tiers.push(this.createTierGroup(rule.upTo, rule.increment)));
      this.isLoading.set(false);
    });
  }

  private createTierGroup(upTo = 0, increment = 1) {
    return this.fb.nonNullable.group({
      upTo: [upTo, [Validators.required, Validators.min(0)]],
      increment: [increment, [Validators.required, Validators.min(1)]],
    });
  }

  addTier(): void {
    const lastUpTo =
      this.tiers.length > 0 ? (this.tiers.at(this.tiers.length - 1).value.upTo ?? 0) : 0;
    this.tiers.push(this.createTierGroup(lastUpTo + 100, 5));
  }

  removeTier(index: number): void {
    if (this.tiers.length <= 1) return;
    this.tiers.removeAt(index);
  }

  saveBudget(): void {
    if (this.budgetForm.invalid || this.isSavingBudget()) {
      this.budgetForm.markAllAsTouched();
      return;
    }

    this.isSavingBudget.set(true);
    this.adminService
      .updateSettings({ defaultTeamBudget: this.budgetForm.getRawValue().defaultTeamBudget })
      .subscribe({
        next: () => {
          this.isSavingBudget.set(false);
          this.snackBar.open('Default team points saved', 'Close', { duration: 3000 });
        },
        error: () => this.isSavingBudget.set(false),
      });
  }

  saveTiers(): void {
    if (this.tiersForm.invalid || this.isSavingTiers()) {
      this.tiersForm.markAllAsTouched();
      return;
    }

    this.isSavingTiers.set(true);
    const rules = this.tiers.controls
      .map((group) => group.getRawValue())
      .sort((a, b) => a.upTo - b.upTo);

    this.adminService.updateSettings({ defaultBidIncrementRules: rules }).subscribe({
      next: () => {
        this.isSavingTiers.set(false);
        this.snackBar.open('Default bid intervals saved', 'Close', { duration: 3000 });
      },
      error: () => this.isSavingTiers.set(false),
    });
  }

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
