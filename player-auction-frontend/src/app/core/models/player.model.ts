import { PlayerAuctionStatus, PlayerRole } from './enums';

export interface PlayerStats {
  appearances: number;
  goals?: number;
  assists?: number;
}

export interface Player {
  id: string;
  name: string;
  role: PlayerRole;
  country: string;
  age?: number;
  passingYear?: number;
  previousTeam?: string;
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
  passingYear?: number;
  previousTeam?: string;
  basePrice: number;
  imageUrl?: string;
  stats?: Partial<PlayerStats>;
}

export interface UpdatePlayerRequest {
  name?: string;
  role?: PlayerRole;
  country?: string;
  age?: number;
  passingYear?: number;
  previousTeam?: string;
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
  passingYear?: number;
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
