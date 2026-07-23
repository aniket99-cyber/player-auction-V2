import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TeamService } from '../services/team.service';
import { AdminService } from '../../settings/services/admin.service';
import { Team } from '../../../core/models';

@Component({
  selector: 'app-team-form',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './team-form.html',
  styleUrl: './team-form.scss',
})
export class TeamForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly teamService = inject(TeamService);
  private readonly adminService = inject(AdminService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  readonly isEditMode = signal(false);
  readonly isSubmitting = signal(false);
  readonly teamId = signal<string | null>(null);
  readonly logoPreviewUrl = signal<string | null>(null);
  private pendingLogoFile: File | null = null;

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    shortName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(5)]],
    season: ['', Validators.required],
    totalBudget: [0, [Validators.required, Validators.min(0)]],
    primaryColor: ['#2fd0ff', Validators.required],
    secondaryColor: ['#0b0e14', Validators.required],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
      this.teamId.set(id);
      this.teamService.getById(id).subscribe((team) => this.patchForm(team));
    } else {
      this.adminService
        .getSettings()
        .subscribe((settings) => this.form.patchValue({ totalBudget: settings.defaultTeamBudget }));
    }
  }

  onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.pendingLogoFile = file;
    const reader = new FileReader();
    reader.onload = () => this.logoPreviewUrl.set(reader.result as string);
    reader.readAsDataURL(file);
  }

  submit(): void {
    if (this.form.invalid || this.isSubmitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    const value = this.form.getRawValue();

    const request$ = this.isEditMode()
      ? this.teamService.update(this.teamId()!, value)
      : this.teamService.create(value);

    request$.subscribe({
      next: (team) => this.handleSaved(team),
      error: () => this.isSubmitting.set(false),
    });
  }

  private handleSaved(team: Team): void {
    if (this.pendingLogoFile) {
      this.teamService.uploadLogo(team.id, this.pendingLogoFile).subscribe({
        next: () => this.finishSubmit(team.id),
        error: () => this.finishSubmit(team.id),
      });
    } else {
      this.finishSubmit(team.id);
    }
  }

  private finishSubmit(teamId: string): void {
    this.isSubmitting.set(false);
    this.snackBar.open(this.isEditMode() ? 'Team updated' : 'Team created', 'Close', { duration: 3000 });
    this.router.navigate(['/teams', teamId]);
  }

  private patchForm(team: Team): void {
    this.form.patchValue({
      name: team.name,
      shortName: team.shortName,
      season: team.season,
      totalBudget: team.totalBudget,
      primaryColor: team.primaryColor,
      secondaryColor: team.secondaryColor,
    });
    if (team.logoUrl) {
      this.logoPreviewUrl.set(team.logoUrl);
    }
  }
}
