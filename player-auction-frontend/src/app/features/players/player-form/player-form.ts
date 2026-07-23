import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PlayerService } from '../services/player.service';
import { Player, PlayerRole } from '../../../core/models';

@Component({
  selector: 'app-player-form',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './player-form.html',
  styleUrl: './player-form.scss',
})
export class PlayerForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly playerService = inject(PlayerService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  readonly roleOptions = Object.values(PlayerRole);
  readonly isEditMode = signal(false);
  readonly isSubmitting = signal(false);
  readonly playerId = signal<string | null>(null);
  readonly imagePreviewUrl = signal<string | null>(null);
  private pendingImageFile: File | null = null;

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    role: ['' as PlayerRole, Validators.required],
    country: ['', [Validators.required, Validators.minLength(2)]],
    age: this.fb.control<number | null>(null, [Validators.min(14), Validators.max(60)]),
    passingYear: this.fb.control<number | null>(null, [Validators.min(1950), Validators.max(2100)]),
    previousTeam: [''],
    basePrice: [0, [Validators.required, Validators.min(0)]],
    appearances: this.fb.control<number | null>(null, Validators.min(0)),
    goals: this.fb.control<number | null>(null, Validators.min(0)),
    assists: this.fb.control<number | null>(null, Validators.min(0)),
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
      this.playerId.set(id);
      this.playerService.getById(id).subscribe((player) => this.patchForm(player));
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

    const payload = {
      name: value.name,
      role: value.role,
      country: value.country,
      basePrice: value.basePrice,
      age: value.age ?? undefined,
      passingYear: value.passingYear ?? undefined,
      previousTeam: value.previousTeam || undefined,
      stats: {
        appearances: value.appearances ?? undefined,
        goals: value.goals ?? undefined,
        assists: value.assists ?? undefined,
      },
    };

    const request$ = this.isEditMode()
      ? this.playerService.update(this.playerId()!, payload)
      : this.playerService.create(payload);

    request$.subscribe({
      next: (player) => this.handleSaved(player),
      error: () => this.isSubmitting.set(false),
    });
  }

  private handleSaved(player: Player): void {
    if (this.pendingImageFile) {
      this.playerService.uploadImage(player.id, this.pendingImageFile).subscribe({
        next: () => this.finishSubmit(player.id),
        error: () => this.finishSubmit(player.id),
      });
    } else {
      this.finishSubmit(player.id);
    }
  }

  private finishSubmit(playerId: string): void {
    this.isSubmitting.set(false);
    this.snackBar.open(this.isEditMode() ? 'Player updated' : 'Player registered', 'Close', {
      duration: 3000,
    });
    this.router.navigate(['/players', playerId]);
  }

  private patchForm(player: Player): void {
    this.form.patchValue({
      name: player.name,
      role: player.role,
      country: player.country,
      age: player.age ?? null,
      passingYear: player.passingYear ?? null,
      previousTeam: player.previousTeam ?? '',
      basePrice: player.basePrice,
      appearances: player.stats?.appearances ?? null,
      goals: player.stats?.goals ?? null,
      assists: player.stats?.assists ?? null,
    });
    if (player.imageUrl) {
      this.imagePreviewUrl.set(player.imageUrl);
    }
  }
}
