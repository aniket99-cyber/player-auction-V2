import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { Player, Team } from '../../../core/models';
import { PlayerService } from '../services/player.service';

interface CaptainAssignmentDialogData {
  team?: Team;
  allTeams?: Team[];
  selectedPlayer?: Player;
  allPlayers?: Player[];
}

@Component({
  selector: 'app-captain-assignment-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatAutocompleteModule,
    MatSelectModule,
    MatOptionModule,
    MatButtonModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './captain-assignment-dialog.html',
  styleUrl: './captain-assignment-dialog.scss',
})
export class CaptainAssignmentDialog implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<CaptainAssignmentDialog>);
  private readonly data = inject<CaptainAssignmentDialogData>(MAT_DIALOG_DATA);
  private readonly playerService = inject(PlayerService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly selectedPlayer = signal(this.data.selectedPlayer ?? null);
  readonly allTeams = signal<Team[]>(this.data.allTeams ?? []);
  readonly selectedTeam = signal<Team | null>(this.data.team ?? (this.data.allTeams?.[0] ?? null));
  readonly form: FormGroup;
  readonly allPlayers = signal<Player[]>(this.data.allPlayers ?? []);
  readonly filteredPlayers = signal<Player[]>([]);
  readonly isLoading = signal(false);
  readonly showPlayerSearch = computed(() => !this.selectedPlayer());

  private readonly searchInput$ = new Subject<string>();

  constructor() {
    this.form = this.fb.group({
      teamSelect: [this.selectedTeam(), Validators.required],
      playerSearch: [this.selectedPlayer()?.name ?? '', this.selectedPlayer() ? [] : Validators.required],
    });
  }

  ngOnInit(): void {
    if (!this.data.allPlayers && !this.selectedPlayer()) {
      this.loadPlayers();
    } else if (this.data.allPlayers) {
      this.filteredPlayers.set(this.data.allPlayers);
    }

    this.searchInput$
      .pipe(
        debounceTime(200),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((searchTerm) => {
        this.filterPlayers(searchTerm);
      });

    // Update form value when team selection changes
    this.form.get('teamSelect')?.valueChanges.subscribe((team) => {
      this.selectedTeam.set(team);
    });
  }

  onSearchChange(event: Event): void {
    const searchTerm = (event.target as HTMLInputElement).value;
    this.searchInput$.next(searchTerm);
  }

  private loadPlayers(): void {
    this.isLoading.set(true);
    this.playerService
      .list({ page: 1, limit: 1000 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.allPlayers.set(result.data);
          this.filteredPlayers.set(result.data);
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
        },
      });
  }

  private filterPlayers(searchTerm: string): void {
    if (!searchTerm.trim()) {
      this.filteredPlayers.set(this.allPlayers());
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = this.allPlayers().filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.role.toLowerCase().includes(term) ||
        p.country.toLowerCase().includes(term),
    );
    this.filteredPlayers.set(filtered);
  }

  selectPlayer(player: Player): void {
    this.selectedPlayer.set(player);
    this.form.get('playerSearch')?.setValue(player.name);
  }

  assignCaptain(): void {
    if (!this.selectedTeam() || !this.selectedPlayer()) {
      return;
    }
    this.dialogRef.close(this.selectedTeam());
  }

  cancel(): void {
    this.dialogRef.close(null);
  }

  getDisplayName(player: Player): string {
    return `${player.name} (${player.role})`;
  }
}
