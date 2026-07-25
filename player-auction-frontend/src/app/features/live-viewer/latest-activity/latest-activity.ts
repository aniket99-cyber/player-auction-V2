import { Component, input } from '@angular/core';
import { Team } from '../../../core/models';
import { ActivityEntry } from '../services/live-viewer.store';

@Component({
  selector: 'app-latest-activity',
  imports: [],
  templateUrl: './latest-activity.html',
  styleUrl: './latest-activity.scss',
})
export class LatestActivity {
  readonly entries = input.required<ActivityEntry[]>();
  readonly teams = input.required<Team[]>();

  teamName(teamId: string | undefined): string {
    if (!teamId) return '';
    return this.teams().find((t) => t.id === teamId)?.shortName ?? '';
  }
}
