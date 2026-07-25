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
import { AdminService } from '../../settings/services/admin.service';
import { AuctionSelectionMode, Player, PlayerAuctionStatus, Team } from '../../../core/models';

const QUEUEABLE_STATUSES = [PlayerAuctionStatus.PENDING, PlayerAuctionStatus.UNSOLD];

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
  private readonly adminService = inject(AdminService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  readonly isSubmitting = signal(false);
  readonly teams = signal<Team[]>([]);
  readonly availablePlayers = signal<Player[]>([]);
  readonly selectionModes = Object.values(AuctionSelectionMode);
  readonly poolStatusOptions = QUEUEABLE_STATUSES;

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    participatingTeams: this.fb.nonNullable.control<string[]>([], Validators.required),
    poolStatus: this.fb.nonNullable.control<PlayerAuctionStatus>(PlayerAuctionStatus.PENDING),
    playerQueue: this.fb.nonNullable.control<string[]>([], Validators.required),
    selectionMode: [AuctionSelectionMode.SEQUENTIAL],
    autoAdvance: [true],
    tiers: this.fb.array<ReturnType<typeof this.createTierGroup>>([]),
  });

  get tiers() {
    return this.form.controls.tiers;
  }

  ngOnInit(): void {
    this.teamService.list({ page: 1, limit: 100 }).subscribe((result) => this.teams.set(result.data));

    this.adminService.getSettings().subscribe((settings) => {
      settings.defaultBidIncrementRules
        .sort((a, b) => a.upTo - b.upTo)
        .forEach((rule) => this.tiers.push(this.createTierGroup(rule.upTo, rule.increment)));
    });

    this.fetchAvailablePlayers();
  }

  onPoolStatusChange(): void {
    this.form.patchValue({ playerQueue: [] });
    this.fetchAvailablePlayers();
  }

  readonly allPlayersSelected = () =>
    this.availablePlayers().length > 0 &&
    this.form.controls.playerQueue.value.length === this.availablePlayers().length;

  toggleSelectAllPlayers(): void {
    this.form.patchValue({
      playerQueue: this.allPlayersSelected() ? [] : this.availablePlayers().map((p) => p.id),
    });
  }

  private fetchAvailablePlayers(): void {
    this.playerService
      .list({ page: 1, limit: 500, auctionStatus: this.form.controls.poolStatus.value })
      .subscribe((result) => this.availablePlayers.set(result.data));
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

  submit(): void {
    if (this.form.invalid || this.isSubmitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    const value = this.form.getRawValue();
    const bidIncrementRules = value.tiers
      .map((tier) => ({ upTo: tier.upTo, increment: tier.increment }))
      .sort((a, b) => a.upTo - b.upTo);

    this.auctionService
      .create({
        name: value.name,
        participatingTeams: value.participatingTeams,
        playerQueue: value.playerQueue,
        selectionMode: value.selectionMode,
        bidIncrementRules,
        settings: {
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
