import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CaptainService } from '../services/captain.service';
import { TeamService } from '../../teams/services/team.service';
import { PlayerService } from '../../players/services/player.service';
import { Player, Team } from '../../../core/models';

@Component({
  selector: 'app-captain-form',
  imports: [ReactiveFormsModule, RouterLink, MatFormFieldModule, MatSelectModule, MatButtonModule],
  templateUrl: './captain-form.html',
  styleUrl: './captain-form.scss',
})
export class CaptainForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly captainService = inject(CaptainService);
  private readonly teamService = inject(TeamService);
  private readonly playerService = inject(PlayerService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  readonly isEditMode = signal(false);
  readonly isSubmitting = signal(false);
  readonly captainId = signal<string | null>(null);
  readonly teams = signal<Team[]>([]);
  readonly roster = signal<Player[]>([]);

  readonly form = this.fb.nonNullable.group({
    team: ['', Validators.required],
    player: ['', Validators.required],
  });

  readonly selectedTeam = computed(() => this.teams().find((t) => t.id === this.form.controls.team.value));

  ngOnInit(): void {
    this.teamService.list({ page: 1, limit: 100 }).subscribe((result) => this.teams.set(result.data));

    this.form.controls.team.valueChanges.subscribe((teamId) => {
      this.form.controls.player.setValue('');
      this.roster.set([]);
      if (!teamId) return;

      const team = this.teams().find((t) => t.id === teamId);
      if (team && team.players.length > 0) {
        this.playerService.getByIds(team.players).subscribe((result) => this.roster.set(result.data));
      }
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
      this.captainId.set(id);
      this.form.controls.team.disable();
      this.captainService.getById(id).subscribe((captain) => {
        this.form.patchValue({ team: captain.team, player: captain.player });
        const team = this.teams().find((t) => t.id === captain.team);
        if (team && team.players.length > 0) {
          this.playerService.getByIds(team.players).subscribe((result) => this.roster.set(result.data));
        }
      });
    }
  }

  submit(): void {
    if (this.form.invalid || this.isSubmitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    const value = this.form.getRawValue();

    const request$ = this.isEditMode()
      ? this.captainService.update(this.captainId()!, { player: value.player })
      : this.captainService.create(value);

    request$.subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.snackBar.open(this.isEditMode() ? 'Captain updated' : 'Captain assigned', 'Close', {
          duration: 3000,
        });
        this.router.navigate(['/captains']);
      },
      error: () => this.isSubmitting.set(false),
    });
  }
}
