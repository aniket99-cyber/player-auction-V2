export interface RetentionEntry {
  player: string;
  retentionPrice: number;
  retentionOrder: number;
  approvedBy: string;
  retainedAt: string;
}

export interface Team {
  id: string;
  name: string;
  shortName: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  owner: string;
  captain?: string;
  totalBudget: number;
  remainingBudget: number;
  players: string[];
  retentions: RetentionEntry[];
  season: string;
  isDeleted: boolean;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTeamRequest {
  name: string;
  shortName: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  owner: string;
  totalBudget: number;
  season: string;
}

export interface UpdateTeamRequest {
  name?: string;
  shortName?: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  captain?: string;
  totalBudget?: number;
}

export interface AddRetentionRequest {
  playerId: string;
  retentionPrice: number;
  retentionOrder: number;
}

export interface TeamListQuery {
  page?: number;
  limit?: number;
  search?: string;
  season?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AuditLogEntry {
  id: string;
  actor: string;
  action: string;
  entityType: string;
  entityId: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  createdAt: string;
}

export interface ImportResult {
  imported: number;
  teams: Team[];
}

export interface ImportRowError {
  rowNumber: number;
  errors: string[];
}
