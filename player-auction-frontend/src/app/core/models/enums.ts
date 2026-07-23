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
}

export enum PlayerRole {
  BATSMAN = 'BATSMAN',
  BOWLER = 'BOWLER',
  ALL_ROUNDER = 'ALL_ROUNDER',
  WICKET_KEEPER = 'WICKET_KEEPER',
}

export enum BidStatus {
  ACTIVE = 'ACTIVE',
  OUTBID = 'OUTBID',
  WINNING = 'WINNING',
  REJECTED = 'REJECTED',
}
