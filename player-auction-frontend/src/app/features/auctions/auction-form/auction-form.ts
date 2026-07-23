import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuctionService } from '../services/auction.service';
import { TeamService } from '../../teams/services/team.service';
import { PlayerService } from '../../players/services/player.service';
import { AuctionSelectionMode, Player, Team } from '../../../core/models';

@Component({
  selector: 'app-auction-form',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './auction-form.html',
  styleUrl: './auction-form.scss',
})
export class AuctionForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auctionService = inject(AuctionService);
  private readonly teamService = inject(TeamService);
  private readonly playerService = inject(PlayerService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  readonly isSubmitting = signal(false);
  readonly teams = signal<Team[]>([]);
  readonly availablePlayers = signal<Player[]>([]);
  readonly selectionModes = Object.values(AuctionSelectionMode);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    participatingTeams: this.fb.nonNullable.control<string[]>([], Validators.required),
    playerQueue: this.fb.nonNullable.control<string[]>([], Validators.required),
    selectionMode: [AuctionSelectionMode.SEQUENTIAL],
    bidTimerSeconds: [15, [Validators.required, Validators.min(5), Validators.max(120)]],
    autoAdvance: [true],
  });

  ngOnInit(): void {
    this.teamService.list({ page: 1, limit: 100 }).subscribe((result) => this.teams.set(result.data));

    // Only players still in the pool (not sold/unsold/retained) make sense
    // to queue into a new auction.
    this.playerService
      .list({ page: 1, limit: 500, auctionStatus: 'PENDING' })
      .subscribe((result) => this.availablePlayers.set(result.data));
  }

  submit(): void {
    if (this.form.invalid || this.isSubmitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    const value = this.form.getRawValue();

    this.auctionService
      .create({
        name: value.name,
        participatingTeams: value.participatingTeams,
        playerQueue: value.playerQueue,
        selectionMode: value.selectionMode,
        // A simple default tiered increment table — editable later via the
        // Auction Room's admin console once real bidding data exists.
        bidIncrementRules: [
          { upTo: 100, increment: 5 },
          { upTo: 500, increment: 10 },
          { upTo: 1000, increment: 25 },
        ],
        settings: {
          bidTimerSeconds: value.bidTimerSeconds,
          autoAdvance: value.autoAdvance,
        },
      })
      .subscribe({
        next: (auction) => {
          this.isSubmitting.set(false);
          this.snackBar.open('Auction created', 'Close', { duration: 3000 });
          this.router.navigate(['/auction-room', auction.id]);
        },
        error: () => this.isSubmitting.set(false),
      });
  }
}
