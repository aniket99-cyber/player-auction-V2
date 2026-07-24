export enum UserRole {
  ADMIN = 'ADMIN',
  TEAM_MANAGER = 'TEAM_MANAGER',
  VIEWER = 'VIEWER',
}

export enum AuctionStatus {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  LIVE = 'LIVE',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum PlayerAuctionStatus {
  UNSOLD = 'UNSOLD',
  SOLD = 'SOLD',
  PENDING = 'PENDING',
  IN_BIDDING = 'IN_BIDDING',
  RETAINED = 'RETAINED',
  CAPTAIN = 'CAPTAIN',
}

export enum PlayerRole {
  GOALKEEPER = 'GOALKEEPER',
  DEFENDER = 'DEFENDER',
  MIDFIELDER = 'MIDFIELDER',
  FORWARD = 'FORWARD',
}

export enum BidStatus {
  ACTIVE = 'ACTIVE',
  OUTBID = 'OUTBID',
  WINNING = 'WINNING',
  REJECTED = 'REJECTED',
}

export enum AuctionSelectionMode {
  SEQUENTIAL = 'SEQUENTIAL',
  RANDOM = 'RANDOM',
}

export enum AuctionPlayerState {
  SELECTING = 'SELECTING',
  IN_BIDDING = 'IN_BIDDING',
  FINALIZING = 'FINALIZING',
  AWAITING_NEXT_ROUND = 'AWAITING_NEXT_ROUND',
}
