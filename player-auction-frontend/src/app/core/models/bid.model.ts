import { BidStatus } from './enums';

export interface Bid {
  id: string;
  auction: string;
  player: string;
  team: string;
  amount: number;
  status: BidStatus;
  placedBy: string;
  createdAt: string;
}
