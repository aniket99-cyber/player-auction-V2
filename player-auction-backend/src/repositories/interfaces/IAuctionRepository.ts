import { IAuction } from '@models/Auction.model';
import { AuctionPlayerState, AuctionStatus } from '@constants/enums';
import { IRepository } from '@repositories/interfaces/IRepository';

export interface IAuctionRepository extends IRepository<IAuction> {
  /**
   * Increases the running bid counter to `newAmount`, remembering
   * `previousAmount` in a single-level undo slot. There's no concurrent-bid
   * race to guard against here — only the admin ever bumps the counter.
   */
  bumpCurrentBid(auctionId: string, newAmount: number, previousAmount: number | null): Promise<IAuction | null>;
  /** Restores `currentBid` to whatever `previousBidAmount` holds (or clears it if there was none), and clears the undo slot. */
  restorePreviousBid(auctionId: string, previousAmount: number | null): Promise<IAuction | null>;
  clearCurrentBid(auctionId: string): Promise<IAuction | null>;
  advanceToNextPlayer(
    auctionId: string,
    nextPlayerId: string | null,
    playerState: AuctionPlayerState | null,
  ): Promise<IAuction | null>;
  setStatus(auctionId: string, status: AuctionStatus): Promise<IAuction | null>;
  setPlayerState(auctionId: string, playerState: AuctionPlayerState | null): Promise<IAuction | null>;
  removeFromQueue(auctionId: string, playerId: string): Promise<IAuction | null>;
  requeuePlayer(auctionId: string, playerId: string): Promise<IAuction | null>;
  addUnsoldThisRound(auctionId: string, playerId: string): Promise<IAuction | null>;
  /**
   * Moves everything in `unsoldThisRound` into `playerQueue`, clears the
   * unsold list, and bumps `round` — the atomic transition into the next
   * re-auction round.
   */
  findActive(): Promise<IAuction | null>;
  activate(auctionId: string): Promise<IAuction | null>;
  deactivate(auctionId: string): Promise<IAuction | null>;
  startNextRound(auctionId: string): Promise<IAuction | null>;
}
