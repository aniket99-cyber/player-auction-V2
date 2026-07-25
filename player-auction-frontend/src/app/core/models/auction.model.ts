import { AuctionPlayerState, AuctionSelectionMode, AuctionStatus } from './enums';

export interface BidIncrementRule {
  upTo: number;
  increment: number;
}

// No team is attached to the running bid counter — a team is only chosen
// once, at Finalize (confirmSale). The admin alone bumps this number.
export interface CurrentBid {
  amount: number;
}

export interface AuctionSettings {
  autoAdvance: boolean;
}

export interface Auction {
  id: string;
  name: string;
  status: AuctionStatus;
  playerQueue: string[];
  currentPlayer?: string;
  playerState?: AuctionPlayerState;
  currentBid?: CurrentBid;
  previousBidAmount?: number;
  bidIncrementRules: BidIncrementRule[];
  participatingTeams: string[];
  selectionMode: AuctionSelectionMode;
  settings: AuctionSettings;
  remainingSecondsAtPause?: number;
  round: number;
  unsoldThisRound: string[];
  createdBy: string;
  startedAt?: string;
  completedAt?: string;
}
