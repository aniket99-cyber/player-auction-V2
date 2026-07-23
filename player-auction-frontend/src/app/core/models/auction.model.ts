import { AuctionStatus } from './enums';

export interface BidIncrementRule {
  upTo: number;
  increment: number;
}

export interface CurrentBid {
  amount: number;
  team: string;
}

export interface Auction {
  id: string;
  name: string;
  status: AuctionStatus;
  playerQueue: string[];
  currentPlayer?: string;
  currentBid?: CurrentBid;
  bidIncrementRules: BidIncrementRule[];
  participatingTeams: string[];
  createdBy: string;
  startedAt?: string;
  completedAt?: string;
}
