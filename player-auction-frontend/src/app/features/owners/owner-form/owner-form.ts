import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { OwnerService } from '../services/owner.service';
import { TeamService } from '../../teams/services/team.service';
import { Owner, Team } from '../../../core/models';

@Component({
  selector: 'app-owner-form',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './owner-form.html',
  styleUrl: './owner-form.scss',
})
export class OwnerForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly ownerService = inject(OwnerService);
  private readonly teamService = inject(TeamService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  readonly isEditMode = signal(false);
  readonly isSubmitting = signal(false);
  readonly ownerId = signal<string | null>(null);
  readonly imagePreviewUrl = signal<string | null>(null);
  readonly teams = signal<Team[]>([]);
  private pendingImageFile: File | null = null;

  readonly form = this.fb.nonNullable.group({
    team: ['', Validators.required],
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
  });

  ngOnInit(): void {
    this.teamService.list({ page: 1, limit: 100 }).subscribe((result) => this.teams.set(result.data));

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
      this.ownerId.set(id);
      this.form.controls.team.disable();
      this.ownerService.getById(id).subscribe((owner) => this.patchForm(owner));
    }
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.pendingImageFile = file;
    const reader = new FileReader();
    reader.onload = () => this.imagePreviewUrl.set(reader.result as string);
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
      ? this.ownerService.update(this.ownerId()!, { name: value.name })
      : this.ownerService.create(value);

    request$.subscribe({
      next: (owner) => this.handleSaved(owner),
      error: () => this.isSubmitting.set(false),
    });
  }

  private handleSaved(owner: Owner): void {
    if (this.pendingImageFile) {
      this.ownerService.uploadImage(owner.id, this.pendingImageFile).subscribe({
        next: () => this.finishSubmit(),
        error: () => this.finishSubmit(),
      });
    } else {
      this.finishSubmit();
    }
  }

  private finishSubmit(): void {
    this.isSubmitting.set(false);
    this.snackBar.open(this.isEditMode() ? 'Owner updated' : 'Owner created', 'Close', { duration: 3000 });
    this.router.navigate(['/owners']);
  }

  private patchForm(owner: Owner): void {
    this.form.patchValue({ team: owner.team, name: owner.name });
    if (owner.imageUrl) {
      this.imagePreviewUrl.set(owner.imageUrl);
    }
  }
}
