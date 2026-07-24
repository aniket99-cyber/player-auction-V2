import { Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { PlayerAuctionStatus } from '../../../core/models';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'neutral' | 'gold';

interface BadgeConfig {
  label: string;
  icon: string;
  variant: BadgeVariant;
}

// Icon + label pairing per status, never color alone — mirrors the dataviz
// skill's status-color rule (gold reserved exclusively for SOLD/premium moments).
const STATUS_CONFIG: Record<PlayerAuctionStatus, BadgeConfig> = {
  PENDING: { label: 'Pool', icon: 'hourglass_empty', variant: 'neutral' },
  IN_BIDDING: { label: 'In Bidding', icon: 'gavel', variant: 'warning' },
  SOLD: { label: 'Sold', icon: 'check_circle', variant: 'gold' },
  UNSOLD: { label: 'Unsold', icon: 'cancel', variant: 'danger' },
  RETAINED: { label: 'Retained', icon: 'verified', variant: 'success' },
  CAPTAIN: { label: 'Captain', icon: 'star', variant: 'success' },
};

@Component({
  selector: 'app-status-badge',
  imports: [MatIconModule],
  templateUrl: './status-badge.html',
  styleUrl: './status-badge.scss',
})
export class StatusBadge {
  readonly status = input.required<PlayerAuctionStatus>();

  readonly config = computed<BadgeConfig>(() => STATUS_CONFIG[this.status()]);
}
