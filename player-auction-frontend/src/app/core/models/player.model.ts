import { PlayerAuctionStatus, PlayerRole } from './enums';

export interface PlayerStats {
  matches: number;
  runs?: number;
  wickets?: number;
  average?: number;
  strikeRate?: number;
}

export interface Player {
  id: string;
  name: string;
  role: PlayerRole;
  country: string;
  age?: number;
  basePrice: number;
  imageUrl?: string;
  stats: PlayerStats;
  auctionStatus: PlayerAuctionStatus;
  isRetained: boolean;
  soldTo?: string;
  soldPrice?: number;
  isDeleted: boolean;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePlayerRequest {
  name: string;
  role: PlayerRole;
  country: string;
  age?: number;
  basePrice: number;
  imageUrl?: string;
  stats?: Partial<PlayerStats>;
}

export interface UpdatePlayerRequest {
  name?: string;
  role?: PlayerRole;
  country?: string;
  age?: number;
  basePrice?: number;
  imageUrl?: string;
  stats?: Partial<PlayerStats>;
}

export interface PlayerListQuery {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  country?: string;
  auctionStatus?: string;
  minAge?: number;
  maxAge?: number;
  minBasePrice?: number;
  maxBasePrice?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  ids?: string[];
}

export interface PlayerImportResult {
  imported: number;
  players: Player[];
}
